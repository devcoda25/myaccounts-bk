## 2026-08-05 - [Database Indexes Missing on Sorting Fields]
**Learning:** Prisma relies on explicit index declarations to optimize sorting on queries like findManyByChildId and findUserTickets. Models often have 'createdAt' or similar fields that require sorting queries, meaning an index explicitly detailing the descending sort is needed to prevent high latency during database calls.
**Action:** Always check the codebase's query mechanisms (e.g. 'orderBy' in findMany) and ensure matching composite indexes like @@index([foreignId, createdAt(sort: Desc)]) are added to the Prisma schema.
