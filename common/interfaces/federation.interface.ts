/**
 * Enterprise Federation Interfaces
 * 
 * Provides a generic strategy pattern for supporting both SAML2 and OIDC
 * enterprise identity providers (Azure AD, Okta, etc.)
 */

// =============================================================================
// Federation Provider Types
// =============================================================================

/**
 * Supported federation provider types
 */
export enum FederationProviderType {
    SAML2 = 'saml2',
    OIDC = 'oidc',
}

/**
 * SAML2 Federation Configuration
 */
export interface SamlFederationConfig {
    /** Unique identifier for this federation configuration */
    id: string;
    /** Display name for the identity provider */
    displayName: string;
    /** SAML Entity ID of the IdP */
    entityId: string;
    /** Single Sign-On Service URL (HTTP-Redirect binding) */
    ssoUrl: string;
    /** Single Logout Service URL (optional) */
    sloUrl?: string;
    /** SAML Signing Certificate (PEM format) */
    signingCertificate: string;
    /** Optional: Encryption certificate for decrypting SAML assertions */
    encryptionCertificate?: string;
    /** Claim mappings from SAML attributes to user profile fields */
    claimMappings: {
        email: string;
        firstName: string;
        lastName: string;
        displayName: string;
        groups?: string;
    };
    /** Sign authentication requests (recommended for security) */
    signRequests: boolean;
    /** Want assertions signed */
    wantAssertionsSigned: boolean;
    /** Organization ID this federation belongs to (for multi-tenant) */
    orgId?: string;
    /** Whether this federation is active */
    isActive: boolean;
}

/**
 * OIDC Federation Configuration
 */
export interface OidcFederationConfig {
    /** Unique identifier for this federation configuration */
    id: string;
    /** Display name for the identity provider */
    displayName: string;
    /** OIDC Discovery Document URL */
    discoveryUrl: string;
    /** Client ID for OIDC authentication */
    clientId: string;
    /** Client Secret (optional for public clients) */
    clientSecret?: string;
    /** Redirect URI for callback */
    redirectUri: string;
    /** Scopes to request (default: openid, profile, email) */
    scopes: string[];
    /** Claim mappings from ID token claims to user profile fields */
    claimMappings: {
        email: string;
        firstName: string;
        lastName: string;
        displayName: string;
        groups?: string;
    };
    /** Organization ID this federation belongs to (for multi-tenant) */
    orgId?: string;
    /** Whether this federation is active */
    isActive: boolean;
}

/**
 * Union type for all federation configurations
 */
export type FederationConfig = SamlFederationConfig | OidcFederationConfig;

/**
 * Common user profile interface for federated users
 * All providers must map to this standardized format
 */
export interface FederatedUserProfile {
    /** Unique identifier from the external IdP */
    providerId: string;
    /** User's email address */
    email: string;
    /** User's first name */
    firstName: string;
    /** User's last name */
    lastName: string;
    /** User's display name (full name) */
    displayName?: string;
    /** Profile picture URL */
    picture?: string;
    /** Group/role memberships from the IdP */
    groups?: string[];
    /** Raw claims from the IdP (for extensibility) */
    rawClaims: Record<string, unknown>;
}

/**
 * Result of a federation authentication attempt
 */
export interface FederationAuthResult {
    /** Whether authentication was successful */
    success: boolean;
    /** User profile if successful */
    profile?: FederatedUserProfile;
    /** Error details if failed */
    error?: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
}

// =============================================================================
// Federation Provider Strategy Interface
// =============================================================================

/**
 * Abstract base interface for all federation providers
 * Implement this interface to add support for new IdP types
 */
export interface FederationProvider {
    /** Type identifier for this provider */
    readonly type: FederationProviderType;
    /** Validate the configuration is correct */
    validateConfig(config: FederationConfig): Promise<void>;
    /** Generate the authorization URL for initiating SSO */
    createAuthorizationUrl(config: FederationConfig, state: string, nonce: string): Promise<string>;
    /** Handle the callback from the IdP and extract user info */
    handleCallback(
        config: FederationConfig,
        callbackData: Record<string, string>
    ): Promise<FederationAuthResult>;
    /** Validate a SAML/OIDC response independently */
    validateResponse(
        config: FederationConfig,
        responseData: string | Record<string, unknown>
    ): Promise<FederationAuthResult>;
    /** Get the discovery metadata for this provider (if applicable) */
    getMetadata?(config: FederationConfig): Promise<Record<string, unknown>>;
}

