# Rust Systems - Technical Reference

> **Purpose**: Technical reference for the rust-systems skill in the autonomous skills-based development system.
> **Related Skills**: systemdev-specialist, backend-fastapi, frontend-nextjs, security-specialist, devops-deployment, database-specialist
> **Examples**: See examples/ directory for production-ready Rust patterns.

---

## Rust Systems Skill Guidelines

### Core Responsibilities

**CRITICAL**: Operate with complete autonomy for Rust systems development

**Systems Programming Excellence**
- **Memory Safety**: Ownership, borrowing, lifetimes without garbage collection
- **Zero-Cost Abstractions**: High-level code with low-level performance
- **Fearless Concurrency**: Thread safety guaranteed by the type system
- **Cross-Platform**: Single codebase for multiple targets

**Web API Development**
- **High-Performance APIs**: Actix-web, Axum for extreme throughput
- **Async-First**: Tokio runtime, futures, async/await patterns
- **Type-Safe Routing**: Compile-time route verification
- **Middleware Ecosystem**: Tower for composable middleware

**Technology Leadership**
- Autonomous technical decisions for Rust architecture
- Performance optimization strategies
- Security best practices (memory-safe by default)
- Testing and quality assurance standards
- Deployment and operational excellence

### Ultimate Goals
- **Production-ready Rust applications** with maximum performance and safety
- **Zero user confirmations required** for technical decisions
- Seamless integration with Python (PyO3), JavaScript (WASM), and other systems

---

## Production Examples

This skill provides comprehensive Rust implementation examples in the `examples/` directory:

### Available Examples

#### 01. Complete Actix-web Setup (`examples/01-actix-web-api-setup.md`)
- **Demonstrates**: Full project structure with workspace and layered architecture
- **Key Patterns**: handlers, services, repositories, extractors, middleware
- **Integration**: PostgreSQL with SQLx, JWT auth, Docker
- **Technologies**: Actix-web 4.x, Tokio, SQLx, serde
- **Use when**: Building high-performance REST APIs

#### 02. Axum Authentication (`examples/02-axum-authentication.md`)
- **Demonstrates**: Complete authentication system with JWT
- **Key Patterns**: Tower middleware, extractors, protected routes
- **Integration**: Password hashing with argon2, token refresh
- **Technologies**: Axum 0.7+, tower-http, jsonwebtoken, argon2
- **Use when**: Implementing authentication with tower ecosystem

#### 03. SQLx Database Patterns (`examples/03-sqlx-database-patterns.md`)
- **Demonstrates**: Compile-time checked SQL queries
- **Key Patterns**: Repository pattern, migrations, transactions
- **Integration**: Async connection pooling, query optimization
- **Technologies**: SQLx 0.7+, deadpool-postgres, refinery
- **Use when**: Building type-safe database layer

#### 04. CLI Application (`examples/04-cli-application.md`)
- **Demonstrates**: Professional command-line application
- **Key Patterns**: Derive-based parsing, subcommands, interactive prompts
- **Integration**: Configuration files, progress bars, colored output
- **Technologies**: clap 4.x, dialoguer, indicatif, colored
- **Use when**: Building developer tools and utilities

#### 05. WASM Frontend Integration (`examples/05-wasm-frontend-integration.md`)
- **Demonstrates**: WebAssembly module for browser performance
- **Key Patterns**: JavaScript interop, async in WASM, bundling
- **Integration**: Next.js/React, performance optimization
- **Technologies**: wasm-bindgen, wasm-pack, web-sys
- **Use when**: Offloading computation to WASM

#### 06. PyO3 Python Extension (`examples/06-pyo3-python-extension.md`)
- **Demonstrates**: High-performance Python extension module
- **Key Patterns**: Function export, type conversion, GIL handling
- **Integration**: maturin build, pytest testing
- **Technologies**: PyO3 0.20+, maturin, pyo3-asyncio
- **Use when**: Accelerating Python with Rust

### Using These Examples
- Examples provide production-ready implementations
- Complete code with proper error handling
- Security and performance best practices
- Cross-references with related skills
- Benchmarking patterns included

---

## Skill Coordination

### Autonomous Operation
This skill operates with **complete autonomy**, requiring **zero user confirmations** for:
- Rust project architecture and workspace structure
- Web framework selection (Actix, Axum, Rocket, Warp)
- Async runtime configuration
- Database layer implementation
- Error handling patterns (thiserror, anyhow)
- CLI structure and argument parsing
- WebAssembly module design
- FFI boundary design (PyO3, Neon)
- Performance optimization decisions
- Testing strategy and coverage targets
- Docker and deployment configuration

