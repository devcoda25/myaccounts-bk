## 2026-06-27 - Add Composite Indexes to Parental Models
**Learning:** Models like ParentalActivity, ParentalApproval, and ChildProfile are frequently queried by their parent IDs and sorted chronologically, but lacked composite indexes to optimize these operations, potentially leading to expensive in-memory sorts.
**Action:** Always verify access patterns and add composite indexes (e.g., `@@index([childId, at])`) to models accessed by parent relations and sorted by time.
