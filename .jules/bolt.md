## 2024-10-28 - [Add indexes to Notification model]
**Learning:** The `Notification` model is heavily queried by `userId` and `createdAt` (e.g. in `NotificationsService.findAll`), and also queried by `userId` and `read` (e.g. in `NotificationsService.markAllAsRead`). But it lacks indexes on these fields, which causes full table scans on the `notifications` table in PostgreSQL.
**Action:** Add indexes `@@index([userId, createdAt(sort: Desc)])` and `@@index([userId, read])` to optimize these queries.
