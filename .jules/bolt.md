## 2024-03-14 - [Backend: Missing FK Indexes]
**Learning:** In Prisma (PostgreSQL), foreign keys do not automatically create indexes, leading to potential full table scans on relations, which is a significant performance bottleneck for large datasets.
**Action:** Add explicit `@@index` to frequently queried foreign keys (e.g., `parentId` in `ChildProfile`, `childId` in `ParentalApproval`).
