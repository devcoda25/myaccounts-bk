## 2025-02-27 - [Add Composite Indexes]
**Learning:** I learned that some models in this codebase were missing composite indexes for fields they are frequently queried and sorted by.
**Action:** For queries like findManyByChildId with an orderBy, ensure composite indexes include the sort direction `@@index([childId, at(sort: Desc)])`.
