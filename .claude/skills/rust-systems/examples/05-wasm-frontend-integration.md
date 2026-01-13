# WebAssembly Frontend Integration

> **Demonstrates**: WebAssembly module for browser performance with JavaScript interop
> **Technologies**: wasm-bindgen, wasm-pack, web-sys, js-sys, Rust 1.75+
> **Integration**: Next.js/React, TypeScript bindings, async in WASM
> **Use when**: Offloading computation-heavy tasks to WebAssembly for performance

---

## Overview

This example demonstrates production-ready WebAssembly integration with:
- wasm-bindgen for JavaScript interop
- Async functions in WebAssembly
- TypeScript type generation
- Performance optimization
- React/Next.js integration patterns
- Size optimization with wasm-opt

## Implementation

### 1. Project Setup (Cargo.toml)

```toml
[package]
name = "wasm-module"
version = "0.1.0"
edition = "2021"
description = "High-performance WASM module for browser"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
# WASM bindings
wasm-bindgen = "0.2"
wasm-bindgen-futures = "0.4"

# JavaScript/Web APIs
js-sys = "0.3"
web-sys = { version = "0.3", features = [
    "console",
    "Window",
    "Document",
    "Performance",
    "PerformanceMark",
    "PerformanceMeasure",
    "CanvasRenderingContext2d",
    "HtmlCanvasElement",
    "ImageData",
] }

# Async
futures = "0.3"

# Serialization for complex types
serde = { version = "1.0", features = ["derive"] }
serde-wasm-bindgen = "0.6"

# Utilities
getrandom = { version = "0.2", features = ["js"] }

# Error handling
thiserror = "1.0"

# Console logging for debugging
console_error_panic_hook = "0.1"

[dev-dependencies]
wasm-bindgen-test = "0.3"

[profile.release]
# Optimize for size
opt-level = "s"
lto = true
codegen-units = 1
panic = "abort"

# Even smaller size (trade-off with speed)
[profile.release-small]
inherits = "release"
opt-level = "z"
```

### 2. Library Entry Point (src/lib.rs)

```rust
use wasm_bindgen::prelude::*;

mod image_processing;
mod math;
mod utils;

pub use image_processing::*;
pub use math::*;

/// Initialize the WASM module
/// Call this once before using other functions
#[wasm_bindgen(start)]
pub fn init() {
    // Set up better panic messages in console
    console_error_panic_hook::set_once();
}

/// Log to browser console (for debugging)
#[wasm_bindgen]
pub fn log(message: &str) {
    web_sys::console::log_1(&message.into());
}

/// Get WASM module version
#[wasm_bindgen]
pub fn version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}
```

### 3. Math Operations (src/math.rs)

