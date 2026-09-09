## 2025-02-27 - [Database Index Optimization]
**Learning:** The `ParentalActivity`, `ParentalApproval`, and `ChildProfile` models are frequently queried by their parent relationships and sorted chronologically (descending). The lack of composite indexes for these queries forces expensive in-memory sorts.
**Action:** Add composite indexes specifying the exact sort direction (e.g., `@@index([childId, at(sort: Desc)])`) to Prisma models that are routinely fetched by relation and sorted. This aligns the database index precisely with the application's query patterns.
