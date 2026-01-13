# Complete Actix-web Project Setup

> **Demonstrates**: Full project structure with workspace and layered architecture (handlers → services → repositories)
> **Technologies**: Actix-web 4.x, Rust 1.75+, Tokio 1.x, SQLx 0.7+, PostgreSQL, Docker
> **Integration**: Pydantic-like validation with validator, lifespan management, dependency injection
> **Use when**: Building high-performance REST APIs with Actix-web framework

---

## Overview

This example provides a complete, production-ready Actix-web project setup with:
- Workspace-based project structure for scalability
- Layered architecture for maintainability
- SQLx for compile-time checked async database queries
- Comprehensive error handling with thiserror
- Docker containerization with multi-stage builds

## Project Structure

```
workspace/rust/
├── Cargo.toml                    # Workspace manifest
├── Cargo.lock                    # Dependencies lock
├── rust-toolchain.toml           # Toolchain pinning
├── rustfmt.toml                  # Formatter config
├── clippy.toml                   # Linter config
├── .cargo/
│   └── config.toml               # Build config
├── crates/
│   ├── api/                      # Main API crate
│   │   ├── Cargo.toml
│   │   └── src/
│   │       ├── main.rs           # Entry point
│   │       ├── lib.rs            # Library exports
│   │       ├── config.rs         # Configuration
│   │       ├── error.rs          # Error types
│   │       ├── routes/
│   │       ├── handlers/
│   │       ├── services/
│   │       ├── repositories/
│   │       ├── models/
│   │       └── middleware/
│   └── core/                     # Shared domain logic
├── tests/                        # Integration tests
├── benches/                      # Benchmarks
├── migrations/                   # Database migrations
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Implementation

### 1. Workspace Configuration (Cargo.toml)

```toml
[workspace]
resolver = "2"
members = ["crates/*"]

[workspace.package]
version = "0.1.0"
edition = "2021"
authors = ["Your Team <team@example.com>"]
license = "MIT"
rust-version = "1.75"

[workspace.dependencies]
# Async runtime
tokio = { version = "1.35", features = ["full"] }
futures = "0.3"

# Web framework
actix-web = "4.4"
actix-rt = "2.9"
actix-cors = "0.7"

# Database
sqlx = { version = "0.7", features = ["runtime-tokio", "postgres", "uuid", "chrono", "migrate"] }

# Serialization
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# Validation
validator = { version = "0.16", features = ["derive"] }

# Error handling
thiserror = "1.0"
anyhow = "1.0"

# Configuration
config = "0.14"
dotenvy = "0.15"

# Logging/Tracing
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter", "json"] }
tracing-actix-web = "0.7"

# Security
argon2 = "0.5"
jsonwebtoken = "9.2"
uuid = { version = "1.6", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }

[workspace.lints.rust]
unsafe_code = "forbid"

[workspace.lints.clippy]
all = "warn"
pedantic = "warn"
nursery = "warn"
```

### 2. API Crate Configuration (crates/api/Cargo.toml)

```toml
[package]
name = "api"
version.workspace = true
edition.workspace = true
authors.workspace = true
license.workspace = true

[[bin]]
name = "api"
path = "src/main.rs"

[dependencies]
tokio.workspace = true
futures.workspace = true
actix-web.workspace = true
actix-rt.workspace = true
actix-cors.workspace = true
sqlx.workspace = true
serde.workspace = true
serde_json.workspace = true
validator.workspace = true
thiserror.workspace = true
anyhow.workspace = true
config.workspace = true
dotenvy.workspace = true
tracing.workspace = true
tracing-subscriber.workspace = true
tracing-actix-web.workspace = true
argon2.workspace = true
jsonwebtoken.workspace = true
uuid.workspace = true
chrono.workspace = true

[dev-dependencies]
actix-rt = "2.9"
```

### 3. Configuration (crates/api/src/config.rs)

```rust
use config::{Config, ConfigError, Environment, File};
use serde::Deserialize;
use std::env;

