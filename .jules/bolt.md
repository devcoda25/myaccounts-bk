## 2025-02-27 - [Audit Log Index Optimization]
**Learning:** The `AuditLog` model frequently queried by `userId` and `action` could benefit from a compound index, although individual indexes exist. However, the `OidcPayload` model handles session payloads with frequent lookups by `expiresAt` missing an index, leading to slow OIDC expiration checks.
**Action:** Add an `@@index([expiresAt])` to the `OidcPayload` model in `prisma/schema.prisma` to optimize expiry sweeps and validation.
