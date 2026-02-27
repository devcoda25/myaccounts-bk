# Bolt's Journal

## 2024-05-22 - Initial Setup
**Learning:** Performance optimization requires careful measurement and verification.
**Action:** Always verify changes with tests and linting.

## 2024-05-22 - Missing Foreign Key Indexes
**Learning:** Prisma (and Postgres) does not automatically index foreign keys or sort columns, leading to potential performance issues on list queries as tables grow.
**Action:** Explicitly check for and add `@@index([foreignKey])` or compound indexes like `@@index([foreignKey, sortColumn])` in `schema.prisma`.
