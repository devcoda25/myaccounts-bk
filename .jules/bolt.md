## 2026-05-06 - Database Composite Indexes
**Learning:** Nested includes in Prisma queries (e.g., fetching a parent model and chronologically ordering its included nested relationships) rely heavily on composite indexes matching the foreign key and sort column (e.g., `@@index([childId, at])`) for optimal performance and preventing in-memory sorts.
**Action:** Always add composite indexes on Foreign Keys and sort columns in `prisma/schema.prisma` when implementing chronological query access patterns.
