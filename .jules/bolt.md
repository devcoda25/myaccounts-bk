## 2025-02-28 - Composite Indexes for Frequent Sorted Queries
**Learning:** Models like ChildProfile, ParentalApproval, ParentalActivity, SupportTicket, SecurityReport, and Session are frequently queried by their relation fields and explicitly sorted chronologically in descending order. Without composite indexes, the database must perform an expensive in-memory sort after fetching the relation rows.
**Action:** Added composite indexes with explicit (sort: Desc) to optimize these operations, ensuring Prisma defaults are correctly aligned with the queries.
