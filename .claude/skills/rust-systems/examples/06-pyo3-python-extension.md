# PyO3 Python Extension Module

> **Demonstrates**: High-performance Python extension module written in Rust
> **Technologies**: PyO3 0.20+, maturin, pyo3-asyncio, Rust 1.75+
> **Integration**: NumPy arrays, async Python, type stubs, pytest testing
> **Use when**: Accelerating Python with Rust for CPU-intensive operations

---

## Overview

This example implements a production-ready Python extension with:
- PyO3 for Python bindings
- maturin for building and publishing
- NumPy array support with zero-copy
- Async Python with pyo3-asyncio
- Automatic type stub generation
- pytest integration for testing

## Implementation

### 1. Project Setup (Cargo.toml)

```toml
[package]
name = "rust_extension"
version = "0.1.0"
edition = "2021"
description = "High-performance Python extension module"

[lib]
name = "rust_extension"
crate-type = ["cdylib"]

[dependencies]
# Python bindings
pyo3 = { version = "0.20", features = ["extension-module", "abi3-py38"] }

# Async support
pyo3-asyncio = { version = "0.20", features = ["tokio-runtime"] }
tokio = { version = "1.35", features = ["full"] }
futures = "0.3"

# NumPy support
numpy = "0.20"

# Parallel processing
rayon = "1.8"

# Serialization
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# Error handling
thiserror = "1.0"

[build-dependencies]
pyo3-build-config = "0.20"

[profile.release]
lto = true
codegen-units = 1
opt-level = 3
```

### 2. Build Configuration (pyproject.toml)

```toml
[build-system]
requires = ["maturin>=1.4,<2.0"]
build-backend = "maturin"

[project]
name = "rust_extension"
version = "0.1.0"
description = "High-performance Python extension module written in Rust"
readme = "README.md"
requires-python = ">=3.8"
classifiers = [
    "Programming Language :: Rust",
    "Programming Language :: Python :: Implementation :: CPython",
    "Programming Language :: Python :: 3.8",
    "Programming Language :: Python :: 3.9",
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
]
dependencies = [
    "numpy>=1.20",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.0",
    "pytest-asyncio>=0.21",
    "hypothesis>=6.0",
    "mypy>=1.0",
]

[tool.maturin]
# Build for Python 3.8+ with stable ABI
python-source = "python"
features = ["pyo3/extension-module", "pyo3/abi3-py38"]
strip = true

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

### 3. Module Entry Point (src/lib.rs)

```rust
use pyo3::prelude::*;

mod array_ops;
mod async_ops;
mod data_processing;
mod math_ops;

use array_ops::*;
use async_ops::*;
use data_processing::*;
use math_ops::*;

/// High-performance Rust extension module for Python
#[pymodule]
fn rust_extension(py: Python<'_>, m: &PyModule) -> PyResult<()> {
    // Math operations
    m.add_function(wrap_pyfunction!(fibonacci, m)?)?;
    m.add_function(wrap_pyfunction!(is_prime, m)?)?;
    m.add_function(wrap_pyfunction!(sieve_primes, m)?)?;
    m.add_function(wrap_pyfunction!(factorial, m)?)?;

    // Array operations
    m.add_function(wrap_pyfunction!(sum_array, m)?)?;
    m.add_function(wrap_pyfunction!(dot_product, m)?)?;
    m.add_function(wrap_pyfunction!(matrix_multiply, m)?)?;
    m.add_function(wrap_pyfunction!(parallel_map, m)?)?;

    // Data processing
    m.add_function(wrap_pyfunction!(parse_json_records, m)?)?;
    m.add_function(wrap_pyfunction!(filter_records, m)?)?;
    m.add_class::<DataProcessor>()?;

    // Async operations
    m.add_function(wrap_pyfunction!(async_compute, m)?)?;
    m.add_function(wrap_pyfunction!(parallel_fetch, m)?)?;

    // Version info
    m.add("__version__", env!("CARGO_PKG_VERSION"))?;

    Ok(())
}
```

### 4. Math Operations (src/math_ops.rs)

```rust
use pyo3::prelude::*;
use rayon::prelude::*;

