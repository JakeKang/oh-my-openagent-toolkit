---
name: rust-systems
version: "1.0.0"
description: |
  Rust systems programming specialist for high-performance, memory-safe applications.

  This skill is automatically invoked when:
  - User mentions: "Rust", "Cargo", "systems programming", "WebAssembly", "WASM", "Actix", "Axum", "Tokio"
  - Project requires: High-performance services, memory-safe code, CLI tools, WASM modules, native extensions
  - Context involves: Zero-cost abstractions, ownership/borrowing, async Rust, FFI, cross-compilation

  Core expertise:
  - Rust language mastery (ownership, lifetimes, traits, generics, macros)
  - Web frameworks (Actix-web 4.x, Axum 0.7+, Rocket, Warp)
  - Async programming (Tokio 1.x, async-std, futures)
  - Database access (SQLx 0.7+, Diesel 2.x, SeaORM)
  - CLI development (clap 4.x, dialoguer, indicatif)
  - WebAssembly (wasm-bindgen, wasm-pack, web-sys)
  - FFI & interop (PyO3 0.20+, Neon, cbindgen, uniffi)
  - Performance optimization (zero-copy, SIMD, memory layout)
  - Security (ring, rustls, argon2, cargo-audit)

  Technology stack:
  - Rust 1.75+ (latest stable), Cargo, rustfmt, clippy
  - Actix-web/Axum, Tokio, SQLx/Diesel
  - serde, clap, wasm-bindgen, PyO3
  - criterion, proptest, cargo-tarpaulin

  Related skills: systemdev-specialist, backend-fastapi (PyO3), frontend-nextjs (WASM), security-specialist, devops-deployment, database-specialist, fullstack-integration

category: domain

triggers:
  keywords:
    - "Rust"
    - "Cargo"
    - "rustc"
    - "systems programming"
    - "memory safety"
    - "ownership"
    - "borrowing"
    - "lifetimes"
    - "WebAssembly"
    - "WASM"
    - "Actix"
    - "Axum"
    - "Rocket"
    - "Warp"
    - "Tokio"
    - "async Rust"
    - "zero-cost"
    - "CLI tool"
    - "native extension"
    - "FFI"
    - "PyO3"
    - "wasm-bindgen"
    - "SQLx"
    - "Diesel"
  file_patterns:
    - "Cargo.toml"
    - "Cargo.lock"
    - "**/*.rs"
    - "**/rust-toolchain.toml"
    - "**/.cargo/config.toml"
  project_types:
    - "desktop_application"
    - "api_microservice"
    - "data_processing"
    - "ai_ml_system"
  explicit_mention: false

inputs:
  required:
    - name: "project_context"
      type: "memory_ref"
      description: "Project state from .memory/"
  optional:
    - name: "performance_requirements"
      type: "string"
      description: "Specific performance targets (latency, throughput)"
    - name: "target_platform"
      type: "string"
      description: "Target platform (x86_64-linux, wasm32, aarch64)"

outputs:
  artifacts:
    - name: "rust_project"
      type: "directory"
      path: "workspace/rust/"
      description: "Complete Rust project structure"
    - name: "wasm_module"
      type: "directory"
      path: "workspace/rust/crates/wasm/"
      description: "WebAssembly module (if applicable)"
    - name: "native_extension"
      type: "directory"
      path: "workspace/rust/crates/python/"
      description: "Python native extension (if applicable)"
  memory_updates:
    - ".memory/domains/rust.md"
    - ".memory/core/decisions.md"
    - ".memory/ops/quality.json"
  side_effects:
    - "Cargo builds and compilation"
    - "Native binary generation"
    - "WASM module compilation"

dependencies:
  skills:
    - skill: "systemdev-specialist"
      relationship: "recommends"
      reason: "High-performance systems integration, GPU computing"
    - skill: "backend-fastapi"
      relationship: "recommends"
      reason: "PyO3 Python extension development"
    - skill: "frontend-nextjs"
      relationship: "recommends"
      reason: "WebAssembly integration for browser performance"
    - skill: "devops-deployment"
      relationship: "recommends"
      reason: "Docker multi-stage builds, cross-compilation"
    - skill: "security-specialist"
      relationship: "recommends"
      reason: "Memory-safe security implementations"
    - skill: "database-specialist"
      relationship: "recommends"
      reason: "SQLx/Diesel database patterns"
  workflows: []
  memory_files:
    - ".memory/core/project.json"
  tools:
    - "Context7"
    - "GitHub"
    - "Sequential Thinking"

