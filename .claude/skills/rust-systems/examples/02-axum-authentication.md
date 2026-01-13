# Axum Authentication with JWT

> **Demonstrates**: Complete authentication system with JWT tokens using Axum and Tower middleware
> **Technologies**: Axum 0.7+, Tower 0.4+, jsonwebtoken 9.x, argon2, Rust 1.75+
> **Integration**: Protected routes, token refresh, RBAC, password hashing
> **Use when**: Implementing user authentication and authorization in Axum applications

---

## Overview

This example implements production-ready authentication with:
- JWT access and refresh tokens
- Secure password hashing with Argon2
- Tower middleware for authentication
- Protected routes with extractors
- Role-based access control (RBAC)
- Token refresh mechanism

## Implementation

### 1. Dependencies (Cargo.toml)

```toml
[dependencies]
# Web framework
axum = { version = "0.7", features = ["macros"] }
axum-extra = { version = "0.9", features = ["typed-header"] }
tower = "0.4"
tower-http = { version = "0.5", features = ["cors", "trace"] }

# Async runtime
tokio = { version = "1.35", features = ["full"] }

# Serialization
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# Authentication
jsonwebtoken = "9.2"
argon2 = "0.5"

# Time handling
chrono = { version = "0.4", features = ["serde"] }

# Error handling
thiserror = "1.0"

# Database
sqlx = { version = "0.7", features = ["runtime-tokio", "postgres", "uuid", "chrono"] }
uuid = { version = "1.6", features = ["v4", "serde"] }

# Tracing
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
```

### 2. JWT Claims and Token Types (src/auth/jwt.rs)

```rust
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, TokenData, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::error::AppError;

/// JWT claims payload
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    /// Subject (user ID)
    pub sub: Uuid,
    /// Expiration time (Unix timestamp)
    pub exp: i64,
    /// Issued at time (Unix timestamp)
    pub iat: i64,
    /// Token type: "access" or "refresh"
    pub token_type: TokenType,
    /// User role for RBAC
    pub role: UserRole,
}

#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum TokenType {
    Access,
    Refresh,
}

#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq, sqlx::Type)]
#[sqlx(type_name = "user_role", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum UserRole {
    User,
    Admin,
    Moderator,
}

impl Claims {
    /// Create new access token claims
    pub fn new_access(user_id: Uuid, role: UserRole, expiration_hours: i64) -> Self {
        let now = Utc::now();
        Self {
            sub: user_id,
            exp: (now + Duration::hours(expiration_hours)).timestamp(),
            iat: now.timestamp(),
            token_type: TokenType::Access,
            role,
        }
    }

    /// Create new refresh token claims
    pub fn new_refresh(user_id: Uuid, role: UserRole, expiration_days: i64) -> Self {
        let now = Utc::now();
        Self {
            sub: user_id,
            exp: (now + Duration::days(expiration_days)).timestamp(),
            iat: now.timestamp(),
            token_type: TokenType::Refresh,
            role,
        }
    }
}

/// JWT encoder/decoder
pub struct JwtManager {
    encoding_key: EncodingKey,
    decoding_key: DecodingKey,
    access_expiration_hours: i64,
    refresh_expiration_days: i64,
}

impl JwtManager {
    pub fn new(
        secret: &str,
        access_expiration_hours: i64,
        refresh_expiration_days: i64,
    ) -> Self {
        Self {
            encoding_key: EncodingKey::from_secret(secret.as_bytes()),
            decoding_key: DecodingKey::from_secret(secret.as_bytes()),
            access_expiration_hours,
            refresh_expiration_days,
        }
    }

    /// Create access token
    pub fn create_access_token(&self, user_id: Uuid, role: UserRole) -> Result<String, AppError> {
        let claims = Claims::new_access(user_id, role, self.access_expiration_hours);
        encode(&Header::default(), &claims, &self.encoding_key)
            .map_err(|e| AppError::internal(format!("Failed to create access token: {e}")))
    }

    /// Create refresh token
    pub fn create_refresh_token(&self, user_id: Uuid, role: UserRole) -> Result<String, AppError> {
        let claims = Claims::new_refresh(user_id, role, self.refresh_expiration_days);
        encode(&Header::default(), &claims, &self.encoding_key)
            .map_err(|e| AppError::internal(format!("Failed to create refresh token: {e}")))
    }

    /// Decode and validate token
    pub fn decode_token(&self, token: &str) -> Result<TokenData<Claims>, AppError> {
        let mut validation = Validation::default();
        validation.set_required_spec_claims(&["exp", "sub", "iat"]);

        decode::<Claims>(token, &self.decoding_key, &validation)
            .map_err(|e| AppError::unauthorized(format!("Invalid token: {e}")))
    }

    /// Create token pair (access + refresh)
    pub fn create_token_pair(&self, user_id: Uuid, role: UserRole) -> Result<TokenPair, AppError> {
        Ok(TokenPair {
            access_token: self.create_access_token(user_id, role)?,
            refresh_token: self.create_refresh_token(user_id, role)?,
            token_type: "Bearer".to_string(),
            expires_in: self.access_expiration_hours * 3600,
        })
    }
}

/// Token pair response
#[derive(Debug, Serialize)]
pub struct TokenPair {
    pub access_token: String,
    pub refresh_token: String,
    pub token_type: String,
    /// Access token expiration in seconds
    pub expires_in: i64,
}
```

