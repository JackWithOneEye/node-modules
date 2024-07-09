/// Pade approximant continued fraction
pub fn tan(x: f32) -> f32 {
    let x2 = x * x;
    let numerator = x * (-135135.0 + x2 * (17325.0 + x2 * (-378.0 + x2)));
    let denominator = -135135.0 + x2 * (62370.0 + x2 * (-3150.0 + 28.0 * x2));
    numerator / denominator
}

/// Pade approximant continued fraction
pub fn sin(x: f32) -> f32 {
    let x2 = x * x;
    let numerator =
        -x * (-11511339840.0 + x2 * (1640635920.0 + x2 * (-52785432.0 + x2 * 479249.0)));
    let denominator = 11511339840.0 + x2 * (277920720.0 + x2 * (3177720.0 + x2 * 18361.0));
    numerator / denominator
}
