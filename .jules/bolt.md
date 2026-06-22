## 2026-06-22 - [Database Optimization]
**Learning:** Models frequently queried by parent/child ID and sorted chronologically (e.g., ParentalActivity, ParentalApproval) require composite indexes (e.g., `@@index([childId, at])`) to avoid expensive in-memory sorts.
**Action:** Always verify access patterns in repositories and add corresponding composite indexes in Prisma schema.