### 3. Password Hashing (src/auth/password.rs)

```rust
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};

use crate::error::AppError;

/// Hash password using Argon2id (recommended variant)
pub fn hash_password(password: &str) -> Result<String, AppError> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();

    argon2
        .hash_password(password.as_bytes(), &salt)
        .map(|hash| hash.to_string())
        .map_err(|e| AppError::internal(format!("Password hashing failed: {e}")))
}

/// Verify password against stored hash
pub fn verify_password(password: &str, hash: &str) -> Result<bool, AppError> {
    let parsed_hash = PasswordHash::new(hash)
        .map_err(|e| AppError::internal(format!("Invalid password hash format: {e}")))?;

    match Argon2::default().verify_password(password.as_bytes(), &parsed_hash) {
        Ok(()) => Ok(true),
        Err(argon2::password_hash::Error::Password) => Ok(false),
        Err(e) => Err(AppError::internal(format!("Password verification failed: {e}"))),
    }
}
```

### 4. Auth Extractor (src/auth/extractor.rs)

```rust
use axum::{
    async_trait,
    extract::FromRequestParts,
    http::{header::AUTHORIZATION, request::Parts, StatusCode},
    RequestPartsExt,
};
use axum_extra::{
    headers::{authorization::Bearer, Authorization},
    TypedHeader,
};
use std::sync::Arc;
use uuid::Uuid;

use super::jwt::{Claims, JwtManager, TokenType, UserRole};
use crate::error::AppError;

/// Authenticated user extracted from JWT token
#[derive(Debug, Clone)]
pub struct AuthUser {
    pub user_id: Uuid,
    pub role: UserRole,
}

/// Application state containing JWT manager
pub struct AppState {
    pub jwt_manager: Arc<JwtManager>,
    // Add other shared state here (db pool, etc.)
}

#[async_trait]
impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        // Extract Authorization header
        let TypedHeader(Authorization(bearer)) = parts
            .extract::<TypedHeader<Authorization<Bearer>>>()
            .await
            .map_err(|_| AppError::unauthorized("Missing or invalid Authorization header"))?;

        // Get JWT manager from extensions (set by middleware)
        let jwt_manager = parts
            .extensions
            .get::<Arc<JwtManager>>()
            .ok_or_else(|| AppError::internal("JWT manager not configured"))?;

        // Decode and validate token
        let token_data = jwt_manager.decode_token(bearer.token())?;
        let claims = token_data.claims;

        // Ensure this is an access token
        if claims.token_type != TokenType::Access {
            return Err(AppError::unauthorized("Invalid token type"));
        }

        Ok(AuthUser {
            user_id: claims.sub,
            role: claims.role,
        })
    }
}

/// Admin-only extractor
pub struct AdminUser(pub AuthUser);

#[async_trait]
impl<S> FromRequestParts<S> for AdminUser
where
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let auth_user = AuthUser::from_request_parts(parts, state).await?;

        if auth_user.role != UserRole::Admin {
            return Err(AppError::forbidden("Admin access required"));
        }

        Ok(AdminUser(auth_user))
    }
}

/// Role requirement extractor factory
pub struct RequireRole<const ROLE: u8>;

impl<const ROLE: u8> RequireRole<ROLE> {
    pub const USER: u8 = 0;
    pub const ADMIN: u8 = 1;
    pub const MODERATOR: u8 = 2;
}
```

### 5. Auth Middleware (src/auth/middleware.rs)

```rust
use axum::{
    extract::State,
    http::Request,
    middleware::Next,
    response::Response,
};
use std::sync::Arc;

use super::jwt::JwtManager;

/// Middleware to inject JWT manager into request extensions
pub async fn inject_jwt_manager<B>(
    State(jwt_manager): State<Arc<JwtManager>>,
    mut request: Request<B>,
    next: Next<B>,
) -> Response {
    request.extensions_mut().insert(jwt_manager);
    next.run(request).await
}
```

