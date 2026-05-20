## 2024-10-24 - Missing Composite Indexes for Chronological Queries
**Learning:** Models like SecurityReport and SupportTicket with chronological access patterns (e.g., filtering by userId and sorting by createdAt desc) cause expensive in-memory sorts without a composite index.
**Action:** Always add composite indexes (e.g., @@index([userId, createdAt])) for models matching this access pattern to allow efficient index scanning.
