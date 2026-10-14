# Implementation Plan: Fix Mobile Passenger Registration Bug

## Root Cause
The `auth.api.signUpEmail()` and `auth.api.signInEmail()` calls in `mobile-auth.ts` are being invoked server-side without proper configuration to return session tokens suitable for mobile bearer authentication. Better Auth v1.7.7 by default returns cookie-based sessions, but the mobile app expects `session: { token: string, expiresAt: string }` where `token` is a bearer token. The current code passes the entire Better Auth session object directly, which does not contain a `token` field in the expected format.

When the button appears to hang indefinitely, it's likely because:
1. The server returns HTTP 500 (due to the session structure mismatch or an auth error)
2. The mobile app's `apiRequest` throws on non-OK responses
3. The error may not surface properly, causing the UI to wait for the 30-second timeout

## Solution Approach
Extract the bearer token from Better Auth's session table after successful signup/login. Better Auth stores a `token` field in the `session` table (confirmed in `schema.prisma`) which is the bearer token string. Use `returnHeaders: true` option (available in v1.7.7) to get the full response, then query the session table to retrieve the token.

---

## Implementation Steps

- [ ] 1. **Fix `registerPassenger` to return bearer token**
      
      **What to do:**
      Modify `registerPassenger` in `src/lib/mobile-auth.ts` to:
      - Call `auth.api.signUpEmail()` with `returnHeaders: true` to ensure we get the complete response
      - After successful signup, query the `session` table to get the bearer token: `await db.session.findFirst({ where: { userId: signUpResult.user.id }, orderBy: { createdAt: 'desc' }, select: { token: true, expiresAt: true } })`
      - Wrap the PatulodUser creation, terms/privacy records, and audit log creation in a `db.$transaction()` to ensure atomicity
      - Return `session: { token: sessionData.token, expiresAt: sessionData.expiresAt.toISOString() }` in the `AuthResponse`
      - Add detailed error logging with `console.error('❌ Session token retrieval failed:', error)` for session query failures
      
      **Rationale:**
      Better Auth v1.7.7 does not support `asResponse: false` to get plain objects with tokens. The `returnHeaders: true` option is documented in the API docs and ensures we get the full response. The session table's `token` column contains the bearer token that mobile apps need. Querying it directly after signup is the most reliable approach.
      
      **Files:**
      - `c:\Users\ADMIN\Documents\workspace\active\patulod\patulod-admin\src\lib\mobile-auth.ts`
      
      **Verify:**
      Add a console.log before returning the response to show the session structure: `console.log('✅ Session token:', { hasToken: !!sessionData?.token, expiresAt: sessionData?.expiresAt })`. Check that the returned object has `session.token` as a string and `session.expiresAt` as an ISO date string.

- [ ] 2. **Fix `loginPassenger` to return bearer token**
      
      **What to do:**
      Apply the same fix to `loginPassenger`:
      - Call `auth.api.signInEmail()` with `returnHeaders: true`
      - After successful login, query the session table: `await db.session.findFirst({ where: { userId: signInResult.user.id }, orderBy: { createdAt: 'desc' }, select: { token: true, expiresAt: true } })`
      - Return `session: { token: sessionData.token, expiresAt: sessionData.expiresAt.toISOString() }` in the `AuthResponse`
      - Add error logging for session query failures
      
      **Files:**
      - `c:\Users\ADMIN\Documents\workspace\active\patulod\patulod-admin\src\lib\mobile-auth.ts`
      
      **Verify:**
      Add a console.log showing `{ hasToken: !!sessionData?.token, expiresAt: sessionData?.expiresAt }` before returning. Confirm the session structure matches the mobile app's expectations.

- [ ] 3. **Add error handling for missing session tokens**
      
      **What to do:**
      In both `registerPassenger` and `loginPassenger`, after querying the session table:
      - Check if `sessionData` is null or `sessionData.token` is missing
      - If missing, log the error: `console.error('❌ Session token not found for user:', signUpResult.user.id)`
      - Return `{ success: false, error: 'Authentication failed. Please try again.' }` instead of proceeding
      
      **Rationale:**
      If Better Auth fails to create a session (database error, configuration issue), we should not return success with an invalid session object. This prevents the mobile app from thinking registration succeeded when it actually failed.
      
      **Files:**
      - `c:\Users\ADMIN\Documents\workspace\active\patulod\patulod-admin\src\lib\mobile-auth.ts`
      
      **Verify:**
      The code compiles without TypeScript errors. Review the error handling logic to ensure all failure paths return descriptive error messages.

