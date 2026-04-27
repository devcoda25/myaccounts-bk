## 2024-04-27 - Initializing Bolt Journal
**Learning:** Initialized performance journal.
**Action:** Ready to optimize.

## 2026-04-27 - Missing Composite Indexes on Chronological Parent/Child Queries
**Learning:** The codebase frequently queries child entities (e.g., ParentalActivity, ChildProfile) by a parent ID and sorts them chronologically. Without composite indexes matching the foreign key and sort column, the database falls back to expensive in-memory filesorts.
**Action:** Always verify and add composite B-Tree indexes (e.g., `@@index([childId, at])`) to models that support chronological pagination by a foreign key.
