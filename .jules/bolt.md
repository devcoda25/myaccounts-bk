## 2025-02-27 - [Parental queries optimization]
**Learning:** The models ParentalActivity, ParentalApproval, and ChildProfile are frequently queried by specific foreign keys and sorted by timestamp, but lack the necessary composite indexes to optimize these queries.
**Action:** Add composite indexes on `[childId, at(sort: Desc)]` for ParentalActivity and ParentalApproval, and `[parentId, createdAt(sort: Desc)]` for ChildProfile.