#[derive(Debug, Clone, Deserialize)]
pub struct AppConfig {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub jwt: JwtConfig,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
    pub workers: usize,
}

#[derive(Debug, Clone, Deserialize)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
    pub min_connections: u32,
}

#[derive(Debug, Clone, Deserialize)]
pub struct JwtConfig {
    pub secret: String,
    pub expiration_hours: i64,
}

impl AppConfig {
    /// Load configuration from files and environment variables.
    ///
    /// Priority (highest to lowest):
    /// 1. Environment variables (APP__ prefix)
    /// 2. config/{RUN_MODE}.toml
    /// 3. config/default.toml
    pub fn load() -> Result<Self, ConfigError> {
        let run_mode = env::var("RUN_MODE").unwrap_or_else(|_| "development".into());

        let config = Config::builder()
            // Start with default config
            .add_source(File::with_name("config/default").required(false))
            // Override with environment-specific config
            .add_source(File::with_name(&format!("config/{run_mode}")).required(false))
            // Override with environment variables (APP__SERVER__HOST, etc.)
            .add_source(
                Environment::with_prefix("APP")
                    .separator("__")
                    .try_parsing(true),
            )
            .build()?;

        config.try_deserialize()
    }
}

impl Default for ServerConfig {
    fn default() -> Self {
        Self {
            host: "127.0.0.1".to_string(),
            port: 8080,
            workers: num_cpus::get(),
        }
    }
}
```

### 4. Error Handling (crates/api/src/error.rs)

```rust
use actix_web::{http::StatusCode, HttpResponse, ResponseError};
use serde::Serialize;
use std::fmt;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Resource not found: {0}")]
    NotFound(String),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Authentication required")]
    Unauthorized,

    #[error("Permission denied")]
    Forbidden,

    #[error("Conflict: {0}")]
    Conflict(String),

    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("JWT error: {0}")]
    Jwt(#[from] jsonwebtoken::errors::Error),

    #[error("Internal server error: {0}")]
    Internal(String),
}

#[derive(Debug, Serialize)]
struct ErrorResponse {
    error: String,
    code: u16,
    #[serde(skip_serializing_if = "Option::is_none")]
    details: Option<String>,
}

impl ResponseError for AppError {
    fn status_code(&self) -> StatusCode {
        match self {
            Self::NotFound(_) => StatusCode::NOT_FOUND,
            Self::Validation(_) => StatusCode::BAD_REQUEST,
            Self::Unauthorized => StatusCode::UNAUTHORIZED,
            Self::Forbidden => StatusCode::FORBIDDEN,
            Self::Conflict(_) => StatusCode::CONFLICT,
            Self::Database(_) => StatusCode::INTERNAL_SERVER_ERROR,
            Self::Jwt(_) => StatusCode::UNAUTHORIZED,
            Self::Internal(_) => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }

    fn error_response(&self) -> HttpResponse {
        let status = self.status_code();
        let error_response = ErrorResponse {
            error: self.to_string(),
            code: status.as_u16(),
            details: self.details(),
        };

        HttpResponse::build(status).json(error_response)
    }
}

impl AppError {
    fn details(&self) -> Option<String> {
        match self {
            Self::Database(e) => Some(format!("Database operation failed: {e}")),
            Self::Jwt(e) => Some(format!("Token error: {e}")),
            _ => None,
        }
    }

    pub fn not_found(resource: impl Into<String>) -> Self {
        Self::NotFound(resource.into())
    }

    pub fn validation(msg: impl Into<String>) -> Self {
        Self::Validation(msg.into())
    }

    pub fn conflict(msg: impl Into<String>) -> Self {
        Self::Conflict(msg.into())
    }

