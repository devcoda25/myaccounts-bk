## 2024-03-24 - [Prisma Missing Index]
**Learning:** In Prisma (PostgreSQL), foreign keys and frequently queried fields are not indexed automatically. When using a custom OIDC adapter, it's crucial to manually add indexes on fields like userCode to prevent full table scans during authentication flows.
**Action:** Always verify `@@index` directives exist on frequently queried fields in new Prisma models.
