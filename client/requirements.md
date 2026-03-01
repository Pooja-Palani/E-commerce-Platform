## Packages
zustand | Global state management for authentication and user sessions

## Notes
- Strict Role-Based Access Control (RBAC) implemented.
- Optimistic locking requires `version` to be passed in all PUT requests.
- Expected 409 Conflict errors on concurrent updates.