    pub fn internal(msg: impl Into<String>) -> Self {
        Self::Internal(msg.into())
    }
}

/// Result type alias for AppError
pub type AppResult<T> = Result<T, AppError>;
```

### 5. Domain Models (crates/api/src/models/user.rs)

```rust
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use validator::Validate;

/// User database model
#[derive(Debug, Clone, FromRow, Serialize)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub name: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Request to create a new user
#[derive(Debug, Deserialize, Validate)]
pub struct CreateUserRequest {
    #[validate(email(message = "Invalid email format"))]
    pub email: String,

    #[validate(length(min = 1, max = 100, message = "Name must be 1-100 characters"))]
    pub name: String,

    #[validate(length(min = 8, max = 128, message = "Password must be 8-128 characters"))]
    pub password: String,
}

/// Request to update a user
#[derive(Debug, Deserialize, Validate)]
pub struct UpdateUserRequest {
    #[validate(length(min = 1, max = 100, message = "Name must be 1-100 characters"))]
    pub name: Option<String>,

    #[validate(email(message = "Invalid email format"))]
    pub email: Option<String>,
}

/// User response (excludes sensitive fields)
#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub id: Uuid,
    pub email: String,
    pub name: String,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
}

impl From<User> for UserResponse {
    fn from(user: User) -> Self {
        Self {
            id: user.id,
            email: user.email,
            name: user.name,
            is_active: user.is_active,
            created_at: user.created_at,
        }
    }
}

/// Paginated list response
#[derive(Debug, Serialize)]
pub struct UserListResponse {
    pub users: Vec<UserResponse>,
    pub total: i64,
    pub page: i64,
    pub per_page: i64,
}
```

### 6. Repository Layer (crates/api/src/repositories/user_repo.rs)

```rust
use crate::error::{AppError, AppResult};
use crate::models::user::{CreateUserRequest, UpdateUserRequest, User};
use sqlx::PgPool;
use uuid::Uuid;

pub struct UserRepository {
    pool: PgPool,
}

impl UserRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn find_by_id(&self, id: Uuid) -> AppResult<Option<User>> {
        let user = sqlx::query_as!(
            User,
            r#"
            SELECT id, email, name, password_hash, is_active, created_at, updated_at
            FROM users
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(user)
    }

