## 2024-05-18 - [Add composite indexes for findMany sorting]
**Learning:** Nested includes in Prisma queries (e.g., fetching a parent model and chronologically ordering its included nested relationships like child profiles, approvals, and activities) rely heavily on composite indexes matching the foreign key and sort column (e.g., `@@index([childId, at])`) for optimal performance and preventing in-memory sorts.
**Action:** Always add composite indexes covering both the foreign key and the sort field for frequently queried and sorted relational data.
