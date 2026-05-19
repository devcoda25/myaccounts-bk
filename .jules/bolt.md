## 2024-05-19 - Composite Indexing for Prisma Nested Includes
 **Learning:** B-Tree composite indexes matching the foreign key and order-by timestamp (e.g., `@@index([childId, at])`) prevent expensive in-memory sorts for common access patterns like `findManyByParentId` that filter by one field and sort by another.
 **Action:** When designing a chronological list query with nested models, always verify composite indexes are defined.
