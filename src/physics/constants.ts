// Standard Physical and Astronomical Constants for HSC Physics (NCTB Syllabus)
export const G_CONST = 6.673e-11; // Gravitational constant N·m²/kg² (HSC standard)

// Standard Earth Parameters (HSC Standard)
export const EARTH_RADIUS = 6.4e6; // Mean Earth radius in meters (6,400 km)
export const EARTH_MASS = 5.98e24; // Earth mass in kg (HSC standard)
export const STANDARD_G = 9.8; // Standard surface acceleration due to gravity (m/s²)
export const EARTH_OMEGA_0 = 7.292e-5; // Earth diurnal rotation rate (rad/s)

// GM product consistent with g = GM / R^2 = 9.8 m/s² at R = 6400 km
// GM = g * R^2 = 9.8 * (6.4e6)^2 = 4.01408e14 m³/s²
export const GM_PRODUCT = STANDARD_G * EARTH_RADIUS * EARTH_RADIUS; // 4.01408e14 m³/s²

// Critical rotation multiplier for weightlessness at Equator:
// g = (omega_crit)^2 * R  =>  omega_crit = sqrt(g / R) = sqrt(9.8 / 6.4e6) ≈ 1.2374e-3 rad/s
// omega_crit / omega_0 ≈ 1.2374e-3 / 7.292e-5 ≈ 16.97x ≈ 17.0x (Classic HSC 17x question)
export const CRITICAL_ROTATION_MULTIPLIER = Math.sqrt(STANDARD_G / EARTH_RADIUS) / EARTH_OMEGA_0; // ~16.97 (17x)

// Theoretical Tunnel SHM Values for Earth R = 6400 km, g = 9.8 m/s²
export const THEORETICAL_OMEGA_SHM = Math.sqrt(STANDARD_G / EARTH_RADIUS); // rad/s ≈ 1.2374e-3
export const THEORETICAL_PERIOD_SECONDS = 2 * Math.PI * Math.sqrt(EARTH_RADIUS / STANDARD_G); // ≈ 5077.5 s ≈ 84.6 minutes
export const THEORETICAL_HALF_TRANSIT_SECONDS = THEORETICAL_PERIOD_SECONDS / 2; // ≈ 2538.7 s ≈ 42.3 minutes
export const THEORETICAL_MAX_VELOCITY = Math.sqrt(STANDARD_G * EARTH_RADIUS); // ≈ 7919.6 m/s ≈ 7.92 km/s

// Key Heights and Altitudes
export const HEIGHT_EVEREST = 8848; // m (8.848 km)
export const DEPTH_BOREHOLE = 12262; // m (12.26 km, Kola Superdeep)
export const HEIGHT_ISS = 408000; // m (408 km)
export const HEIGHT_GEO = 35786000; // m (35,786 km - Geostationary)
export const LATITUDE_DHAKA = 23.8103; // degrees (Tropic of Cancer zone)
