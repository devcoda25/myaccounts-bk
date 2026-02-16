## 2026-02-16 - [Missing FK Indexes]
**Learning:** Prisma does not automatically index foreign keys in PostgreSQL. This codebase is missing indexes on several high-traffic relations (e.g., Notification.userId, ChildProfile.parentId), leading to potential O(N) full table scans.
**Action:** Always manually check and add `@@index([foreignKey])` or composite indexes for relations, especially on rapidly growing tables like Notifications.
