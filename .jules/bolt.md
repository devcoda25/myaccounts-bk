## 2026-04-28 - [Missing Composite Indexes on Chronological Queries]
**Learning:** Chronological query patterns (filtering by foreign key like userId or parentId and sorting by timestamp) cause expensive in-memory sorts if there is no composite index matching this pattern.
**Action:** Add composite indexes on the foreign key and sort column (e.g., @@index([userId, createdAt])) for models with chronological query patterns (like Notification, Session, ChildProfile, etc).