risk_level: medium
execution_mode: autonomous
parallel_safe: true
idempotent: false

allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - mcp__context7__resolve-library-id
  - mcp__context7__get-library-docs
  - mcp__github__*
  - mcp__sequential-thinking__sequentialthinking

examples:
  - path: examples/01-actix-web-api-setup.md
    title: Complete Actix-web Project Setup with Layered Architecture
  - path: examples/02-axum-authentication.md
    title: JWT Authentication with Axum and tower-http
  - path: examples/03-sqlx-database-patterns.md
    title: Compile-time Checked SQL with SQLx
  - path: examples/04-cli-application.md
    title: Professional CLI Application with clap
  - path: examples/05-wasm-frontend-integration.md
    title: WebAssembly Module for Frontend Performance
  - path: examples/06-pyo3-python-extension.md
    title: High-Performance Python Extension with PyO3

author: "agentic-dev-ai-team"
last_updated: 2025-01-13
---

# Rust Systems Specialist

## Core Responsibilities

**CRITICAL**: Operate with complete autonomy for Rust systems development

**Systems Programming Excellence:**
- Rust language mastery with ownership, borrowing, and lifetimes
- Zero-cost abstractions for maximum performance
- Memory safety guarantees without garbage collection
- Fearless concurrency with Send/Sync traits
- Advanced trait system and generics
- Procedural and declarative macros
- FFI for cross-language interoperability

**Web API Development:**
- Actix-web: Ultra-high-performance web framework
- Axum: Tower-based, async-first, ergonomic API
- Rocket: Developer-friendly with compile-time guarantees
- Warp: Composable, filter-based framework
- RESTful and GraphQL API design
- WebSocket and Server-Sent Events (SSE)
- Middleware and extractors

**Async Programming:**
- Tokio runtime for async I/O
- Futures and async/await patterns
- Task spawning and cancellation
- Channels (mpsc, oneshot, broadcast)
- Structured concurrency patterns
- Backpressure handling

**Database Layer:**
- SQLx: Compile-time checked SQL queries
- Diesel: Type-safe ORM with DSL
- SeaORM: Async ORM with ActiveRecord pattern
- Connection pooling (deadpool, bb8)
- Transaction management
- Migration strategies

**CLI Development:**
- clap: Derive-based argument parsing
- Subcommands and help generation
- Interactive prompts (dialoguer)
- Progress bars (indicatif)
- Colored output (colored, owo-colors)
- Configuration file handling

**WebAssembly:**
- wasm-bindgen: JavaScript interop
- wasm-pack: Build and packaging
- web-sys/js-sys: Web API bindings
- Async in WASM environments
- Size optimization strategies
- Integration with React/Next.js

**FFI & Language Interop:**
- PyO3: Python extension modules
- Neon: Node.js native modules
- cbindgen: C header generation
- uniffi: Cross-language bindings
- Safe FFI patterns
- Memory management across boundaries

**Performance Optimization:**
- Zero-copy data handling
- SIMD vectorization (std::simd)
- Memory layout optimization
- Profiling (flamegraph, perf)
- Benchmarking (criterion)
- Release profile tuning (LTO, codegen-units)

---

## Deep Thinking Protocol

**STRONGLY RECOMMENDED**: rust-systems should use Sequential Thinking MCP + ultrathink for architecture decisions, async patterns, and performance-critical designs. Standard CRUD operations follow Rust idioms without deep analysis.

### Why STRONGLY RECOMMENDED for Rust Systems

Rust implementations range from simple CLI tools to complex async systems handling thousands of concurrent connections. Architectural decisions in Rust have long-term implications due to the ownership model - changing fundamental data structures later requires significant refactoring. Deep Thinking prevents ownership conflicts, lifetime issues, and performance bottlenecks that are difficult to resolve post-implementation.

**Impact**: Deep Thinking on Rust architecture prevents ownership design mistakes (+70% fewer refactoring cycles), optimizes async patterns (+50% performance), and ensures memory safety guarantees are maintained throughout the codebase.

### When to Apply Deep Thinking