/// Calculate Fibonacci number
/// 
/// Much faster than pure Python for large n
#[pyfunction]
#[pyo3(signature = (n))]
pub fn fibonacci(n: u64) -> u64 {
    match n {
        0 => 0,
        1 => 1,
        _ => {
            let mut a = 0u64;
            let mut b = 1u64;
            for _ in 2..=n {
                let temp = a.saturating_add(b);
                a = b;
                b = temp;
            }
            b
        }
    }
}

/// Check if a number is prime
#[pyfunction]
#[pyo3(signature = (n))]
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
    !(3..=sqrt_n).step_by(2).any(|i| n % i == 0)
}

/// Find all primes up to n using Sieve of Eratosthenes
/// 
/// Returns a list of prime numbers
#[pyfunction]
#[pyo3(signature = (n))]
pub fn sieve_primes(n: u64) -> Vec<u64> {
    if n < 2 {
        return vec![];
    }

    let n = n as usize;
    let mut is_prime = vec![true; n + 1];
    is_prime[0] = false;
    is_prime[1] = false;

    let sqrt_n = (n as f64).sqrt() as usize;
    for i in 2..=sqrt_n {
        if is_prime[i] {
            let mut j = i * i;
            while j <= n {
                is_prime[j] = false;
                j += i;
            }
        }
    }

    is_prime
        .into_iter()
        .enumerate()
        .filter_map(|(i, is_p)| if is_p { Some(i as u64) } else { None })
        .collect()
}

/// Calculate factorial using parallel computation for large numbers
#[pyfunction]
#[pyo3(signature = (n))]
pub fn factorial(n: u64) -> PyResult<u128> {
    if n > 34 {
        return Err(pyo3::exceptions::PyOverflowError::new_err(
            "n too large for u128 factorial",
        ));
    }

    let result: u128 = (1..=n as u128).product();
    Ok(result)
}

/// Parallel prime counting using rayon
#[pyfunction]
#[pyo3(signature = (start, end))]
pub fn count_primes_parallel(start: u64, end: u64) -> u64 {
    (start..=end)
        .into_par_iter()
        .filter(|&n| is_prime(n))
        .count() as u64
}
```

### 5. NumPy Array Operations (src/array_ops.rs)

```rust
use numpy::{IntoPyArray, PyArray1, PyArray2, PyReadonlyArray1, PyReadonlyArray2};
use pyo3::prelude::*;
use rayon::prelude::*;

/// Sum array elements (faster than numpy.sum for small arrays)
#[pyfunction]
#[pyo3(signature = (arr))]
pub fn sum_array(arr: PyReadonlyArray1<'_, f64>) -> f64 {
    let arr = arr.as_array();
    arr.iter().sum()
}

/// Parallel sum for large arrays
#[pyfunction]
#[pyo3(signature = (arr))]
pub fn sum_array_parallel(arr: PyReadonlyArray1<'_, f64>) -> f64 {
    let arr = arr.as_array();
    arr.as_slice().unwrap().par_iter().sum()
}

/// Dot product of two vectors
#[pyfunction]
#[pyo3(signature = (a, b))]
pub fn dot_product(a: PyReadonlyArray1<'_, f64>, b: PyReadonlyArray1<'_, f64>) -> PyResult<f64> {
    let a = a.as_array();
    let b = b.as_array();

    if a.len() != b.len() {
        return Err(pyo3::exceptions::PyValueError::new_err(
            "Arrays must have the same length",
        ));
    }

    let result: f64 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
    Ok(result)
}

