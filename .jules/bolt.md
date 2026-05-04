## 2024-05-04 - [Database Indexes]
**Learning:** Chronological query patterns (e.g., filtering by ID and sorting by timestamp) cause expensive in-memory sorts if composite indexes are missing.
**Action:** Add missing composite indexes (`@@index([foreignKey, timestamp])`) to models to support common access patterns.
