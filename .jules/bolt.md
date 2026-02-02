## 2024-02-02 - Boolean Logic Preventing Optimization
**Learning:** Found an anti-pattern in `UserQueryService` where `||` was used for default values (`options.include || options.fullProfile`). This made it impossible to opt-out (pass `false`) when the default was `true`.
**Action:** Use `??` (nullish coalescing) for option merging to allow explicit `false` overrides.