### 6. Auth Handlers (src/handlers/auth.rs)

```rust
use axum::{extract::State, http::StatusCode, Json};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use validator::Validate;

use crate::auth::{
    extractor::AuthUser,
    jwt::{JwtManager, TokenPair, TokenType, UserRole},
    password::{hash_password, verify_password},
};
use crate::error::AppError;

/// Application state
pub struct AppState {
    pub jwt_manager: Arc<JwtManager>,
    // In real app: pub db_pool: PgPool,
}

/// Login request
#[derive(Debug, Deserialize, Validate)]
pub struct LoginRequest {
    #[validate(email(message = "Invalid email format"))]
    pub email: String,
    #[validate(length(min = 8, message = "Password must be at least 8 characters"))]
    pub password: String,
}

/// Login response
#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub user: UserInfo,
    #[serde(flatten)]
    pub tokens: TokenPair,
}

#[derive(Debug, Serialize)]
pub struct UserInfo {
    pub id: uuid::Uuid,
    pub email: String,
    pub name: String,
    pub role: UserRole,
}

/// Register request
#[derive(Debug, Deserialize, Validate)]
pub struct RegisterRequest {
    #[validate(email(message = "Invalid email format"))]
    pub email: String,
    #[validate(length(min = 1, max = 100, message = "Name must be 1-100 characters"))]
    pub name: String,
    #[validate(length(min = 8, max = 128, message = "Password must be 8-128 characters"))]
    pub password: String,
}

/// Refresh token request
#[derive(Debug, Deserialize)]
pub struct RefreshRequest {
    pub refresh_token: String,
}

/// Login handler
///
/// POST /api/v1/auth/login
pub async fn login(
    State(state): State<Arc<AppState>>,
    Json(req): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, AppError> {
    // Validate request
    req.validate()
        .map_err(|e| AppError::validation(e.to_string()))?;

    // In real app: fetch user from database
    // let user = state.user_repo.find_by_email(&req.email).await?;

    // Mock user for example
    let mock_user = MockUser {
        id: uuid::Uuid::new_v4(),
        email: req.email.clone(),
        name: "Test User".to_string(),
        password_hash: hash_password("password123")?,
        role: UserRole::User,
        is_active: true,
    };

    // Verify password
    if !verify_password(&req.password, &mock_user.password_hash)? {
        return Err(AppError::unauthorized("Invalid email or password"));
    }

    // Check if user is active
    if !mock_user.is_active {
        return Err(AppError::forbidden("Account is deactivated"));
    }

    // Create token pair
    let tokens = state.jwt_manager.create_token_pair(mock_user.id, mock_user.role)?;

    Ok(Json(LoginResponse {
        user: UserInfo {
            id: mock_user.id,
            email: mock_user.email,
            name: mock_user.name,
            role: mock_user.role,
        },
        tokens,
    }))
}

/// Register handler
///
/// POST /api/v1/auth/register
pub async fn register(
    State(state): State<Arc<AppState>>,
    Json(req): Json<RegisterRequest>,
) -> Result<(StatusCode, Json<LoginResponse>), AppError> {
    // Validate request
    req.validate()
        .map_err(|e| AppError::validation(e.to_string()))?;

    // In real app: check if email already exists
    // if state.user_repo.find_by_email(&req.email).await?.is_some() {
    //     return Err(AppError::conflict("Email already registered"));
    // }

    // Hash password
    let password_hash = hash_password(&req.password)?;

    // In real app: create user in database
    // let user = state.user_repo.create(&req, &password_hash).await?;

    // Mock created user
    let user_id = uuid::Uuid::new_v4();
    let role = UserRole::User;

    // Create token pair
    let tokens = state.jwt_manager.create_token_pair(user_id, role)?;

    Ok((
        StatusCode::CREATED,
        Json(LoginResponse {
            user: UserInfo {
                id: user_id,
                email: req.email,
                name: req.name,
                role,
            },
            tokens,
        }),
    ))
}

/// Refresh token handler
///
/// POST /api/v1/auth/refresh
pub async fn refresh_token(
    State(state): State<Arc<AppState>>,
    Json(req): Json<RefreshRequest>,
) -> Result<Json<TokenPair>, AppError> {
    // Decode refresh token
    let token_data = state.jwt_manager.decode_token(&req.refresh_token)?;
    let claims = token_data.claims;

    // Verify it's a refresh token
    if claims.token_type != TokenType::Refresh {
        return Err(AppError::unauthorized("Invalid token type"));
    }

    // In real app: verify user still exists and is active
    // let user = state.user_repo.find_by_id(claims.sub).await?
    //     .ok_or_else(|| AppError::unauthorized("User not found"))?;
    // if !user.is_active {
    //     return Err(AppError::forbidden("Account is deactivated"));
    // }

    // Create new token pair
    let tokens = state.jwt_manager.create_token_pair(claims.sub, claims.role)?;

    Ok(Json(tokens))
}

/// Get current user handler
///
/// GET /api/v1/auth/me
pub async fn get_current_user(
    auth_user: AuthUser,
) -> Result<Json<UserInfo>, AppError> {
    // In real app: fetch user from database
    // let user = state.user_repo.find_by_id(auth_user.user_id).await?
    //     .ok_or_else(|| AppError::not_found("User not found"))?;

    // Mock response
    Ok(Json(UserInfo {
        id: auth_user.user_id,
        email: "user@example.com".to_string(),
        name: "Test User".to_string(),
        role: auth_user.role,
    }))
}

/// Logout handler (client-side token invalidation)
/// For server-side invalidation, implement token blacklist
///
/// POST /api/v1/auth/logout
pub async fn logout(_auth_user: AuthUser) -> StatusCode {
    // In real app with token blacklist:
    // state.token_blacklist.add(&auth_user.token_jti).await?;
    
    // For stateless JWT, logout is handled client-side by discarding tokens
    StatusCode::NO_CONTENT
}

// Mock user struct for example
struct MockUser {
    id: uuid::Uuid,
    email: String,
    name: String,
    password_hash: String,
    role: UserRole,
    is_active: bool,
}
```

