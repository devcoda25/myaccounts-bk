## 2024-05-22 - Missing Foreign Key Indexes
**Learning:** Prisma does not automatically index foreign key columns. This codebase relies heavily on relations but lacks indexes on many foreign keys (e.g., `userId` in `Notification`, `childId` in `ParentalActivity`), leading to potential full table scans.
**Action:** When working on Prisma schemas, always check if foreign keys used in filtering or sorting have corresponding indexes.
