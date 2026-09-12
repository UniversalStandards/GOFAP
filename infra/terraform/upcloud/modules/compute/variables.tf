variable "name" {
  type = string
}
variable "zone" {
  type = string
}
variable "plan" {
  type = string
}
variable "storage_size" {
  type = number
}
variable "network_id" {
  type = string
}
variable "ssh_public_key" {
  type      = string
  sensitive = true
}
