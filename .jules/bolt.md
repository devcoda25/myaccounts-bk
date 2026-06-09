## 2026-06-09 - [Database Indexes]
**Learning:** findManyByChildId and findManyByParentId access patterns on ChildProfile, ParentalApproval, and ParentalActivity filter by foreign key and sort chronologically. Missing composite indexes cause expensive in-memory filesorts.
**Action:** Always add composite indexes matching the foreign key and sort column (e.g., @@index([childId, at])) for nested include queries and frequently sorted relations.
