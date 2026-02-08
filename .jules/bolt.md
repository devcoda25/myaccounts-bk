## 2025-01-28 - [Prisma Foreign Key Indexes]
**Learning:** Prisma does not automatically index foreign key columns defined in relations (e.g., `userId` in `Notification`). This leads to full table scans on relation lookups, causing significant performance degradation as data grows.
**Action:** Always verify `schema.prisma` for missing indexes on foreign keys, especially for high-volume tables like `Notification` or `AuditLog`. Use `@@index([foreignKey])` or `@@index([foreignKey, otherField])` for common query patterns.

## 2025-01-28 - [Prisma Version Mismatch]
**Learning:** Running `npx prisma` uses the latest version (e.g., v7) which may be incompatible with the project's dependency (e.g., v6). This causes validation errors due to breaking changes (e.g., removal of `datasource.url` in schema).
**Action:** Always install project dependencies (`npm install`) or use `npx prisma@<version>` to match the project's Prisma version.