### Skill Invocation Context
This skill is automatically invoked by Claude when:
- User requests involve: "Rust", "Cargo", "systems programming", "WASM", "Actix", "Axum", "Tokio"
- Project requires: High-performance services, memory-safe code, CLI tools, native extensions
- Context matches: Zero-cost abstractions, ownership patterns, async Rust, FFI
- Related skills mention: "rust-systems skill" in their outputs

### Cross-Skill Collaboration
Coordinates with related skills through natural language mentions:

**systemdev-specialist (CRITICAL)**:
- High-performance data processing pipelines
- GPU computing integration (CUDA wrappers in Rust)
- Real-time video/image processing
- Scientific computing with ndarray
- Performance profiling and optimization
- Memory-mapped I/O patterns

**backend-fastapi (HIGH)**:
- PyO3 Python extension development
- Rust for Python performance bottlenecks
- Shared library generation (.so/.dll)
- Type conversion across FFI boundary
- GIL handling strategies
- maturin build configuration
- Async Python with pyo3-asyncio

**frontend-nextjs (HIGH)**:
- WebAssembly modules for browser
- Computation-heavy tasks in WASM
- wasm-bindgen JavaScript interop
- WASM module loading and instantiation
- Size optimization (wasm-opt)
- Performance comparison (WASM vs JS)

**security-specialist (HIGH)**:
- Memory-safe cryptographic implementations
- TLS with rustls (no OpenSSL dependency)
- Password hashing with argon2
- JWT token handling with jsonwebtoken
- Secure random generation with rand
- Input validation patterns

**devops-deployment (MEDIUM-HIGH)**:
- Multi-stage Docker builds for Rust
- Static binary compilation (musl target)
- Cross-compilation for multiple platforms
- Release profile optimization (LTO, strip)
- CI/CD with cargo test, clippy, audit
- Container size optimization

**database-specialist**:
- SQLx compile-time query checking
- Diesel type-safe migrations
- Connection pooling strategies
- Query optimization for async
- Transaction patterns

**fullstack-integration**:
- Architecture decisions involving Rust services
- API contract design (OpenAPI generation)
- Type sharing strategies
- System integration patterns
- Performance requirements coordination

**qa-testing**:
- Rust testing patterns (cargo test)
- Integration test strategies
- Benchmark verification (criterion)
- Coverage with tarpaulin
- Property-based testing (proptest)

### Coordination Pattern
1. **Natural Language Mentions**: Skills mention rust-systems for performance needs
2. **Autonomous Invocation**: Claude automatically invokes based on context
3. **Shared Memory System**: Architecture decisions in .memory/ directory
4. **Zero User Confirmation**: All technical implementation autonomous

---

## Technology Stack

### Core Toolchain
```
Rust Toolchain:
- Rust: 1.75+ (latest stable, edition 2021)
- Cargo: Package manager, build system, workspace management
- rustfmt: Code formatting (enforced in CI)
- clippy: Linting, best practices (warn level minimum)
- rust-analyzer: LSP for IDE support
- cargo-edit: Dependency management (cargo add/rm)
- cargo-watch: Development auto-reload
```

### Web Frameworks
```
API Development (choose one):
- Actix-web 4.x: Highest performance, actor model, mature
- Axum 0.7+: Tower ecosystem, composable, ergonomic
- Rocket 0.5+: Developer-friendly, compile-time guarantees
- Warp 0.3+: Filter-based, functional style

Supporting:
- tower: Middleware framework
- tower-http: HTTP middleware (CORS, compression, tracing)
- hyper: Low-level HTTP (Axum foundation)
```

### Async Runtime
```
Concurrency:
- Tokio 1.x: Industry standard, multi-threaded by default
- async-std: Alternative runtime (simpler API)
- futures: Future combinators
- tokio-util: Codecs, sync primitives

Observability:
- tracing: Structured diagnostics
- tracing-subscriber: Log formatting, filtering
- tracing-opentelemetry: OpenTelemetry integration
```

### Database
```
Data Layer:
- SQLx 0.7+: Compile-time SQL, async, PostgreSQL/MySQL/SQLite
- Diesel 2.x: Type-safe ORM, DSL, migrations
- SeaORM 0.12+: Async ORM, ActiveRecord pattern

Connection Pooling:
- deadpool-postgres: Async PostgreSQL pool
- bb8: Generic async pool
- sqlx built-in: SQLx connection pool

Migrations:
- sqlx-cli: SQLx migration tool
- diesel_cli: Diesel migration tool
- refinery: Framework-agnostic migrations
```

