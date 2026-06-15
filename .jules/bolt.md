## 2025-06-15 - Missing Index for Session model findMany query
**Learning:** The `findActiveSessionsByUser` query in the Session repository filters by `userId` and sorts by `lastUsedAt` descending. Without a composite index, this causes a filesort.
**Action:** Add `@@index([userId, lastUsedAt])` to models queried by `userId` and sorted by a timestamp to optimize performance.
