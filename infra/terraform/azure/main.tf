terraform {
  required_version = ">= 1.3.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.117"
    }
  }
}

provider "azurerm" {
  features {}
  subscription_id = var.subscription_ids.dev
}

provider "azurerm" {
  alias           = "staging"
  features        = {}
  subscription_id = var.subscription_ids.staging
}

provider "azurerm" {
  alias           = "prod"
  features        = {}
  subscription_id = var.subscription_ids.prod
}

provider "azurerm" {
  alias           = "shared"
  features        = {}
  subscription_id = var.subscription_ids.shared_network
}

resource "azurerm_resource_group" "dev" {
  name     = var.resource_group_names.dev
  location = var.location
  tags     = var.tags
}

resource "azurerm_resource_group" "staging" {
  provider = azurerm.staging

  name     = var.resource_group_names.staging
  location = var.location
  tags     = var.tags
}

resource "azurerm_resource_group" "prod" {
  provider = azurerm.prod

  name     = var.resource_group_names.prod
  location = var.location
  tags     = var.tags
}

resource "azurerm_resource_group" "shared" {
  provider = azurerm.shared

  name     = var.resource_group_names.shared_network
  location = var.location
  tags     = var.tags
}

resource "azurerm_virtual_network" "shared" {
  provider = azurerm.shared

  name                = var.vnet_name
  location            = var.location
  resource_group_name = azurerm_resource_group.shared.name
  address_space       = var.vnet_address_space
  tags                = var.tags
}

resource "azurerm_subnet" "shared" {
  provider = azurerm.shared

  for_each = var.subnet_prefixes

  name                 = each.key
  resource_group_name  = azurerm_resource_group.shared.name
  virtual_network_name = azurerm_virtual_network.shared.name
  address_prefixes     = each.value

  private_endpoint_network_policies_enabled = each.key == "private-endpoints" ? false : true
}

module "baseline_policy_dev" {
  source = "./modules/policy_baseline"

  subscription_id = var.subscription_ids.dev
  required_tags   = var.required_tags

  providers = {
    azurerm = azurerm
  }
}

module "baseline_policy_staging" {
  source = "./modules/policy_baseline"

  subscription_id = var.subscription_ids.staging
  required_tags   = var.required_tags

  providers = {
    azurerm = azurerm.staging
  }
}

module "baseline_policy_prod" {
  source = "./modules/policy_baseline"

  subscription_id = var.subscription_ids.prod
  required_tags   = var.required_tags

  providers = {
    azurerm = azurerm.prod
  }
}

module "baseline_policy_shared" {
  source = "./modules/policy_baseline"

  subscription_id = var.subscription_ids.shared_network
  required_tags   = var.required_tags

  providers = {
    azurerm = azurerm.shared
  }
}
