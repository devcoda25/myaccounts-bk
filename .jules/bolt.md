
## 2025-03-26 - Missing Composite Indexes for Sorting
**Learning:** Prisma does not automatically index foreign key columns in PostgreSQL, nor does it create composite indexes for query patterns that filter by a foreign key and sort by a timestamp. This can lead to expensive in-memory sorts for common queries like finding a user's recent notifications or sessions.
**Action:** Always manually add composite indexes (e.g., `@@index([userId, createdAt])`) in `schema.prisma` for models that are frequently queried by an ID and sorted by a date field.