```rust
use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};

/// Fibonacci calculation (demonstrates CPU-intensive task)
#[wasm_bindgen]
pub fn fibonacci(n: u32) -> u64 {
    match n {
        0 => 0,
        1 => 1,
        _ => {
            let mut a = 0u64;
            let mut b = 1u64;
            for _ in 2..=n {
                let temp = a + b;
                a = b;
                b = temp;
            }
            b
        }
    }
}

/// Prime number check
#[wasm_bindgen]
pub fn is_prime(n: u64) -> bool {
    if n < 2 {
        return false;
    }
    if n == 2 {
        return true;
    }
    if n % 2 == 0 {
        return false;
    }

    let sqrt_n = (n as f64).sqrt() as u64;
    for i in (3..=sqrt_n).step_by(2) {
        if n % i == 0 {
            return false;
        }
    }
    true
}

/// Find all primes up to n (Sieve of Eratosthenes)
#[wasm_bindgen]
pub fn sieve_primes(n: u32) -> Vec<u32> {
    if n < 2 {
        return vec![];
    }

    let mut is_prime = vec![true; (n + 1) as usize];
    is_prime[0] = false;
    is_prime[1] = false;

    let sqrt_n = (n as f64).sqrt() as u32;
    for i in 2..=sqrt_n {
        if is_prime[i as usize] {
            let mut j = i * i;
            while j <= n {
                is_prime[j as usize] = false;
                j += i;
            }
        }
    }

    is_prime
        .iter()
        .enumerate()
        .filter_map(|(i, &is_p)| if is_p { Some(i as u32) } else { None })
        .collect()
}

/// Matrix multiplication (demonstrates array operations)
#[wasm_bindgen]
pub struct Matrix {
    rows: usize,
    cols: usize,
    data: Vec<f64>,
}

#[wasm_bindgen]
impl Matrix {
    #[wasm_bindgen(constructor)]
    pub fn new(rows: usize, cols: usize) -> Matrix {
        Matrix {
            rows,
            cols,
            data: vec![0.0; rows * cols],
        }
    }

    pub fn from_array(rows: usize, cols: usize, data: Vec<f64>) -> Matrix {
        assert_eq!(data.len(), rows * cols, "Data length mismatch");
        Matrix { rows, cols, data }
    }

    pub fn get(&self, row: usize, col: usize) -> f64 {
        self.data[row * self.cols + col]
    }

    pub fn set(&mut self, row: usize, col: usize, value: f64) {
        self.data[row * self.cols + col] = value;
    }

    pub fn multiply(&self, other: &Matrix) -> Matrix {
        assert_eq!(self.cols, other.rows, "Matrix dimensions incompatible");

        let mut result = Matrix::new(self.rows, other.cols);

        for i in 0..self.rows {
            for j in 0..other.cols {
                let mut sum = 0.0;
                for k in 0..self.cols {
                    sum += self.get(i, k) * other.get(k, j);
                }
                result.set(i, j, sum);
            }
        }

        result
    }

    pub fn to_array(&self) -> Vec<f64> {
        self.data.clone()
    }

    pub fn rows(&self) -> usize {
        self.rows
    }

    pub fn cols(&self) -> usize {
        self.cols
    }
}

/// Statistics result (demonstrates complex return types)
#[derive(Serialize, Deserialize)]
pub struct StatsResult {
    pub mean: f64,
    pub median: f64,
    pub std_dev: f64,
    pub min: f64,
    pub max: f64,
    pub count: usize,
}

/// Calculate statistics for a dataset
#[wasm_bindgen]
pub fn calculate_stats(data: Vec<f64>) -> JsValue {
    if data.is_empty() {
        return serde_wasm_bindgen::to_value(&StatsResult {
            mean: 0.0,
            median: 0.0,
            std_dev: 0.0,
            min: 0.0,
            max: 0.0,
            count: 0,
        })
        .unwrap();
    }

    let count = data.len();
    let sum: f64 = data.iter().sum();
    let mean = sum / count as f64;

    let mut sorted = data.clone();
    sorted.sort_by(|a, b| a.partial_cmp(b).unwrap());

    let median = if count % 2 == 0 {
        (sorted[count / 2 - 1] + sorted[count / 2]) / 2.0
    } else {
        sorted[count / 2]
    };

    let variance: f64 = data.iter().map(|x| (x - mean).powi(2)).sum::<f64>() / count as f64;
    let std_dev = variance.sqrt();

    let min = *sorted.first().unwrap();
    let max = *sorted.last().unwrap();

    let result = StatsResult {
        mean,
        median,
        std_dev,
        min,
        max,
        count,
    };

    serde_wasm_bindgen::to_value(&result).unwrap()
}
```

### 4. Image Processing (src/image_processing.rs)

