## 2026-10-05 - [Database Indexes for Fast Sorting]
**Learning:** Models like `Notification`, `SecurityReport`, `ParentalActivity`, and `ParentalApproval` lack composite indexes for filtering by `userId` or `childId` and sorting by time. This will result in expensive in-memory sorting for list queries.
**Action:** Add composite indexes using Prisma's `@@index([fieldId, createdAt(sort: Desc)])`.
