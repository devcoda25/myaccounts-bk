## 2024-05-22 - Missing Critical Indexes on High-Traffic Tables
**Learning:** The `Notification` table, a high-volume user-facing entity, lacked *any* indexes on `userId` or `createdAt`, despite documentation/memory suggesting otherwise. This would cause severe performance degradation on user dashboards as the table grows.
**Action:** Always verify `schema.prisma` definitions against expected performance requirements, especially for core user-facing lists (Notifications, AuditLogs, Sessions), and do not rely solely on documentation or memory.