```rust
use wasm_bindgen::prelude::*;
use wasm_bindgen::Clamped;
use web_sys::ImageData;

/// Apply grayscale filter to image data
#[wasm_bindgen]
pub fn grayscale(data: Clamped<Vec<u8>>, width: u32, height: u32) -> ImageData {
    let mut pixels = data.0;

    for i in (0..pixels.len()).step_by(4) {
        let r = pixels[i] as f32;
        let g = pixels[i + 1] as f32;
        let b = pixels[i + 2] as f32;

        // Luminosity method for grayscale
        let gray = (0.299 * r + 0.587 * g + 0.114 * b) as u8;

        pixels[i] = gray;
        pixels[i + 1] = gray;
        pixels[i + 2] = gray;
        // Alpha channel unchanged
    }

    ImageData::new_with_u8_clamped_array_and_sh(Clamped(&pixels), width, height).unwrap()
}

/// Apply sepia filter
#[wasm_bindgen]
pub fn sepia(data: Clamped<Vec<u8>>, width: u32, height: u32) -> ImageData {
    let mut pixels = data.0;

    for i in (0..pixels.len()).step_by(4) {
        let r = pixels[i] as f32;
        let g = pixels[i + 1] as f32;
        let b = pixels[i + 2] as f32;

        pixels[i] = ((0.393 * r + 0.769 * g + 0.189 * b).min(255.0)) as u8;
        pixels[i + 1] = ((0.349 * r + 0.686 * g + 0.168 * b).min(255.0)) as u8;
        pixels[i + 2] = ((0.272 * r + 0.534 * g + 0.131 * b).min(255.0)) as u8;
    }

    ImageData::new_with_u8_clamped_array_and_sh(Clamped(&pixels), width, height).unwrap()
}

/// Apply blur filter (box blur)
#[wasm_bindgen]
pub fn blur(data: Clamped<Vec<u8>>, width: u32, height: u32, radius: u32) -> ImageData {
    let pixels = data.0;
    let mut output = pixels.clone();
    let w = width as usize;
    let h = height as usize;
    let r = radius as i32;

    for y in 0..h {
        for x in 0..w {
            let mut total_r = 0u32;
            let mut total_g = 0u32;
            let mut total_b = 0u32;
            let mut count = 0u32;

            for dy in -r..=r {
                for dx in -r..=r {
                    let nx = x as i32 + dx;
                    let ny = y as i32 + dy;

                    if nx >= 0 && nx < w as i32 && ny >= 0 && ny < h as i32 {
                        let idx = ((ny as usize) * w + (nx as usize)) * 4;
                        total_r += pixels[idx] as u32;
                        total_g += pixels[idx + 1] as u32;
                        total_b += pixels[idx + 2] as u32;
                        count += 1;
                    }
                }
            }

            let idx = (y * w + x) * 4;
            output[idx] = (total_r / count) as u8;
            output[idx + 1] = (total_g / count) as u8;
            output[idx + 2] = (total_b / count) as u8;
        }
    }

    ImageData::new_with_u8_clamped_array_and_sh(Clamped(&output), width, height).unwrap()
}

/// Adjust brightness
#[wasm_bindgen]
pub fn brightness(data: Clamped<Vec<u8>>, width: u32, height: u32, factor: f32) -> ImageData {
    let mut pixels = data.0;

    for i in (0..pixels.len()).step_by(4) {
        pixels[i] = ((pixels[i] as f32 * factor).clamp(0.0, 255.0)) as u8;
        pixels[i + 1] = ((pixels[i + 1] as f32 * factor).clamp(0.0, 255.0)) as u8;
        pixels[i + 2] = ((pixels[i + 2] as f32 * factor).clamp(0.0, 255.0)) as u8;
    }

    ImageData::new_with_u8_clamped_array_and_sh(Clamped(&pixels), width, height).unwrap()
}

/// Adjust contrast
#[wasm_bindgen]
pub fn contrast(data: Clamped<Vec<u8>>, width: u32, height: u32, factor: f32) -> ImageData {
    let mut pixels = data.0;
    let factor = (259.0 * (factor + 255.0)) / (255.0 * (259.0 - factor));

    for i in (0..pixels.len()).step_by(4) {
        pixels[i] = ((factor * (pixels[i] as f32 - 128.0) + 128.0).clamp(0.0, 255.0)) as u8;
        pixels[i + 1] = ((factor * (pixels[i + 1] as f32 - 128.0) + 128.0).clamp(0.0, 255.0)) as u8;
        pixels[i + 2] = ((factor * (pixels[i + 2] as f32 - 128.0) + 128.0).clamp(0.0, 255.0)) as u8;
    }

    ImageData::new_with_u8_clamped_array_and_sh(Clamped(&pixels), width, height).unwrap()
}

/// Invert colors
#[wasm_bindgen]
pub fn invert(data: Clamped<Vec<u8>>, width: u32, height: u32) -> ImageData {
    let mut pixels = data.0;

    for i in (0..pixels.len()).step_by(4) {
        pixels[i] = 255 - pixels[i];
        pixels[i + 1] = 255 - pixels[i + 1];
        pixels[i + 2] = 255 - pixels[i + 2];
    }

    ImageData::new_with_u8_clamped_array_and_sh(Clamped(&pixels), width, height).unwrap()
}
```