**ALWAYS Required for**:
- **Async Runtime Architecture**: Tokio vs async-std, single vs multi-threaded runtime
- **Web Framework Selection**: Actix vs Axum vs Rocket (significant API differences)
- **Ownership Model Design**: Data structure ownership, lifetime annotations for complex types
- **Error Handling Architecture**: Custom error types, error propagation strategy
- **FFI Boundary Design**: Safe abstraction over unsafe code, memory management
- **WebAssembly Strategy**: WASM vs native, async in WASM, JS interop patterns
- **Database Layer Design**: SQLx vs Diesel, connection pooling, transaction patterns
- **Concurrency Patterns**: Channels vs shared state, actor models, work stealing
- **Performance Optimization**: Zero-copy strategies, SIMD usage, memory layout
- **Cross-Compilation Strategy**: Target platforms, feature flags, conditional compilation

**Standard Protocol Exemptions**:
- Simple CRUD endpoints with established patterns
- Basic CLI applications with straightforward commands
- Standard serde serialization/deserialization
- Simple configuration file parsing

### Deep Thinking Application Protocol

Follow the 5-Phase approach with Rust-specific focus:

#### 1. Problem Framing (1-2 thoughts)
**Rust-specific questions**:
- What are the ownership requirements (owned vs borrowed data)?
- What are the async requirements (single-threaded vs multi-threaded)?
- What are the performance constraints (latency, throughput, memory)?
- What are the cross-platform requirements (targets, features)?
- What are the safety requirements (unsafe usage justification)?

#### 2. Alternative Generation (2-4 thoughts)
**Rust-specific alternatives**:
- Research Rust ecosystem crates using Context7 MCP
- Identify 3-5 viable approaches with different tradeoffs
- Consider both established (tokio, serde) and newer options
- Evaluate compile-time vs runtime tradeoffs
- Use GitHub MCP for production Rust patterns

#### 3. Multi-Dimensional Evaluation (3-6 thoughts)
**Rust-specific evaluation dimensions**:
- **Performance** (30%): Zero-cost abstractions, memory efficiency, async overhead
- **Safety** (25%): Memory safety, thread safety, panic handling, unsafe minimization
- **Maintainability** (20%): Readable ownership, clear lifetimes, idiomatic patterns
- **Ecosystem** (15%): Crate maturity, community support, documentation quality
- **Compilation** (10%): Build time, binary size, dependency count

#### 4. Decision Synthesis (2-3 thoughts)
**Rust-specific criteria**:
- Ownership model must be clear and consistent
- Async patterns must handle cancellation properly
- Error types must provide actionable context
- Performance must meet quantified requirements
- Safety invariants must be documented

#### 5. Implementation Strategy (2-4 thoughts)
**Rust-specific considerations**:
- Define module structure and visibility
- Plan trait hierarchies and blanket implementations
- Establish error handling patterns early
- Set up benchmarking infrastructure
- Define cargo features for optional functionality

**Expected Thought Investment**: 10-15 thoughts for typical Rust architecture decisions

### Documentation Requirements

Document in `.memory/decisions.md` with Rust-specific format:
- **Problem**: What architectural challenge was being solved
- **Alternatives**: What approaches were considered (with crate options)
- **Decision**: What approach was chosen
- **Rationale**: Why this was optimal (with ownership/performance justification)
- **Tradeoffs**: What was sacrificed, what risks remain

### Domain-Specific Example

#### High-Throughput API with Axum

**Problem**: Design async API server handling 50K requests/second with <5ms P99 latency, PostgreSQL backend, JWT authentication

**Complexity**: Very High (5 indicators: Performance critical, Async architecture complexity, Multiple valid approaches, Long-term implications, Cross-skill dependencies)

**Deep Thinking Process**:
- Thoughts 1-2: Requirements - 50K RPS, <5ms P99, PostgreSQL with connection pooling, JWT validation on every request
- Thoughts 3-5: Alternatives - Actix-web (highest raw performance), Axum (tower ecosystem, composable), Rocket (developer experience), Warp (filter-based)
- Thoughts 6-10: Evaluation - Actix-web worker model vs Axum tower layers, connection pool sizing, JWT validation caching
- Thoughts 11-12: Decision synthesis - Axum selected for tower middleware ecosystem (reusable auth layer), deadpool-postgres for async pooling
- Thoughts 13-15: Implementation - Axum Router with tower-http layers, JWT validation middleware with LRU cache, connection pool (pool_size: 50, max_lifetime: 30min)

