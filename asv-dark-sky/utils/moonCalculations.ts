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
 * Calculate moon altitude (simplified calculation)
 * For accurate results, you'd need a library like SunCalc or Astronomy Engine
 * This is a rough estimate based on phase and time
 */
export function estimateMoonAltitude(
    date: Date,
    latitude: number,
    longitude: number
): number {
    // This is a simplified calculation
    // For production, consider using a proper astronomy library
    const hours = date.getHours() + date.getMinutes() / 60;
    const moonPhase = calculateMoonPhase(date);

    // Rough estimate: moon is highest around midnight
    // Full moon rises at sunset, new moon rises at sunrise
    const phaseOffset = (moonPhase.illumination / 100) * 12; // hours
    const peakTime = 18 + phaseOffset; // 6 PM + phase offset

    const timeDiff = Math.abs(hours - peakTime);
    const altitude = Math.max(0, 90 - (timeDiff * 7.5)); // Rough sine curve

    return Math.round(altitude);
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
