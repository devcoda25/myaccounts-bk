## 2024-06-04 - Missing composite indexes cause in-memory sorting for Nested Prisma Queries
**Learning:** Nested includes in Prisma queries (e.g., fetching a parent model and chronologically ordering its included nested relationships) rely heavily on composite indexes matching the foreign key and sort column (e.g., `@@index([childId, at])`) to avoid expensive in-memory sorts.
**Action:** Always add composite indexes to Prisma models when queries include filters on a foreign key combined with a sort on a different field.
