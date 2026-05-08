## 2026-05-08 - [Missing Chronological Indexes]
**Learning:** Nested includes and chronological queries in Prisma (like sorting ParentalActivity by 'at' descending) can cause expensive in-memory filesorts if composite indexes matching the foreign key and sort column are absent.
**Action:** Always verify access patterns (e.g., findManyByChildId) and explicitly add B-Tree composite indexes like '@@index([childId, at])' to prevent performance bottlenecks.
