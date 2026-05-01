## 2026-05-01 - [Composite Indexes on Prisma Foreign Keys]
**Learning:** Prisma queries that filter by a foreign key and sort by a timestamp (like parentId/createdAt or childId/at), especially in nested includes (e.g., child.activities(orderBy: {at: 'desc'})), require composite B-Tree indexes matching both the foreign key and sort column. Without these, the database performs expensive in-memory sorts.
**Action:** Always explicitly check for and add composite indexes (e.g., @@index([fkId, timestamp])) to Prisma models when access patterns involve chronological sorting within a relation.
