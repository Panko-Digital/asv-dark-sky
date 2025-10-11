/**
 * Moon brightness calculations for sky quality measurements
 */

export interface MoonData {
    phase: string;
    illumination: number; // 0-100%
    altitude?: number; // degrees above horizon
    azimuth?: number; // compass direction
}

/**
 * Calculate moon phase and illumination percentage
 */
export function calculateMoonPhase(date: Date): { phase: string; illumination: number } {
    // Known new moon: January 6, 2000, 18:14 UTC
    const knownNewMoon = new Date(2000, 0, 6, 18, 14).getTime();
    const lunarCycle = 29.53058867; // days

    const currentTime = date.getTime();
    const daysSinceNewMoon =
        (currentTime - knownNewMoon) / (1000 * 60 * 60 * 24);
    const currentPhase = (daysSinceNewMoon % lunarCycle) / lunarCycle;

    // Calculate illumination percentage (0-100)
    const illumination = Math.round(
        (1 - Math.cos(currentPhase * 2 * Math.PI)) * 50
    );

    let phase = "";
    if (currentPhase < 0.03 || currentPhase > 0.97) {
        phase = "New Moon";
    } else if (currentPhase < 0.22) {
        phase = "Waxing Crescent";
    } else if (currentPhase < 0.28) {
        phase = "First Quarter";
    } else if (currentPhase < 0.47) {
        phase = "Waxing Gibbous";
    } else if (currentPhase < 0.53) {
        phase = "Full Moon";
    } else if (currentPhase < 0.72) {
        phase = "Waning Gibbous";
    } else if (currentPhase < 0.78) {
        phase = "Last Quarter";
    } else {
        phase = "Waning Crescent";
    }

    return { phase, illumination };
}

/**
 * Calculate moon altitude using more accurate astronomical calculations
 * Based on simplified lunar position algorithms
 */
export function estimateMoonAltitude(
    date: Date,
    latitude: number,
    longitude: number
): number {
    // Convert to Julian Day Number
    const jd = dateToJulianDay(date);

    // Calculate moon's ecliptic coordinates
    const moonPos = calculateMoonPosition(jd);

    // Convert ecliptic to equatorial coordinates
    const equatorial = eclipticToEquatorial(moonPos.longitude, moonPos.latitude, jd);

    // Convert to local coordinates (altitude/azimuth)
    const local = equatorialToLocal(
        equatorial.rightAscension,
        equatorial.declination,
        latitude,
        longitude,
        date
    );

    return Math.max(0, local.altitude);
}

/**
 * Convert Date to Julian Day Number
 */
function dateToJulianDay(date: Date): number {
    const a = Math.floor((14 - (date.getMonth() + 1)) / 12);
    const y = date.getFullYear() + 4800 - a;
    const m = (date.getMonth() + 1) + 12 * a - 3;

    const jdn = date.getDate() + Math.floor((153 * m + 2) / 5) + 365 * y +
        Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;

    const hours = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;

    return jdn + (hours - 12) / 24;
}

/**
 * Calculate moon's ecliptic position (simplified)
 */
function calculateMoonPosition(jd: number): { longitude: number; latitude: number } {
    // Days since J2000.0
    const T = (jd - 2451545.0) / 36525;

    // Mean longitude of the moon
    const L0 = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T + T * T * T / 538841 - T * T * T * T / 65194000;

    // Mean elongation of the moon
    const D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T + T * T * T / 545868 - T * T * T * T / 113065000;

    // Sun's mean anomaly
    const M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T + T * T * T / 24490000;

    // Moon's mean anomaly
    const M1 = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T + T * T * T / 69699 - T * T * T * T / 14712000;

    // Moon's argument of latitude
    const F = 93.2720950 + 483202.0175233 * T - 0.0036539 * T * T - T * T * T / 3526000 + T * T * T * T / 863310000;

    // Convert to radians
    const D_rad = (D * Math.PI) / 180;
    const M_rad = (M * Math.PI) / 180;
    const M1_rad = (M1 * Math.PI) / 180;
    const F_rad = (F * Math.PI) / 180;

    // Main periodic terms (simplified - only major terms)
    let deltaL = 0;
    deltaL += 6.288774 * Math.sin(M1_rad);
    deltaL += 1.274027 * Math.sin(2 * D_rad - M1_rad);
    deltaL += 0.658314 * Math.sin(2 * D_rad);
    deltaL += 0.213618 * Math.sin(2 * M1_rad);
    deltaL -= 0.185116 * Math.sin(M_rad);
    deltaL -= 0.114332 * Math.sin(2 * F_rad);
    deltaL += 0.058793 * Math.sin(2 * (D_rad - M1_rad));
    deltaL += 0.057066 * Math.sin(2 * D_rad - M_rad - M1_rad);
    deltaL += 0.053322 * Math.sin(2 * D_rad + M1_rad);
    deltaL += 0.045758 * Math.sin(2 * D_rad - M_rad);

    let deltaB = 0;
    deltaB += 5.128122 * Math.sin(F_rad);
    deltaB += 0.280602 * Math.sin(M1_rad + F_rad);
    deltaB += 0.277693 * Math.sin(M1_rad - F_rad);
    deltaB += 0.173237 * Math.sin(2 * D_rad - F_rad);
    deltaB += 0.055413 * Math.sin(2 * D_rad - M1_rad + F_rad);
    deltaB += 0.046271 * Math.sin(2 * D_rad - M1_rad - F_rad);

    const longitude = (L0 + deltaL) % 360;
    const latitude = deltaB;

    return { longitude, latitude };
}

