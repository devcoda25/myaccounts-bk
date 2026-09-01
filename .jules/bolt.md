## 2025-02-28 - [Performance] Missing Database Indexes for Sorting
**Learning:** Frequent queries in ParentalActivity, ParentalApproval, ChildProfile, and SupportTicket modules use orderBy on temporal fields (at, createdAt) combined with foreign keys (childId, parentId, userId). The absence of composite indexes covering these combinations leads to full table scans and expensive in-memory sorts for pagination/history endpoints.
**Action:** Always add composite indexes (e.g., @@index([childId, at(sort: Desc)])) for models that are frequently queried by a relationship ID and sorted by date.
