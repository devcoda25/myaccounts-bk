## 2025-02-27 - [Missing Composite Index on parental_child_profiles]
**Learning:** The ChildProfile model is frequently queried by parentId and sorted by createdAt, but lacks the necessary composite index, causing performance issues.
**Action:** Add @@index([parentId, createdAt(sort: Desc)]) to the model and create the corresponding SQL migration.
