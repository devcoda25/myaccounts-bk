## 2024-10-27 - [ChildProfile query bottleneck]
**Learning:** The `ChildProfile` model uses a JSONB/Gin index for `apps` but lacks a dedicated index on `parentId`. Queries filtering by `parentId` will require full table scans on this table which could contain many child profiles per parent.
**Action:** Always verify foreign keys like `parentId` have dedicated indexes in PostgreSQL schemas when creating related models.
