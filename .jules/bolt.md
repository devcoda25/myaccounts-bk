## 2025-02-27 - Added Composite Indexes for Descending Sorts
**Learning:** Models queried by foreign keys and sorted chronologically (e.g., ParentalActivity, SecurityReport) need composite indexes containing both the foreign key and the date field with a descending sort (e.g., `@@index([childId, at(sort: Desc)])`) to prevent expensive in-memory sorts.
**Action:** Always verify query patterns in repository files and create composite indexes in Prisma schema along with matching SQL migrations.
