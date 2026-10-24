import {
  EARTH_RADIUS,
  STANDARD_G,
  EARTH_OMEGA_0,
  GM_PRODUCT,
  G_CONST,
  EARTH_MASS
} from './constants';
import { HscGravityEvaluation } from '../types';

/**
 * Evaluates the full HSC Physics Gravity Formula Engine:
 * 1. Altitude: g_h = g * R^2 / (R + h)^2
 *    Approximation (h << R): g_h ≈ g * (1 - 2h / R)
 *    Relative error: |g_exact - g_approx| / g_exact * 100%
 * 2. Depth: g_d = g * (1 - d / R)
 * 3. Latitude: g' = g_base - omega^2 * R * cos^2(lambda)
 * 4. Combined Effect: breakdown of spatial loss vs centrifugal loss
 * 5. Orbital Mechanics: v_o = sqrt(GM / (R+h)), T = 2π * sqrt((R+h)^3 / GM), v_e = sqrt(2GM / (R+h))
 */
export function evaluateHscGravity(
  r: number,
  latitudeDeg: number = 0,
  testMassKg: number = 50,
  rotationMultiplier: number = 1.0,
  R: number = EARTH_RADIUS,
  g0: number = STANDARD_G
): HscGravityEvaluation {
  // Clamp r >= 0
  const clampedR = Math.max(0, r);
  const isInside = clampedR < R;
  const isAtSurface = Math.abs(clampedR - R) < 100; // within 100m
  const isOutside = clampedR > R;

  const altitudeM = Math.max(0, clampedR - R);
  const altitudeKm = altitudeM / 1000;
  const depthM = Math.max(0, R - clampedR);
  const depthKm = depthM / 1000;

  // 1 & 2: Base gravity calculation based on position
  let gExact = 0;
  let gApprox: number | null = null;
  let approxErrorPercent: number | null = null;

  if (isInside) {
    // Depth Formula: g_d = g * (1 - d / R) = g * (r / R)
    // Linearly drops to 0 at the center (r = 0, d = R)
    gExact = g0 * (clampedR / R);
  } else {
    // Altitude Formula: g_h = g * R^2 / (R + h)^2
    gExact = g0 * Math.pow(R / (R + altitudeM), 2);

    // Approximation formula for h << R: g_h ≈ g * (1 - 2h / R)
    const approxVal = g0 * (1 - (2 * altitudeM) / R);
    gApprox = Math.max(0, approxVal);

    if (gExact > 0) {
      approxErrorPercent = (Math.abs(gExact - gApprox) / gExact) * 100;
    }
  }

  const gBase = gExact;

  // 3: Latitude and Diurnal Rotation Effect
  // g' = g - omega^2 * r * cos^2(lambda)
  const latRad = (latitudeDeg * Math.PI) / 180;
  const cosLat = Math.cos(latRad);
  const omega = rotationMultiplier * EARTH_OMEGA_0;

  // Centrifugal acceleration perpendicular to Earth's axis: a_c = omega^2 * (r * cosLat)
  const centrifugalAccel = Math.pow(omega, 2) * clampedR * cosLat;

  // Radial outward deductible: Delta g_rot = omega^2 * r * cos^2(lambda)
  const centrifugalDeductible = Math.pow(omega, 2) * clampedR * Math.pow(cosLat, 2);

  // 4: Combined Loss Breakdown
  const deltaG_spatial = Math.max(0, g0 - gBase);
  const deltaG_rot = centrifugalDeductible;
  const deltaG_total = deltaG_spatial + deltaG_rot;

  // Effective gravity at probe's location (clamped to 0)
  const effectiveG = Math.max(0, gBase - deltaG_rot);
  const isWeightless = effectiveG <= 0.0001;

  // Effective weight and scale reading
  const apparentWeightN = testMassKg * effectiveG;
  const scaleReadingKg = apparentWeightN / g0;

  // 5: Orbital & Escape Mechanics (at r = R + h)
  const orbitalRadius = Math.max(clampedR, 1000); // avoid div by 0
  const orbitalVelocity = Math.sqrt(GM_PRODUCT / orbitalRadius);
  const orbitalVelocityKmS = orbitalVelocity / 1000;
  const escapeVelocity = Math.sqrt((2 * GM_PRODUCT) / orbitalRadius);
  const escapeVelocityKmS = escapeVelocity / 1000;

  // Period T = 2π * sqrt(r^3 / GM)
  const orbitalPeriodSec = 2 * Math.PI * Math.sqrt(Math.pow(orbitalRadius, 3) / GM_PRODUCT);

  const totalSecs = Math.round(orbitalPeriodSec);
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  let periodText = '';
  if (hours > 0) {
    periodText = `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    periodText = `${minutes}m ${seconds}s`;
  } else {
    periodText = `${seconds}s`;
  }

  return {
    r: clampedR,
    altitudeM,
    altitudeKm,
    depthM,
    depthKm,
    latitudeDeg,
    isInside,
    isAtSurface,
    isOutside,
    gBase,
    gExact,
    gApprox,
    approxErrorPercent,
    omega,
    centrifugalAccel,
    centrifugalDeductible,
    deltaG_spatial,
    deltaG_rot,
    deltaG_total,
    effectiveG,
    apparentWeightN,
    scaleReadingKg,
    isWeightless,
    orbitalVelocity,
    orbitalVelocityKmS,
    escapeVelocity,
    escapeVelocityKmS,
    orbitalPeriodSec,
    orbitalPeriodFormatted: {
      hours,
      minutes,
      seconds,
      text: periodText
    }
  };
}

/**
 * Step tunnel SHM simulation using Velocity Verlet integrator.
 */
export function stepVerletTunnel(
  currentY: number,
  currentV: number,
  dt: number,
  densityMultiplier: number = 1.0,
  R: number = EARTH_RADIUS,
  g0: number = STANDARD_G
): { nextY: number; nextV: number; nextA: number } {
  const getAccel = (y: number) => {
    const absY = Math.abs(y);
    if (absY <= 1e-4) return 0;
    const baseG = g0 * densityMultiplier;
    if (absY <= R) {
      // Linear restoring force inside: a = - (g * rho / R) * y
      return -(baseG / R) * y;
    } else {
      // Inverse square law outside: a = - g * rho * (R / y)^2
      return -Math.sign(y) * baseG * Math.pow(R / absY, 2);
    }
  };

  const a0 = getAccel(currentY);
  const nextY = currentY + currentV * dt + 0.5 * a0 * dt * dt;
  const a1 = getAccel(nextY);
  const nextV = currentV + 0.5 * (a0 + a1) * dt;

  return {
    nextY,
    nextV,
    nextA: a1
  };
}

/**
 * Evaluates the effect of Earth's diurnal rotation at latitude lambda.
 */
export function evaluateRotationAtLatitude(
  latitudeDeg: number,
  omegaMultiplier: number = 1.0,
  objectMass: number = 70,
  R: number = EARTH_RADIUS,
  g0: number = STANDARD_G
) {
  const evalRes = evaluateHscGravity(R, latitudeDeg, objectMass, omegaMultiplier, R, g0);
  const latRad = (latitudeDeg * Math.PI) / 180;
  const cosLat = Math.cos(latRad);
  const omega = evalRes.omega;

  const radiusOfParallel = R * cosLat;
  const linearSpeedKmS = (omega * radiusOfParallel) / 1000;

  // Threshold omega where g' becomes 0 at this specific latitude:
  // g0 = omega_crit^2 * R * cos^2(lambda)  =>  omega_crit = sqrt(g0 / R) / cos(lambda)
  const isPole = Math.abs(cosLat) < 1e-4;
  const criticalOmega = !isPole ? Math.sqrt(g0 / R) / cosLat : Infinity;
  const criticalMultiplier = !isPole ? criticalOmega / EARTH_OMEGA_0 : Infinity;
  const criticalLinearSpeedKmS = !isPole ? (criticalOmega * radiusOfParallel) / 1000 : Infinity;

  // Percentage toward reaching floating threshold (100% = floats)
  const percentToFloat = Math.min(100, (evalRes.centrifugalDeductible / g0) * 100);
  const isWeightless = evalRes.effectiveG <= 0.0001;

  return {
    latitudeRad: latRad,
    cosLat,
    omega,
    trueG: g0,
    radiusOfParallel,
    linearSpeedKmS,
    centrifugalAccel: evalRes.centrifugalAccel,
    centrifugalDeductible: evalRes.centrifugalDeductible,
    effectiveG: evalRes.effectiveG,
    effectiveGExact: evalRes.gExact - evalRes.centrifugalDeductible,
    apparentWeight: evalRes.apparentWeightN,
    scaleReadingKg: evalRes.scaleReadingKg,
    isWeightless,
    criticalOmega,
    criticalMultiplier,
    criticalLinearSpeedKmS,
    percentToFloat
  };
}

// Backward compatibility helper
export function evaluateEarthExplorer(r: number, testMass: number = 50) {
  const res = evaluateHscGravity(r, 0, testMass);
  return {
    r,
    altitude: res.altitudeM,
    depth: res.depthM,
    isInside: res.isInside,
    g: res.effectiveG,
    gPercent: (res.effectiveG / STANDARD_G) * 100,
    potential: 0,
    enclosedMass: EARTH_MASS * Math.pow(Math.min(1, r / EARTH_RADIUS), 3),
    enclosedMassFraction: Math.pow(Math.min(1, r / EARTH_RADIUS), 3),
    shieldedMass: EARTH_MASS * (1 - Math.pow(Math.min(1, r / EARTH_RADIUS), 3)),
    shieldedMassFraction: 1 - Math.pow(Math.min(1, r / EARTH_RADIUS), 3),
    orbitalVelocity: res.orbitalVelocity,
    orbitalPeriodMin: res.orbitalPeriodSec / 60,
    escapeVelocity: res.escapeVelocity,
    apparentWeight: res.apparentWeightN,
    scaleReadingKg: res.scaleReadingKg
  };
}

export function evaluateSolidEarthGravity(y: number, densityMultiplier: number = 1.0, R: number = EARTH_RADIUS) {
  const r = Math.abs(y);
  const isInside = r <= R;
  const baseG0 = STANDARD_G * densityMultiplier;
  const gMag = isInside ? baseG0 * (r / R) : baseG0 * Math.pow(R / r, 2);
  const accelY = r === 0 ? 0 : -Math.sign(y) * gMag;
  return {
    r,
    g: gMag,
    accelY,
    potential: 0,
    isInside,
    enclosedMassFraction: isInside ? Math.pow(r / R, 3) : 1.0
  };
}

export function evaluateHollowShell(
  x: number,
  y: number,
  shellRadius: number = EARTH_RADIUS,
  shellMass: number = EARTH_MASS
) {
  const r = Math.hypot(x, y);
  const isInside = r < shellRadius;
  if (isInside) {
    return {
      r,
      fieldMagnitude: 0,
      fieldX: 0,
      fieldY: 0,
      potential: - (G_CONST * shellMass) / shellRadius,
      isInside: true
    };
  } else {
    const fieldMag = (G_CONST * shellMass) / Math.max(r * r, 1);
    const unitX = r > 0 ? x / r : 0;
    const unitY = r > 0 ? y / r : 0;
    return {
      r,
      fieldMagnitude: fieldMag,
      fieldX: -unitX * fieldMag,
      fieldY: -unitY * fieldMag,
      potential: - (G_CONST * shellMass) / Math.max(r, 1),
      isInside: false
    };
  }
}
