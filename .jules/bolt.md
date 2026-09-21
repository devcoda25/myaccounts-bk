## 2025-02-27 - [Missing composite index on Notification table]
**Learning:** The `Notification` model is frequently queried by `userId` and sorted chronologically (descending) in `NotificationsService.findAll`, but lacks a composite index to optimize this.
**Action:** Always verify if frequently sorted findMany queries have matching composite indexes like `@@index([userId, createdAt(sort: Desc)])` to avoid expensive in-memory sorts.
