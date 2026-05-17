## 2026-05-17 - [Composite Indexes for Chronological Queries]
**Learning:** Nested includes in Prisma queries (e.g., fetching a parent model and chronologically ordering its included nested relationships) rely heavily on composite indexes matching the foreign key and sort column (e.g., `@@index([childId, at])`) for optimal performance and preventing in-memory sorts.
**Action:** Add composite indexes to models that are frequently queried by foreign key and sorted by a timestamp.
