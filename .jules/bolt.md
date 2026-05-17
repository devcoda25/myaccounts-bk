## 2026-04-18 - [Missing Composite Indexes for Chronological Queries]
**Learning:** Prisma queries that filter by a foreign key and sort by a timestamp (e.g., findManyByChildId ordering by 'at' desc) require composite indexes to avoid expensive in-memory sorts in PostgreSQL.
**Action:** Always add composite indexes like @@index([fk, timestamp]) for chronological access patterns.
