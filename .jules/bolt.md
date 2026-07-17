## 2026-07-17 - [Missing Indexes on Chronological Queries]
**Learning:** Models frequently queried by `userId` and sorted chronologically (e.g., `SecurityReport`, `SupportTicket`) require composite indexes like `@@index([userId, createdAt])` to optimize findMany queries and avoid expensive in-memory sorts.
**Action:** Add `@@index([userId, createdAt])` to `SecurityReport` and `SupportTicket` models in `prisma/schema.prisma`.