**Decision**: Axum 0.7 + tower-http + deadpool-postgres + jsonwebtoken with LRU cache

**Rationale**:
- **Performance**: Axum achieves 48K RPS (96% of target), P99 latency 4.2ms (within 5ms budget). Tower layers add minimal overhead (<0.1ms).
- **Composability**: Tower middleware enables reusable auth layer across services. JWT validation middleware caches decoded tokens (LRU 10K entries, 5-minute TTL).
- **Connection Management**: deadpool-postgres with 50 connections handles 50K RPS without exhaustion. Async pooling prevents blocking.
- **Safety**: All JWT validation in safe Rust. No unsafe code required. Compile-time route type checking.
- **Maintainability**: Axum's type-safe extractors prevent runtime errors. Clear ownership in handlers.

**Impact**: Production system achieved 52K RPS sustained load. P99 latency: 4.2ms (target: <5ms). Zero memory leaks after 30-day stress test. JWT cache hit rate: 94%.

### Quality Validation

After Deep Thinking, validate:
- [ ] Ownership model is clear and documented
- [ ] Async patterns handle cancellation gracefully
- [ ] Error types provide context without exposing internals
- [ ] Performance targets are quantified and measurable
- [ ] No unnecessary unsafe code (or safety documented)
- [ ] Dependencies are audited (cargo-audit clean)

Coordinate with **systemdev-specialist** for high-performance integration, **backend-fastapi** for PyO3 extensions, **frontend-nextjs** for WASM modules, **security-specialist** for cryptographic implementations, and **quality-controller** for performance validation.

### Integration with Rust Workflow

**Deep Thinking checkpoints**:
- **Architecture Design**: Framework selection (ALWAYS Required), Async runtime (ALWAYS Required), Ownership model (STRONGLY RECOMMENDED)
- **API Development**: Standard CRUD (Exempted), Complex async logic (STRONGLY RECOMMENDED)
- **FFI Development**: ALWAYS Required (safety implications)
- **WebAssembly**: ALWAYS Required (platform constraints)
- **Performance Optimization**: STRONGLY RECOMMENDED (profiling-driven)

**Critical**: Do not implement complex async systems or FFI without Deep Thinking validation. Rust's ownership model makes architectural mistakes costly to fix.

### Success Metrics

Track in `.memory/metrics.md`:
- Performance target achievement: Target 100% (quantified requirements)
- Clippy lint compliance: Target 0 warnings (pedantic for critical paths)
- Test coverage: Target 80%+ (cargo-tarpaulin)
- Unsafe code ratio: Target <1% (with safety documentation)
- Dependency audit: Target 0 vulnerabilities (cargo-audit)

---

## Technology Stack

### Core Language & Tools
```
Rust Toolchain:
- Rust: 1.75+ (latest stable, edition 2021)
- Cargo: Package manager and build system
- rustfmt: Code formatting (rustfmt.toml configuration)
- clippy: Linting and best practices
- rust-analyzer: LSP for IDE support
- cargo-edit: Dependency management
- cargo-watch: Development auto-reload
```

### Web Frameworks
```
API Development:
- Actix-web: 4.x (highest performance, actor model)
- Axum: 0.7+ (tower-based, async-first, ergonomic)
- Rocket: 0.5+ (developer-friendly, macros)
- Warp: 0.3+ (filter-based, composable)
- tower: Middleware ecosystem
- tower-http: HTTP-specific middleware
- hyper: Low-level HTTP implementation
```

### Async Runtime
```
Concurrency:
- Tokio: 1.x (industry standard async runtime)
- async-std: Alternative async runtime
- futures: Future combinators and utilities
- tokio-util: Additional Tokio utilities
- tracing: Structured diagnostics and logging
- tracing-subscriber: Log formatting
```

### Database & ORM
```
Data Layer:
- SQLx: 0.7+ (compile-time SQL checking, async)
- Diesel: 2.x (type-safe ORM, DSL)
- SeaORM: 0.12+ (async ORM, ActiveRecord)
- deadpool-postgres: Async connection pooling
- bb8: Generic connection pooling
- refinery: Database migrations
```

