## 2025-02-18 - Middleware Overhead from Env Parsing
**Learning:** Middleware guards that execute on every request should avoid repetitive parsing of environment variables (like splitting strings). Accessing `process.env` and running string operations (split/map/trim) in `canActivate` adds unnecessary CPU cycles to every request.
**Action:** Move configuration parsing to the constructor or a configuration service to ensure it happens only once at startup.
