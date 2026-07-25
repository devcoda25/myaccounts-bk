## 2026-07-25 - Add missing database indexes on frequently queried fields
**Learning:** Models like ParentalActivity, ParentalApproval, and ChildProfile are frequently queried by their foreign keys (like childId or parentId) and sorted by their timestamp (like at or createdAt), which can cause N+1 query problems and expensive in-memory sorts without composite indexes.
**Action:** Add composite indexes on the foreign key and timestamp fields to optimize findMany queries.
