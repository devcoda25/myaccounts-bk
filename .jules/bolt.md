## 2024-05-15 - Missing DB Indexes causing sequential scans
**Learning:** Prisma models like `ChildProfile`, `ParentalApproval`, and `ParentalActivity` are queried with composite where+orderBy clauses, but lack the matching database indexes, which can lead to expensive in-memory sorts.
**Action:** Add `@@index([parentId, createdAt])` to `ChildProfile` and `@@index([childId, at])` to `ParentalApproval` and `ParentalActivity` models to optimize query access paths.
