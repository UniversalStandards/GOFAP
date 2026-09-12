variable "name" {
  type = string
}
variable "ami_id" {
  type = string
}
variable "instance_type" {
  type = string
}
variable "subnet_id" {
  type = string
}
variable "security_group_ids" {
  type = list(string)
}
variable "ssh_public_key" {
  type      = string
  sensitive = true
}
variable "tags" {
  type = map(string)
}
