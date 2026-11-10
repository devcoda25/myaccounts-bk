## 2026-11-10 - [OIDC userCode Index Optimization]
**Learning:** Found a missing index on the `userCode` field in the `OidcPayload` model, which is queried during OIDC authentication.
**Action:** Add an index to frequently queried fields to avoid O(n) lookups.
