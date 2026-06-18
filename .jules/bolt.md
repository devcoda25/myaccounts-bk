## 2026-04-23 - [Prisma Composite Indexes for Chronological Queries]
**Learning:** Nested includes and chronological ordering in Prisma (e.g., orderBy: { createdAt: 'desc' }) cause expensive in-memory sorts on PostgreSQL if B-Tree composite indexes matching the foreign key and sort column are missing.
**Action:** Always add composite indexes like `@@index([foreignKeyId, timestampField])` to models queried chronologically.
