## 2024-05-03 - [Prisma Composite Indexes for Chronological Queries]
**Learning:** Nested includes in Prisma queries (e.g., fetching a parent model and chronologically ordering its included nested relationships) and chronological access patterns rely heavily on composite indexes matching the foreign key and sort column (e.g., `@@index([childId, at])`) for optimal performance and preventing in-memory sorts.
**Action:** Always explicitly check for and add missing composite indexes on Foreign Keys and sort columns in `prisma/schema.prisma` when adding chronological access patterns.
