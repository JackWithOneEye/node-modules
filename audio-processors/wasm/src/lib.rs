// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

pub mod adsr;
pub mod bit_crusher;
pub mod bypasser;
pub mod decimator;
pub mod graindr;
pub mod multi_filter;
pub mod multiplier;

mod dsp;
mod utils;