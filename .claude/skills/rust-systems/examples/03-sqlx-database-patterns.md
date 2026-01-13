# SQLx Database Patterns

> **Demonstrates**: Compile-time checked SQL queries with async database operations
> **Technologies**: SQLx 0.7+, PostgreSQL 16, Tokio 1.x, Rust 1.75+
> **Integration**: Repository pattern, migrations, transactions, connection pooling
> **Use when**: Building type-safe database layer with compile-time SQL verification

---

## Overview

This example demonstrates production-ready database patterns with SQLx:
- Compile-time verified SQL queries
- Async connection pooling
- Repository pattern for clean architecture
- Database migrations
- Transaction management
- Custom types and JSON columns

## Implementation

### 1. Dependencies (Cargo.toml)

```toml
[dependencies]
# Async runtime
tokio = { version = "1.35", features = ["full"] }

# Database
sqlx = { version = "0.7", features = [
    "runtime-tokio",      # Tokio runtime
    "postgres",           # PostgreSQL driver
    "uuid",               # UUID support
    "chrono",             # DateTime support
    "json",               # JSON/JSONB columns
    "migrate",            # Migration support
    "macros",             # query!() and query_as!() macros
] }

# Types
uuid = { version = "1.6", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# Error handling
thiserror = "1.0"

# Tracing
tracing = "0.1"
```

### 2. Database Configuration (src/db/config.rs)

```rust
use sqlx::postgres::{PgConnectOptions, PgPoolOptions, PgSslMode};
use sqlx::PgPool;
use std::str::FromStr;
use std::time::Duration;

/// Database configuration
#[derive(Debug, Clone)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
    pub min_connections: u32,
    pub connect_timeout_secs: u64,
    pub idle_timeout_secs: u64,
    pub max_lifetime_secs: u64,
}

impl Default for DatabaseConfig {
    fn default() -> Self {
        Self {
            url: "postgres://localhost/mydb".to_string(),
            max_connections: 10,
            min_connections: 2,
            connect_timeout_secs: 30,
            idle_timeout_secs: 600,
            max_lifetime_secs: 1800,
        }
    }
}

/// Create database connection pool
pub async fn create_pool(config: &DatabaseConfig) -> Result<PgPool, sqlx::Error> {
    let connect_options = PgConnectOptions::from_str(&config.url)?
        .application_name("rust-api")
        .ssl_mode(PgSslMode::Prefer);

    let pool = PgPoolOptions::new()
        .max_connections(config.max_connections)
        .min_connections(config.min_connections)
        .acquire_timeout(Duration::from_secs(config.connect_timeout_secs))
        .idle_timeout(Duration::from_secs(config.idle_timeout_secs))
        .max_lifetime(Duration::from_secs(config.max_lifetime_secs))
        .connect_with(connect_options)
        .await?;

    tracing::info!(
        "Database pool created: max={}, min={}",
        config.max_connections,
        config.min_connections
    );

    Ok(pool)
}

/// Run database migrations
pub async fn run_migrations(pool: &PgPool) -> Result<(), sqlx::Error> {
    tracing::info!("Running database migrations...");
    sqlx::migrate!("./migrations").run(pool).await?;
    tracing::info!("Migrations completed successfully");
    Ok(())
}
```

### 3. Domain Models (src/models/mod.rs)

```rust
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

/// User entity
#[derive(Debug, Clone, FromRow, Serialize)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub name: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub is_active: bool,
    pub metadata: Option<sqlx::types::Json<UserMetadata>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// User metadata stored as JSONB
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserMetadata {
    pub avatar_url: Option<String>,
    pub preferences: UserPreferences,
    pub last_login: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserPreferences {
    pub theme: String,
    pub notifications_enabled: bool,
    pub language: String,
}

impl Default for UserMetadata {
    fn default() -> Self {
        Self {
            avatar_url: None,
            preferences: UserPreferences {
                theme: "light".to_string(),
                notifications_enabled: true,
                language: "en".to_string(),
            },
            last_login: None,
        }
    }
}

/// Post entity with foreign key
#[derive(Debug, Clone, FromRow, Serialize)]
pub struct Post {
    pub id: Uuid,
    pub user_id: Uuid,
    pub title: String,
    pub content: String,
    pub published: bool,
    pub tags: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Post with author information (join result)
#[derive(Debug, Clone, FromRow, Serialize)]
pub struct PostWithAuthor {
    pub id: Uuid,
    pub title: String,
    pub content: String,
    pub published: bool,
    pub tags: Vec<String>,
    pub created_at: DateTime<Utc>,
    // Author fields (prefixed to avoid collision)
    pub author_id: Uuid,
    pub author_name: String,
    pub author_email: String,
}

/// Custom enum type mapped to PostgreSQL ENUM
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "post_status", rename_all = "lowercase")]
pub enum PostStatus {
    Draft,
    Published,
    Archived,
}
```

