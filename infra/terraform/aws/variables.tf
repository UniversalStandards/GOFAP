variable "environment" {
  type = string
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "environment must be dev, staging, or production."
  }
}
variable "region" {
  type = string
}
variable "vpc_cidr" {
  type = string
}
variable "subnet_cidr" {
  type = string
}
variable "availability_zone" {
  type = string
}
variable "instance_type" {
  type = string
}
variable "ssh_public_key" {
  type      = string
  sensitive = true
}
variable "admin_cidrs" {
  type = list(string)
}
variable "tags" {
  type    = map(string)
  default = {}
}