### Serialization
```
Data Formats:
- serde: Serialize/deserialize framework
- serde_json: JSON (most common)
- toml: Configuration files
- serde_yaml: YAML support
- bincode: Efficient binary format
- postcard: Embedded-friendly binary
```

### CLI Development
```
Command-Line:
- clap 4.x: Derive-based argument parsing
- dialoguer: Interactive prompts
- indicatif: Progress bars, spinners
- colored: Terminal colors
- console: Terminal utilities
- directories: Platform-specific paths
- config: Configuration file loading
```

### WebAssembly
```
WASM Development:
- wasm-bindgen: JavaScript interop
- wasm-pack: Build, test, publish tool
- web-sys: Web API bindings
- js-sys: JavaScript type bindings
- gloo: WASM utilities (timers, events)
- wasm-opt: Binary optimization
```

### FFI & Interop
```
Python:
- PyO3 0.20+: Python extension modules
- maturin: Python package builder
- pyo3-asyncio: Async Python support

Node.js:
- Neon: Native Node modules
- napi-rs: Alternative Node bindings

C/C++:
- cbindgen: C header generation
- cxx: Safe C++ interop
- bindgen: C header to Rust

Cross-Platform:
- uniffi: Multi-language bindings (Kotlin, Swift, Python)
```

### Testing & Quality
```
Testing:
- cargo test: Built-in framework
- proptest: Property-based testing
- mockall: Mocking framework
- fake: Test data generation
- test-case: Parameterized tests
- rstest: Fixtures and parameterized tests

Benchmarking:
- criterion: Statistical benchmarking
- divan: Alternative benchmarking

Coverage:
- cargo-tarpaulin: Code coverage
- llvm-cov: LLVM-based coverage
```

### Security
```
Cryptography:
- ring: High-performance crypto primitives
- rustls: TLS without OpenSSL
- webpki: Certificate validation

Authentication:
- argon2: Password hashing
- jsonwebtoken: JWT encoding/decoding
- oauth2: OAuth2 client

Security:
- secrecy: Secret value handling
- zeroize: Memory zeroization
- cargo-audit: Vulnerability scanning
- cargo-deny: Dependency policy
```

---

## Layered Architecture Pattern

### Project Structure (Workspace)
```
workspace/rust/
├── Cargo.toml                    # Workspace manifest
├── Cargo.lock                    # Dependencies lock
├── rust-toolchain.toml           # Toolchain pinning
├── rustfmt.toml                  # Formatter config
├── clippy.toml                   # Linter config
├── .cargo/
│   └── config.toml               # Build config (targets, profiles)
├── crates/
│   ├── api/                      # Web API crate
│   │   ├── Cargo.toml
│   │   └── src/
│   │       ├── main.rs           # Entry point
│   │       ├── lib.rs            # Library exports
│   │       ├── config.rs         # Configuration loading
│   │       ├── error.rs          # Error types (thiserror)
│   │       ├── routes/           # Route definitions
│   │       │   ├── mod.rs
│   │       │   ├── health.rs
│   │       │   └── users.rs
│   │       ├── handlers/         # Request handlers
│   │       │   ├── mod.rs
│   │       │   └── user.rs
│   │       ├── services/         # Business logic
│   │       │   ├── mod.rs
│   │       │   └── user.rs
│   │       ├── repositories/     # Data access
│   │       │   ├── mod.rs
│   │       │   └── user.rs
│   │       ├── models/           # Domain models
│   │       │   ├── mod.rs
│   │       │   └── user.rs
│   │       └── middleware/       # Custom middleware
│   │           ├── mod.rs
│   │           └── auth.rs
│   ├── core/                     # Shared domain logic
│   │   ├── Cargo.toml
│   │   └── src/
│   │       ├── lib.rs
│   │       └── domain/
│   ├── cli/                      # CLI application
│   │   ├── Cargo.toml
│   │   └── src/
│   │       ├── main.rs
│   │       └── commands/
│   └── wasm/                     # WebAssembly module
│       ├── Cargo.toml
│       └── src/lib.rs
├── tests/                        # Integration tests
│   └── api_integration.rs
├── benches/                      # Benchmarks
│   └── api_benchmark.rs
├── migrations/                   # Database migrations
│   └── 20250113_001_initial.sql
├── Dockerfile
├── docker-compose.yml
└── README.md
```

### Layer Responsibilities

**Routes (HTTP Layer)**:
- URL path definitions
- HTTP method bindings
- Middleware attachment
- OpenAPI documentation
- NO business logic

**Handlers (Request/Response Layer)**:
- Extract request data
- Call services
- Format responses
- HTTP status codes
- Error response formatting

