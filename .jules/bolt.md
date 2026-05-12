## 2026-05-12 - [Database Optimizations]
 **Learning:** Missing database indexes on frequently queried fields for nested relationships and chronological queries causes in-memory sorts which degrade performance.
 **Action:** Added composite indexes for models queried by relations and sorted by date.
