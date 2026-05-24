## 2026-05-24 - Add composite indexes to Parental Activity and Approval
**Learning:** Nested includes and chronologically ordered queries (filtering by childId and sorting by at desc) can cause expensive in-memory filesorts if the database is missing a composite index covering both fields.
**Action:** Always ensure that queries combining a foreign key filter and a sort order are backed by a corresponding composite index like @@index([childId, at]).
