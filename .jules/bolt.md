## 2025-02-28 - [Added composite indexes for Parent/Child queries]
**Learning:** The models ChildProfile, ParentalApproval, and ParentalActivity lacked composite indexes for frequently queried fields like `parentId` and `childId` when sorting by timestamp in a descending order.
**Action:** Add `@@index` composite indexes to the respective models in `prisma/schema.prisma` and explicitly define descending sort `(sort: Desc)` to match query logic and maintain performance.
