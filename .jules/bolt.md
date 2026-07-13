## 2026-07-13 - [Missing Composite Indexes on Parental Models]
**Learning:** The `ParentalApproval` and `ParentalActivity` models frequently query by `childId` and sort chronologically by `at`, but lack composite indexes (e.g., `@@index([childId, at])`), leading to unoptimized queries and expensive in-memory sorts.
**Action:** Always verify access patterns (especially filtering combined with sorting) and add corresponding composite indexes in Prisma schemas.
