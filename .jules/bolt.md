## 2026-09-02 - Missing Composite Indexes on Support Models
**Learning:** `SecurityReport` and `SupportTicket` models are queried by `userId` and sorted by `createdAt` in `SupportRepository`, but lack composite indexes. Relying solely on foreign key indexes for chronological queries causes expensive in-memory sorts on large tables.
**Action:** Always define composite indexes with sort directions (e.g., `@@index([userId, createdAt(sort: Desc)])`) for models fetched by a relation and displayed chronologically.
