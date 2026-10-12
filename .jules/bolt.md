## 2023-10-12 - Missing database index for Notifications
**Learning:** The `Notification` model is frequently queried by `userId` and sorted by `createdAt` descending (e.g., in `NotificationsService.findAll`), but lacks a composite index in `schema.prisma`. This would lead to full table scans and expensive in-memory sorting as the notifications table grows.
**Action:** Add `@@index([userId, createdAt(sort: Desc)])` to the `Notification` model.
