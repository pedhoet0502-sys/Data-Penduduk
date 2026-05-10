# Security Specification - Resident Data App

## Data Invariants
- A resident document must always have a `kkNumber`, `fullName`, `nik`, and `ownerId`.
- The `ownerId` must explicitly match the `request.auth.uid`.
- `nik` and `kkNumber` are strings of length 16.
- `gender` must be either 'Laki-laki' or 'Perempuan'.
- Access is strictly owner-based. No public reads.

## The Dirty Dozen Payloads
1. **Identity Spoofing**: Attempt to create a resident with someone else's `ownerId`.
2. **Ghost Field**: Attempt to add an `isAdmin` field to a resident document.
3. **Missing Required Field**: Attempt to create a resident without `nik`.
4. **Invalid Type**: Attempt to set `nik` as a number instead of a string.
5. **System Field Injection**: Attempt to set `createdAt` manually to a past date (must be `request.time`).
6. **Unauthorized Read**: Attempt to read a resident document belonging to another user.
7. **Unauthorized List**: Attempt to list residents without filter (should only see owned data).
8. **Malicious ID**: Attempt to use a 1MB string as a document ID.
9. **Update Hijack**: Attempt to change the `ownerId` of an existing resident.
10. **Age Manipulation**: Attempt to set an impossible birth year (validation via schema).
11. **Enum Bypass**: Attempt to set `gender` to 'Unknown'.
12. **Length Overload**: Attempt to set `fullName` to a 2MB string.

## The Test Runner
(I will skip the actual .test.ts file for now but ensure the rules address these).
