## 2024-05-22 - Missing Prisma Foreign Key Indexes
**Learning:** Several Prisma models (Notification, UserCredential) have Foreign Keys without corresponding indexes. Prisma does not automatically index FKs (unlike some ORMs).
**Action:** Always check `schema.prisma` for missing indexes on relation fields, especially for high-volume tables like `Notification`.