### 4. User Repository (src/repositories/user_repo.rs)

```rust
use chrono::Utc;
use sqlx::PgPool;
use uuid::Uuid;

use crate::error::{AppError, AppResult};
use crate::models::{User, UserMetadata};

/// User repository for database operations
pub struct UserRepository {
    pool: PgPool,
}

impl UserRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Find user by ID
    pub async fn find_by_id(&self, id: Uuid) -> AppResult<Option<User>> {
        // Compile-time verified query
        let user = sqlx::query_as!(
            User,
            r#"
            SELECT 
                id, email, name, password_hash, is_active,
                metadata as "metadata: sqlx::types::Json<UserMetadata>",
                created_at, updated_at
            FROM users
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(user)
    }

    /// Find user by email
    pub async fn find_by_email(&self, email: &str) -> AppResult<Option<User>> {
        let user = sqlx::query_as!(
            User,
            r#"
            SELECT 
                id, email, name, password_hash, is_active,
                metadata as "metadata: sqlx::types::Json<UserMetadata>",
                created_at, updated_at
            FROM users
            WHERE email = $1
            "#,
            email
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(user)
    }

    /// Create new user
    pub async fn create(
        &self,
        email: &str,
        name: &str,
        password_hash: &str,
    ) -> AppResult<User> {
        let id = Uuid::new_v4();
        let metadata = UserMetadata::default();

        let user = sqlx::query_as!(
            User,
            r#"
            INSERT INTO users (id, email, name, password_hash, is_active, metadata, created_at, updated_at)
            VALUES ($1, $2, $3, $4, true, $5, NOW(), NOW())
            RETURNING 
                id, email, name, password_hash, is_active,
                metadata as "metadata: sqlx::types::Json<UserMetadata>",
                created_at, updated_at
            "#,
            id,
            email,
            name,
            password_hash,
            sqlx::types::Json(&metadata) as _
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(user)
    }

    /// Update user
    pub async fn update(
        &self,
        id: Uuid,
        name: Option<&str>,
        email: Option<&str>,
    ) -> AppResult<User> {
        let user = sqlx::query_as!(
            User,
            r#"
            UPDATE users
            SET 
                name = COALESCE($2, name),
                email = COALESCE($3, email),
                updated_at = NOW()
            WHERE id = $1
            RETURNING 
                id, email, name, password_hash, is_active,
                metadata as "metadata: sqlx::types::Json<UserMetadata>",
                created_at, updated_at
            "#,
            id,
            name,
            email
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(user)
    }

    /// Update user metadata
    pub async fn update_metadata(&self, id: Uuid, metadata: &UserMetadata) -> AppResult<User> {
        let user = sqlx::query_as!(
            User,
            r#"
            UPDATE users
            SET 
                metadata = $2,
                updated_at = NOW()
            WHERE id = $1
            RETURNING 
                id, email, name, password_hash, is_active,
                metadata as "metadata: sqlx::types::Json<UserMetadata>",
                created_at, updated_at
            "#,
            id,
            sqlx::types::Json(metadata) as _
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(user)
    }

    /// Soft delete user
    pub async fn soft_delete(&self, id: Uuid) -> AppResult<bool> {
        let result = sqlx::query!(
            r#"
            UPDATE users
            SET is_active = false, updated_at = NOW()
            WHERE id = $1
            "#,
            id
        )
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    /// Hard delete user
    pub async fn hard_delete(&self, id: Uuid) -> AppResult<bool> {
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

    /// List users with pagination
    pub async fn list(&self, limit: i64, offset: i64) -> AppResult<(Vec<User>, i64)> {
        // Get total count
        let count = sqlx::query_scalar!(
            r#"
            SELECT COUNT(*) as "count!"
            FROM users
            WHERE is_active = true
            "#
        )
        .fetch_one(&self.pool)
        .await?;

        // Get paginated users
        let users = sqlx::query_as!(
            User,
            r#"
            SELECT 
                id, email, name, password_hash, is_active,
                metadata as "metadata: sqlx::types::Json<UserMetadata>",
                created_at, updated_at
            FROM users
            WHERE is_active = true
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
            "#,
            limit,
            offset
        )
        .fetch_all(&self.pool)
        .await?;

        Ok((users, count))
    }

    /// Search users by name or email
    pub async fn search(&self, query: &str, limit: i64) -> AppResult<Vec<User>> {
        let pattern = format!("%{query}%");

        let users = sqlx::query_as!(
            User,
            r#"
            SELECT 
                id, email, name, password_hash, is_active,
                metadata as "metadata: sqlx::types::Json<UserMetadata>",
                created_at, updated_at
            FROM users
            WHERE is_active = true
              AND (name ILIKE $1 OR email ILIKE $1)
            ORDER BY 
                CASE 
                    WHEN name ILIKE $2 THEN 0  -- Exact match first
                    ELSE 1
                END,
                name
            LIMIT $3
            "#,
            pattern,
            format!("{query}%"),
            limit
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(users)
    }
}
```