/**
 * Convert ecliptic to equatorial coordinates
 */
function eclipticToEquatorial(
    longitude: number,
    latitude: number,
    jd: number
): { rightAscension: number; declination: number } {
    // Obliquity of the ecliptic
    const T = (jd - 2451545.0) / 36525;
    const epsilon = 23.439291 - 0.0130042 * T - 0.000000164 * T * T + 0.000000504 * T * T * T;

    const lon_rad = (longitude * Math.PI) / 180;
    const lat_rad = (latitude * Math.PI) / 180;
    const eps_rad = (epsilon * Math.PI) / 180;

    const rightAscension = Math.atan2(
        Math.sin(lon_rad) * Math.cos(eps_rad) - Math.tan(lat_rad) * Math.sin(eps_rad),
        Math.cos(lon_rad)
    ) * (180 / Math.PI);

    const declination = Math.asin(
        Math.sin(lat_rad) * Math.cos(eps_rad) + Math.cos(lat_rad) * Math.sin(eps_rad) * Math.sin(lon_rad)
    ) * (180 / Math.PI);

    return {
        rightAscension: rightAscension < 0 ? rightAscension + 360 : rightAscension,
        declination
    };
}

/**
 * Convert equatorial to local coordinates (altitude/azimuth)
 */
function equatorialToLocal(
    rightAscension: number,
    declination: number,
    latitude: number,
    longitude: number,
    date: Date
): { altitude: number; azimuth: number } {
    // Calculate Local Sidereal Time
    const jd = dateToJulianDay(date);
    const T = (jd - 2451545.0) / 36525;

    // Greenwich Sidereal Time
    let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - T * T * T / 38710000;
    gmst = gmst % 360;
    if (gmst < 0) gmst += 360;

    // Local Sidereal Time
    const lst = (gmst + longitude) % 360;

    // Hour Angle
    let hourAngle = (lst - rightAscension) % 360;
    if (hourAngle < 0) hourAngle += 360;
    if (hourAngle > 180) hourAngle -= 360;

    // Convert to radians
    const ha_rad = (hourAngle * Math.PI) / 180;
    const dec_rad = (declination * Math.PI) / 180;
    const lat_rad = (latitude * Math.PI) / 180;

    // Calculate altitude
    const altitude = Math.asin(
        Math.sin(dec_rad) * Math.sin(lat_rad) +
        Math.cos(dec_rad) * Math.cos(lat_rad) * Math.cos(ha_rad)
    ) * (180 / Math.PI);

    // Calculate azimuth
    const azimuth = Math.atan2(
        -Math.sin(ha_rad),
        Math.tan(dec_rad) * Math.cos(lat_rad) - Math.sin(lat_rad) * Math.cos(ha_rad)
    ) * (180 / Math.PI);

    return {
        altitude: Math.round(altitude * 100) / 100,
        azimuth: azimuth < 0 ? azimuth + 360 : azimuth
    };
}

/**
 * Calculate moon brightness impact factor
 * Returns a value from 0 (no moon) to ~1.5 (full moon at zenith)
 * This represents additional magnitudes of sky brightness
 */
export function calculateMoonImpact(moonData: MoonData): number {
    const { illumination, altitude = 0 } = moonData;

    // If moon is below horizon, no impact
    if (altitude <= 0) {
        return 0;
    }

    // Moon brightness formula based on astronomical research
    // Peak impact is about 1.5 mag/arcsec² for full moon at zenith
    const illuminationFactor = illumination / 100; // 0 to 1
    const altitudeFactor = Math.sin((altitude * Math.PI) / 180); // 0 to 1

    // Combine factors: full moon at zenith = ~1.5 magnitude impact
    const moonImpact = illuminationFactor * altitudeFactor * 1.5;

    return moonImpact;
}

/**
 * Adjust SQM reading to account for moon brightness
 * Returns the "dark sky" SQM value (what it would be without the moon)
 */
