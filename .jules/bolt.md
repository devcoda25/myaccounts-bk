## 2026-04-22 - Optimize Parental Data Access
**Learning:** Composite indexes combining foreign keys with sort columns (e.g., [parentId, createdAt], [childId, at]) are crucial for optimizing nested includes and chronologically sorted queries in this codebase.
**Action:** Always check repositories for findMany queries with orderBy when adding new relational models to ensure appropriate composite indexes are included in the schema.
