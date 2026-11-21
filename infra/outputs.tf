output "fqdn" {
  description = "A publikus DNS-név (a TLS és az alkalmazás hosztneve)."
  value       = azurerm_public_ip.main.fqdn
}

output "public_ip" {
  description = "A VM statikus publikus IP-je."
  value       = azurerm_public_ip.main.ip_address
}

output "ssh_command" {
  description = "Belépés a VM-re (csak az engedélyezett CIDR-ről)."
  value       = "ssh ${var.admin_username}@${azurerm_public_ip.main.fqdn}"
}

output "backup_storage_account" {
  description = "A backup storage account neve."
  value       = azurerm_storage_account.backup.name
}

output "backup_container" {
  description = "A backup konténer neve."
  value       = azurerm_storage_container.backup.name
}
