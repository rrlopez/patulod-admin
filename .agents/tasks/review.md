# Mobile auth bearer token extraction fix

The registration bug fix extracts bearer tokens from Better Auth for mobile client authentication. The implementation uses `asResponse: false` on `signUpEmail` and `signInEmail`, adds dual-path token extraction (direct from result or DB fallback), wraps Patulod user creation in a transaction, and explicitly types the session response.

The token extraction follows a fallback strategy: when Better Auth returns `result.token` directly, use it and fetch only `expiresAt` from the DB; when it doesn't, query the session table for both fields. The transaction wraps all four Patulod DB operations but correctly excludes Better Auth (separate connection), leaving a known gap where Better Auth users can be orphaned if the transaction fails. Error messages surface session retrieval failures with full context. The build completes without TypeScript errors.

**Watch for:** Nothing blocking. The orphaned user scenario (Better Auth succeeds, Patulod transaction fails) is a known trade-off given the separate connection pools, already documented in the plan.

**Verdict**: APPROVED

## High-level view

Both `registerPassenger` and `loginPassenger` call Better Auth with `asResponse: false`, check for `signUpResult.token`, and fall back to querying `db.session.findFirst` ordered by `createdAt desc` when it's absent. The primary path (token present) fetches only `expiresAt` from DB; the fallback path fetches both `token` and `expiresAt`.

The transaction wraps `patulodUser`, `termsAcceptance`, `privacyAcknowledgment`, and `auditLog` creation, correctly excluding the Better Auth `signUpEmail` call. The `AuthResponse.session` field is explicitly typed as `{ token: string; expiresAt: string }`. Error handling logs the full context when session data is missing and returns descriptive messages. Build succeeds with no TypeScript errors.

<details>
<summary>Issues (0)</summary>

No blocking issues.

</details>

<details><summary>Details</summary>

## Orphaned Better Auth users on transaction failure

If the Patulod user transaction fails after Better Auth creates the user, the Better Auth user remains but no Patulod user is created. The user can retry registration, which will hit the email duplicate check and return `{ success: false, errors: { email: 'Email already registered' } }`. Better Auth manages its own connection, so it can't participate in the Prisma transaction. This is a known trade-off.

</details>

<details>
<summary>File map</summary>

**Changed:**
- `src/lib/mobile-auth.ts` — Session token extraction with dual-path fallback, transaction-wrapped Patulod user creation, explicit session typing (459 lines)

**Full diff:** No base branch to compare against (new repository)

</details>
