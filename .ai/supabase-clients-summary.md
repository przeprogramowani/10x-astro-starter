# Supabase Clients Architecture - Summary

## Overview
This document describes the Supabase client architecture used in the 10x-cards application.

## Client Types

### 1. Browser Client (Client-side)
**File**: `src/db/auth.client.ts`  
**Created with**: `createBrowserClient()`  
**Export**: `authClient`

**Purpose**: 
- User authentication operations (login, register, logout, password reset)
- Client-side operations with automatic cookie management

**Environment Variables**:
- `PUBLIC_SUPABASE_URL` - Supabase project URL (exposed to browser)
- `PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (exposed to browser)

**Used in**:
- `LoginForm.tsx` - User login
- `RegisterForm.tsx` - User registration
- `UserMenu.tsx` - User logout
- `ChangePasswordForm.tsx` - Password change
- `ResetPasswordForm.tsx` - Password reset
- `ForgotPasswordForm.tsx` - Password recovery

**Features**:
- Automatic cookie-based session storage
- Session persistence
- Auto token refresh
- Compatible with SSR

### 2. Server Client (Server-side)
**File**: `src/db/supabase.client.ts`  
**Created with**: `createServerClient()`  
**Export**: `createSupabaseServerInstance()`

**Purpose**:
- Data operations in API routes
- Server-side operations with RLS policies
- Per-request instance creation

**Environment Variables**:
- `SUPABASE_URL` - Supabase project URL (server-side only)
- `SUPABASE_KEY` - Supabase anonymous key (server-side only)

**Used in**:
- `src/middleware/index.ts` - Creates instance per-request, adds to `context.locals.supabase`
- All API routes (`/api/cards`, `/api/generation-requests`, etc.) - Access via `locals.supabase`

**Features**:
- Manual cookie handling with Astro
- RLS policies enforced
- Session verification
- User authentication state

### 3. Admin Client (Server-side only)
**File**: `src/db/supabase.client.ts`  
**Created with**: `createClient()` with service role key  
**Export**: `createSupabaseAdminClient()`

**Purpose**:
- Administrative operations that bypass RLS
- Used only for Auth API operations that require elevated privileges
- **NOT** for regular data operations

**Environment Variables**:
- `SUPABASE_URL` - Supabase project URL (server-side only)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only, optional)

**Used in**:
- `src/lib/services/user.service.ts` - `deleteUserAccount()` function
  - Only for `auth.admin.deleteUser()` call
  - User identity is verified first using authenticated client
  - Ensures users can only delete their own accounts

**Features**:
- Bypasses RLS policies
- Full database access
- No session persistence
- No auto token refresh

**⚠️ Security Warning**: 
- Never expose this client to the frontend
- Only use for Auth operations that require admin privileges
- Always verify user identity with authenticated client first
- Service role key must be kept secret

## Request Flow

### Client-side Authentication Flow
```
User Form (LoginForm.tsx)
  → authClient.auth.signInWithPassword()
  → Supabase Auth API
  → Sets auth cookies
  → Redirect to protected page
```

### Server-side Data Flow
```
API Request (/api/cards)
  → Middleware (src/middleware/index.ts)
    → createSupabaseServerInstance()
    → Reads auth cookies
    → Verifies session
    → Sets locals.supabase and locals.user
  → API Route Handler
    → Uses locals.supabase for queries
    → RLS policies enforced
    → Returns data
```

### Admin Operation Flow (User Self-Deletion)
```
API Request (/api/users/me DELETE)
  → API Route Handler
    → Uses locals.supabase (authenticated client)
    → deleteUserAccount(userId, supabase)
      → Step 1: Verify user identity with supabase.auth.getUser()
      → Step 2: Ensure authenticated user matches target userId
      → Step 3: createSupabaseAdminClient()
      → Step 4: adminClient.auth.admin.deleteUser()
    → Returns success
```

**Security Note**: The admin client is only used for the Auth deletion operation. User identity is verified first using the authenticated client from the request context, ensuring users can only delete their own accounts.

## Environment Variables Setup

### Required Variables
```bash
# Server-side only (not exposed to browser)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Optional, only for admin ops

# Public variables (exposed to browser)
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Variable Usage
| Variable | Used By | Exposed to Browser |
|----------|---------|-------------------|
| `SUPABASE_URL` | Server client, Admin client | ❌ No |
| `SUPABASE_KEY` | Server client | ❌ No |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin client | ❌ No |
| `PUBLIC_SUPABASE_URL` | Browser client | ✅ Yes |
| `PUBLIC_SUPABASE_ANON_KEY` | Browser client | ✅ Yes |

## Best Practices

### ✅ DO:
- Use `authClient` for all client-side authentication operations
- Use `locals.supabase` in API routes for data operations
- Create server instance per-request in middleware
- Use admin client only for Auth operations that require elevated privileges
- Always verify user identity with authenticated client before using admin client
- Keep service role key secret and server-side only

### ❌ DON'T:
- Don't use `authClient` in server-side code
- Don't expose admin client to frontend
- Don't reuse server client instances across requests
- Don't use admin client for regular data operations
- Don't use admin client without verifying user identity first
- Don't commit `.env` file with real credentials

## TypeScript Types

The `src/env.d.ts` file provides:
- `App.Locals` interface with `supabase` and `user` properties
- `ImportMetaEnv` interface with all environment variables
- Proper typing for Supabase clients with `Database` types

## Testing

- Unit tests mock the clients using Vitest
- E2E tests use real Supabase instance with test credentials
- See `src/test/setup.ts` for test configuration

## Changes Made (2026-01-25)

### Phase 1: Environment Variables Cleanup
1. ✅ Removed fallback in `auth.client.ts` - now requires `PUBLIC_*` variables
2. ✅ Updated `env.d.ts` to mark `PUBLIC_*` variables as required (not optional)
3. ✅ Added comments to clarify server-side vs public variables
4. ✅ Improved error message in `auth.client.ts` to be more specific

### Phase 2: Security Enhancement for User Deletion
5. ✅ Updated `deleteUserAccount()` to accept authenticated `supabase` client parameter
6. ✅ Added user identity verification before admin operations
7. ✅ Prevents users from deleting other users' accounts
8. ✅ Updated API route `/api/users/me` to pass authenticated client
9. ✅ Updated all 29 unit tests to reflect new security model
10. ✅ Added new security tests for identity verification

**Security Improvement**: The admin client is now only used for the Auth API call that requires elevated privileges. User identity is verified first using the authenticated client, ensuring users can only delete their own accounts.

## Related Files

- `src/db/auth.client.ts` - Browser client
- `src/db/supabase.client.ts` - Server and admin clients
- `src/db/database.types.ts` - Generated Supabase types
- `src/middleware/index.ts` - Request middleware
- `src/env.d.ts` - TypeScript environment types
- `.env.example` - Environment variables template
