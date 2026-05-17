## 2024-05-18 - Missing Index on Parental Approval Queries
**Learning:** `findManyByChildId` on `ParentalApproval` queries filter by `childId` and order by `at` descending. Missing a composite index `@@index([childId, at])` can cause an in-memory filesort when tables grow large, leading to significant performance degradation.
**Action:** Add `@@index([childId, at])` to both `ParentalApproval` and `ParentalActivity` models, and similarly `@@index([userId, lastUsedAt])` to `Session`, and `@@index([userId, createdAt])` to Notification, SecurityReport and SupportTicket.