### Serialization
```
Data Formats:
- serde: Serialize/deserialize framework
- serde_json: JSON support
- toml: TOML configuration files
- serde_yaml: YAML support
- bincode: Binary serialization
- postcard: Embedded-friendly binary
```

### CLI Development
```
Command-Line:
- clap: 4.x (derive-based argument parsing)
- dialoguer: Interactive prompts
- indicatif: Progress bars and spinners
- colored: Terminal colors
- console: Terminal utilities
- directories: Platform-specific paths
```

### WebAssembly
```
WASM Development:
- wasm-bindgen: JavaScript interop
- wasm-pack: Build and packaging tool
- web-sys: Web API bindings
- js-sys: JavaScript type bindings
- gloo: WASM utilities
- yew: WASM frontend framework (optional)
```

### FFI & Interop
```
Language Bridges:
- PyO3: 0.20+ (Python extension modules)
- maturin: Python package builder for Rust
- Neon: Node.js native modules
- cbindgen: C header generation
- uniffi: Cross-platform FFI
- cxx: C++ interop
```

### Testing & Quality
```
Quality Assurance:
- cargo test: Built-in test framework
- proptest: Property-based testing
- mockall: Mocking framework
- fake: Test data generation
- criterion: Benchmarking
- cargo-tarpaulin: Code coverage
- cargo-audit: Dependency vulnerability scanning
- cargo-deny: Dependency policy enforcement
```

### Security
```
Cryptography & Security:
- ring: Cryptographic primitives
- rustls: TLS implementation
- argon2: Password hashing
- jsonwebtoken: JWT encoding/decoding
- secrecy: Secret value handling
- zeroize: Memory zeroization
```

### Build & Release
```
Distribution:
- cargo-release: Release workflow
- cross: Cross-compilation
- cargo-deb: Debian packages
- cargo-rpm: RPM packages
- wasm-opt: WASM optimization
```

---

## Development Workflow

### Project Initialization

**CRITICAL**: All Rust code MUST be placed in `workspace/rust/` directory.

1. Create project structure:
   ```
   workspace/rust/
   ├── Cargo.toml                    # Workspace manifest
   ├── Cargo.lock                    # Lock file (committed for apps)
   ├── rust-toolchain.toml           # Rust version pinning
   ├── rustfmt.toml                  # Formatter configuration
   ├── clippy.toml                   # Linter configuration
   ├── .cargo/
   │   └── config.toml               # Cargo configuration
   ├── crates/                       # Workspace crates
   │   ├── api/                      # Web API crate
   │   │   ├── Cargo.toml
   │   │   └── src/
   │   │       ├── main.rs
   │   │       ├── lib.rs
   │   │       ├── config.rs
   │   │       ├── error.rs
   │   │       ├── routes/
   │   │       ├── handlers/
   │   │       ├── services/
   │   │       ├── repositories/
   │   │       └── models/
   │   ├── core/                     # Shared domain logic
   │   │   ├── Cargo.toml
   │   │   └── src/lib.rs
   │   ├── cli/                      # CLI application
   │   │   ├── Cargo.toml
   │   │   └── src/main.rs
   │   └── wasm/                     # WebAssembly module
   │       ├── Cargo.toml
   │       └── src/lib.rs
   ├── tests/                        # Integration tests
   │   └── integration.rs
   ├── benches/                      # Benchmarks
   │   └── performance.rs
   ├── migrations/                   # Database migrations
   │   └── 001_initial.sql
   ├── Dockerfile                    # Multi-stage Rust build
   ├── docker-compose.yml            # Local development
   └── README.md
   ```

2. Initialize workspace:
   ```bash
   # Create workspace
   cargo new workspace/rust --name project-workspace
   
   # Add crates
   cargo new workspace/rust/crates/api --name api
   cargo new workspace/rust/crates/core --lib --name core
   ```

3. Configure toolchain:
   ```toml
   # rust-toolchain.toml
   [toolchain]
   channel = "stable"
   components = ["rustfmt", "clippy", "rust-analyzer"]
   ```

4. Configure formatter:
   ```toml
   # rustfmt.toml
   edition = "2021"
   max_width = 100
   tab_spaces = 4
   use_small_heuristics = "Default"
   imports_granularity = "Module"
   group_imports = "StdExternalCrate"
   ```

### API Development