/// Matrix multiplication (returns new array)
#[pyfunction]
#[pyo3(signature = (a, b))]
pub fn matrix_multiply<'py>(
    py: Python<'py>,
    a: PyReadonlyArray2<'_, f64>,
    b: PyReadonlyArray2<'_, f64>,
) -> PyResult<&'py PyArray2<f64>> {
    let a = a.as_array();
    let b = b.as_array();

    let (m, k1) = a.dim();
    let (k2, n) = b.dim();

    if k1 != k2 {
        return Err(pyo3::exceptions::PyValueError::new_err(format!(
            "Matrix dimensions incompatible: ({}, {}) x ({}, {})",
            m, k1, k2, n
        )));
    }

    let mut result = vec![0.0; m * n];

    // Parallel matrix multiplication using rayon
    result
        .par_chunks_mut(n)
        .enumerate()
        .for_each(|(i, row)| {
            for j in 0..n {
                let mut sum = 0.0;
                for k in 0..k1 {
                    sum += a[[i, k]] * b[[k, j]];
                }
                row[j] = sum;
            }
        });

    Ok(result.into_pyarray(py).reshape([m, n]).unwrap())
}

/// Apply function to array elements in parallel
#[pyfunction]
#[pyo3(signature = (arr, operation))]
pub fn parallel_map<'py>(
    py: Python<'py>,
    arr: PyReadonlyArray1<'_, f64>,
    operation: &str,
) -> PyResult<&'py PyArray1<f64>> {
    let arr = arr.as_array();

    let result: Vec<f64> = match operation {
        "square" => arr.as_slice().unwrap().par_iter().map(|x| x * x).collect(),
        "sqrt" => arr.as_slice().unwrap().par_iter().map(|x| x.sqrt()).collect(),
        "abs" => arr.as_slice().unwrap().par_iter().map(|x| x.abs()).collect(),
        "exp" => arr.as_slice().unwrap().par_iter().map(|x| x.exp()).collect(),
        "log" => arr.as_slice().unwrap().par_iter().map(|x| x.ln()).collect(),
        "sin" => arr.as_slice().unwrap().par_iter().map(|x| x.sin()).collect(),
        "cos" => arr.as_slice().unwrap().par_iter().map(|x| x.cos()).collect(),
        _ => {
            return Err(pyo3::exceptions::PyValueError::new_err(format!(
                "Unknown operation: {}. Supported: square, sqrt, abs, exp, log, sin, cos",
                operation
            )));
        }
    };

    Ok(result.into_pyarray(py))
}

/// Element-wise array operations with SIMD-like parallelism
#[pyfunction]
#[pyo3(signature = (a, b, operation))]
pub fn elementwise_op<'py>(
    py: Python<'py>,
    a: PyReadonlyArray1<'_, f64>,
    b: PyReadonlyArray1<'_, f64>,
    operation: &str,
) -> PyResult<&'py PyArray1<f64>> {
    let a = a.as_array();
    let b = b.as_array();

    if a.len() != b.len() {
        return Err(pyo3::exceptions::PyValueError::new_err(
            "Arrays must have the same length",
        ));
    }

    let a_slice = a.as_slice().unwrap();
    let b_slice = b.as_slice().unwrap();

    let result: Vec<f64> = match operation {
        "add" => a_slice.par_iter().zip(b_slice).map(|(x, y)| x + y).collect(),
        "sub" => a_slice.par_iter().zip(b_slice).map(|(x, y)| x - y).collect(),
        "mul" => a_slice.par_iter().zip(b_slice).map(|(x, y)| x * y).collect(),
        "div" => a_slice.par_iter().zip(b_slice).map(|(x, y)| x / y).collect(),
        "pow" => a_slice.par_iter().zip(b_slice).map(|(x, y)| x.powf(*y)).collect(),
        _ => {
            return Err(pyo3::exceptions::PyValueError::new_err(format!(
                "Unknown operation: {}. Supported: add, sub, mul, div, pow",
                operation
            )));
        }
    };

    Ok(result.into_pyarray(py))
}
```

### 6. Data Processing (src/data_processing.rs)

```rust
use pyo3::prelude::*;
use rayon::prelude::*;
use serde::{Deserialize, Serialize};

