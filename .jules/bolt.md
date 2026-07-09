## 2024-07-09 - [Optimized Parental Queries]
**Learning:** The `ParentalActivity` and `ParentalApproval` models are frequently queried by `childId` and sorted chronologically. In-memory sorting can become a bottleneck without composite indexes.
**Action:** Add composite indexes `@@index([childId, at])` on `ParentalActivity` and `ParentalApproval` models.
