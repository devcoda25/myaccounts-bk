## 2026-06-03 - [Composite Indexes for Chronological Queries]
**Learning:** Nested includes in Prisma queries (e.g., fetching a parent model and chronologically ordering its included nested relationships) rely heavily on composite indexes matching the foreign key and sort column (e.g., \`@@index([childId, at])\`) to prevent expensive in-memory sorts.
**Action:** Always add composite indexes covering the foreign key and chronological sort field for relations that are frequently queried with \`orderBy\`.
