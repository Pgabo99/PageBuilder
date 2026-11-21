variable "subscription_id" {
  description = "Azure-előfizetés azonosítója (üresen az ARM_SUBSCRIPTION_ID környezeti változó dönt)."
  type        = string
  default     = null
}

variable "location" {
  description = "Azure-régió."
  type        = string
  default     = "westeurope"
}

variable "name_prefix" {
  description = "Az erőforrások névelőtagja (kisbetű, számjegy)."
  type        = string
  default     = "pagebuilder"

  validation {
    condition     = can(regex("^[a-z][a-z0-9]{2,12}$", var.name_prefix))
    error_message = "A névelőtag 3–13 karakter: kisbetűvel kezdődik, kisbetű és számjegy."
  }
}

variable "dns_label" {
  description = "A publikus IP DNS-címkéje: <címke>.<régió>.cloudapp.azure.com (régión belül egyedi)."
  type        = string

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{1,61}[a-z0-9]$", var.dns_label))
    error_message = "A DNS-címke kisbetűvel kezdődik, kisbetű, számjegy és kötőjel lehet, betűre vagy számjegyre végződik."
  }
}

variable "ssh_allowed_cidr" {
  description = "Az a CIDR (pl. 203.0.113.7/32), ahonnan az SSH elérhető."
  type        = string

  validation {
    condition     = can(cidrhost(var.ssh_allowed_cidr, 0)) && var.ssh_allowed_cidr != "0.0.0.0/0"
    error_message = "Érvényes CIDR kell, és az SSH nem nyitható meg a teljes internetnek."
  }
}

variable "ssh_public_key" {
  description = "Az admin felhasználó SSH nyilvános kulcsa (a privát kulcs nem kerül ide)."
  type        = string
}

variable "admin_username" {
  description = "A VM admin felhasználója."
  type        = string
  default     = "azureuser"
}

variable "vm_size" {
  description = "A VM mérete. Alap: 2 vCPU, 4 GB. Ha kevés a memória: Standard_B2ms (8 GB)."
  type        = string
  default     = "Standard_B2s"
}

variable "os_disk_size_gb" {
  description = "Az OS-lemez mérete GB-ban."
  type        = number
  default     = 64
}

variable "os_disk_type" {
  description = "Az OS-lemez típusa (a Standard_LRS olcsóbb, de lassabb)."
  type        = string
  default     = "StandardSSD_LRS"
}

variable "k3s_channel" {
  description = "A k3s kiadási csatornája (stable, latest vagy pl. v1.34)."
  type        = string
  default     = "stable"
}

variable "auto_shutdown_time" {
  description = "Napi automatikus leállítás UTC szerint, HHMM formában (pl. 2000); null: kikapcsolva."
  type        = string
  default     = null

  validation {
    condition     = var.auto_shutdown_time == null || can(regex("^([01][0-9]|2[0-3])[0-5][0-9]$", var.auto_shutdown_time))
    error_message = "A leállítás ideje HHMM formátumú legyen."
  }
}

variable "backup_allowed_ips" {
  description = "Extra publikus IP-k vagy /30-nál nagyobb CIDR-ek, amelyek elérik a backup-tárolót (pl. kézi visszaállításhoz)."
  type        = list(string)
  default     = []
}

variable "backup_retention_days" {
  description = "A mentések megőrzési ideje napokban a backup-tárolóban."
  type        = number
  default     = 30
}
