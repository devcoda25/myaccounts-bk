## 2026-05-23 - [Database Indexes for Parental Models]
**Learning:** The `findManyByChildId` access patterns on `ParentalApproval` and `ParentalActivity` models filter by `childId` and sort by `at`. They rely on `@@index([childId, at])` to avoid in-memory filesorts, but these are missing in the schema.
**Action:** Add `@@index([childId, at])` to both models, and also `@@index([parentId, createdAt])` to `ChildProfile`.
