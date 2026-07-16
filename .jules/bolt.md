## 2026-07-16 - [Database Optimization]
**Learning:** The database was missing composite indexes on frequently queried fields in the Parental Control Module, such as parentId and createdAt for ChildProfile, and childId and at for ParentalApproval and ParentalActivity, which could lead to in-memory sorting bottlenecks.
**Action:** Add composite indexes using Prisma to optimize findMany queries with sorting.
