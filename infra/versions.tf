terraform {
  required_version = ">= 1.9"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
}

provider "azurerm" {
  features {}

  # Üresen az ARM_SUBSCRIPTION_ID környezeti változó vagy az `az login` előfizetése dönt.
  subscription_id = var.subscription_id
}