- [ ] 4. **Wrap `registerPassenger` DB operations in a transaction**
      
      **What to do:**
      Wrap the PatulodUser creation, terms acceptance, privacy acknowledgment, and audit log creation in `db.$transaction(async (tx) => { ... })`:
      ```typescript
      await db.$transaction(async (tx) => {
        const patulodUser = await tx.patulodUser.create({ ... });
        await tx.termsAcceptance.create({ ... });
        await tx.privacyAcknowledgment.create({ ... });
        await tx.auditLog.create({ ... });
      });
      ```
      
      **Rationale:**
      If any of the DB operations fail after Better Auth creates the user, we currently leave an orphaned user account with no PatulodUser record. A transaction ensures either all operations succeed or none do. Note: the Better Auth `signUpEmail` call happens BEFORE the transaction because it's not part of our Prisma client's transaction scope.
      
      **Files:**
      - `c:\Users\ADMIN\Documents\workspace\active\patulod\patulod-admin\src\lib\mobile-auth.ts`
      
      **Verify:**
      Run `cd c:\Users\ADMIN\Documents\workspace\active\patulod\patulod-admin && npm run build` to ensure TypeScript compiles successfully. Check that there are no TypeScript errors about the transaction scope.

- [ ] 5. **Update `AuthResponse` interface type annotations**
      
      **What to do:**
      Update the `AuthResponse` interface in `src/lib/mobile-auth.ts` to explicitly type the session field:
      ```typescript
      export interface AuthResponse {
        success: boolean
        user?: {
          id: string
          fullName: string
          email: string
          phone?: string
          role: string
        }
        session?: {
          token: string
          expiresAt: string
        }
        error?: string
        errors?: Record<string, string>
        reason?: string
      }
      ```
      
      **Rationale:**
      The current `session?: any` type is too permissive and hides the bug. Explicitly typing it as `{ token: string, expiresAt: string }` provides type safety and documentation.
      
      **Files:**
      - `c:\Users\ADMIN\Documents\workspace\active\patulod\patulod-admin\src\lib\mobile-auth.ts`
      
      **Verify:**
      Run `cd c:\Users\ADMIN\Documents\workspace\active\patulod\patulod-admin && npm run build`. TypeScript should show errors if any code returns an incorrectly shaped session object.

- [ ] 6. **Test the fix with manual verification**
      
      **What to do:**
      Start the dev server and test the registration flow:
      1. Run `cd c:\Users\ADMIN\Documents\workspace\active\patulod\patulod-admin && npm run dev`
      2. Use a tool like curl or Postman to POST to `http://localhost:3000/api/mobile/auth/register` with valid registration data
      3. Check the server console logs for the `✅ Session token:` log showing `hasToken: true`
      4. Verify the response JSON contains `session.token` as a non-empty string and `session.expiresAt` as an ISO date string
      5. Repeat for `/api/mobile/auth/login`
      
      **Files:**
      - None (manual testing)
      
      **Verify:**
      The registration endpoint returns HTTP 200 with `{ success: true, session: { token: "...", expiresAt: "..." } }`. The token should be a long random string, not undefined or null. The button loading state should resolve (no longer hang indefinitely).

---

## Code Changes Summary

### Key Changes in `mobile-auth.ts`:

1. **Session token extraction pattern:**
   ```typescript
   const signUpResult = await auth.api.signUpEmail({
     body: { email, password, name },
     returnHeaders: true,
   });
   
   // Query session table for bearer token
   const sessionData = await db.session.findFirst({
     where: { userId: signUpResult.user.id },
     orderBy: { createdAt: 'desc' },
     select: { token: true, expiresAt: true },
   });
   
   if (!sessionData?.token) {
     console.error('❌ Session token not found for user:', signUpResult.user.id);
     return { success: false, error: 'Authentication failed. Please try again.' };
   }
   
   console.log('✅ Session token:', { hasToken: !!sessionData.token, expiresAt: sessionData.expiresAt });
   ```

2. **Transaction boundary:**
   ```typescript
   await db.$transaction(async (tx) => {
     const patulodUser = await tx.patulodUser.create({ data: { ... } });
     await tx.termsAcceptance.create({ data: { userId: patulodUser.id, ... } });
     await tx.privacyAcknowledgment.create({ data: { userId: patulodUser.id, ... } });
     await tx.auditLog.create({ data: { userId: patulodUser.id, ... } });
   });
   ```

3. **Return statement:**
   ```typescript
   return {
     success: true,
     user: { ... },
     session: {
       token: sessionData.token,
       expiresAt: sessionData.expiresAt.toISOString(),
     },
   };
   ```

### Files Not Changing:
- `src/routes/api/mobile/auth/register.ts` - route handler is correct
- `src/routes/api/mobile/auth/login.ts` - route handler is correct  
- `src/lib/auth.ts` - Better Auth config is correct (no need for bearer plugin since we're extracting tokens directly)
- `patulod-mobile/lib/api.ts` - mobile app's `AuthResponse` interface and token handling is correct

## Success Criteria

After implementing these changes:
1. Mobile registration requests return HTTP 200 with `session.token` as a string
2. The mobile app successfully saves the token and navigates to the next screen
3. The button no longer hangs indefinitely
4. Server logs show `✅ Session token: { hasToken: true, expiresAt: ... }` for successful auth
5. All DB operations in registration are atomic (transaction ensures consistency)
6. Login flow works identically to registration with token extraction
