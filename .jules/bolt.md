## 2023-10-25 - Bolt: Composite Indexes for Chronological Queries
**Learning:** Models frequently queried by foreign keys and sorted chronologically (e.g., Notification by userId, ParentalActivity by childId) suffer from expensive in-memory filesorts if they lack composite indexes.
**Action:** Always add composite indexes (e.g., @@index([userId, createdAt])) to models that are frequently accessed via foreign key and sorted by timestamp.
