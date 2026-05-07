## 2024-05-07 - Composite Indexes for Nested Includes
**Learning:** Nested includes in Prisma queries (e.g., fetching a parent model and chronologically ordering its included nested relationships) rely heavily on composite indexes matching the foreign key and sort column (e.g., `@@index([childId, at])`) for optimal performance and preventing in-memory sorts.
**Action:** Explicitly check for and add missing composite indexes on Foreign Keys and sort columns in `prisma/schema.prisma`.
