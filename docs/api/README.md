# API Documentation

The canonical machine-readable contract is [`openapi.yaml`](openapi.yaml), using OpenAPI 3.1. It documents the authentication flow, health probes, and the principal organization, budget, vendor, payment, expense, wallet, and analytics endpoints.

## Authentication

Browser clients authenticate with the OIDC Authorization Code flow:

1. Navigate to `GET /api/login` (not an XHR call).
2. Complete authentication and consent at the identity provider.
3. The provider redirects to `GET /api/callback`; the server establishes a PostgreSQL-backed session and redirects to `/`.
4. Send the secure, HTTP-only session cookie with subsequent same-origin requests. For cross-origin tooling, cookie transmission requires an explicitly approved origin and credentials configuration.
5. Call `GET /api/auth/user` to obtain the current user. A `401` means the client must begin login again.
6. Navigate to `GET /api/logout` to clear the local session and start provider logout.

The API does not accept the session identifier as a bearer token. Scripts and service-to-service clients do not currently have a supported non-interactive authentication flow.

## Compatibility

The current routes are under `/api` and are described as version `1.0.0` in the specification, but the URL is not yet versioned. Additive response fields are backward compatible. Removing or renaming fields or changing their meaning requires a deprecation window and a versioned route before release.

## Conventions

- JSON requests use `Content-Type: application/json`.
- Protected endpoints use the `sessionCookie` security scheme and return `401` when authentication is missing or expired.
- Organization-scoped endpoints return `400` if the authenticated user has no organization.
- Validation failures return `400`; missing resources return `404`; unexpected failures return `500`.
- General and authentication-specific rate limits apply. Clients should treat `429` as retryable and use exponential backoff with jitter.
- List endpoints currently return arrays and do not expose pagination. Consumers must not assume ordering; pagination will be introduced compatibly before unbounded datasets are supported.

## Validation

Validate the contract with any OpenAPI 3.1-aware tool, for example:

```bash
npx --yes @redocly/cli lint docs/api/openapi.yaml
```

Contract changes must be reviewed alongside the corresponding Express handlers and schema changes.