### 5. Async Functions (src/async_ops.rs)

```rust
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;
use web_sys::{Request, RequestInit, Response};

/// Fetch data from URL (demonstrates async in WASM)
#[wasm_bindgen]
pub async fn fetch_json(url: String) -> Result<JsValue, JsValue> {
    let mut opts = RequestInit::new();
    opts.method("GET");

    let request = Request::new_with_str_and_init(&url, &opts)?;
    request.headers().set("Accept", "application/json")?;

    let window = web_sys::window().unwrap();
    let resp_value = JsFuture::from(window.fetch_with_request(&request)).await?;
    let resp: Response = resp_value.dyn_into()?;

    let json = JsFuture::from(resp.json()?).await?;
    Ok(json)
}

/// Async computation with progress callback
#[wasm_bindgen]
pub async fn heavy_computation(
    iterations: u32,
    progress_callback: js_sys::Function,
) -> Result<f64, JsValue> {
    let mut result = 0.0;

    for i in 0..iterations {
        // Simulate heavy computation
        result += (i as f64).sin();

        // Report progress every 1000 iterations
        if i % 1000 == 0 {
            let progress = (i as f64 / iterations as f64) * 100.0;
            let this = JsValue::null();
            progress_callback.call1(&this, &JsValue::from_f64(progress))?;

            // Yield to allow UI updates
            let promise = js_sys::Promise::resolve(&JsValue::undefined());
            JsFuture::from(promise).await?;
        }
    }

    Ok(result)
}
```

### 6. Build and Package

**Build Script (build.sh)**:
```bash
#!/bin/bash
set -e

echo "Building WASM module..."

# Build with wasm-pack
wasm-pack build --target web --release

# Optimize WASM size (requires wasm-opt from binaryen)
if command -v wasm-opt &> /dev/null; then
    echo "Optimizing WASM size..."
    wasm-opt -Oz -o pkg/wasm_module_bg_opt.wasm pkg/wasm_module_bg.wasm
    mv pkg/wasm_module_bg_opt.wasm pkg/wasm_module_bg.wasm
fi

echo "Build complete! Output in ./pkg/"
ls -lh pkg/*.wasm
```

### 7. TypeScript Definitions (pkg/wasm_module.d.ts)

Generated automatically by wasm-pack, but you can extend:

```typescript
// Additional TypeScript types for better DX

export interface StatsResult {
  mean: number;
  median: number;
  std_dev: number;
  min: number;
  max: number;
  count: number;
}

export function fibonacci(n: number): bigint;
export function is_prime(n: bigint): boolean;
export function sieve_primes(n: number): Uint32Array;
export function calculate_stats(data: Float64Array): StatsResult;

export function grayscale(data: Uint8ClampedArray, width: number, height: number): ImageData;
export function sepia(data: Uint8ClampedArray, width: number, height: number): ImageData;
export function blur(data: Uint8ClampedArray, width: number, height: number, radius: number): ImageData;
export function brightness(data: Uint8ClampedArray, width: number, height: number, factor: number): ImageData;
export function contrast(data: Uint8ClampedArray, width: number, height: number, factor: number): ImageData;
export function invert(data: Uint8ClampedArray, width: number, height: number): ImageData;

export class Matrix {
  constructor(rows: number, cols: number);
  static from_array(rows: number, cols: number, data: Float64Array): Matrix;
  get(row: number, col: number): number;
  set(row: number, col: number, value: number): void;
  multiply(other: Matrix): Matrix;
  to_array(): Float64Array;
  rows(): number;
  cols(): number;
}
```

