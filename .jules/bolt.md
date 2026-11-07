## 2026-11-07 - [Database Index for OIDC userCode]
**Learning:** The OIDC Adapter performs frequent queries on the `userCode` field during authentication flows (via `findByUserCode`), but the database schema lacks an index for this field, leading to potential full table scans.
**Action:** Add `@@index([userCode])` to the `OidcPayload` model in `prisma/schema.prisma` to optimize database performance.
