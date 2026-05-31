## 2024-05-31 - [Database Indexing for Nested Relationships]
**Learning:** Nested includes in Prisma queries (e.g., fetching a parent model and chronologically ordering its included nested relationships) rely heavily on composite indexes matching the foreign key and sort column for optimal performance and preventing in-memory sorts.
**Action:** Add composite indices matching the foreign key and chronological sort field on models queried via nested includes.
