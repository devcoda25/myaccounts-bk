## 2024-07-21 - Added missing composite indexes for chronological queries
**Learning:** Models like ParentalActivity, ParentalApproval, and ChildProfile are frequently queried by their foreign key (childId or parentId) and sorted by a timestamp (at or createdAt). Without a composite index, the database must perform an expensive in-memory sort after filtering by the foreign key.
**Action:** Add composite indexes (e.g., `@@index([childId, at])`) to models where this query pattern is used to avoid in-memory sorts and optimize query performance.
