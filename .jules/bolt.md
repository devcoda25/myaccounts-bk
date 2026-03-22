## 2024-03-22 - Missing Composite Indexes for Sorting
**Learning:** Found common query pattern: filter by foreign key (userId, childId) + sort by timestamp (createdAt, at, lastUsedAt). Because these are not B-Tree composite indexed, large tables will force an expensive in-memory sort or unoptimized query plan.
**Action:** Add `@@index([foreignKey, timestampColumn])` on tables like Notification, Session, ParentalActivity, ParentalApproval, SecurityReport, and SupportTicket to ensure DB uses index scanning for the `ORDER BY ... DESC`.