/// A record for data processing
#[derive(Debug, Clone, Serialize, Deserialize)]
#[pyclass]
pub struct Record {
    #[pyo3(get, set)]
    pub id: i64,
    #[pyo3(get, set)]
    pub name: String,
    #[pyo3(get, set)]
    pub value: f64,
    #[pyo3(get, set)]
    pub active: bool,
}

#[pymethods]
impl Record {
    #[new]
    fn new(id: i64, name: String, value: f64, active: bool) -> Self {
        Record {
            id,
            name,
            value,
            active,
        }
    }

    fn __repr__(&self) -> String {
        format!(
            "Record(id={}, name='{}', value={}, active={})",
            self.id, self.name, self.value, self.active
        )
    }

    fn to_dict(&self, py: Python<'_>) -> PyResult<PyObject> {
        let dict = pyo3::types::PyDict::new(py);
        dict.set_item("id", self.id)?;
        dict.set_item("name", &self.name)?;
        dict.set_item("value", self.value)?;
        dict.set_item("active", self.active)?;
        Ok(dict.into())
    }
}

/// Parse JSON records in parallel
#[pyfunction]
#[pyo3(signature = (json_strings))]
pub fn parse_json_records(json_strings: Vec<String>) -> PyResult<Vec<Record>> {
    let results: Result<Vec<Record>, _> = json_strings
        .par_iter()
        .map(|s| serde_json::from_str(s))
        .collect();

    results.map_err(|e| pyo3::exceptions::PyValueError::new_err(format!("JSON parse error: {}", e)))
}

/// Filter records by predicate
#[pyfunction]
#[pyo3(signature = (records, min_value = None, active_only = false))]
pub fn filter_records(
    records: Vec<Record>,
    min_value: Option<f64>,
    active_only: bool,
) -> Vec<Record> {
    records
        .into_par_iter()
        .filter(|r| {
            let value_ok = min_value.map_or(true, |min| r.value >= min);
            let active_ok = !active_only || r.active;
            value_ok && active_ok
        })
        .collect()
}

/// Data processor class with state
#[pyclass]
pub struct DataProcessor {
    records: Vec<Record>,
    processed_count: usize,
}

#[pymethods]
impl DataProcessor {
    #[new]
    fn new() -> Self {
        DataProcessor {
            records: Vec::new(),
            processed_count: 0,
        }
    }

    /// Load records from JSON strings
    fn load_json(&mut self, json_strings: Vec<String>) -> PyResult<usize> {
        let new_records = parse_json_records(json_strings)?;
        let count = new_records.len();
        self.records.extend(new_records);
        Ok(count)
    }

    /// Add a single record
    fn add_record(&mut self, record: Record) {
        self.records.push(record);
    }

    /// Get all records
    fn get_records(&self) -> Vec<Record> {
        self.records.clone()
    }

    /// Filter records
    fn filter(&self, min_value: Option<f64>, active_only: bool) -> Vec<Record> {
        filter_records(self.records.clone(), min_value, active_only)
    }

    /// Calculate statistics
    fn statistics(&self) -> PyResult<PyObject> {
        Python::with_gil(|py| {
            let dict = pyo3::types::PyDict::new(py);

            let values: Vec<f64> = self.records.iter().map(|r| r.value).collect();

            if values.is_empty() {
                dict.set_item("count", 0)?;
                dict.set_item("sum", 0.0)?;
                dict.set_item("mean", 0.0)?;
                dict.set_item("min", 0.0)?;
                dict.set_item("max", 0.0)?;
            } else {
                let sum: f64 = values.par_iter().sum();
                let count = values.len();
                let mean = sum / count as f64;
                let min = values.par_iter().cloned().reduce(|| f64::MAX, f64::min);
                let max = values.par_iter().cloned().reduce(|| f64::MIN, f64::max);

                dict.set_item("count", count)?;
                dict.set_item("sum", sum)?;
                dict.set_item("mean", mean)?;
                dict.set_item("min", min)?;
                dict.set_item("max", max)?;
            }

            Ok(dict.into())
        })
    }

