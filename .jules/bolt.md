## 2024-07-10 - Add composite index for Parental Models
**Learning:** findManyByChildId and findManyByParentId access patterns on ChildProfile, ParentalApproval, and ParentalActivity filter by foreign key and sort by date. They rely on composite indexes to avoid in-memory filesorts.
**Action:** Add @@index([childId, at]) and @@index([parentId, createdAt]) to these models in prisma/schema.prisma.
