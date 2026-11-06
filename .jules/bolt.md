## 2024-03-24 - Missing database index for userCode
**Learning:** The `findByUserCode` operation in `PrismaOidcAdapter` queries `OidcPayload` using `userCode`. However, the `OidcPayload` model in `schema.prisma` lacks an index on `userCode`, causing slow, full-table scans for this lookup.
**Action:** Always verify indexes for fields used in unique lookups or frequent queries. When an index is missing, add it to `schema.prisma` and create a migration.
