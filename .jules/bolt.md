## 2025-02-27 - Added Composite Indexes for Parental Queries
**Learning:** The ChildProfile, ParentalApproval, and ParentalActivity models are frequently queried by parentId or childId and sorted chronologically. Missing composite indexes meant the database was performing inefficient in-memory sorts for these common operations.
**Action:** Added explicit composite indexes with sort: Desc in Prisma (e.g., @@index([childId, at(sort: Desc)])) to ensure the queries can leverage the database index for both filtering and sorting simultaneously.
