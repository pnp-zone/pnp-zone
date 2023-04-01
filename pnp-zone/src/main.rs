//! # pnp-zone
//!
//! A pen and paper platform
#![warn(missing_docs, unused_imports, clippy::unwrap_used, clippy::expect_used)]
#![cfg_attr(
    feature = "rorm-main",
    allow(dead_code, unused_variables, unused_imports)
)]

#[rorm::rorm_main]
#[tokio::main]
async fn main() {
    println!("Hello, world!");
}
