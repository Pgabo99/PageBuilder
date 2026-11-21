data "azurerm_client_config" "current" {}

locals {
  tags = {
    project = var.name_prefix
    managed = "terraform"
  }

  # A storage account neve globálisan egyedi, 3–24 kisbetű vagy számjegy: az előfizetésből származtatjuk.
  backup_account_name = "${var.name_prefix}bk${substr(md5(data.azurerm_client_config.current.subscription_id), 0, 8)}"
}

resource "azurerm_resource_group" "main" {
  name     = "rg-${var.name_prefix}"
  location = var.location
  tags     = local.tags
}

resource "azurerm_virtual_network" "main" {
  name                = "vnet-${var.name_prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  address_space       = ["10.10.0.0/16"]
  tags                = local.tags
}

resource "azurerm_subnet" "main" {
  name                 = "snet-${var.name_prefix}"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.10.1.0/24"]

  # Ingyenes: a backup storage account csak ebből az alhálózatból érhető el.
  service_endpoints = ["Microsoft.Storage"]
}

# Bejövő forgalom: csak HTTP/HTTPS bárhonnan és SSH a megadott CIDR-ről. Minden más (k3s API,
# MySQL, Redis, Prometheus, Grafana) az Azure alapértelmezett DenyAllInbound szabálya miatt zárt.
resource "azurerm_network_security_group" "main" {
  name                = "nsg-${var.name_prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.tags

  security_rule {
    name                       = "allow-http-https"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_ranges    = ["80", "443"]
    source_address_prefix      = "Internet"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "allow-ssh-from-admin"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = var.ssh_allowed_cidr
    destination_address_prefix = "*"
  }
}

resource "azurerm_public_ip" "main" {
  name                = "pip-${var.name_prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  allocation_method   = "Static"
  sku                 = "Standard"
  domain_name_label   = var.dns_label
  tags                = local.tags
}

resource "azurerm_network_interface" "main" {
  name                = "nic-${var.name_prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.tags

  ip_configuration {
    name                          = "primary"
    subnet_id                     = azurerm_subnet.main.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.main.id
  }
}

resource "azurerm_network_interface_security_group_association" "main" {
  network_interface_id      = azurerm_network_interface.main.id
  network_security_group_id = azurerm_network_security_group.main.id
}

resource "azurerm_linux_virtual_machine" "main" {
  name                = "vm-${var.name_prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  size                = var.vm_size
  admin_username      = var.admin_username
  tags                = local.tags

  network_interface_ids = [azurerm_network_interface.main.id]

  # Csak kulcsos belépés, jelszó nincs.
  disable_password_authentication = true

  admin_ssh_key {
    username   = var.admin_username
    public_key = var.ssh_public_key
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = var.os_disk_type
    disk_size_gb         = var.os_disk_size_gb
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "ubuntu-24_04-lts"
    sku       = "server"
    version   = "latest"
  }

  custom_data = base64encode(templatefile("${path.module}/cloud-init.yaml.tftpl", {
    k3s_channel = var.k3s_channel
    fqdn        = azurerm_public_ip.main.fqdn
  }))
}

# Opcionális: a felejtett VM a fő költségkockázat, ez naponta leállítja (deallocate).
resource "azurerm_dev_test_global_vm_shutdown_schedule" "main" {
  count = var.auto_shutdown_time == null ? 0 : 1

  virtual_machine_id    = azurerm_linux_virtual_machine.main.id
  location              = azurerm_resource_group.main.location
  enabled               = true
  daily_recurrence_time = var.auto_shutdown_time
  timezone              = "UTC"

  notification_settings {
    enabled = false
  }
}

# A mentések a VM-en kívül, külön storage accountban élnek (a VM elvesztése nem érinti őket).
resource "azurerm_storage_account" "backup" {
  name                            = local.backup_account_name
  location                        = azurerm_resource_group.main.location
  resource_group_name             = azurerm_resource_group.main.name
  account_tier                    = "Standard"
  account_replication_type        = "LRS"
  account_kind                    = "StorageV2"
  min_tls_version                 = "TLS1_2"
  https_traffic_only_enabled      = true
  allow_nested_items_to_be_public = false
  tags                            = local.tags

  # Tiltó alapértelmezés: csak a VM alhálózata és az opcionálisan megadott IP-k érik el.
  network_rules {
    default_action             = "Deny"
    bypass                     = ["AzureServices"]
    virtual_network_subnet_ids = [azurerm_subnet.main.id]
    ip_rules                   = var.backup_allowed_ips
  }
}

resource "azurerm_storage_container" "backup" {
  name                  = "backups"
  storage_account_id    = azurerm_storage_account.backup.id
  container_access_type = "private"
}

resource "azurerm_storage_management_policy" "backup" {
  storage_account_id = azurerm_storage_account.backup.id

  rule {
    name    = "expire-old-backups"
    enabled = true

    filters {
      blob_types   = ["blockBlob"]
      prefix_match = ["backups/"]
    }

    actions {
      base_blob {
        delete_after_days_since_modification_greater_than = var.backup_retention_days
      }
    }
  }
}
