"""
Moon brightness calculations for sky quality measurements
"""

import math
from datetime import datetime, timezone
from typing import Dict, Optional


def calculate_moon_phase(date: datetime) -> Dict[str, any]:
    """
    Calculate moon phase and illumination percentage
    
    Returns:
        dict with 'phase' (str) and 'illumination' (int, 0-100)
    """
    # Known new moon: January 6, 2000, 18:14 UTC
    known_new_moon = datetime(2000, 1, 6, 18, 14, tzinfo=timezone.utc)
    lunar_cycle = 29.53058867  # days
    
    # Ensure date is timezone-aware (convert to UTC if naive)
    if date.tzinfo is None:
        date = date.replace(tzinfo=timezone.utc)
    
    time_diff = date - known_new_moon
    days_since_new_moon = time_diff.total_seconds() / (60 * 60 * 24)
    current_phase = (days_since_new_moon % lunar_cycle) / lunar_cycle
    
    # Calculate illumination percentage (0-100)
    illumination = round((1 - math.cos(current_phase * 2 * math.pi)) * 50)
    
    # Determine phase name
    if current_phase < 0.03 or current_phase > 0.97:
        phase = "New Moon"
    elif current_phase < 0.22:
        phase = "Waxing Crescent"
    elif current_phase < 0.28:
        phase = "First Quarter"
    elif current_phase < 0.47:
        phase = "Waxing Gibbous"
    elif current_phase < 0.53:
        phase = "Full Moon"
    elif current_phase < 0.72:
        phase = "Waning Gibbous"
    elif current_phase < 0.78:
        phase = "Last Quarter"
    else:
        phase = "Waning Crescent"
    
    return {
        "phase": phase,
        "illumination": illumination
    }


def calculate_moon_impact(illumination: float, altitude: Optional[float] = None) -> float:
    """
    Calculate moon brightness impact factor
    
    Args:
        illumination: Moon illumination percentage (0-100)
        altitude: Moon altitude in degrees above horizon (0-90)
    
    Returns:
        Impact value in magnitudes (0 to ~1.5)
    """
    if altitude is not None and altitude <= 0:
        # Moon below horizon, no impact
        return 0.0
    
    # Normalize illumination to 0-1
    illumination_factor = illumination / 100.0
    
    # If altitude provided, include it in calculation
    if altitude is not None:
        altitude_factor = math.sin(math.radians(altitude))
    else:
        # If no altitude, assume average impact (50% of max)
        altitude_factor = 0.5
    
    # Full moon at zenith contributes ~1.5 mag/arcsec² to sky brightness
    moon_impact = illumination_factor * altitude_factor * 1.5
    
    return moon_impact


def adjust_sqm_for_moon(measured_sqm: float, moon_impact: float) -> float:
    """
    Adjust SQM reading to account for moon brightness
    
    Args:
        measured_sqm: The measured SQM value
        moon_impact: Moon impact in magnitudes (from calculate_moon_impact)
    
    Returns:
        Adjusted SQM value (what it would be without the moon)
    """
    # Moon makes sky brighter (lower SQM), so we add the impact
    # to get what the SQM would be without the moon
    adjusted_sqm = measured_sqm + moon_impact
    
    return adjusted_sqm


def get_moon_impact_description(moon_impact: float) -> str:
    """
    Get human-readable description of moon impact
    """
    if moon_impact < 0.1:
        return "Minimal moon impact"
    elif moon_impact < 0.5:
        return "Slight moon brightness"
    elif moon_impact < 1.0:
        return "Moderate moon brightness"
    else:
        return "Significant moon brightness"
