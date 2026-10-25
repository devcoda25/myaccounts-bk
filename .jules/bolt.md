## 2024-05-14 - [Session Revocation N+1 Query]
**Learning:** Revoking multiple sessions via a loop (`for...await deleteSession`) results in an N+1 query problem, slowing down operations like `logoutOthers` or `revokeAllDevices` when a user has many active sessions.
**Action:** Use Prisma's `deleteMany` for bulk revocation instead of iterating over `deleteSession` to optimize database round trips.
