
## 2025-03-12 - [Prisma PostgreSQL Indexing Optimization]
**Learning:** In PostgreSQL, Prisma does not automatically index foreign key columns, nor does it create composite indexes for sorting out of the box. Frequently queried collections (like Notification, SecurityReport, SupportTicket, ParentalApproval, and ParentalActivity) that filter by a related ID and sort by a timestamp can suffer performance degradation without explicit composite indexes covering the foreign key and timestamp fields.
**Action:** When adding models or access patterns that query by an ID and sort by time, always add an explicit `@@index([foreignKey, timestampField])` in `prisma/schema.prisma` to prevent expensive in-memory sorts and improve performance.
