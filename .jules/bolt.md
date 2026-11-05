## 2024-11-05 - OIDC Payload Lookup Indexes
**Learning:** `OidcPayload` queries in `findByUserCode` use the `userCode` field which lacks a database index, causing a full table scan. `uid` has an index but `userCode` doesn't.
**Action:** Add `@@index([userCode])` to the `OidcPayload` model in `schema.prisma`.
