## 2025-05-18 - Database Composite Indexes for Sorting
**Learning:** Chronological query patterns and nested includes require composite indexes matching the foreign key and sort column to prevent expensive in-memory sorts.
**Action:** Always explicitly verify that the intended fields exist in the model before adding an @@index to prevent fatal schema compilation errors.
