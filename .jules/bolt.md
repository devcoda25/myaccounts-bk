## 2024-05-18 - Database Composite Indexes on FK/Sort Pairs
**Learning:** In NestJS+Prisma backends, access patterns that filter by foreign keys and sort by timestamps (e.g., findManyByChildId with orderBy: {at: 'desc'}) require composite indexes to avoid expensive in-memory filesorts.
**Action:** Always add composite indexes matching the filter and sort fields (e.g., @@index([childId, at])) for chronologically ordered relational queries.
