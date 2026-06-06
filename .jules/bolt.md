## 2025-06-06 - Add Composite Indexes to Parental Models
**Learning:** findManyByChildId access patterns on ParentalApproval and ParentalActivity models filter by childId and sort by at. Missing composite indexes for these fields cause expensive in-memory filesorts on the database.
**Action:** Add @@index([childId, at]) to ParentalApproval and ParentalActivity models in prisma/schema.prisma.