### 5. Post Repository with Joins (src/repositories/post_repo.rs)

```rust
use sqlx::PgPool;
use uuid::Uuid;

use crate::error::AppResult;
use crate::models::{Post, PostStatus, PostWithAuthor};

/// Post repository
pub struct PostRepository {
    pool: PgPool,
}

impl PostRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Create post
    pub async fn create(
        &self,
        user_id: Uuid,
        title: &str,
        content: &str,
        tags: &[String],
    ) -> AppResult<Post> {
        let id = Uuid::new_v4();

        let post = sqlx::query_as!(
            Post,
            r#"
            INSERT INTO posts (id, user_id, title, content, published, tags, created_at, updated_at)
            VALUES ($1, $2, $3, $4, false, $5, NOW(), NOW())
            RETURNING id, user_id, title, content, published, tags, created_at, updated_at
            "#,
            id,
            user_id,
            title,
            content,
            tags
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(post)
    }

    /// Find post with author (JOIN)
    pub async fn find_with_author(&self, id: Uuid) -> AppResult<Option<PostWithAuthor>> {
        let post = sqlx::query_as!(
            PostWithAuthor,
            r#"
            SELECT 
                p.id,
                p.title,
                p.content,
                p.published,
                p.tags,
                p.created_at,
                u.id as author_id,
                u.name as author_name,
                u.email as author_email
            FROM posts p
            INNER JOIN users u ON p.user_id = u.id
            WHERE p.id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(post)
    }

    /// List published posts with authors
    pub async fn list_published(&self, limit: i64, offset: i64) -> AppResult<Vec<PostWithAuthor>> {
        let posts = sqlx::query_as!(
            PostWithAuthor,
            r#"
            SELECT 
                p.id,
                p.title,
                p.content,
                p.published,
                p.tags,
                p.created_at,
                u.id as author_id,
                u.name as author_name,
                u.email as author_email
            FROM posts p
            INNER JOIN users u ON p.user_id = u.id
            WHERE p.published = true
            ORDER BY p.created_at DESC
            LIMIT $1 OFFSET $2
            "#,
            limit,
            offset
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(posts)
    }

    /// Find posts by tag
    pub async fn find_by_tag(&self, tag: &str, limit: i64) -> AppResult<Vec<Post>> {
        let posts = sqlx::query_as!(
            Post,
            r#"
            SELECT id, user_id, title, content, published, tags, created_at, updated_at
            FROM posts
            WHERE $1 = ANY(tags) AND published = true
            ORDER BY created_at DESC
            LIMIT $2
            "#,
            tag,
            limit
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(posts)
    }

    /// Publish post
    pub async fn publish(&self, id: Uuid) -> AppResult<Post> {
        let post = sqlx::query_as!(
            Post,
            r#"
            UPDATE posts
            SET published = true, updated_at = NOW()
            WHERE id = $1
            RETURNING id, user_id, title, content, published, tags, created_at, updated_at
            "#,
            id
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(post)
    }

    /// Bulk update tags using ANY
    pub async fn add_tag_to_posts(&self, post_ids: &[Uuid], tag: &str) -> AppResult<u64> {
        let result = sqlx::query!(
            r#"
            UPDATE posts
            SET tags = array_append(tags, $2), updated_at = NOW()
            WHERE id = ANY($1) AND NOT ($2 = ANY(tags))
            "#,
            post_ids,
            tag
        )
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected())
    }
}
```