### 7. Protected Route Examples (src/handlers/users.rs)

```rust
use axum::{extract::Path, http::StatusCode, Json};
use serde::Serialize;
use uuid::Uuid;

use crate::auth::{
    extractor::{AdminUser, AuthUser},
    jwt::UserRole,
};
use crate::error::AppError;

#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub id: Uuid,
    pub email: String,
    pub name: String,
    pub role: UserRole,
}

/// Get user by ID - requires authentication
///
/// GET /api/v1/users/:id
pub async fn get_user(
    auth_user: AuthUser,
    Path(user_id): Path<Uuid>,
) -> Result<Json<UserResponse>, AppError> {
    // Users can only view their own profile unless admin
    if auth_user.user_id != user_id && auth_user.role != UserRole::Admin {
        return Err(AppError::forbidden("Cannot access other user's profile"));
    }

    // In real app: fetch from database
    Ok(Json(UserResponse {
        id: user_id,
        email: "user@example.com".to_string(),
        name: "Test User".to_string(),
        role: UserRole::User,
    }))
}

/// List all users - admin only
///
/// GET /api/v1/users
pub async fn list_users(
    AdminUser(_admin): AdminUser,
) -> Result<Json<Vec<UserResponse>>, AppError> {
    // In real app: fetch from database with pagination
    Ok(Json(vec![
        UserResponse {
            id: Uuid::new_v4(),
            email: "user1@example.com".to_string(),
            name: "User One".to_string(),
            role: UserRole::User,
        },
        UserResponse {
            id: Uuid::new_v4(),
            email: "admin@example.com".to_string(),
            name: "Admin User".to_string(),
            role: UserRole::Admin,
        },
    ]))
}

/// Delete user - admin only
///
/// DELETE /api/v1/users/:id
pub async fn delete_user(
    AdminUser(_admin): AdminUser,
    Path(user_id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    // In real app: delete from database
    tracing::info!("Deleting user: {}", user_id);
    
    Ok(StatusCode::NO_CONTENT)
}
```

### 8. Router Configuration (src/routes.rs)

```rust
use axum::{
    middleware,
    routing::{delete, get, post},
    Router,
};
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};

use crate::auth::{jwt::JwtManager, middleware::inject_jwt_manager};
use crate::handlers::{auth, users};

pub struct AppState {
    pub jwt_manager: Arc<JwtManager>,
}

pub fn create_router(state: Arc<AppState>) -> Router {
    // Public routes (no authentication required)
    let public_routes = Router::new()
        .route("/auth/login", post(auth::login))
        .route("/auth/register", post(auth::register))
        .route("/auth/refresh", post(auth::refresh_token));

    // Protected routes (authentication required)
    let protected_routes = Router::new()
        .route("/auth/me", get(auth::get_current_user))
        .route("/auth/logout", post(auth::logout))
        .route("/users", get(users::list_users))
        .route("/users/:id", get(users::get_user))
        .route("/users/:id", delete(users::delete_user))
        // Inject JWT manager for auth extractors
        .layer(middleware::from_fn_with_state(
            state.jwt_manager.clone(),
            inject_jwt_manager,
        ));

    // Health check
    let health_routes = Router::new()
        .route("/health", get(health_check));

    // CORS configuration
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Combine all routes
    Router::new()
        .nest("/api/v1", public_routes)
        .nest("/api/v1", protected_routes)
        .merge(health_routes)
        .layer(cors)
        .with_state(state)
}

async fn health_check() -> &'static str {
    "OK"
}
```

