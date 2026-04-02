# Bolt's Journal ⚡

## 2024-05-22 - Initial Setup
**Learning:** Started Bolt journal.
**Action:** Always check this file for critical performance insights.

## 2024-05-22 - Notification Schema Bottleneck
**Learning:** The `Notification` model lacked indexes on `userId`, causing full table scans for the most frequent operation (dashboard load).
**Action:** Added `@@index([userId, createdAt])` to support efficient filtering and sorting. Always check `prisma/schema.prisma` for missing foreign key indexes.
