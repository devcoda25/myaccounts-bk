## 2026-11-08 - [Database Optimization]
**Learning:** Missing foreign key indexes (e.g., parentId in ChildProfile, childId in ParentalApproval and ParentalActivity) can cause full table scans on relations.
**Action:** Add indexes for all relations and frequent lookups.
