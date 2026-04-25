## 2026-04-25 - [Composite Indexes for Chronological Queries]
**Learning:** Prisma queries that filter by a foreign key and sort by a timestamp (e.g., orderBy: { createdAt: 'desc' }) cause expensive in-memory filesorts in PostgreSQL if a composite index (e.g., @@index([fk, timestamp])) is missing. Prisma doesn't auto-index FKs.
**Action:** Always verify and add composite B-Tree indexes for access patterns matching 'filter by ID, sort by date'.
