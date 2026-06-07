## 2024-06-07 - Composite Indexes for Chronological Filtering
**Learning:** Queries fetching a parent model and chronologically ordering its included relationships (like findManyByChildId sorting by at) require composite indexes matching the foreign key and sort column (e.g., @@index([childId, at])) for optimal performance and preventing in-memory sorts.
**Action:** Add these indexes to parental_approvals and parental_activities.
