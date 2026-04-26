## 2024-05-18 - Missing Composite Indexes for Nested Includes
**Learning:** Nested includes in Prisma queries (e.g., fetching a parent model and chronologically ordering its included nested relationships like approvals or activities) rely heavily on composite indexes matching the foreign key and sort column (e.g., `@@index([childId, at])`). Without these, Prisma might perform expensive in-memory sorts.
**Action:** Always check for missing indexes on foreign keys and chronological sort columns in `prisma/schema.prisma`.
