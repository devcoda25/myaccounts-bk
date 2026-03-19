## 2024-05-20 - [Init]

## 2024-05-20 - [Composite Indexes on Foreign Keys and Timestamps]
**Learning:** In a PostgreSQL + Prisma setup, common access patterns that filter by a foreign key (e.g., `userId`, `childId`) and sort by a timestamp (e.g., `createdAt`, `at`, `lastUsedAt`) can lead to expensive in-memory sorts if indexes are missing. Adding B-Tree composite indexes matching this specific access pattern prevents this overhead without needing explicit sort directions in the Prisma schema.
**Action:** When creating or analyzing relation models (e.g., Notifications, Activity Logs, Sessions) where listing records involves filtering by an owner and sorting chronologically, always verify if a composite index on `[ownerId, timestamp]` exists and add it if missing.
