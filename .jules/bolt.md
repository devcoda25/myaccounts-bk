## 2024-03-02 - Missing Compound Indexes
**Learning:** The application frequently queries models by a foreign key and sorts by a timestamp (e.g. `userId` and `createdAt`), but the schema lacks compound indexes to optimize this access pattern. This can lead to slow queries and high database load as table sizes grow.
**Action:** Always add `@@index([foreignKey, timestampField])` for commonly queried collections like notifications, tickets, reports, approvals, and activities.
