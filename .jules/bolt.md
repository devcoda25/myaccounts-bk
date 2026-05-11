## 2024-05-11 - Optimize ChildProfile Queries
**Learning:** Found nested includes on ChildProfile (`approvals`, `activities`) missing composite indexes on foreign key + order by column.
**Action:** Add composite indexes to ParentalApproval (`@@index([childId, at])`) and ParentalActivity (`@@index([childId, at])`) to optimize `ORDER BY at DESC` and prevent in-memory filesort, and `@@index([parentId, createdAt])` to ChildProfile.
