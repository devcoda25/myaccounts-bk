## 2026-11-03 - [Missing Index on OidcPayload.userCode]
**Learning:** The `findByUserCode` method in `PrismaOidcAdapter` queries the `oidcPayload` table by `userCode`. However, the `OidcPayload` model in `schema.prisma` lacks an index on the `userCode` field, which can lead to full table scans and performance degradation for OIDC authorization operations involving user codes.
**Action:** Always verify database schema indexes match the queries performed in the application code, especially for frequent lookups like authentication tokens or authorization codes.
