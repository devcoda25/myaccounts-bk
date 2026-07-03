## 2026-07-03 - Add missing indexes for parental features
**Learning:** The 'findManyByChildId' and 'findManyByParentId' operations on ParentalApproval, ParentalActivity, and ChildProfile models require composite indexes to optimize sorting and filtering and avoid expensive in-memory operations.
**Action:** Add the appropriate composite indexes to the models in prisma/schema.prisma.
