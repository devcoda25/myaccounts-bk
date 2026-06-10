## 2024-06-10 - [Database Optimization]
**Learning:** Prisma nested relation queries and child finds sorted by date require composite indexes on foreign keys and date fields to avoid in-memory filesorts.
**Action:** Add composite indexes like @@index([childId, at]) on related models.
