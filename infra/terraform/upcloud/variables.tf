variable "environment" {
  type = string
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "environment must be dev, staging, or production."
  }
}
variable "zone" {
  type = string
}
variable "network_cidr" {
  type = string
}
variable "plan" {
  type = string
}
variable "storage_size" {
  type = number
}
variable "ssh_public_key" {
  type      = string
  sensitive = true
}
variable "admin_cidrs" {
  type = list(string)
}
