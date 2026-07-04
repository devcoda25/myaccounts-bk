## 2026-07-04 - [Database Indexes]
**Learning:** Models frequently queried by a specific field and sorted chronologically (e.g., `ParentalActivity`, `ParentalApproval`, `Session`, `SecurityReport`, `SupportTicket`) require composite indexes to optimize `findMany` queries and avoid expensive in-memory sorts.
**Action:** Add composite indexes to frequently queried models in `prisma/schema.prisma`.