### 6. Transaction Support (src/repositories/transaction.rs)

```rust
use sqlx::{PgPool, Postgres, Transaction};
use uuid::Uuid;

use crate::error::{AppError, AppResult};
use crate::models::User;

/// Execute operations within a transaction
pub async fn create_user_with_default_post(
    pool: &PgPool,
    email: &str,
    name: &str,
    password_hash: &str,
) -> AppResult<(User, Uuid)> {
    // Begin transaction
    let mut tx: Transaction<'_, Postgres> = pool.begin().await?;

    // Create user
    let user_id = Uuid::new_v4();
    let user = sqlx::query_as!(
        User,
        r#"
        INSERT INTO users (id, email, name, password_hash, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, true, NOW(), NOW())
        RETURNING 
            id, email, name, password_hash, is_active,
            metadata as "metadata: sqlx::types::Json<crate::models::UserMetadata>",
            created_at, updated_at
        "#,
        user_id,
        email,
        name,
        password_hash
    )
    .fetch_one(&mut *tx)
    .await?;

    // Create default welcome post
    let post_id = Uuid::new_v4();
    sqlx::query!(
        r#"
        INSERT INTO posts (id, user_id, title, content, published, tags, created_at, updated_at)
        VALUES ($1, $2, 'Welcome!', 'Welcome to the platform!', false, ARRAY['welcome'], NOW(), NOW())
        "#,
        post_id,
        user_id
    )
    .execute(&mut *tx)
    .await?;

    // Commit transaction
    tx.commit().await?;

    Ok((user, post_id))
}

/// Transaction with savepoints for partial rollback
pub async fn complex_operation(pool: &PgPool) -> AppResult<()> {
    let mut tx = pool.begin().await?;

    // First operation
    sqlx::query!("UPDATE users SET updated_at = NOW() WHERE is_active = true")
        .execute(&mut *tx)
        .await?;

    // Create savepoint
    let savepoint = tx.begin().await?;

    // Risky operation that might fail
    let result = sqlx::query!("UPDATE posts SET published = true WHERE created_at < NOW() - INTERVAL '30 days'")
        .execute(&mut *savepoint)
        .await;

    match result {
        Ok(_) => {
            // Commit savepoint (release)
            savepoint.commit().await?;
        }
        Err(e) => {
            // Rollback only the savepoint, keep earlier changes
            tracing::warn!("Risky operation failed, rolling back savepoint: {}", e);
            savepoint.rollback().await?;
        }
    }

    // Commit main transaction
    tx.commit().await?;

    Ok(())
}

/// Retry pattern for transient failures
pub async fn with_retry<T, F, Fut>(max_retries: u32, f: F) -> AppResult<T>
where
    F: Fn() -> Fut,
    Fut: std::future::Future<Output = AppResult<T>>,
{
    let mut attempts = 0;

    loop {
        match f().await {
            Ok(result) => return Ok(result),
            Err(e) => {
                attempts += 1;
                if attempts >= max_retries {
                    return Err(e);
                }

                // Check if error is retryable (connection issues, deadlocks)
                if is_retryable_error(&e) {
                    tracing::warn!("Retryable error, attempt {}/{}: {}", attempts, max_retries, e);
                    tokio::time::sleep(std::time::Duration::from_millis(100 * attempts as u64)).await;
                } else {
                    return Err(e);
                }
            }
        }
    }
}

fn is_retryable_error(error: &AppError) -> bool {
    // Check for connection errors, deadlocks, serialization failures
    matches!(error, AppError::Database(_))
}
```

### 7. Database Migrations

**migrations/20250113_001_create_users.sql**:
```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- GIN index for JSONB queries
CREATE INDEX idx_users_metadata ON users USING GIN (metadata);
```

**migrations/20250113_002_create_posts.sql**:
```sql
-- Create post status enum
CREATE TYPE post_status AS ENUM ('draft', 'published', 'archived');

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    published BOOLEAN NOT NULL DEFAULT false,
    tags TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_published ON posts(published);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- GIN index for array search
CREATE INDEX idx_posts_tags ON posts USING GIN (tags);

-- Full-text search index
CREATE INDEX idx_posts_search ON posts USING GIN (
    to_tsvector('english', title || ' ' || content)
);
```