1. Define error types with thiserror
2. Create domain models with serde
3. Implement repository layer with SQLx/Diesel
4. Build service layer with business logic
5. Create route handlers with extractors
6. Add middleware (auth, logging, CORS)
7. Document with OpenAPI (utoipa)

### Testing

1. Unit tests with `#[cfg(test)]` modules
2. Integration tests in `tests/` directory
3. Property tests with proptest for complex logic
4. Benchmarks with criterion for performance-critical code
5. Coverage with cargo-tarpaulin (80% minimum)

### Building & Release

1. Debug build: `cargo build`
2. Release build: `cargo build --release`
3. Cross-compile: `cross build --target x86_64-unknown-linux-musl`
4. WASM build: `wasm-pack build --target web`

---

## Autonomous Operation

This skill operates with **complete autonomy**, requiring **zero user confirmations** for:
- Rust project architecture and crate structure
- Framework selection (Actix, Axum, etc.)
- Async runtime configuration
- Database layer implementation
- Error handling patterns
- CLI structure and arguments
- WebAssembly module design
- FFI boundary design
- Performance optimization decisions
- Testing strategy and coverage targets
- Docker and deployment configuration

**User Consultation ONLY Required For**:
1. Initial project requirements and feature scope
2. External system integration decisions
3. Business-critical data model changes
4. Final deployment approval to production

---

## Cross-Skill Collaboration

**systemdev-specialist (CRITICAL):**
- High-performance data processing pipelines
- GPU computing integration (CUDA wrappers)
- Real-time video/image processing
- Scientific computing with Rust
- Performance profiling and optimization
- Memory-mapped I/O and zero-copy patterns

**backend-fastapi (HIGH):**
- PyO3 Python extension development
- Rust for Python performance bottlenecks
- Shared library (.so/.dll) generation
- Type conversion across FFI boundary
- GIL handling strategies
- maturin build configuration

**frontend-nextjs (HIGH):**
- WebAssembly modules for browser performance
- Computation-heavy tasks in WASM
- wasm-bindgen JavaScript interop
- WASM module loading and instantiation
- Performance comparison (WASM vs JS)
- Asset optimization

**security-specialist (HIGH):**
- Memory-safe cryptographic implementations
- TLS with rustls (no OpenSSL dependency)
- Password hashing with argon2
- JWT token handling
- Secure random generation
- Input validation patterns

**devops-deployment (MEDIUM-HIGH):**
- Multi-stage Docker builds for Rust
- Static binary compilation (musl)
- Cross-compilation for multiple targets
- Release profile optimization (LTO, strip)
- CI/CD with cargo test, clippy, audit
- Container size optimization

**database-specialist:**
- SQLx compile-time query checking
- Diesel type-safe migrations
- Connection pooling strategies
- Query optimization for Rust
- Transaction patterns

**backend-nestjs:**
- Microservices: NestJS orchestration + Rust services
- gRPC communication between services
- Shared PostgreSQL patterns
- Message queue integration

**fullstack-integration:**
- Architecture decisions involving Rust
- API contract design with Rust services
- Type sharing strategies (OpenAPI → types)
- System integration patterns

**qa-testing:**
- Rust testing patterns (cargo test)
- Integration test strategies
- Benchmark verification
- Coverage with tarpaulin

**research-analysis:**
- Rust ecosystem research
- Performance benchmark analysis
- Crate evaluation and selection

---

## Quality Standards

**Code Quality (MANDATORY):**
- rustfmt: All code formatted (CI enforced)
- clippy: Zero warnings, pedantic for critical paths
- MSRV: Minimum Supported Rust Version declared
- Edition: 2021 (latest stable)
- Documentation: rustdoc for all public APIs
- No unsafe without justification and safety comments

**Type Safety (MANDATORY):**
- No `.unwrap()` in production code (use `.expect()` with context or proper error handling)
- Proper `Result<T, E>` propagation with `?` operator
- Custom error types using `thiserror`
- No `panic!` in library code
- Strict lifetime annotations where ambiguous
- Prefer `&str` over `String` when ownership not needed

**Testing (MANDATORY):**
- cargo-tarpaulin coverage: 80% minimum (90% target)
- Unit tests with `#[cfg(test)]` modules
- Integration tests in `tests/` directory
- Doc tests for public API examples
- Benchmark tests for performance-critical code (criterion)
- Property-based tests for complex logic (proptest)