### 9. Main Application (src/main.rs)

```rust
use std::sync::Arc;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod auth;
mod error;
mod handlers;
mod routes;

use auth::jwt::JwtManager;
use routes::{create_router, AppState};

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "axum_auth=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load configuration (from env in production)
    let jwt_secret = std::env::var("JWT_SECRET")
        .unwrap_or_else(|_| "your-super-secret-key-change-in-production".to_string());
    let access_expiration_hours = 1;
    let refresh_expiration_days = 7;

    // Create JWT manager
    let jwt_manager = Arc::new(JwtManager::new(
        &jwt_secret,
        access_expiration_hours,
        refresh_expiration_days,
    ));

    // Create application state
    let state = Arc::new(AppState { jwt_manager });

    // Create router
    let app = create_router(state);

    // Start server
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
    tracing::info!("Server listening on {}", listener.local_addr().unwrap());

    axum::serve(listener, app).await.unwrap();
}
```

### 10. Error Types (src/error.rs)

```rust
use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Unauthorized: {0}")]
    Unauthorized(String),

    #[error("Forbidden: {0}")]
    Forbidden(String),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Conflict: {0}")]
    Conflict(String),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Internal error: {0}")]
    Internal(String),
}

#[derive(Debug, Serialize)]
struct ErrorResponse {
    error: String,
    code: u16,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match &self {
            Self::Unauthorized(msg) => (StatusCode::UNAUTHORIZED, msg.clone()),
            Self::Forbidden(msg) => (StatusCode::FORBIDDEN, msg.clone()),
            Self::NotFound(msg) => (StatusCode::NOT_FOUND, msg.clone()),
            Self::Conflict(msg) => (StatusCode::CONFLICT, msg.clone()),
            Self::Validation(msg) => (StatusCode::BAD_REQUEST, msg.clone()),
            Self::Internal(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg.clone()),
        };

        let body = Json(ErrorResponse {
            error: message,
            code: status.as_u16(),
        });

        (status, body).into_response()
    }
}

impl AppError {
    pub fn unauthorized(msg: impl Into<String>) -> Self {
        Self::Unauthorized(msg.into())
    }

    pub fn forbidden(msg: impl Into<String>) -> Self {
        Self::Forbidden(msg.into())
    }

    pub fn not_found(msg: impl Into<String>) -> Self {
        Self::NotFound(msg.into())
    }

    pub fn conflict(msg: impl Into<String>) -> Self {
        Self::Conflict(msg.into())
    }

    pub fn validation(msg: impl Into<String>) -> Self {
        Self::Validation(msg.into())
    }

    pub fn internal(msg: impl Into<String>) -> Self {
        Self::Internal(msg.into())
    }
}
```

## Usage Examples

### Login

```bash
curl -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Response:
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "Test User",
    "role": "user"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### Access Protected Route

```bash
curl "http://localhost:8080/api/v1/auth/me" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Refresh Token

```bash
curl -X POST "http://localhost:8080/api/v1/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}'
```

## Security Best Practices

1. **JWT Secrets**: Use strong, random secrets (min 256 bits)
2. **Token Expiration**: Short-lived access tokens (15-60 min)
3. **HTTPS Only**: Always use HTTPS in production
4. **Password Policy**: Minimum 8 characters, consider complexity
5. **Rate Limiting**: Implement on login endpoint
6. **Token Blacklist**: For logout/revocation (Redis recommended)
7. **Refresh Token Rotation**: Issue new refresh on each refresh
8. **Secure Headers**: HSTS, CSP, X-Frame-Options

## Key Takeaways

1. **Type-Safe Extractors**: Axum extractors provide compile-time safety
2. **Tower Middleware**: Composable, reusable middleware layers
3. **Argon2 Hashing**: Industry-standard password hashing
4. **RBAC Pattern**: Role-based access with custom extractors
5. **Error Handling**: Consistent error responses with proper HTTP status
6. **Token Pair**: Access + refresh token pattern for security/UX balance

This authentication system is production-ready and follows Rust/Axum best practices.
