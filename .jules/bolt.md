## 2024-05-24 - Add composite indexes
**Learning:** Models with chronological querying patterns on a relational key require composite indices combining the relational key and sort field to prevent expensive in-memory sorts.
**Action:** Add `@@index` to schemas based on frequent query patterns.
