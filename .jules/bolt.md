## 2026-06-02 - [Composite Indexes for Chronological Queries]
**Learning:** Chronological query patterns and nested includes filtering by foreign keys and sorting by dates (e.g., findManyByChildId or chronological Session access) require composite indexes matching the foreign key and sort column to prevent expensive in-memory sorts.
**Action:** Always add composite indexes (e.g., @@index([userId, createdAt])) when implementing models with chronological access patterns.
