## 2024-05-22 - Missing Prisma Indexes on Foreign Keys

**Learning:** This codebase uses Prisma with PostgreSQL, which does not automatically index Foreign Keys. Several core models (Notification, SecurityReport, SupportTicket) were missing indexes on userId, leading to potential full table scans on high-traffic queries. Also, Notification was missing a composite index for sorting ([userId, createdAt]).

**Action:** Systematically audit schema.prisma for all relation fields and ensure the corresponding Foreign Key column has an @@index. For sorted queries (like feeds), ensure the sort column is also in the index.