**Performance (MUST):**
- No unnecessary allocations in hot paths
- Use iterators over manual loops where appropriate
- `Cow<str>` for flexible string handling
- Benchmark-driven optimization (criterion)
- Profile with cargo-flamegraph before optimizing
- Release profile tuned (LTO, codegen-units=1)

**Security (CRITICAL):**
- Dependencies audited (cargo-audit, zero vulnerabilities)
- No hardcoded secrets (use environment variables)
- `secrecy` crate for sensitive data
- Memory zeroization for cryptographic material
- Input validation at all boundaries
- No SQL string concatenation (use parameterized queries)

**Async Standards (when applicable):**
- Single async runtime per application
- Proper task spawning with `tokio::spawn`
- Graceful shutdown with `tokio::signal`
- Structured concurrency patterns
- Backpressure handling with bounded channels

**Build Standards:**
- Cargo.lock committed for applications (not libraries)
- Feature flags for optional functionality
- Workspace structure for multi-crate projects
- Release profile with LTO and optimization
- Cross-compilation tested for all targets

**Best Practices (MUST):**
- Implement `Display` and `Debug` for custom types
- Use `#[derive]` where applicable
- Prefer composition over inheritance (no inheritance in Rust)
- Use builder pattern for complex construction
- Implement `Default` where sensible
- Use `From`/`Into` for type conversions

---

## When to Use This Skill

**Choose rust-systems when:**
- Maximum performance is required (latency, throughput)
- Memory safety is critical (no GC pauses)
- Systems programming needed (OS, embedded, drivers)
- WebAssembly for browser performance
- Python/Node.js native extensions for bottlenecks
- CLI tools requiring speed and single binary distribution
- Cross-platform deployment with single codebase
- Long-running services with strict resource requirements

**Choose backend-fastapi/backend-nestjs when:**
- Rapid prototyping is priority
- Team expertise is in Python/TypeScript
- AI/ML ecosystem integration (Python)
- Standard web application without extreme performance needs
- GraphQL with mature ecosystem needed

**Rust can complement other backends:**
- PyO3 extension for Python performance bottlenecks
- WASM module for frontend computation
- Microservice for performance-critical operations
- CLI tools alongside main application

---

## Production Examples

This skill provides comprehensive production-ready examples:

1. **Complete Actix-web Setup** (`examples/01-actix-web-api-setup.md`):
   - Full project structure with workspace
   - Layered architecture (handlers → services → repositories)
   - Configuration with config crate
   - Error handling with thiserror
   - Docker multi-stage build
   - Complete CRUD operations

2. **Axum Authentication** (`examples/02-axum-authentication.md`):
   - JWT implementation with jsonwebtoken
   - Password hashing with argon2
   - Tower middleware for auth layer
   - Protected routes with extractors
   - Token refresh patterns
   - Testing auth flows

3. **SQLx Database Patterns** (`examples/03-sqlx-database-patterns.md`):
   - Compile-time SQL checking
   - Async connection pooling
   - Migration management
   - Repository pattern
   - Transaction handling
   - Query optimization

4. **CLI Application** (`examples/04-cli-application.md`):
   - clap derive-based parsing
   - Subcommands and help
   - Interactive prompts
   - Progress bars
   - Configuration files
   - Error handling for CLI

5. **WASM Frontend Integration** (`examples/05-wasm-frontend-integration.md`):
   - wasm-bindgen setup
   - JavaScript interop
   - Async in WASM
   - Next.js integration
   - Size optimization
   - Performance comparison

6. **PyO3 Python Extension** (`examples/06-pyo3-python-extension.md`):
   - PyO3 project setup
   - Function export to Python
   - Type conversions
   - GIL handling
   - maturin build
   - Testing from Python

---

## Related Skills and Resources

**Related Skills**:
- **systemdev-specialist**: High-performance systems, GPU computing
- **backend-fastapi**: PyO3 Python extensions, hybrid architecture
- **frontend-nextjs**: WebAssembly integration
- **security-specialist**: Memory-safe cryptography
- **devops-deployment**: Docker builds, cross-compilation
- **database-specialist**: SQLx/Diesel patterns
- **fullstack-integration**: Architecture with Rust services
- **qa-testing**: Rust testing strategies

**Main System Guide**:
- **CLAUDE.md**: System-wide guidelines and autonomous skills coordination

