# Offline tesztek: mock provider, Azure-hitelesítés és erőforrás nélkül.
mock_provider "azurerm" {}

variables {
  dns_label        = "pagebuilder-teszt"
  ssh_allowed_cidr = "203.0.113.7/32"
  ssh_public_key   = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAILtspn8IE8TgL2Anle5l5CKrTomiVnavoAJa+UrLgalB teszt"
}

run "alapertelmezett_terv" {
  command = plan

  assert {
    condition     = azurerm_linux_virtual_machine.main.size == "Standard_B2s"
    error_message = "Az alapértelmezett VM-méret a 4 GB-os Standard_B2s legyen."
  }

  assert {
    condition     = azurerm_linux_virtual_machine.main.disable_password_authentication
    error_message = "A VM-en csak SSH-kulcsos belépés engedélyezett."
  }

  assert {
    condition     = length(azurerm_dev_test_global_vm_shutdown_schedule.main) == 0
    error_message = "Az automatikus leállítás alapból ki van kapcsolva."
  }
}

run "csak_http_https_es_ssh_nyitott" {
  command = plan

  assert {
    condition     = length(azurerm_network_security_group.main.security_rule) == 2
    error_message = "Csak két bejövő szabály lehet: HTTP/HTTPS és SSH."
  }

  assert {
    condition = alltrue([
      for r in azurerm_network_security_group.main.security_rule :
      r.direction == "Inbound" && r.access == "Allow"
    ])
    error_message = "Minden szabály bejövő engedélyezés."
  }

  assert {
    condition = toset(flatten([
      for r in azurerm_network_security_group.main.security_rule :
      concat(
        r.destination_port_ranges == null ? [] : tolist(r.destination_port_ranges),
        r.destination_port_range == null ? [] : [r.destination_port_range],
      )
    ])) == toset(["80", "443", "22"])
    error_message = "Csak a 22, 80 és 443 port lehet nyitva (nincs MySQL, Redis, Prometheus, Grafana, k3s API)."
  }

  assert {
    condition = alltrue([
      for r in azurerm_network_security_group.main.security_rule :
      r.destination_port_range != "22" || r.source_address_prefix == var.ssh_allowed_cidr
    ])
    error_message = "Az SSH csak a megadott CIDR-ről érhető el."
  }
}

run "backup_tarolo_privat" {
  command = plan

  assert {
    condition     = azurerm_storage_container.backup.container_access_type == "private"
    error_message = "A backup-konténer privát."
  }

  assert {
    condition     = !azurerm_storage_account.backup.allow_nested_items_to_be_public
    error_message = "A storage account nem engedélyezhet nyilvános blobot."
  }

  assert {
    condition     = one(azurerm_storage_account.backup.network_rules).default_action == "Deny"
    error_message = "A backup-tároló hálózati alapértelmezése tiltó."
  }

  assert {
    condition     = azurerm_storage_account.backup.min_tls_version == "TLS1_2"
    error_message = "Legalább TLS 1.2 kell."
  }
}

run "meretet_es_leallitast_valtozo_allitja" {
  command = plan

  variables {
    vm_size            = "Standard_B2ms"
    auto_shutdown_time = "2000"
  }

  assert {
    condition     = azurerm_linux_virtual_machine.main.size == "Standard_B2ms"
    error_message = "A VM mérete változóból állítható."
  }

  assert {
    condition     = length(azurerm_dev_test_global_vm_shutdown_schedule.main) == 1
    error_message = "A megadott leállítási idő létrehozza az ütemezést."
  }
}

run "ssh_nem_nyithato_az_egesz_internetnek" {
  command = plan

  variables {
    ssh_allowed_cidr = "0.0.0.0/0"
  }

  expect_failures = [var.ssh_allowed_cidr]
}

run "ervenytelen_cidr" {
  command = plan

  variables {
    ssh_allowed_cidr = "nem-cidr"
  }

  expect_failures = [var.ssh_allowed_cidr]
}

run "ervenytelen_dns_cimke" {
  command = plan

  variables {
    dns_label = "Nagybetu_Hibas"
  }

  expect_failures = [var.dns_label]
}

run "ervenytelen_leallitasi_ido" {
  command = plan

  variables {
    auto_shutdown_time = "2560"
  }

  expect_failures = [var.auto_shutdown_time]
}
