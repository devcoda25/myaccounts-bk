## 2026-04-26 - [Database Performance]
**Learning:** Nested includes and sorted finds on chronological data create hidden in-memory sort bottlenecks without composite indexes.
**Action:** Always create composite B-Tree indexes matching the (foreignKey, sortColumn) signature on ordered child relations.
