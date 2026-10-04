## 2026-10-04 - [Add Missing Indexes for Parental/Child Models]
 **Learning:** Models such as ParentalActivity and ParentalApproval are frequently queried by childId and sorted by `at` (descending). The ChildProfile model is queried by parentId and sorted by createdAt (descending). Missing these indexes creates N+1 query and sorting performance issues.
 **Action:** Adding `@@index` to these Prisma models is required.
