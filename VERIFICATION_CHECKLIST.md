# EVzone My Accounts - Implementation Verification Checklist

This document provides a comprehensive checklist for verifying that the Wallet and Organization apps can still authenticate after the security hardening and session management changes.

---

## Phase 1: Security Hardening Verification

### 1.1 MFA Recovery Code Entropy
- [ ] **Test**: Generate recovery codes and verify they use cryptographically secure random values
- [ ] **Expected**: Each code should be 8 hex characters (XXXX-XXXX format)
- [ ] **Command**: `npm test -- --grep="recovery codes"`
- [ ] **Validation**: No `Math.random()` usage in recovery code generation

### 1.2 Encryption Key Management
- [ ] **Test**: Verify service fails to start without `ENCRYPTION_KEY` env var
- [ ] **Expected**: `InternalServerErrorException` on startup
- [ ] **Command**: `ENCRYPTION_KEY="" npm start` (should fail)
- [ ] **Validation**: Check logs for fail-fast error message

### 1.3 OAuth Token Endpoint Auth Method
- [ ] **Test**: Verify confidential clients use `client_secret_basic`
- [ ] **Expected**: OIDC discovery document shows `token_endpoint_auth_methods_supported` includes `client_secret_basic`
- [ ] **Endpoint**: `GET /.well-known/openid-configuration`
- [ ] **Validation**: `token_endpoint_auth_methods_supported` includes `"client_secret_basic"`

---

## Phase 2: Session Management Verification

### 2.1 GET /api/v1/sessions Endpoint
- [ ] **Test**: List all active sessions for authenticated user
- [ ] **Endpoint**: `GET /api/v1/sessions`
- [ ] **Headers**: `Authorization: Bearer <access_token>`
- [ ] **Expected Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "isCurrent": true,
      "clientId": "evzone_portal",
      "clientName": "EVzone Portal",
      "deviceInfo": { "device": "Web Client", "os": "Windows", "browser": "Chrome", "location": "Unknown", "ip": "192.168.1.1" },
      "createdAt": "2024-01-15T10:30:00Z",
      "lastUsedAt": "2024-01-15T10:45:00Z",
      "expiresAt": "2024-01-15T11:00:00Z"
    }
  ],
  "total": 1
}
```

### 2.2 DELETE /api/v1/sessions/:id Endpoint
- [ ] **Test**: Revoke a specific session
- [ ] **Endpoint**: `DELETE /api/v1/sessions/<session_id>`
- [ ] **Expected Response**: `{ "success": true, "message": "Session revoked successfully" }`
- [ ] **Validation**: Session no longer appears in GET /api/v1/sessions

### 2.3 DELETE /api/v1/sessions Endpoint (Revoke All)
- [ ] **Test**: Revoke all sessions (logout everywhere)
- [ ] **Endpoint**: `DELETE /api/v1/sessions`
- [ ] **Expected Response**: `{ "success": true, "message": "Revoked X sessions", "revokedCount": X }`
- [ ] **Validation**: No active sessions returned from GET /api/v1/sessions

### 2.4 GET /api/v1/sessions/logout-uris Endpoint
- [ ] **Test**: Get front-channel logout URLs for SLO
- [ ] **Endpoint**: `GET /api/v1/sessions/logout-uris`
- [ ] **Expected Response**:
```json
{
  "success": true,
  "data": [
    { "clientId": "evzone_portal", "logoutUrl": "https://accounts.evzone.app/auth/signed-out" }
  ]
}
```

---

## Phase 3: OIDC Compliance Verification

### 3.1 OIDC Discovery Document
- [ ] **Test**: Verify discovery endpoint includes SLO support
- [ ] **Endpoint**: `GET /.well-known/openid-configuration`
- [ ] **Expected Fields**:
  - `issuer`: Identity provider URL
  - `authorization_endpoint`: OAuth authorization URL
  - `token_endpoint`: OAuth token URL
  - `userinfo_endpoint`: User info endpoint
  - `jwks_uri`: JSON Web Key Set URL
  - `end_session_endpoint`: Logout endpoint URL

### 3.2 End Session Endpoint (RP-Initiated Logout)
- [ ] **Test**: User initiates logout from My Accounts
- [ ] **Endpoint**: `GET /oidc/logout?id_token_hint=<id_token>&post_logout_redirect_uri=<uri>&state=<state>`
- [ ] **Expected**: 
  - IdP session cookie cleared
  - Redirect to `post_logout_redirect_uri` (if provided)
  - Front-channel logout iframes triggered for other RPs

### 3.3 Front-Channel Logout
- [ ] **Test**: Verify RPs receive logout notifications
- [ ] **Implementation**: RPs should include hidden iframe with:
```html
<iframe src="https://accounts.evzone.com/oidc/front-channel-logout?sid=<session_id>&iss=<issuer>">
```
- [ ] **Expected**: RP clears local session when iframe is loaded

---

## Phase 4: Wallet App Authentication Flow

### 4.1 Wallet App Login Flow
1. User clicks "Login" on wallet.evzone.com
2. Redirect to `https://accounts.evzone.com/authorize?client_id=evzone_wallet&...`
3. User authenticates at IdP
4. IdP redirects back to wallet with authorization code
5. Wallet exchanges code for tokens
6. **Verification**: Access token and refresh token issued successfully

