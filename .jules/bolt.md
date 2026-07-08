## 2024-06-11 - [Optimize findMany Queries]
**Learning:** Adding `@@index([userId, createdAt])` (or `lastUsedAt`) to `Notification`, `SecurityReport`, `SupportTicket`, and `Session` optimizes frequently queried fields by `userId` and avoids expensive in-memory sorts based on chronological dates.
**Action:** Consistently add composite indexes on foreign keys when paired with sort fields in models that are queried together.