    pub async fn find_by_email(&self, email: &str) -> AppResult<Option<User>> {
        let user = sqlx::query_as!(
            User,
            r#"
            SELECT id, email, name, password_hash, is_active, created_at, updated_at
            FROM users
            WHERE email = $1
            "#,
            email
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(user)
    }

    pub async fn create(&self, req: &CreateUserRequest, password_hash: &str) -> AppResult<User> {
        let user = sqlx::query_as!(
            User,
            r#"
            INSERT INTO users (id, email, name, password_hash, is_active, created_at, updated_at)
            VALUES ($1, $2, $3, $4, true, NOW(), NOW())
            RETURNING id, email, name, password_hash, is_active, created_at, updated_at
            "#,
            Uuid::new_v4(),
            req.email,
            req.name,
            password_hash
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(user)
    }

    pub async fn update(&self, id: Uuid, req: &UpdateUserRequest) -> AppResult<User> {
        let user = sqlx::query_as!(
            User,
            r#"
            UPDATE users
            SET 
                name = COALESCE($2, name),
                email = COALESCE($3, email),
                updated_at = NOW()
            WHERE id = $1
            RETURNING id, email, name, password_hash, is_active, created_at, updated_at
            "#,
            id,
            req.name,
            req.email
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(user)
    }

    pub async fn delete(&self, id: Uuid) -> AppResult<bool> {
        let result = sqlx::query!(
            r#"
            DELETE FROM users
            WHERE id = $1
            "#,
            id
        )
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn list(&self, page: i64, per_page: i64) -> AppResult<(Vec<User>, i64)> {
        let offset = (page - 1) * per_page;

        // Get total count
        let count_result = sqlx::query_scalar!(
            r#"
            SELECT COUNT(*) as "count!"
            FROM users
            "#
        )
        .fetch_one(&self.pool)
        .await?;

        // Get paginated results
        let users = sqlx::query_as!(
            User,
            r#"
            SELECT id, email, name, password_hash, is_active, created_at, updated_at
            FROM users
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
            "#,
            per_page,
            offset
        )
        .fetch_all(&self.pool)
        .await?;

        Ok((users, count_result))
    }
}
```

### 7. Service Layer (crates/api/src/services/user_service.rs)

```rust
use crate::error::{AppError, AppResult};
use crate::models::user::{CreateUserRequest, UpdateUserRequest, User, UserListResponse, UserResponse};
use crate::repositories::user_repo::UserRepository;
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use uuid::Uuid;

pub struct UserService {
    repo: UserRepository,
}

impl UserService {
    pub fn new(repo: UserRepository) -> Self {
        Self { repo }
    }

    pub async fn create_user(&self, req: CreateUserRequest) -> AppResult<UserResponse> {
        // Check if email already exists
        if self.repo.find_by_email(&req.email).await?.is_some() {
            return Err(AppError::conflict("Email already registered"));
        }

        // Hash password
        let password_hash = hash_password(&req.password)?;

        // Create user
        let user = self.repo.create(&req, &password_hash).await?;
        Ok(user.into())
    }

    pub async fn get_user(&self, id: Uuid) -> AppResult<UserResponse> {
        let user = self
            .repo
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found("User not found"))?;

        Ok(user.into())
    }

    pub async fn update_user(&self, id: Uuid, req: UpdateUserRequest) -> AppResult<UserResponse> {
        // Check user exists
        let _ = self
            .repo
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found("User not found"))?;

        // Check email uniqueness if changing
        if let Some(ref email) = req.email {
            if let Some(existing) = self.repo.find_by_email(email).await? {
                if existing.id != id {
                    return Err(AppError::conflict("Email already in use"));
                }
            }
        }

        let user = self.repo.update(id, &req).await?;
        Ok(user.into())
    }

    pub async fn delete_user(&self, id: Uuid) -> AppResult<()> {
        let deleted = self.repo.delete(id).await?;
        if !deleted {
            return Err(AppError::not_found("User not found"));
        }
        Ok(())
    }

    pub async fn list_users(&self, page: i64, per_page: i64) -> AppResult<UserListResponse> {
        let (users, total) = self.repo.list(page, per_page).await?;
        let user_responses: Vec<UserResponse> = users.into_iter().map(Into::into).collect();

        Ok(UserListResponse {
            users: user_responses,
            total,
            page,
            per_page,
        })
    }

    pub async fn authenticate(&self, email: &str, password: &str) -> AppResult<User> {
        let user = self
            .repo
            .find_by_email(email)
            .await?
            .ok_or(AppError::Unauthorized)?;

        if !user.is_active {
            return Err(AppError::Forbidden);
        }

        verify_password(password, &user.password_hash)?;
        Ok(user)
    }
}

/// Hash password using Argon2id
fn hash_password(password: &str) -> AppResult<String> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| AppError::internal(format!("Password hashing failed: {e}")))?
        .to_string();
    Ok(password_hash)
}

/// Verify password against hash
fn verify_password(password: &str, hash: &str) -> AppResult<()> {
    let parsed_hash =
        PasswordHash::new(hash).map_err(|e| AppError::internal(format!("Invalid hash: {e}")))?;

    Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .map_err(|_| AppError::Unauthorized)
}
```

### 8. Handlers (crates/api/src/handlers/user.rs)

```rust
use crate::error::AppResult;
use crate::models::user::{CreateUserRequest, UpdateUserRequest, UserListResponse, UserResponse};
use crate::services::user_service::UserService;
use actix_web::{web, HttpResponse};
use uuid::Uuid;
use validator::Validate;

/// Application state shared across handlers
pub struct AppState {
    pub user_service: UserService,
}

/// Create a new user
///
/// POST /api/v1/users
pub async fn create_user(
    state: web::Data<AppState>,
    body: web::Json<CreateUserRequest>,
) -> AppResult<HttpResponse> {
    // Validate request
    body.validate()
        .map_err(|e| crate::error::AppError::validation(e.to_string()))?;

    let user = state.user_service.create_user(body.into_inner()).await?;
    Ok(HttpResponse::Created().json(user))
}

