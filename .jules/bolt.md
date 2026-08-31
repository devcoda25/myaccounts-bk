## 2025-02-27 - Composite Indexes for Chronological Queries
**Learning:** When writing composite indexes for models queried by an ID and sorted chronologically (like `Session`, `SupportTicket`, `SecurityReport`, `ParentalActivity`, and `ParentalApproval`), omitting `(sort: Desc)` causes Prisma to default to ascending order. This prevents the database from using the index for descending sorts, falling back to expensive in-memory sorts.
**Action:** Always append `(sort: Desc)` to timestamp fields in composite indexes when the application queries them in descending order.
