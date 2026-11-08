## 2026-11-08 - OIDC Payload Lookup Performance
**Learning:** The custom OIDC adapter performs lookups on OIDC payloads using the user code, but the field lacked an index in the schema, potentially causing full table scans during authentication flows.
**Action:** Add database indexes to any fields that are used for single-record lookups in the critical authentication path.
