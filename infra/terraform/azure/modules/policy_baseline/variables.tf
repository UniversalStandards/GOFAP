variable "subscription_id" {
  description = "Subscription ID for policy assignment scope."
  type        = string
}

variable "required_tags" {
  description = "Tags required on all resources within the subscription."
  type        = list(string)
}
