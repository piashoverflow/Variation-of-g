export type SimulationMode = 'explorer' | 'tunnel' | 'rotation';

export type Language = 'bn' | 'en';

export interface VectorDisplayOptions {
  showTrueGravity: boolean;      // g vector (crimson)
  showVelocity: boolean;         // v vector (emerald)
  showCentrifugal: boolean;      // centrifugal vector (amber)
  showEffectiveGravity: boolean; // effective g vector
  showTrajectory: boolean;       // orbit ellipse / drop line
  showLatitudeLines: boolean;    // equator, Dhaka, poles
  showApproximation: boolean;    // g(1 - 2h/R) overlay toggle
  showGridView: boolean;         // coordinate grid
  showFieldMesh: boolean;        // field lines
  showEquipotential: boolean;    // potential contours
  showGaussMass: boolean;        // enclosed mass
  showProofCones: boolean;       // shell theorem ray cones
}

export interface ExplorerState {
  r: number;                     // radial distance from center (m)
  latitudeDeg: number;           // latitude (-90 to +90 deg)
  angleRad: number;              // polar angle in radians
  testMass: number;              // test probe mass (kg)
  useApproximation: boolean;     // approximation toggle
  rotationMultiplier: number;    // Earth rotation multiplier (0x, 1x, 17x, custom)
  isRunning: boolean;            // animation active
  motionType: 'orbit' | 'drop' | 'static';
  orbitSpeedMultiplier: number;  // 0.5x, 1x, 2x, 5x
  viewScaleMode: 'geo' | 'leo' | 'surface' | 'core';
  isDragging: boolean;
  selectedPreset: string | null;
}

export interface HscGravityEvaluation {
  r: number;
  altitudeM: number;
  altitudeKm: number;
  depthM: number;
  depthKm: number;
  latitudeDeg: number;
  isInside: boolean;
  isAtSurface: boolean;
  isOutside: boolean;
  
  gBase: number;
  gExact: number;
  gApprox: number | null;
  approxErrorPercent: number | null;
  
  omega: number;
  centrifugalAccel: number;
  centrifugalDeductible: number;
  deltaG_spatial: number;
  deltaG_rot: number;
  deltaG_total: number;
  
  effectiveG: number;
  apparentWeightN: number;
  scaleReadingKg: number;
  isWeightless: boolean;
  
  orbitalVelocity: number;
  orbitalVelocityKmS: number;
  escapeVelocity: number;
  escapeVelocityKmS: number;
  orbitalPeriodSec: number;
  orbitalPeriodFormatted: {
    hours: number;
    minutes: number;
    seconds: number;
    text: string;
  };
}

export interface TunnelState {
  position: number;
  velocity: number;
  acceleration: number;
  releaseHeight: number;
  densityMultiplier: number;
  mass: number;
  isRunning: boolean;
  elapsedSeconds: number;
  halfTransitDetected: boolean;
  firstCrossingTime: number | null;
  timeSpeed: number;
  trail: { y: number; time: number }[];
}

export interface RotationState {
  latitudeDeg: number;
  rotationMultiplier: number;
  humanMass: number;
  globeAngle: number;
  isFloating: boolean;
  isRunning: boolean;
}

export interface ShellState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  shellRadius: number;
  shellMass: number;
  testMass: number;
  isDragging: boolean;
  isDrifting: boolean;
}

export interface Challenge {
  id: string;
  titleEn: string;
  titleBn: string;
  descEn: string;
  descBn: string;
  targetMode: SimulationMode;
  hintEn: string;
  hintBn: string;
  checkCompleted: (states: { explorer: ExplorerState; tunnel: TunnelState; rotation: RotationState }) => boolean;
}
