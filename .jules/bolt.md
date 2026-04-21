## 2025-02-23 - Missing Composite Indexes
**Learning:** Chronological queries require composite indexes in Prisma to prevent expensive in-memory sorts.
**Action:** Always add composite indexes for models with chronological access patterns.