### 8. React Integration (useWasm.ts)

```typescript
import { useEffect, useState, useCallback } from 'react';

// Type for the WASM module
interface WasmModule {
  fibonacci: (n: number) => bigint;
  is_prime: (n: bigint) => boolean;
  sieve_primes: (n: number) => Uint32Array;
  calculate_stats: (data: Float64Array) => StatsResult;
  grayscale: (data: Uint8ClampedArray, width: number, height: number) => ImageData;
  sepia: (data: Uint8ClampedArray, width: number, height: number) => ImageData;
  blur: (data: Uint8ClampedArray, width: number, height: number, radius: number) => ImageData;
  brightness: (data: Uint8ClampedArray, width: number, height: number, factor: number) => ImageData;
  contrast: (data: Uint8ClampedArray, width: number, height: number, factor: number) => ImageData;
  invert: (data: Uint8ClampedArray, width: number, height: number) => ImageData;
  Matrix: new (rows: number, cols: number) => Matrix;
}

interface StatsResult {
  mean: number;
  median: number;
  std_dev: number;
  min: number;
  max: number;
  count: number;
}

interface Matrix {
  get(row: number, col: number): number;
  set(row: number, col: number, value: number): void;
  multiply(other: Matrix): Matrix;
  to_array(): Float64Array;
  rows(): number;
  cols(): number;
}

export function useWasm() {
  const [wasm, setWasm] = useState<WasmModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadWasm() {
      try {
        // Dynamic import for code splitting
        const wasmModule = await import('@/wasm/wasm_module');
        await wasmModule.default(); // Initialize

        if (mounted) {
          setWasm(wasmModule as unknown as WasmModule);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to load WASM'));
          setLoading(false);
        }
      }
    }

    loadWasm();

    return () => {
      mounted = false;
    };
  }, []);

  return { wasm, loading, error };
}

// Hook for image processing
export function useImageProcessor() {
  const { wasm, loading, error } = useWasm();

  const processImage = useCallback(
    (
      imageData: ImageData,
      filter: 'grayscale' | 'sepia' | 'blur' | 'brightness' | 'contrast' | 'invert',
      options?: { radius?: number; factor?: number }
    ): ImageData | null => {
      if (!wasm) return null;

      const { data, width, height } = imageData;
      const clampedData = new Uint8ClampedArray(data);

      switch (filter) {
        case 'grayscale':
          return wasm.grayscale(clampedData, width, height);
        case 'sepia':
          return wasm.sepia(clampedData, width, height);
        case 'blur':
          return wasm.blur(clampedData, width, height, options?.radius ?? 3);
        case 'brightness':
          return wasm.brightness(clampedData, width, height, options?.factor ?? 1.2);
        case 'contrast':
          return wasm.contrast(clampedData, width, height, options?.factor ?? 50);
        case 'invert':
          return wasm.invert(clampedData, width, height);
        default:
          return null;
      }
    },
    [wasm]
  );

  return { processImage, loading, error };
}
```

### 9. React Component Example

