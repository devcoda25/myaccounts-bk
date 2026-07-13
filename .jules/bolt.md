## 2024-05-24 - Add composite indexes to ParentalActivity and ParentalApproval
 **Learning:** findManyByChildId access patterns on ParentalApproval and ParentalActivity models filter by childId and sort by at. They rely on @@index([childId, at]) to avoid in-memory filesorts.
 **Action:** Added composite indexes to optimize the queries.
