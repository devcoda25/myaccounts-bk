## 2023-10-25 - [Add Composite Indexes for findMany Queries]
**Learning:** Models like `ParentalActivity` and `ParentalApproval` are frequently queried by `childId` and ordered by `at` (descending). Adding a composite index `@@index([childId, at(sort: Desc)])` optimizes these queries, avoiding expensive in-memory sorts.
**Action:** Always add composite indexes with explicitly defined sort order (e.g. `(sort: Desc)`) to frequently queried foreign key relationships that are also sorted by a date field in the query.
