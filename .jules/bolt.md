## 2025-02-14 - Missing Index on OIDC userCode
**Learning:** Found a missing index on the `userCode` field in the `OidcPayload` model which is used in `findByUserCode` during OIDC interactions. In PostgreSQL, Prisma does not automatically index foreign keys or frequently queried string fields unless explicitly defined. This causes full table scans on OIDC device authorization polling or similar lookups.
**Action:** Always verify if queried lookup fields (like `userCode`) have an explicit `@@index` in the Prisma schema to avoid O(n) table scans.