    /// Group records by active status
    fn group_by_active(&self) -> PyResult<PyObject> {
        Python::with_gil(|py| {
            let dict = pyo3::types::PyDict::new(py);

            let (active, inactive): (Vec<_>, Vec<_>) =
                self.records.iter().cloned().partition(|r| r.active);

            dict.set_item("active", active)?;
            dict.set_item("inactive", inactive)?;

            Ok(dict.into())
        })
    }

    /// Get number of records
    fn __len__(&self) -> usize {
        self.records.len()
    }

    fn __repr__(&self) -> String {
        format!("DataProcessor(records={})", self.records.len())
    }
}
```

### 7. Async Operations (src/async_ops.rs)

```rust
use pyo3::prelude::*;
use pyo3_asyncio::tokio::future_into_py;
use std::time::Duration;
use tokio::time::sleep;

/// Async computation example
#[pyfunction]
pub fn async_compute(py: Python<'_>, iterations: u64) -> PyResult<&PyAny> {
    future_into_py(py, async move {
        let mut result = 0.0f64;

        for i in 0..iterations {
            result += (i as f64).sin();

            // Yield periodically to not block the event loop
            if i % 10000 == 0 {
                sleep(Duration::from_micros(1)).await;
            }
        }

        Ok(result)
    })
}

/// Parallel fetch simulation (demonstrates concurrent async)
#[pyfunction]
pub fn parallel_fetch(py: Python<'_>, urls: Vec<String>) -> PyResult<&PyAny> {
    future_into_py(py, async move {
        let handles: Vec<_> = urls
            .into_iter()
            .map(|url| {
                tokio::spawn(async move {
                    // Simulate network request
                    sleep(Duration::from_millis(100)).await;
                    format!("Response from: {}", url)
                })
            })
            .collect();

        let mut results = Vec::new();
        for handle in handles {
            results.push(handle.await.unwrap());
        }

        Ok(results)
    })
}

/// Async task with progress callback
#[pyfunction]
pub fn async_with_progress<'py>(
    py: Python<'py>,
    total: u64,
    callback: PyObject,
) -> PyResult<&'py PyAny> {
    future_into_py(py, async move {
        let mut result = 0u64;

        for i in 0..total {
            result += i;

            // Report progress every 10%
            if i % (total / 10).max(1) == 0 {
                let progress = (i as f64 / total as f64) * 100.0;
                Python::with_gil(|py| {
                    let _ = callback.call1(py, (progress,));
                });
            }

            // Yield occasionally
            if i % 1000 == 0 {
                sleep(Duration::from_micros(1)).await;
            }
        }

        Ok(result)
    })
}
```

### 8. Type Stubs (python/rust_extension/__init__.pyi)

```python
"""Type stubs for rust_extension module."""

from typing import List, Optional, Dict, Any, Callable, Awaitable
import numpy as np
from numpy.typing import NDArray

__version__: str

# Math operations
def fibonacci(n: int) -> int: ...
def is_prime(n: int) -> bool: ...
def sieve_primes(n: int) -> List[int]: ...
def factorial(n: int) -> int: ...
def count_primes_parallel(start: int, end: int) -> int: ...

# Array operations
def sum_array(arr: NDArray[np.float64]) -> float: ...
def sum_array_parallel(arr: NDArray[np.float64]) -> float: ...
def dot_product(a: NDArray[np.float64], b: NDArray[np.float64]) -> float: ...
def matrix_multiply(
    a: NDArray[np.float64], b: NDArray[np.float64]
) -> NDArray[np.float64]: ...
def parallel_map(
    arr: NDArray[np.float64], operation: str
) -> NDArray[np.float64]: ...
def elementwise_op(
    a: NDArray[np.float64], b: NDArray[np.float64], operation: str
) -> NDArray[np.float64]: ...