### 4.2 Wallet App Token Validation
- [ ] **Test**: Wallet app validates access token
- [ ] **Endpoint**: `GET /api/userinfo` (with Bearer token)
- [ ] **Expected**: Returns user profile
- [ ] **Validation**: Token signature verified against JWKS

### 4.3 Wallet App Token Refresh
- [ ] **Test**: Wallet app refreshes expired access token
- [ ] **Endpoint**: `POST /api/auth/refresh` with refresh token
- **Expected**: New access token issued
- [ ] **Validation**: Old refresh token invalidated (token rotation)

### 4.4 Wallet App Logout (SLO)
1. User clicks "Logout" on wallet.evzone.com
2. Wallet calls `/oidc/logout` with `post_logout_redirect_uri`
3. IdP clears session, optionally notifies other apps
4. Wallet clears local tokens
5. User redirected to wallet login page
6. **Verification**: User must re-authenticate to access wallet

---

## Phase 5: Organization App Authentication Flow

### 5.1 Org App Login Flow
- [ ] **Test**: Same as Wallet App (standard OIDC flow)
- [ ] **Client ID**: `evzone_org`
- [ ] **Expected**: Tokens issued successfully

### 5.2 Org App Session Management
- [ ] **Test**: User views active sessions in Org app
- [ ] **Endpoint**: `GET /api/sessions`
- [ ] **Expected**: Shows sessions from both Wallet and Org apps

### 5.3 Org App Logout (SLO)
- [ ] **Test**: User logs out from Org app
- [ ] **Expected**: Session terminated across all EVzone apps

---

## Phase 7: Frontend-Backend Compatibility

### 7.1 Session Management UI
- [ ] **Test**: Security Sessions page loads correctly
- [ ] **Endpoint**: `GET /api/v1/sessions`
- [ ] **Frontend Path**: `/app/security/sessions`
- [ ] **Validation**: Sessions list displays with device info, location, IP

### 7.2 Revoke Session UI
- [ ] **Test**: Revoke individual session from UI
- [ ] **Action**: Click "Sign out" on a session card
- [ ] **Expected**: Session removed from list, success notification shown

### 7.3 Revoke All Sessions UI
- [ ] **Test**: Revoke all other sessions from UI
- [ ] **Action**: Click "Sign out other devices"
- [ ] **Expected**: Current session remains, others removed

### 7.4 Logout Everywhere UI
- [ ] **Test**: Revoke all sessions including current
- [ ] **Action**: Click "Sign out all"
- [ ] **Expected**: All sessions removed, user redirected to login

### 7.5 OIDC Logout Flow
- [ ] **Test**: User initiates logout via OIDC
- [ ] **Endpoint**: `GET /oidc/logout?id_token_hint=<token>&post_logout_redirect_uri=<uri>`
- [ ] **Frontend Action**: User clicks logout in the portal
- [ ] **Expected**: User redirected to `/auth/signed-out`

### 7.6 Frontend API Configuration
- [ ] **Verify**: API base URL is `/api/v1`
- [ ] **Frontend File**: `myaccountsfrontend/src/utils/api.ts`
- [ ] **Validation**: Calls to `/sessions` become `/api/v1/sessions`

---

## Regression Tests

### Authentication Flow Tests
- [ ] User registration and email verification
- [ ] User login with password
- [ ] User login with MFA
- [ ] User login with social provider (Google)
- [ ] Password reset flow
- [ ] MFA enrollment and verification
- [ ] Session refresh token rotation

### Token Validation Tests
- [ ] Valid access token accepted
- [ ] Expired access token rejected
- [ ] Invalid signature token rejected
- [ ] Wrong audience token rejected
- [ ] Refresh token rotation works correctly

### Authorization Tests
- [ ] Protected endpoints require valid token
- [ ] Admin endpoints require admin role
- [ ] User can only access own resources

---

## Performance Tests

### Token Issuance
- [ ] Measure token issuance latency (< 100ms target)
- [ ] Test under load (100 concurrent requests)
- [ ] Verify no memory leaks

### Session Queries
- [ ] Measure session listing latency (< 200ms for 100 sessions)
- [ ] Test session count query performance

---

## Security Tests

### Penetration Testing
- [ ] Token hijacking attempts blocked
- [ ] Session fixation attacks prevented
- [ ] CSRF protection working
- [ ] XSS vulnerabilities patched
- [ ] SQL injection prevention

### Compliance Checks
- [ ] No sensitive data in logs
- [ ] Tokens have appropriate expiration
- [ ] Refresh tokens are rotated
- [ ] Encryption keys properly protected

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] No critical security vulnerabilities
- [ ] Configuration validated
- [ ] Environment variables set
- [ ] Database migrations applied
- [ ] SSL certificates valid

### Post-Deployment
- [ ] Health check endpoint responding
- [ ] OIDC discovery endpoint accessible
- [ ] JWKS endpoint accessible
- [ ] Token issuance working
- [ ] User login successful
- [ ] Wallet app authentication working
- [ ] Org app authentication working
- [ ] SSO flow verified
- [ ] SLO flow verified

---

## Rollback Plan

If issues are detected after deployment:

1. **Database**: Restore from backup if needed
2. **Environment**: Revert environment variables
3. **Code**: Previous version tag available
4. **DNS**: Can revert to previous deployment

---

## Support Contacts

- **Authentication Issues**: auth-team@evzone.com
- **Wallet Integration**: wallet-team@evzone.com
- **Org App Integration**: org-team@evzone.com
- **Security Incidents**: security@evzone.com

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0
