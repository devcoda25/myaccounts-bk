## 2026-06-29 - [Database Indexes]
**Learning:** The access patterns for ChildProfile, ParentalApproval, and ParentalActivity use findMany filtering by parentId or childId and sorting chronologically by createdAt or at.
**Action:** Add composite indexes like `@@index([childId, at])` to these models to optimize these frequently used queries.