// =============================================================================
// SAML2 Specific Interfaces
// =============================================================================

/**
 * SAML2 Assertion structure (decoded but not validated)
 */
export interface SamlAssertion {
    /** Assertion ID */
    id: string;
    /** Issuer of the assertion */
    issuer: string;
    /** Subject Name ID */
    subjectNameId: string;
    /** Session Index (for SLO) */
    sessionIndex?: string;
    /** Subject confirmation data */
    subjectConfirmationData?: {
        notOnOrAfter: Date;
        recipient: string;
    };
    /** Conditions (audience restrictions, etc.) */
    conditions?: {
        notBefore: Date;
        notOnOrAfter: Date;
        audiences: string[];
    };
    /** Attribute statements */
    attributes: Record<string, string[]>;
}

/**
 * SAML2 Response structure (decoded but not validated)
 */
export interface SamlResponse {
    /** Response ID */
    id: string;
    /** Destination URL */
    destination: string;
    /** InResponseTo (for replay protection) */
    inResponseTo?: string;
    /** Issuer of the response */
    issuer: string;
    /** Status code */
    statusCode: string;
    /** Status message (optional) */
    statusMessage?: string;
    /** The assertion */
    assertion: SamlAssertion;
}

// =============================================================================
// OIDC Specific Interfaces
// =============================================================================

/**
 * OIDC Discovery Document structure
 */
export interface OidcDiscoveryDocument {
    /** Issuer URL */
    issuer: string;
    /** Authorization endpoint */
    authorization_endpoint: string;
    /** Token endpoint */
    token_endpoint: string;
    /** UserInfo endpoint */
    userinfo_endpoint: string;
    /** JWKS URI */
    jwks_uri: string;
    /** Supported scopes */
    scopes_supported: string[];
    /** Supported response types */
    response_types_supported: string[];
    /** Supported token endpoint auth methods */
    token_endpoint_auth_methods_supported: string[];
    /** Supported subject types */
    subject_types_supported: string[];
    /** Supported ID token signing algorithms */
    id_token_signing_alg_values_supported: string[];
    /** Claims supported */
    claims_supported: string[];
}

// =============================================================================
// Home Realm Discovery (HRD) Interface
// =============================================================================

/**
 * Home Realm Discovery result
 * Determines which federation to use based on email domain or other hints
 */
export interface HrdResult {
    /** Whether a federation was found */
    found: boolean;
    /** Federation configuration if found */
    federationConfig?: FederationConfig;
    /** Whether to show a login form (for unknown domains) */
    showLoginForm: boolean;
    /** Suggestion message for the user */
    message?: string;
}

/**
 * HRD Provider interface for domain-based discovery
 */
export interface HrdProvider {
    /** Discover the federation for a given email domain */
    discover(emailOrDomain: string): Promise<HrdResult>;
}

// =============================================================================
// Configuration Storage Interface
// =============================================================================

/**
 * Storage interface for federation configurations
 */
export interface FederationConfigRepository {
    /** Get a federation configuration by ID */
    getById(id: string): Promise<FederationConfig | null>;
    /** Get all active federations for an organization */
    getByOrgId(orgId: string): Promise<FederationConfig[]>;
    /** Get all active federations */
    getAllActive(): Promise<FederationConfig[]>;
    /** Get federation by email domain */
    getByEmailDomain(domain: string): Promise<FederationConfig | null>;
    /** Create a new federation configuration */
    create(config: FederationConfig): Promise<FederationConfig>;
    /** Update a federation configuration */
    update(id: string, config: Partial<FederationConfig>): Promise<FederationConfig>;
    /** Delete a federation configuration */
    delete(id: string): Promise<void>;
    /** Validate configuration exists and is active */
    validate(id: string): Promise<boolean>;
}
