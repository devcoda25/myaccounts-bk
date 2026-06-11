## 2024-05-18 - [Prisma Schema Validation Limits]
**Learning:** Prisma validator fails with "duplicate constraint name" (P1012) if you apply sed text substitution twice accidentally.
**Action:** Use idempotent scripts or explicitly verify file states before modifying.

## 2024-05-18 - [Query Patterns]
**Learning:** findMany by `childId` sorted by `at` is a common pattern in `ParentalApproval` and `ParentalActivity`.
**Action:** Index `[childId, at]` to prevent in-memory filesorts.
