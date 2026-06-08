## 2026-06-08 - Add composite indexes
**Learning:** Prisma models accessed chronologically per user or child often require composite indexes for efficient sorting, otherwise in-memory sorts occur. Adding these composite indexes significantly improves scaling for millions of users.
**Action:** Always add composite indexes matching the filter and sort fields for frequently accessed chronological queries.
