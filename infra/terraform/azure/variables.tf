variable "subscription_ids" {
  description = "Azure subscription IDs for each environment and shared networking."
  type = object({
    dev             = string
    staging         = string
    prod            = string
    shared_network  = string
  })
}

variable "location" {
  description = "Azure region for resource groups and networking."
  type        = string
  default     = "eastus"
}

variable "resource_group_names" {
  description = "Resource group names for each environment and shared networking."
  type = object({
    dev            = string
    staging        = string
    prod           = string
    shared_network = string
  })
}

variable "vnet_name" {
  description = "Name of the shared virtual network."
  type        = string
  default     = "gofap-shared-vnet"
}

variable "vnet_address_space" {
  description = "Address space for the shared VNet."
  type        = list(string)
  default     = ["10.20.0.0/16"]
}

variable "subnet_prefixes" {
  description = "Subnet prefixes for app, data, and private endpoint subnets."
  type        = map(list(string))
  default = {
    app              = ["10.20.1.0/24"]
    data             = ["10.20.2.0/24"]
    private-endpoints = ["10.20.3.0/24"]
  }
}

variable "tags" {
  description = "Tags applied to resource groups and shared networking resources."
  type        = map(string)
  default     = {}
}

variable "required_tags" {
  description = "Tags required by the baseline Azure Policy assignment."
  type        = list(string)
  default     = ["Environment", "Owner", "CostCenter"]

  validation {
    condition     = length(var.required_tags) > 0
    error_message = "At least one required tag must be specified."
  }
}
