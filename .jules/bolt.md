## 2026-11-11 - [OIDC Payload Table Scans]
**Learning:** The OIDC provider adapter frequently queries OidcPayload by userCode during device flows, but the field lacked an index, causing potential O(n) table scans on every device authorization request.
**Action:** Always verify that all fields used in custom Prisma adapter lookups have corresponding database indexes.
