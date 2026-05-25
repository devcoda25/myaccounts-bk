## 2026-05-25 - [Database Schema Indexes for Chronological Queries]
**Learning:** Identified that nested includes and chronological query access patterns on models like Notification, SecurityReport, ParentalApproval, and Session can result in expensive in-memory sorts without composite B-Tree indexes that match the foreign key and the sort column.
**Action:** Added targeted composite indexes (e.g., `@@index([userId, createdAt])`) to strictly match application access patterns to optimize performance.
