## 2026-05-18 - Add missing indexes for parental queries
**Learning:** The child-profile repository heavily queries parental_child_profiles, parental_approvals, and parental_activities using parentId/childId and sorting by createdAt/at desc. Without composite indexes, these queries cause expensive in-memory sorts.
**Action:** Add composite indexes to efficiently support descending sorts on heavily accessed child/parent associations.
