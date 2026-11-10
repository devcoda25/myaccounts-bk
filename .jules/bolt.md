## 2024-05-18 - [Missing Index on userCode]
**Learning:** The PrismaOidcAdapter performs lookups by userCode, but the userCode field in the OidcPayload model lacks an index. This would cause full table scans.
**Action:** Add an @@index([userCode]) to the OidcPayload model.
