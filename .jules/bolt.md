## 2025-02-27 - [Index on OidcPayload userCode]
**Learning:** OidcPayload table is missing an index on userCode, leading to slow OIDC code lookups. OidcPayloads are queried with `findByUserCode`.
**Action:** Add an index on userCode field in OidcPayload model.
