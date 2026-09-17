## 2025-02-27 - [Missing Composite Indexes on Parental Models]
**Learning:** The `ParentalActivity`, `ParentalApproval`, and `ChildProfile` models are frequently queried by their parent foreign key and sorted by timestamp descending, but lack composite indexes. Without explicitly specifying `(sort: Desc)` in Prisma (e.g., `@@index([childId, at(sort: Desc)])`), Prisma creates ascending indexes which do not fully optimize these queries and can cause schema drift.
**Action:** Always add composite indexes with `(sort: Desc)` when optimizing `findMany` queries that include descending sorts.
