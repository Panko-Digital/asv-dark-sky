import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_STORAGE_KEY = '@sqm_measurement_history';

export interface SQMMeasurement {
    id: string;
    timestamp: string;
    location: {
        latitude: number;
        longitude: number;
        altitude: number | null;
        accuracy: number | null;
    } | null;
    sqm: number;
    median_brightness: number;
}

/**
 * Save a new SQM measurement to local storage history
 */
export const saveMeasurement = async (
    location: SQMMeasurement['location'],
    sqm: number,
    median_brightness: number
): Promise<void> => {
    try {
        // Load existing history
        const history = await loadHistory();

        // Create new measurement entry
        const newMeasurement: SQMMeasurement = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            location,
            sqm,
            median_brightness,
        };

        // Add to beginning of array (most recent first)
        const updatedHistory = [newMeasurement, ...history];

        // Save back to storage
        await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
        console.error('Error saving measurement:', error);
        throw error;
    }
};

/**
 * Load all SQM measurements from local storage
 */
export const loadHistory = async (): Promise<SQMMeasurement[]> => {
    try {
        const data = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);

        if (data === null) {
            return [];
        }

        return JSON.parse(data) as SQMMeasurement[];
    } catch (error) {
        console.error('Error loading history:', error);
        return [];
    }
};

/**
 * Clear all measurement history
 */
export const clearHistory = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch (error) {
        console.error('Error clearing history:', error);
        throw error;
    }
};

/**
 * Delete a specific measurement by ID
 */
export const deleteMeasurement = async (id: string): Promise<void> => {
    try {
        const history = await loadHistory();
        const updatedHistory = history.filter(m => m.id !== id);
        await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
        console.error('Error deleting measurement:', error);
        throw error;
    }
};
