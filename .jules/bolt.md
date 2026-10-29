## 2026-10-29 - [Missing Index on child parentId]
**Learning:** The `ChildProfile` model in Prisma has a foreign key to `User` on `parentId`, but no explicit database index. This could cause full table scans for operations looking up children by their parent's ID, which is a common operation in parental controls.
**Action:** Add `@@index([parentId])` to the `ChildProfile` model.
