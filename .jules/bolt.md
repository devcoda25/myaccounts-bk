## 2026-04-30 - Add Composite Indexes to Parental Models
**Learning:** Nested includes in Prisma queries (e.g., fetching a parent model and chronologically ordering its included nested relationships) rely heavily on composite indexes matching the foreign key and sort column (e.g., `@@index([childId, at])`) for optimal performance and preventing in-memory sorts.
**Action:** Add `@@index([childId, at])` to `ParentalApproval` and `ParentalActivity`, and `@@index([parentId, createdAt])` to `ChildProfile`.
