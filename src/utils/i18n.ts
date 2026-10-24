import { Language } from '../types';

export const translations = {
  en: {
    appTitle: 'Gravity & Gravitational Motion Lab',
    appSubtitle: '',
    hscBadge: 'HSC PHYSICS',
    udvashBadge: 'UDVASH',
    tabExplorer: 'Universal Earth Cross-Section & Orbit Lab',
    tabTunnel: 'Gravity Tunnel SHM Lab',
    tabRotation: 'Diurnal Spin & Floating Velocity Lab',
    theoryDrawer: 'HSC Formulas & Derivations',
    challenges: 'Student Practice Challenges',
    soundToggle: 'Audio',
    reset: 'Reset',
    play: 'Play',
    pause: 'Pause',
    step: 'Step',
    speedMultiplier: 'Simulation Speed',
    startOrbit: 'Start Orbit / Motion',
    dropObject: 'Drop Toward Center',
    
    // Core Formula Sections
    altitudeSection: '1. Altitude Effect (h above surface)',
    depthSection: '2. Depth Effect (d below surface)',
    latitudeSection: '3. Latitude & Earth Rotation (λ & ω)',
    combinedSection: '4. Combined Effect Breakdown',
    orbitalSection: '5. Orbital & Escape Velocity Mechanics',

    // Specific Formulas
    formulaExactAlt: 'g_h = g · R² / (R + h)²',
    formulaApproxAlt: 'g_h ≈ g(1 - 2h / R) [for h ≪ R]',
    formulaDepth: 'g_d = g(1 - d / R)',
    formulaLatitude: "g' = g - ω² R cos²λ",
    formulaOrbitalV: 'v_o = √(GM / (R + h))',
    formulaPeriod: 'T = 2π √((R + h)³ / GM)',
    formulaEscapeV: 'v_e = √(2GM / (R + h))',

    // Telemetry labels
    telemetryTitle: 'Live Telemetry & Value Cards',
    radialDistance: 'Radial Distance (r)',
    altitudeH: 'Altitude (h)',
    depthD: 'Depth (d)',
    localG: 'Local Gravity g',
    effectiveG: "Effective Gravity g'",
    effectiveWeight: 'Effective Weight (W = m·g\')',
    scaleReading: 'Scale Reading',
    testMass: 'Test Object Mass (m)',
    orbitalSpeed: 'Orbital Speed (v_o)',
    orbitalPeriod: 'Orbital Period (T)',
    escapeSpeed: 'Escape Velocity (v_e)',
    approxToggle: 'Show Approximation Formula (h ≪ R)',
    approxError: 'Approximation Error',
    spinSpeed: 'Earth Spin Speed (ω)',
    spinMultiplier: 'Spin Multiplier',
    floatDiscoveryPrompt: 'Increase Earth spin speed to discover at what threshold velocity the object starts floating!',
    floatingStatus: '🎉 Airborne! Object is Weightless',
    groundedStatus: 'Grounded on Scale',
    requiredSpeedToFloat: 'Required Threshold Speed to Float',
    currentSpeed: 'Current Linear Speed',
    
    // Presets
    presetsTitle: 'HSC Exam Quick-Jump Presets',
    presetEquator: 'Equator (λ = 0°)',
    presetDhaka: 'Dhaka (λ ≈ 23.8°)',
    presetPoles: 'North Pole (λ = 90°)',
    presetEverest: 'Mt. Everest (h = 8.848 km)',
    presetISS: 'ISS / LEO (h ≈ 408 km)',
    presetGEO: 'Geostationary Orbit (h ≈ 35,786 km)',
    presetCenter: 'Center of Earth (d = R, g = 0)',
    presetBorehole: 'Deep Borehole (d = 12 km)',

    // Vector toggles
    vectorsTitle: 'Vector Overlays',
    trueGravityVec: 'Gravitational Acceleration (g)',
    velocityVec: 'Tangential Velocity (v)',
    centrifugalVec: 'Centrifugal Acceleration (a_c)',
    trajectoryVec: 'Trajectory / Orbital Path',
    latitudeLines: 'Latitude Parallels & Dhaka Arc',
    gridViewVec: 'Measurement Grid',
    fullscreen: 'Full Screen',

    // Statuses
    weightlessBanner: 'CRITICAL WEIGHTLESSNESS ACHIEVED (ওজনহীনতা)',
    weightlessDesc: 'Centrifugal acceleration equals gravitational acceleration! Scale reads 0.0000 N.',
    statusRunning: 'RUNNING',
    statusPaused: 'PAUSED',
    insideCore: 'Inside Earth Core / Mantle',
    atSurface: 'At Earth Surface (Sea Level)',
    inOrbit: 'In Outer Space / Orbit'
  },
  bn: {
    appTitle: 'মহাকর্ষ ও গতিবিদ্যা ল্যাব',
    appSubtitle: '',
    hscBadge: 'HSC PHYSICS',
    udvashBadge: 'UDVASH',
    tabExplorer: 'পৃথিবীর প্রস্থচ্ছেদ ও উপগ্রহের কক্ষপথ ল্যাব',
    tabTunnel: 'পৃথিবীর সুড়ঙ্গে সরল ছন্দিত স্পন্দন',
    tabRotation: 'আহ্নিক ঘূর্ণন ও ভাসমান বেগ ল্যাব',
    theoryDrawer: 'এইচএসসি সূত্র ও গাণিতিক প্রতিপাদন',
    challenges: 'বোর্ড ও ভর্তি পরীক্ষা প্র্যাকটিস',
    soundToggle: 'শব্দ',
    reset: 'রিসেট',
    play: 'চালান',
    pause: 'বিরতি',
    step: 'ধাপ',
    speedMultiplier: 'সিমুলেশন গতি',
    startOrbit: 'কক্ষপথে আবর্তন শুরু করুন',
    dropObject: 'কেন্দ্রে মুক্তপতন ঘটান',

    // Core Formula Sections
    altitudeSection: '১. উচ্চতার প্রভাব (ভূ-পৃষ্ঠ থেকে h উচ্চতায়)',
    depthSection: '২. গভীরতার প্রভাব (ভূ-অভ্যন্তরে d গভীরতায়)',
    latitudeSection: '৩. অক্ষাংশ ও পৃথিবীর ঘূর্ণন (λ ও ω)',
    combinedSection: '৪. সম্মিলিত প্রভাবের বিশ্লেষণ (Combined Loss)',
    orbitalSection: '৫. উপগ্রহের বেগ, পর্যায়কাল ও মুক্তিবেগ',

    // Specific Formulas
    formulaExactAlt: 'g_h = g · R² / (R + h)²',
    formulaApproxAlt: 'g_h ≈ g(1 - 2h / R) [যখন h ≪ R]',
    formulaDepth: 'g_d = g(1 - d / R)',
    formulaLatitude: "g' = g - ω² R cos²λ",
    formulaOrbitalV: 'v_o = √(GM / (R + h))',
    formulaPeriod: 'T = 2π √((R + h)³ / GM)',
    formulaEscapeV: 'v_e = √(2GM / (R + h))',

    // Telemetry labels
    telemetryTitle: 'লাইভ টেলিমেট্রি ও মানসমূহ',
    radialDistance: 'কেন্দ্র থেকে দূরত্ব (r)',
    altitudeH: 'উচ্চতা (h)',
    depthD: 'গভীরতা (d)',
    localG: 'অভিকর্ষজ ত্বরণ g',
    effectiveG: "কার্যকরী ত্বরণ g'",
    effectiveWeight: "আপাত ওজন (W = m·g')",
    scaleReading: 'স্প্রিং নিক্তির পাঠ',
    testMass: 'বস্তুর ভর (m)',
    orbitalSpeed: 'কক্ষপথীয় বেগ (v_o)',
    orbitalPeriod: 'পর্যায়কাল (T)',
    escapeSpeed: 'মুক্তিবেগ (v_e)',
    approxToggle: 'আসন্ন সূত্র প্রদর্শন (h ≪ R)',
    approxError: 'আসন্ন সূত্রের আপেক্ষিক ত্রুটি',
    spinSpeed: 'ঘূর্ণন দ্রুতি (ω)',
    spinMultiplier: 'ঘূর্ণন গুণক',
    floatDiscoveryPrompt: 'ঘূর্ণন দ্রুতি বৃদ্ধি করে আবিষ্কার করুন ঠিক কত বেগে পৌঁছালে বস্তুটি নিক্তি ছেড়ে বাতাসে ভাসতে শুরু করে!',
    floatingStatus: '🎉 ভাসমান! বস্তুটি বায়বীয় ওজনহীন',
    groundedStatus: 'মাটিতে সংযুক্ত',
    requiredSpeedToFloat: 'ভাসার আবশ্যকীয় বেগ',
    currentSpeed: 'বর্তমান রৈখিক বেগ',

    // Presets
    presetsTitle: 'এইচএসসি পরীক্ষার স্ট্যান্ডার্ড প্রিসেট',
    presetEquator: 'বিষুবরেখা (λ = ০°)',
    presetDhaka: 'ঢাকা (λ ≈ ২৩.৮°)',
    presetPoles: 'উত্তর মেরু (λ = ৯০°)',
    presetEverest: 'মাউন্ট এভারেস্ট (h = ৮.৮৪৮ কিমি)',
    presetISS: 'আন্তর্জাতিক মহাকাশ স্টেশন (h ≈ ৪০৮ কিমি)',
    presetGEO: 'ভূ-স্থির উপগ্রহ (h ≈ ৩৫,৭৮৬ কিমি)',
    presetCenter: 'পৃথিবীর কেন্দ্র (d = R, g = ০)',
    presetBorehole: 'গভীর বোরহোল (d = ১২ কিমি)',

    // Vector toggles
    vectorsTitle: 'ভেক্টর প্রদর্শন অপশন',
    trueGravityVec: 'মহাকর্ষ বল / ত্বরণ (g)',
    velocityVec: 'স্পর্শকীয় কক্ষপথীয় বেগ (v)',
    centrifugalVec: 'কেন্দ্রবিমুখী ত্বরণ (a_c)',
    trajectoryVec: 'কক্ষপথীয় ট্র্যাজেক্টরি লাইন',
    latitudeLines: 'অক্ষাংশ রেখা ও ঢাকার কোণ',
    gridViewVec: 'পরিমাপ গ্রিড ভিউ',
    fullscreen: 'ফুল স্ক্রিন',

    // Statuses
    weightlessBanner: 'সংকট ওজনহীনতা অর্জিত (Weightless!)',
    weightlessDesc: 'কেন্দ্রবিমুখী ত্বরণ অভিকর্ষ ত্বরণের সমান হওয়ায় নিক্তির পাঠ ০.০০০০ নিউটন!',
    statusRunning: 'চলমান',
    statusPaused: 'স্থগিত',
    insideCore: 'ভূ-অভ্যন্তরে (Core / Mantle)',
    atSurface: 'ভূ-পৃষ্ঠে (সমুদ্রপৃষ্ঠ, r = R)',
    inOrbit: 'মহাকাশে / উপগ্রহ কক্ষপথে'
  }
};

export function getTranslation(lang: Language) {
  return translations[lang] || translations.en;
}