# Data processing
class Record:
    id: int
    name: str
    value: float
    active: bool

    def __init__(self, id: int, name: str, value: float, active: bool) -> None: ...
    def to_dict(self) -> Dict[str, Any]: ...

def parse_json_records(json_strings: List[str]) -> List[Record]: ...
def filter_records(
    records: List[Record],
    min_value: Optional[float] = None,
    active_only: bool = False,
) -> List[Record]: ...

class DataProcessor:
    def __init__(self) -> None: ...
    def load_json(self, json_strings: List[str]) -> int: ...
    def add_record(self, record: Record) -> None: ...
    def get_records(self) -> List[Record]: ...
    def filter(
        self, min_value: Optional[float] = None, active_only: bool = False
    ) -> List[Record]: ...
    def statistics(self) -> Dict[str, Any]: ...
    def group_by_active(self) -> Dict[str, List[Record]]: ...
    def __len__(self) -> int: ...

# Async operations
async def async_compute(iterations: int) -> float: ...
async def parallel_fetch(urls: List[str]) -> List[str]: ...
async def async_with_progress(
    total: int, callback: Callable[[float], None]
) -> int: ...
```

### 9. Python Tests (tests/test_rust_extension.py)

```python
"""Tests for rust_extension module."""

import pytest
import numpy as np
import json
import asyncio

import rust_extension as rs


class TestMathOps:
    def test_fibonacci(self):
        assert rs.fibonacci(0) == 0
        assert rs.fibonacci(1) == 1
        assert rs.fibonacci(10) == 55
        assert rs.fibonacci(20) == 6765

    def test_is_prime(self):
        assert not rs.is_prime(0)
        assert not rs.is_prime(1)
        assert rs.is_prime(2)
        assert rs.is_prime(17)
        assert not rs.is_prime(18)

    def test_sieve_primes(self):
        primes = rs.sieve_primes(30)
        assert primes == [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]

    def test_factorial(self):
        assert rs.factorial(0) == 1
        assert rs.factorial(5) == 120
        assert rs.factorial(10) == 3628800


class TestArrayOps:
    def test_sum_array(self):
        arr = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
        assert rs.sum_array(arr) == 15.0

    def test_dot_product(self):
        a = np.array([1.0, 2.0, 3.0])
        b = np.array([4.0, 5.0, 6.0])
        assert rs.dot_product(a, b) == 32.0

    def test_dot_product_mismatch(self):
        a = np.array([1.0, 2.0])
        b = np.array([1.0, 2.0, 3.0])
        with pytest.raises(ValueError):
            rs.dot_product(a, b)

    def test_matrix_multiply(self):
        a = np.array([[1.0, 2.0], [3.0, 4.0]])
        b = np.array([[5.0, 6.0], [7.0, 8.0]])
        result = rs.matrix_multiply(a, b)
        expected = np.array([[19.0, 22.0], [43.0, 50.0]])
        np.testing.assert_array_almost_equal(result, expected)

    def test_parallel_map(self):
        arr = np.array([1.0, 4.0, 9.0, 16.0])
        result = rs.parallel_map(arr, "sqrt")
        expected = np.array([1.0, 2.0, 3.0, 4.0])
        np.testing.assert_array_almost_equal(result, expected)


class TestDataProcessing:
    def test_record_creation(self):
        record = rs.Record(1, "test", 42.0, True)
        assert record.id == 1
        assert record.name == "test"
        assert record.value == 42.0
        assert record.active is True

    def test_parse_json_records(self):
        json_strings = [
            '{"id": 1, "name": "a", "value": 1.0, "active": true}',
            '{"id": 2, "name": "b", "value": 2.0, "active": false}',
        ]
        records = rs.parse_json_records(json_strings)
        assert len(records) == 2
        assert records[0].id == 1
        assert records[1].active is False

    def test_filter_records(self):
        records = [
            rs.Record(1, "a", 10.0, True),
            rs.Record(2, "b", 20.0, False),
            rs.Record(3, "c", 30.0, True),
        ]
        filtered = rs.filter_records(records, min_value=15.0, active_only=True)
        assert len(filtered) == 1
        assert filtered[0].id == 3

    def test_data_processor(self):
        processor = rs.DataProcessor()
        processor.add_record(rs.Record(1, "a", 10.0, True))
        processor.add_record(rs.Record(2, "b", 20.0, True))

        assert len(processor) == 2

        stats = processor.statistics()
        assert stats["count"] == 2
        assert stats["sum"] == 30.0
        assert stats["mean"] == 15.0


