resource "azurerm_policy_definition" "storage_tls" {
  name         = "enforce-storage-tls"
  policy_type  = "Custom"
  mode         = "All"
  display_name = "Enforce TLS 1.2 and HTTPS-only for storage accounts"
  description  = "Requires storage accounts to enforce HTTPS traffic only and minimum TLS 1.2."
  metadata     = jsonencode({ category = "Security" })

  policy_rule = jsonencode({
    if = {
      allOf = [
        {
          field  = "type"
          equals = "Microsoft.Storage/storageAccounts"
        },
        {
          anyOf = [
            {
              field     = "Microsoft.Storage/storageAccounts/supportsHttpsTrafficOnly"
              notEquals = true
            },
            {
              field     = "Microsoft.Storage/storageAccounts/minimumTlsVersion"
              notEquals = "TLS1_2"
            }
          ]
        }
      ]
    }
    then = {
      effect = "deny"
    }
  })
}

resource "azurerm_policy_definition" "storage_public_access" {
  name         = "disallow-storage-public-access"
  policy_type  = "Custom"
  mode         = "All"
  display_name = "Disallow public access to storage accounts"
  description  = "Prevents enabling public blob access on storage accounts."
  metadata     = jsonencode({ category = "Security" })

  policy_rule = jsonencode({
    if = {
      allOf = [
        {
          field  = "type"
          equals = "Microsoft.Storage/storageAccounts"
        },
        {
          field  = "Microsoft.Storage/storageAccounts/allowBlobPublicAccess"
          equals = true
        }
      ]
    }
    then = {
      effect = "deny"
    }
  })
}

resource "azurerm_policy_definition" "required_tags" {
  name         = "require-resource-tags"
  policy_type  = "Custom"
  mode         = "All"
  display_name = "Require baseline tags on resources"
  description  = "Ensures required tags are present on all resources."
  metadata     = jsonencode({ category = "Governance" })

  policy_rule = jsonencode({
    if = {
      anyOf = [
        for tag in var.required_tags : {
          field  = "tags['${tag}']"
          exists = "false"
        }
      ]
    }
    then = {
      effect = "deny"
    }
  })
}

resource "azurerm_policy_assignment" "storage_tls" {
  name                 = "baseline-storage-tls"
  display_name         = "Baseline: enforce TLS for storage"
  policy_definition_id = azurerm_policy_definition.storage_tls.id
  scope                = "/subscriptions/${var.subscription_id}"
}

resource "azurerm_policy_assignment" "storage_public_access" {
  name                 = "baseline-storage-public-access"
  display_name         = "Baseline: disallow public storage"
  policy_definition_id = azurerm_policy_definition.storage_public_access.id
  scope                = "/subscriptions/${var.subscription_id}"
}

resource "azurerm_policy_assignment" "required_tags" {
  name                 = "baseline-required-tags"
  display_name         = "Baseline: require tags"
  policy_definition_id = azurerm_policy_definition.required_tags.id
  scope                = "/subscriptions/${var.subscription_id}"
}