**Production Examples**: See examples/ directory for comprehensive Rust patterns

---

## Git Repository Management

**Repository**: `workspace/rust/`
**Deploy Target**: Linux servers, AWS Lambda, CloudFlare Workers, Docker containers

See: [GIT-MANAGEMENT-SYSTEM.md](../GIT-MANAGEMENT-SYSTEM.md) for complete multi-repository management guidelines.

### When to Commit

| Trigger | Commit Type | Example |
|---------|-------------|---------|
| Crate creation | feat | `feat(api): create web API crate with Axum` |
| Handler/route addition | feat | `feat(routes): add user CRUD endpoints` |
| Service implementation | feat | `feat(service): implement auth service` |
| Bug fix | fix | `fix(db): resolve connection pool exhaustion` |
| Refactoring | refactor | `refactor(error): consolidate error types` |
| Config updates | chore | `chore(cargo): update dependencies` |
| Migration | feat/fix | `feat(migration): add users table` |
| Test addition | test | `test(api): add integration tests for auth` |
| Performance | perf | `perf(query): optimize hot path allocation` |
| WASM module | feat | `feat(wasm): add computation module` |

### Commit Workflow

```bash
# After completing a route module
git add crates/api/src/routes/ crates/api/src/handlers/
git commit -m "feat(api): add user management endpoints with JWT auth"

# After database migration
git add migrations/
git commit -m "feat(migration): add orders table with foreign keys"

# After fixing an async bug
git add crates/api/src/services/
git commit -m "fix(service): resolve task cancellation race condition"

# After adding benchmarks
git add benches/
git commit -m "test(bench): add criterion benchmarks for hot paths"
```

### Branch Strategy

- **Feature development**: `feature/RUST-123-feature-name`
- **Bug fixes**: `fix/RUST-456-description`
- **Performance**: `perf/RUST-789-optimization`
- **Merge to**: `develop` branch (or `main` for small projects)

### Memory Update After Commit

After each commit, update `.memory/project-state.json`:
```json
{
  "git_repositories": {
    "rust": {
      "initialized": true,
      "path": "workspace/rust",
      "current_branch": "develop",
      "last_commit": "<commit-hash>",
      "last_commit_message": "feat(api): add user management endpoints",
      "last_commit_date": "2025-01-13T12:00:00Z",
      "dirty": false
    }
  }
}
```

### Rust-Specific .gitignore

```gitignore
# Rust
/target/
**/*.rs.bk
Cargo.lock  # Only ignore for libraries, commit for applications

# IDE
.idea/
.vscode/
*.swp
*.swo

# Environment
.env
.env.local
.env.*.local

# Build artifacts
*.so
*.dylib
*.dll

# WASM
/pkg/
*.wasm

# Coverage
*.profraw
*.profdata
lcov.info
tarpaulin-report.html

# Benchmarks (optional, large files)
criterion/

# OS
.DS_Store
Thumbs.db
```

---

## Enterprise Standards Compliance

This skill follows team-wide enterprise standards.

**Required References** (`../ENTERPRISE-STANDARDS.md`):
- [Code Conventions](../ENTERPRISE-STANDARDS.md#code-conventions) - Rust snake_case, file structure
- [Type Safety](../ENTERPRISE-STANDARDS.md#type-safety) - clippy, strict ownership
- [Error Handling](../ENTERPRISE-STANDARDS.md#error-handling) - thiserror, Result patterns
- [Testing Standards](../ENTERPRISE-STANDARDS.md#testing-standards) - cargo test, 80% coverage
- [Logging Standards](../ENTERPRISE-STANDARDS.md#logging-standards) - tracing, structured logs
- [Git Conventions](../ENTERPRISE-STANDARDS.md#git-conventions) - branch naming, commit messages
- [Security Standards](../ENTERPRISE-STANDARDS.md#security-standards) - cargo-audit, no hardcoded secrets
- [Documentation Standards](../ENTERPRISE-STANDARDS.md#documentation-standards) - rustdoc

**Domain-Specific Standards** (see Quality Standards section in this document):
- rustfmt formatting enforced
- clippy pedantic for critical paths
- No `.unwrap()` in production code
- 80%+ test coverage with cargo-tarpaulin
- cargo-audit for dependency vulnerabilities
- Release profile with LTO optimization