class TestAsyncOps:
    @pytest.mark.asyncio
    async def test_async_compute(self):
        result = await rs.async_compute(1000)
        assert isinstance(result, float)

    @pytest.mark.asyncio
    async def test_parallel_fetch(self):
        urls = ["http://example.com/1", "http://example.com/2"]
        results = await rs.parallel_fetch(urls)
        assert len(results) == 2


class TestPerformance:
    """Performance comparison tests."""

    def test_fibonacci_performance(self):
        import time

        # Rust version
        start = time.perf_counter()
        rust_result = rs.fibonacci(40)
        rust_time = time.perf_counter() - start

        # Python version
        def py_fib(n):
            if n <= 1:
                return n
            a, b = 0, 1
            for _ in range(2, n + 1):
                a, b = b, a + b
            return b

        start = time.perf_counter()
        py_result = py_fib(40)
        py_time = time.perf_counter() - start

        assert rust_result == py_result
        # Rust should be faster (but not always for simple operations)
        print(f"\nFibonacci(40): Rust={rust_time:.6f}s, Python={py_time:.6f}s")

    def test_sieve_performance(self):
        import time

        n = 1_000_000

        # Rust version
        start = time.perf_counter()
        rust_primes = rs.sieve_primes(n)
        rust_time = time.perf_counter() - start

        print(f"\nSieve({n}): Rust={rust_time:.4f}s, found {len(rust_primes)} primes")
        assert len(rust_primes) > 0
```

### 10. Build and Usage

```bash
# Development build
maturin develop

# Release build
maturin build --release

# Install in current environment
pip install .

# Build wheel for distribution
maturin build --release --out dist/

# Run tests
pytest tests/ -v

# Type checking
mypy python/
```

### Python Usage Example

```python
import numpy as np
import rust_extension as rs
import asyncio

# Math operations
print(f"Fibonacci(30) = {rs.fibonacci(30)}")
print(f"Is 17 prime? {rs.is_prime(17)}")
print(f"Primes up to 50: {rs.sieve_primes(50)}")

# Array operations with NumPy
arr = np.random.rand(1_000_000)
print(f"Sum: {rs.sum_array(arr)}")
print(f"Parallel sum: {rs.sum_array_parallel(arr)}")

# Matrix multiplication
a = np.random.rand(100, 100)
b = np.random.rand(100, 100)
result = rs.matrix_multiply(a, b)

# Data processing
processor = rs.DataProcessor()
processor.add_record(rs.Record(1, "Alice", 100.0, True))
processor.add_record(rs.Record(2, "Bob", 200.0, False))
print(processor.statistics())

# Async operations
async def main():
    result = await rs.async_compute(100_000)
    print(f"Async result: {result}")

    responses = await rs.parallel_fetch([
        "http://api.example.com/1",
        "http://api.example.com/2",
    ])
    print(f"Responses: {responses}")

asyncio.run(main())
```

## Key Takeaways

1. **Zero-Copy Arrays**: NumPy arrays accessible without copying
2. **Parallel Processing**: rayon for automatic parallelization
3. **Type Safety**: Type stubs for IDE support and mypy
4. **Async Support**: pyo3-asyncio for Python async/await
5. **maturin**: Easy build and distribution
6. **Performance**: 10-100x speedup for CPU-intensive operations
7. **Python Classes**: Full class support with PyO3

This extension module pattern is production-ready for accelerating Python applications.
