## 2025-02-27 - [Index Optimization for Parental Models]
**Learning:** The ParentalActivity, ParentalApproval, and ChildProfile models are frequently queried by their foreign keys (childId and parentId) and sorted chronologically, leading to expensive in-memory sorts and potential N+1 query performance degradation without composite indexes.
**Action:** Always ensure that foreign keys combined with timestamp fields used for sorting (like `at` or `createdAt`) are covered by composite indexes (e.g., `@@index([childId, at(sort: Desc)])`).
