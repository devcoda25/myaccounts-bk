## 2026-04-23 - Add missing database composite indexes for chronological queries
**Learning:** Chronological queries filtering by a foreign key (like `childId`, `userId`) and sorting by timestamp (`at`, `createdAt`, `lastUsedAt`) cause expensive in-memory sorts in PostgreSQL without composite indexes.
**Action:** Always add composite indexes like `@@index([childId, at])` when implementing list endpoints that filter by parent ID and sort by time.
