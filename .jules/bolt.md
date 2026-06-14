## 2026-06-14 - Optimize frequently queried and chronologically sorted user models
**Learning:** Models frequently queried by userId and sorted chronologically (e.g., Notification, SecurityReport, SupportTicket, Session) require composite indexes matching the foreign key and sort column to avoid expensive in-memory sorts.
**Action:** Add composite indexes on [userId, sortColumn] to models exhibiting this access pattern.
