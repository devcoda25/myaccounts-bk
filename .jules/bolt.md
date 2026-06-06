## 2024-06-06 - Composite Indexes for Chronological Queries
**Learning:** Nested includes and chronological queries filtering by foreign keys (e.g., childId) and sorting by timestamps (e.g., at) cause expensive in-memory filesorts in the database if lacking composite indexes.
**Action:** Always add composite indexes like `@@index([childId, at])` to models queried chronologically to prevent in-memory sorts.
