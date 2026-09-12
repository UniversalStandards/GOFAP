provider "azurerm" {
  features {}
}
locals {
  name = "gofaps-${var.environment}"
  tags = merge(var.tags, {
    Application = "GOFAPS", Environment = var.environment, ManagedBy = "Terraform"
  })
}
resource "azurerm_resource_group" "this" {
  name     = "${local.name}-rg"
  location = var.location
  tags     = local.tags
}
module "networking" {
  source              = "./modules/networking"
  name                = local.name
  location            = var.location
  resource_group_name = azurerm_resource_group.this.name
  address_space       = var.address_space
  subnet_prefixes     = var.subnet_prefixes
  tags                = local.tags
}
module "security" {
  source              = "./modules/security"
  name                = local.name
  location            = var.location
  resource_group_name = azurerm_resource_group.this.name
  subnet_id           = module.networking.subnet_id
  admin_cidrs         = var.admin_cidrs
  tags                = local.tags
}
module "compute" {
  source              = "./modules/compute"
  name                = local.name
  location            = var.location
  resource_group_name = azurerm_resource_group.this.name
  subnet_id           = module.networking.subnet_id
  vm_size             = var.vm_size
  admin_username      = var.admin_username
  ssh_public_key      = var.ssh_public_key
  tags                = local.tags
}
