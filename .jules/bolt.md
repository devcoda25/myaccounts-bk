## 2024-11-06 - Missing Index on OidcPayload.userCode
**Learning:** OIDC payload queries by userCode in `PrismaOidcAdapter` do not have an index on `userCode` in the `OidcPayload` model in Prisma, potentially leading to full table scans.
**Action:** Add `@@index([userCode])` to `OidcPayload` in `schema.prisma`.