/// Get user by ID
///
/// GET /api/v1/users/{id}
pub async fn get_user(
    state: web::Data<AppState>,
    path: web::Path<Uuid>,
) -> AppResult<HttpResponse> {
    let id = path.into_inner();
    let user = state.user_service.get_user(id).await?;
    Ok(HttpResponse::Ok().json(user))
}

/// List users with pagination
///
/// GET /api/v1/users?page=1&per_page=20
pub async fn list_users(
    state: web::Data<AppState>,
    query: web::Query<PaginationQuery>,
) -> AppResult<HttpResponse> {
    let page = query.page.unwrap_or(1).max(1);
    let per_page = query.per_page.unwrap_or(20).clamp(1, 100);

    let users = state.user_service.list_users(page, per_page).await?;
    Ok(HttpResponse::Ok().json(users))
}

/// Update user
///
/// PUT /api/v1/users/{id}
pub async fn update_user(
    state: web::Data<AppState>,
    path: web::Path<Uuid>,
    body: web::Json<UpdateUserRequest>,
) -> AppResult<HttpResponse> {
    let id = path.into_inner();

    // Validate request
    body.validate()
        .map_err(|e| crate::error::AppError::validation(e.to_string()))?;

    let user = state
        .user_service
        .update_user(id, body.into_inner())
        .await?;
    Ok(HttpResponse::Ok().json(user))
}

/// Delete user
///
/// DELETE /api/v1/users/{id}
pub async fn delete_user(
    state: web::Data<AppState>,
    path: web::Path<Uuid>,
) -> AppResult<HttpResponse> {
    let id = path.into_inner();
    state.user_service.delete_user(id).await?;
    Ok(HttpResponse::NoContent().finish())
}

/// Query parameters for pagination
#[derive(Debug, serde::Deserialize)]
pub struct PaginationQuery {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
}
```

### 9. Routes Configuration (crates/api/src/routes/mod.rs)

```rust
use crate::handlers::user::{create_user, delete_user, get_user, list_users, update_user, AppState};
use actix_web::web;

pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/v1")
            // Health check
            .route("/health", web::get().to(health_check))
            // User routes
            .service(
                web::scope("/users")
                    .route("", web::post().to(create_user))
                    .route("", web::get().to(list_users))
                    .route("/{id}", web::get().to(get_user))
                    .route("/{id}", web::put().to(update_user))
                    .route("/{id}", web::delete().to(delete_user)),
            ),
    );
}

async fn health_check() -> actix_web::HttpResponse {
    actix_web::HttpResponse::Ok().json(serde_json::json!({
        "status": "healthy",
        "version": env!("CARGO_PKG_VERSION")
    }))
}
```

### 10. Main Application (crates/api/src/main.rs)

```rust
use actix_cors::Cors;
use actix_web::{middleware, web, App, HttpServer};
use sqlx::postgres::PgPoolOptions;
use std::sync::Arc;
use tracing::info;
use tracing_actix_web::TracingLogger;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod config;
mod error;
mod handlers;
mod models;
mod repositories;
mod routes;
mod services;