export function adjustSQMForMoon(
    measuredSQM: number,
    moonData: MoonData
): number {
    const moonImpact = calculateMoonImpact(moonData);

    // Lower SQM values = brighter sky
    // Moon makes sky brighter, so subtract impact
    const adjustedSQM = measuredSQM + moonImpact;

    return adjustedSQM;
}

/**
 * Cross-reference moon position with simplified validation
 * This helps identify calculation errors for debugging
 */
export function validateMoonCalculation(
    date: Date,
    latitude: number,
    longitude: number,
    calculatedAltitude: number
): {
    isValid: boolean;
    expectedRange: { min: number; max: number };
    warnings: string[];
} {
    const warnings: string[] = [];
    let isValid = true;

    // Basic validation checks
    if (calculatedAltitude > 90) {
        warnings.push('Altitude exceeds 90° (impossible)');
        isValid = false;
    }

    if (calculatedAltitude < -90) {
        warnings.push('Altitude below -90° (impossible)');
        isValid = false;
    }

    // Check if location is in reasonable Earth bounds
    if (Math.abs(latitude) > 90) {
        warnings.push('Invalid latitude');
        isValid = false;
    }

    if (Math.abs(longitude) > 180) {
        warnings.push('Invalid longitude');
        isValid = false;
    }

    // For Southern Hemisphere locations (like Geelong), 
    // moon behavior differs from Northern Hemisphere
    if (latitude < 0) {
        warnings.push('Southern Hemisphere - moon phases and timing inverted from NH');
    }

    // Moon is never above 90° - declination range is roughly ±28.5°
    const maxPossibleAltitude = 90 - Math.abs(latitude) + 28.5;
    const expectedRange = {
        min: -90,
        max: Math.min(90, maxPossibleAltitude)
    };

    if (calculatedAltitude > expectedRange.max) {
        warnings.push(`Altitude ${calculatedAltitude}° exceeds maximum possible ${expectedRange.max.toFixed(1)}° for this latitude`);
        isValid = false;
    }

    // Additional location-specific checks for Geelong, Australia
    if (latitude > -39 && latitude < -37 && longitude > 144 && longitude < 145) {
        warnings.push('Location appears to be Geelong, Australia - calculations should account for Southern Hemisphere');

        // In Southern Hemisphere, phases appear "upside down"
        // Full moon crosses meridian around midnight in summer, noon in winter
        const month = date.getMonth() + 1; // 1-12
        const hour = date.getHours();

        if (month >= 10 || month <= 3) { // Summer in SH
            if (hour > 10 && hour < 14 && calculatedAltitude > 60) {
                warnings.push('High altitude during summer daytime unusual for moon');
            }
        }
    }

    return { isValid, expectedRange, warnings };
}

/**
 * Get reference moon data for comparison (simplified)
 * Returns expected moon rise/set times for basic validation
 */
export function getMoonReferenceData(date: Date, latitude: number, longitude: number): {
    approximateRise: Date | null;
    approximateSet: Date | null;
    notes: string[];
} {
    const notes: string[] = [];

    // Very simplified rise/set calculation
    // This is just for basic validation, not accurate timing
    const moonPhase = calculateMoonPhase(date);

    // Full moon rises around sunset, sets around sunrise
    // New moon rises around sunrise, sets around sunset
    const phaseOffset = (moonPhase.illumination / 100) * 12; // 0-12 hours

    let riseHour = 6 + phaseOffset; // Base sunrise time + phase offset
    let setHour = 18 + phaseOffset; // Base sunset time + phase offset

    // Adjust for Southern Hemisphere
    if (latitude < 0) {
        notes.push('Southern Hemisphere: seasons and daylight inverted');
        // Summer/winter adjustments would go here
    }

    // Create approximate rise/set times
    const baseDate = new Date(date);
    baseDate.setHours(0, 0, 0, 0);

    let approximateRise: Date | null = null;
    let approximateSet: Date | null = null;

    if (riseHour >= 0 && riseHour <= 24) {
        approximateRise = new Date(baseDate);
        approximateRise.setHours(Math.floor(riseHour), (riseHour % 1) * 60);
    }

    if (setHour >= 0 && setHour <= 24) {
        approximateSet = new Date(baseDate);
        approximateSet.setHours(Math.floor(setHour), (setHour % 1) * 60);
    }

    notes.push(`Moon phase: ${moonPhase.phase} (${moonPhase.illumination}% illuminated)`);

    return { approximateRise, approximateSet, notes };
}

/**
 * Get human-readable description of moon impact
 */
export function getMoonImpactDescription(moonData: MoonData): string {
    const impact = calculateMoonImpact(moonData);

    if (impact < 0.1) {
        return "Minimal moon impact";
    } else if (impact < 0.5) {
        return "Slight moon brightness";
    } else if (impact < 1.0) {
        return "Moderate moon brightness";
    } else {
        return "Significant moon brightness";
    }
}