**Services (Business Logic Layer)**:
- Domain rules and validation
- Orchestrate repositories
- Transaction coordination
- Business events
- NO HTTP concerns, NO direct DB queries

**Repositories (Data Access Layer)**:
- Database CRUD operations
- SQL query building
- Connection management
- Data mapping
- NO business logic

**Models (Domain Layer)**:
- Domain entities
- Value objects
- serde serialization
- Validation rules

**Middleware**:
- Authentication
- Authorization
- Logging/tracing
- CORS
- Compression

---

## Implementation Approaches

### 1. Async-First with Axum

**Router Setup:**
```rust
use axum::{
    routing::{get, post},
    Router,
};
use tower_http::cors::CorsLayer;
use std::sync::Arc;

pub fn create_router(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/health", get(health_check))
        .route("/api/v1/users", get(list_users).post(create_user))
        .route("/api/v1/users/:id", get(get_user).put(update_user).delete(delete_user))
        .layer(CorsLayer::permissive())
        .with_state(state)
}
```

**Handler Pattern:**
```rust
use axum::{
    extract::{Path, State, Json},
    http::StatusCode,
    response::IntoResponse,
};
use std::sync::Arc;

pub async fn get_user(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i64>,
) -> Result<impl IntoResponse, AppError> {
    let user = state.user_service.get_by_id(id).await?;
    
    match user {
        Some(u) => Ok((StatusCode::OK, Json(u))),
        None => Err(AppError::NotFound("User not found".into())),
    }
}

pub async fn create_user(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateUserRequest>,
) -> Result<impl IntoResponse, AppError> {
    let user = state.user_service.create(payload).await?;
    Ok((StatusCode::CREATED, Json(user)))
}
```

### 2. Error Handling with thiserror

**Custom Error Types:**
```rust
use thiserror::Error;
use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Not found: {0}")]
    NotFound(String),
    
    #[error("Validation error: {0}")]
    Validation(String),
    
    #[error("Authentication required")]
    Unauthorized,
    
    #[error("Permission denied")]
    Forbidden,
    
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    
    #[error("Internal error: {0}")]
    Internal(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match &self {
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg.clone()),
            AppError::Validation(msg) => (StatusCode::BAD_REQUEST, msg.clone()),
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, "Unauthorized".into()),
            AppError::Forbidden => (StatusCode::FORBIDDEN, "Forbidden".into()),
            AppError::Database(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error".into()),
            AppError::Internal(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg.clone()),
        };
        
        let body = Json(json!({
            "error": message,
            "code": status.as_u16(),
        }));
        
        (status, body).into_response()
    }
}
```

### 3. SQLx Repository Pattern

**Repository Implementation:**
```rust
use sqlx::PgPool;
use crate::models::User;
use crate::error::AppError;

pub struct UserRepository {
    pool: PgPool,
}

impl UserRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
    
    pub async fn find_by_id(&self, id: i64) -> Result<Option<User>, AppError> {
        let user = sqlx::query_as!(
            User,
            r#"
            SELECT id, email, name, created_at, updated_at
            FROM users
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await?;
        
        Ok(user)
    }
    
    pub async fn create(&self, email: &str, name: &str, password_hash: &str) -> Result<User, AppError> {
        let user = sqlx::query_as!(
            User,
            r#"
            INSERT INTO users (email, name, password_hash)
            VALUES ($1, $2, $3)
            RETURNING id, email, name, created_at, updated_at
            "#,
            email,
            name,
            password_hash
        )
        .fetch_one(&self.pool)
        .await?;
        
        Ok(user)
    }
    
    pub async fn list(&self, limit: i64, offset: i64) -> Result<Vec<User>, AppError> {
        let users = sqlx::query_as!(
            User,
            r#"
            SELECT id, email, name, created_at, updated_at
            FROM users
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
            "#,
            limit,
            offset
        )
        .fetch_all(&self.pool)
        .await?;
        
        Ok(users)
    }
}
```

### 4. Configuration Management

**Config with Environment Variables:**
```rust
use serde::Deserialize;
use config::{Config, ConfigError, Environment, File};

#[derive(Debug, Deserialize)]
pub struct AppConfig {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub jwt: JwtConfig,
}

#[derive(Debug, Deserialize)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
}

#[derive(Debug, Deserialize)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
}

#[derive(Debug, Deserialize)]
pub struct JwtConfig {
    pub secret: String,
    pub expiration_hours: i64,
}

impl AppConfig {
    pub fn load() -> Result<Self, ConfigError> {
        let run_mode = std::env::var("RUN_MODE").unwrap_or_else(|_| "development".into());
        
        let config = Config::builder()
            // Start with default config
            .add_source(File::with_name("config/default"))
            // Override with environment-specific
            .add_source(File::with_name(&format!("config/{}", run_mode)).required(false))
            // Override with environment variables (APP_ prefix)
            .add_source(Environment::with_prefix("APP").separator("__"))
            .build()?;
        
        config.try_deserialize()
    }
}
```

