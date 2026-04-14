# Bolt's Journal
## 2024-04-14 - Prisma Index Validation Failure
**Learning:** Adding a composite index `@@index([userId, lastUsedAt])` to the `Session` model causes a fatal schema validation error if the `lastUsedAt` field does not actually exist in the model definition (it was assumed based on other models).
**Action:** Always explicitly verify that all fields intended for an index exist in the target model before adding the index declaration to `prisma/schema.prisma`, and always run `npx prisma validate` to catch these errors.
