## 2025-02-27 - [Add Composite Indexes]
**Learning:** Composite indexes with explicit sort directions are required in Prisma (e.g. `(sort: Desc)`) to avoid expensive in-memory sorts for queries with both filter and sort, like findManyByChildId in the Parental module.
**Action:** Add `@@index([childId, at(sort: Desc)])` to ParentalActivity and ParentalApproval.