### 5. JWT Authentication Middleware

**Tower Auth Layer:**
```rust
use axum::{
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
    response::{IntoResponse, Response},
    RequestPartsExt,
};
use axum_extra::{
    headers::{authorization::Bearer, Authorization},
    TypedHeader,
};
use jsonwebtoken::{decode, DecodingKey, Validation};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: i64,  // user id
    pub exp: usize,
    pub iat: usize,
}

pub struct AuthUser {
    pub user_id: i64,
}

#[axum::async_trait]
impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
{
    type Rejection = AuthError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let TypedHeader(Authorization(bearer)) = parts
            .extract::<TypedHeader<Authorization<Bearer>>>()
            .await
            .map_err(|_| AuthError::MissingToken)?;
        
        let secret = std::env::var("JWT_SECRET").expect("JWT_SECRET must be set");
        
        let token_data = decode::<Claims>(
            bearer.token(),
            &DecodingKey::from_secret(secret.as_bytes()),
            &Validation::default(),
        )
        .map_err(|_| AuthError::InvalidToken)?;
        
        Ok(AuthUser {
            user_id: token_data.claims.sub,
        })
    }
}

pub enum AuthError {
    MissingToken,
    InvalidToken,
}

impl IntoResponse for AuthError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            AuthError::MissingToken => (StatusCode::UNAUTHORIZED, "Missing authorization token"),
            AuthError::InvalidToken => (StatusCode::UNAUTHORIZED, "Invalid token"),
        };
        (status, message).into_response()
    }
}
```

### 6. Docker Multi-Stage Build

**Dockerfile:**
```dockerfile
# Build stage
FROM rust:1.75-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy manifests
COPY Cargo.toml Cargo.lock ./
COPY crates/ crates/

# Build dependencies (cache layer)
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

# Copy config files
COPY config/ config/
COPY migrations/ migrations/

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Run binary
CMD ["./api"]
```

---

## Performance Optimization

### Zero-Copy Patterns

```rust
use bytes::Bytes;
use std::borrow::Cow;

// Use Cow for flexible ownership
fn process_data(input: Cow<'_, str>) -> String {
    if input.contains("special") {
        input.replace("special", "modified")
    } else {
        input.into_owned()
    }
}

// Use Bytes for zero-copy networking
async fn handle_upload(body: Bytes) -> Result<(), Error> {
    // body is reference-counted, no copy
    process_bytes(&body).await
}
```

### Connection Pooling

```rust
use deadpool_postgres::{Config, Pool, Runtime};
use tokio_postgres::NoTls;

pub async fn create_pool(database_url: &str, max_size: usize) -> Pool {
    let mut cfg = Config::new();
    cfg.url = Some(database_url.to_string());
    cfg.pool = Some(deadpool_postgres::PoolConfig {
        max_size,
        ..Default::default()
    });
    
    cfg.create_pool(Some(Runtime::Tokio1), NoTls)
        .expect("Failed to create pool")
}
```

### Benchmarking with Criterion

```rust
use criterion::{black_box, criterion_group, criterion_main, Criterion};

fn benchmark_parser(c: &mut Criterion) {
    let data = include_str!("../testdata/large.json");
    
    c.bench_function("parse_json", |b| {
        b.iter(|| {
            let _: serde_json::Value = serde_json::from_str(black_box(data)).unwrap();
        })
    });
}

criterion_group!(benches, benchmark_parser);
criterion_main!(benches);
```

---

## Related Skills and Resources

**Related Skills**:
- **systemdev-specialist**: High-performance systems, GPU computing integration
- **backend-fastapi**: PyO3 Python extensions, hybrid architecture
- **frontend-nextjs**: WebAssembly integration for browser
- **security-specialist**: Memory-safe cryptography, TLS
- **devops-deployment**: Docker builds, cross-compilation
- **database-specialist**: SQLx/Diesel patterns
- **fullstack-integration**: Architecture with Rust services
- **qa-testing**: Rust testing strategies

**Main System Guide**:
- **CLAUDE.md**: System-wide guidelines and autonomous skills coordination

**Production Examples**: See examples/ directory for comprehensive Rust patterns

---

This technical reference guide supports Rust 1.75+, Actix-web/Axum, Tokio, SQLx/Diesel, and the autonomous skills-based development system.
