## 2024-06-17 - Setup
**Learning:** Initializing bolt journal.
**Action:** Always document learnings.
## 2024-06-17 - Added composite indexes for models queried by userId and sorted by createdAt
**Learning:** Models like SecurityReport and SupportTicket frequently queried by userId and sorted chronologically require composite indexes to avoid in-memory sorts.
**Action:** Added @@index([userId, createdAt]) to these models in prisma/schema.prisma.