use crate::config::AppConfig;
use crate::handlers::user::AppState;
use crate::repositories::user_repo::UserRepository;
use crate::services::user_service::UserService;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "api=debug,actix_web=info".into()),
        )
        .with(tracing_subscriber::fmt::layer().json())
        .init();

    // Load configuration
    dotenvy::dotenv().ok();
    let config = AppConfig::load().expect("Failed to load configuration");

    info!("Starting server at {}:{}", config.server.host, config.server.port);

    // Create database pool
    let pool = PgPoolOptions::new()
        .max_connections(config.database.max_connections)
        .min_connections(config.database.min_connections)
        .connect(&config.database.url)
        .await
        .expect("Failed to connect to database");

    // Run migrations
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Failed to run migrations");

    info!("Database connected and migrations applied");

    // Create application state
    let user_repo = UserRepository::new(pool.clone());
    let user_service = UserService::new(user_repo);
    let app_state = web::Data::new(AppState { user_service });

    // Start HTTP server
    HttpServer::new(move || {
        let cors = Cors::default()
            .allowed_origin("http://localhost:3000")
            .allowed_methods(vec!["GET", "POST", "PUT", "DELETE"])
            .allowed_headers(vec![
                actix_web::http::header::AUTHORIZATION,
                actix_web::http::header::CONTENT_TYPE,
            ])
            .max_age(3600);

        App::new()
            .app_data(app_state.clone())
            .wrap(TracingLogger::default())
            .wrap(middleware::Compress::default())
            .wrap(cors)
            .configure(routes::configure_routes)
    })
    .workers(config.server.workers)
    .bind((config.server.host, config.server.port))?
    .run()
    .await
}
```

### 11. Database Migration (migrations/20250113_001_create_users.sql)

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);

-- Create index on created_at for sorting
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 12. Docker Configuration

**Dockerfile**:
```dockerfile
# Build stage
FROM rust:1.75-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy workspace files
COPY Cargo.toml Cargo.lock ./
COPY crates/ crates/

# Build release binary
RUN cargo build --release --bin api

# Runtime stage
FROM debian:bookworm-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

# Copy binary from builder
COPY --from=builder /app/target/release/api /app/api

# Copy config and migrations
COPY config/ config/
COPY migrations/ migrations/

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/api/v1/health || exit 1

# Run binary
CMD ["./api"]
```

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8080:8080"
    environment:
      - APP__SERVER__HOST=0.0.0.0
      - APP__SERVER__PORT=8080
      - APP__DATABASE__URL=postgres://user:password@db:5432/mydb
      - APP__DATABASE__MAX_CONNECTIONS=10
      - APP__DATABASE__MIN_CONNECTIONS=2
      - APP__JWT__SECRET=your-super-secret-jwt-key-change-in-production
      - APP__JWT__EXPIRATION_HOURS=24
      - RUST_LOG=api=debug,actix_web=info
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=mydb
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d mydb"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

## Usage

### Local Development

```bash
# Install dependencies and build
cargo build

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Start PostgreSQL (if not using Docker)
docker run -d --name postgres \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=mydb \
  -p 5432:5432 \
  postgres:16-alpine

# Run migrations (requires sqlx-cli)
cargo install sqlx-cli
sqlx migrate run

# Run development server
cargo run --bin api

# Access API
# - Health check: http://localhost:8080/api/v1/health
```

### Docker Development

```bash
# Start all services
docker-compose up --build

# Access API at http://localhost:8080
```

### API Testing

```bash
# Create user
curl -X POST "http://localhost:8080/api/v1/users" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","password":"securepass123"}'

# Get user
curl "http://localhost:8080/api/v1/users/{uuid}"

# List users
curl "http://localhost:8080/api/v1/users?page=1&per_page=10"

# Update user
curl -X PUT "http://localhost:8080/api/v1/users/{uuid}" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name"}'

# Delete user
curl -X DELETE "http://localhost:8080/api/v1/users/{uuid}"
```

## Key Takeaways

1. **Workspace Structure**: Scalable monorepo with shared dependencies
2. **Layered Architecture**: handlers → services → repositories for clean separation
3. **Compile-Time SQL**: SQLx validates queries at compile time
4. **Type-Safe Errors**: thiserror for custom error types with proper HTTP responses
5. **Request Validation**: validator crate for declarative validation
6. **Async-First**: Full async/await with Tokio runtime
7. **Configuration Management**: Environment-based config with type safety
8. **Security**: Argon2 password hashing, secure defaults
9. **Observability**: Structured logging with tracing
10. **Docker Ready**: Multi-stage builds for minimal container size

This complete setup provides a solid foundation for production Actix-web APIs.
