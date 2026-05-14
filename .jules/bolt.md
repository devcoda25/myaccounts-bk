## 2024-05-14 - Prisma Query Performance Opportunities
**Learning:** Found several queries performing descending sorts on timestamps that lack composite indexes, leading to potential filesorts. Specifically:
- `ParentalActivity.findManyByChildId` sorts by `at` desc and filters by `childId`.
- `ParentalApproval.findManyByChildId` sorts by `at` desc and filters by `childId`.
- `ChildProfile.activities` include sorts by `at` desc.
- `User.sessions` include sorts by `createdAt` desc.

**Action:** Add composite indexes (`@@index([childId, at])`, etc.) to Prisma models to speed up these common access patterns.