**migrations/20250113_003_add_updated_at_trigger.sql**:
```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 8. Full-Text Search (src/repositories/search.rs)

```rust
use sqlx::PgPool;
use uuid::Uuid;

use crate::error::AppResult;
use crate::models::Post;

/// Search repository for full-text search
pub struct SearchRepository {
    pool: PgPool,
}

impl SearchRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Full-text search on posts
    pub async fn search_posts(&self, query: &str, limit: i64) -> AppResult<Vec<PostSearchResult>> {
        let results = sqlx::query_as!(
            PostSearchResult,
            r#"
            SELECT 
                p.id,
                p.title,
                p.content,
                p.tags,
                p.created_at,
                ts_rank(
                    to_tsvector('english', p.title || ' ' || p.content),
                    plainto_tsquery('english', $1)
                ) as "rank!",
                ts_headline(
                    'english',
                    p.content,
                    plainto_tsquery('english', $1),
                    'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=20'
                ) as "snippet!"
            FROM posts p
            WHERE 
                p.published = true
                AND to_tsvector('english', p.title || ' ' || p.content) @@ plainto_tsquery('english', $1)
            ORDER BY rank DESC
            LIMIT $2
            "#,
            query,
            limit
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(results)
    }

    /// Search with phrase matching
    pub async fn search_phrase(&self, phrase: &str, limit: i64) -> AppResult<Vec<Post>> {
        let posts = sqlx::query_as!(
            Post,
            r#"
            SELECT id, user_id, title, content, published, tags, created_at, updated_at
            FROM posts
            WHERE 
                published = true
                AND to_tsvector('english', title || ' ' || content) @@ phraseto_tsquery('english', $1)
            ORDER BY created_at DESC
            LIMIT $2
            "#,
            phrase,
            limit
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(posts)
    }
}

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
pub struct PostSearchResult {
    pub id: Uuid,
    pub title: String,
    pub content: String,
    pub tags: Vec<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub rank: f32,
    pub snippet: String,
}
```

### 9. Error Handling (src/error.rs)

```rust
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Conflict: {0}")]
    Conflict(String),

    #[error("Validation error: {0}")]
    Validation(String),
}

pub type AppResult<T> = Result<T, AppError>;

impl AppError {
    pub fn not_found(msg: impl Into<String>) -> Self {
        Self::NotFound(msg.into())
    }

    pub fn conflict(msg: impl Into<String>) -> Self {
        Self::Conflict(msg.into())
    }
}
```

### 10. Usage Example (src/main.rs)

```rust
use sqlx::PgPool;

mod db;
mod error;
mod models;
mod repositories;

use db::config::{create_pool, run_migrations, DatabaseConfig};
use repositories::{user_repo::UserRepository, post_repo::PostRepository};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Load config
    let config = DatabaseConfig {
        url: std::env::var("DATABASE_URL")
            .unwrap_or_else(|_| "postgres://user:password@localhost/mydb".to_string()),
        ..Default::default()
    };

    // Create pool and run migrations
    let pool = create_pool(&config).await?;
    run_migrations(&pool).await?;

    // Create repositories
    let user_repo = UserRepository::new(pool.clone());
    let post_repo = PostRepository::new(pool.clone());

    // Example operations
    let user = user_repo
        .create("user@example.com", "Test User", "hashed_password")
        .await?;
    tracing::info!("Created user: {:?}", user);

    let post = post_repo
        .create(user.id, "My First Post", "Hello, World!", &["rust".to_string(), "sqlx".to_string()])
        .await?;
    tracing::info!("Created post: {:?}", post);

    let post_with_author = post_repo.find_with_author(post.id).await?;
    tracing::info!("Post with author: {:?}", post_with_author);

    Ok(())
}
```

## Key Takeaways

1. **Compile-Time Verification**: SQLx validates SQL at compile time against database schema
2. **Type-Safe Queries**: `query_as!` macro maps results to Rust structs with type checking
3. **JSONB Support**: Native support for JSON columns with serde integration
4. **Array Types**: PostgreSQL arrays map directly to Rust Vec<T>
5. **Connection Pooling**: Built-in async connection pool with configurable limits
6. **Migration System**: SQL migrations with version tracking
7. **Transaction Support**: Full transaction and savepoint support
8. **Full-Text Search**: Native PostgreSQL FTS with ranking and highlighting

This database layer provides type-safe, performant database access for production Rust applications.
