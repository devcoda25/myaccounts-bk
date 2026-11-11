## 2024-11-11 - [Missing Index on userCode]
**Learning:** Found that `userCode` on `OidcPayload` is queried directly via `findFirst` in the OIDC adapter, but lacked an index. This would cause O(n) table scans as the OIDC payloads grow.
**Action:** Always verify indexes exist for fields used in `.findFirst()` or `.findUnique()` queries in custom Prisma adapters.
