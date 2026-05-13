## 2024-05-13 - Database Query Optimization
**Learning:** Common access patterns that filter by a parent ID and sort by a timestamp (e.g., createdAt, at) require composite indexes to avoid expensive in-memory filesorts in PostgreSQL via Prisma.
**Action:** Add composite indexes like @@index([parentId, createdAt]) to models with these query patterns.
## 2024-05-13 - Missing Database Server for Prisma Migrate
**Learning:** The agent environment does not have a live database to run `npx prisma migrate dev`. Consequently, we cannot generate migration SQL files for schema changes within the agent workspace. Also, the project deploys via a script that does not run `prisma migrate deploy`, implying database migrations might be handled externally or this is a limitation of the current setup.
**Action:** When PRing Prisma schema changes, acknowledge the inability to generate the migration file locally due to the missing database server, and communicate that the user must generate the migration locally before deploying.