```tsx
'use client';

import { useRef, useState, useCallback } from 'react';
import { useImageProcessor, useWasm } from '@/hooks/useWasm';

export function ImageEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [originalImage, setOriginalImage] = useState<ImageData | null>(null);
  const { processImage, loading, error } = useImageProcessor();

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canvasRef.current) return;

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      setOriginalImage(imageData);
    };
    img.src = URL.createObjectURL(file);
  }, []);

  const applyFilter = useCallback(
    (filter: 'grayscale' | 'sepia' | 'blur' | 'brightness' | 'contrast' | 'invert') => {
      if (!originalImage || !canvasRef.current) return;

      const startTime = performance.now();
      const processed = processImage(originalImage, filter, { radius: 5, factor: 1.3 });
      const endTime = performance.now();

      if (processed) {
        const ctx = canvasRef.current.getContext('2d')!;
        ctx.putImageData(processed, 0, 0);
        console.log(`Filter applied in ${(endTime - startTime).toFixed(2)}ms`);
      }
    },
    [originalImage, processImage]
  );

  const reset = useCallback(() => {
    if (!originalImage || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d')!;
    ctx.putImageData(originalImage, 0, 0);
  }, [originalImage]);

  if (loading) return <div>Loading WASM module...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="space-y-4">
      <input type="file" accept="image/*" onChange={handleFileUpload} />
      
      <div className="flex gap-2">
        <button onClick={() => applyFilter('grayscale')}>Grayscale</button>
        <button onClick={() => applyFilter('sepia')}>Sepia</button>
        <button onClick={() => applyFilter('blur')}>Blur</button>
        <button onClick={() => applyFilter('brightness')}>Brightness</button>
        <button onClick={() => applyFilter('contrast')}>Contrast</button>
        <button onClick={() => applyFilter('invert')}>Invert</button>
        <button onClick={reset}>Reset</button>
      </div>
      
      <canvas ref={canvasRef} className="border" />
    </div>
  );
}

// Performance comparison component
export function PerformanceDemo() {
  const { wasm, loading } = useWasm();
  const [results, setResults] = useState<{ wasm: number; js: number } | null>(null);

  const runBenchmark = useCallback(() => {
    if (!wasm) return;

    const n = 45;

    // WASM version
    const wasmStart = performance.now();
    const wasmResult = wasm.fibonacci(n);
    const wasmEnd = performance.now();

    // JavaScript version
    const jsStart = performance.now();
    const jsResult = fibonacciJS(n);
    const jsEnd = performance.now();

    setResults({
      wasm: wasmEnd - wasmStart,
      js: jsEnd - jsStart,
    });

    console.log(`WASM result: ${wasmResult}, JS result: ${jsResult}`);
  }, [wasm]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <button onClick={runBenchmark}>Run Fibonacci(45) Benchmark</button>
      
      {results && (
        <div>
          <p>WASM: {results.wasm.toFixed(2)}ms</p>
          <p>JavaScript: {results.js.toFixed(2)}ms</p>
          <p>Speedup: {(results.js / results.wasm).toFixed(2)}x</p>
        </div>
      )}
    </div>
  );
}

// Pure JavaScript fibonacci for comparison
function fibonacciJS(n: number): bigint {
  if (n <= 1) return BigInt(n);
  let a = 0n;
  let b = 1n;
  for (let i = 2; i <= n; i++) {
    const temp = a + b;
    a = b;
    b = temp;
  }
  return b;
}
```

### 10. Next.js Configuration (next.config.js)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Enable WASM support
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Fix for WASM in production
    config.output.webassemblyModuleFilename = 
      isServer ? './../static/wasm/[modulehash].wasm' : 'static/wasm/[modulehash].wasm';

    return config;
  },
};

module.exports = nextConfig;
```

## Size Optimization

```bash
# Install wasm-opt (part of binaryen)
# macOS: brew install binaryen
# Ubuntu: apt install binaryen

# Optimize for size
wasm-opt -Oz -o optimized.wasm original.wasm

# Check size reduction
ls -lh *.wasm
```

## Key Takeaways

1. **wasm-bindgen**: Seamless JavaScript/Rust interop
2. **Async Support**: Full async/await in WASM with wasm-bindgen-futures
3. **TypeScript**: Auto-generated type definitions for safety
4. **Performance**: 2-10x speedup for CPU-intensive tasks
5. **Image Processing**: Direct ImageData manipulation
6. **Size Optimization**: Use wasm-opt and release profiles
7. **React Integration**: Custom hooks for ergonomic usage

This WASM integration provides production-ready performance optimization for frontend applications.
