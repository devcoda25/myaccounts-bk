## 2026-11-06 - [Missing Index on OidcPayload userCode]
**Learning:** The OidcPayload model lacks an index on the userCode field, which is used for lookups in the oidc-provider adapter (findByUserCode). This can cause slow OIDC device flow authentications due to full table scans.
**Action:** Add an @@index([userCode]) to the OidcPayload model and create a corresponding raw SQL migration.
