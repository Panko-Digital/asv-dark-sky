# Requirements Document

## Introduction

This feature enhances user privacy and data control for the Sky Quality Meter (SQM) mobile application. Currently, when users take SQM readings, the application sends the images and exact GPS coordinates to the backend calculation service, which processes the images, calculates the SQM value, and automatically stores the measurement with precise coordinates in the public database. This means exact user locations are visible to everyone on the public map, potentially revealing home addresses. This feature will implement location obfuscation to protect user privacy while maintaining useful data for the community, and provide users with the ability to manage their contributions to the public database.

## Glossary

- **SQM_Application**: The Sky Quality Meter mobile application that captures and displays light pollution measurements
- **SQM_Reading**: A sky quality measurement containing brightness data, location coordinates, timestamp, and optional moon data
- **Location_Obfuscation**: The process of reducing GPS coordinate precision to prevent exact location identification
- **Device_Identifier**: A unique, persistent identifier for a user's device used to track their contributions
- **Public_Database**: The backend cloud database that stores measurements visible to all users on the map
- **Local_Storage**: The device's AsyncStorage containing the user's personal measurement history
- **Fuzzing_Radius**: The distance in meters by which location coordinates are randomized
- **Backend_API**: The cloud functions service that handles measurement storage and retrieval

## Requirements

### Requirement 1

**User Story:** As a user, I want my exact home location to remain private when I share SQM readings, so that strangers cannot identify where I live.

#### Acceptance Criteria

1. WHEN the SQM_Application captures a new SQM_Reading THEN the system SHALL apply Location_Obfuscation before storing to Public_Database
2. WHEN Location_Obfuscation is applied THEN the system SHALL reduce coordinate precision to approximately 1 kilometer radius
3. WHEN Location_Obfuscation is applied THEN the system SHALL add random offset within the Fuzzing_Radius to prevent clustering at grid points
4. WHEN displaying SQM_Reading on the map THEN the system SHALL show the obfuscated coordinates from Public_Database
5. WHEN storing SQM_Reading to Local_Storage THEN the system SHALL preserve the original precise coordinates for the user's personal history

### Requirement 2

**User Story:** As a user, I want my SQM readings to be automatically shared with obfuscated location data, so that I can contribute to the community's light pollution map without revealing my exact location.

#### Acceptance Criteria

1. WHEN the SQM_Application sends images to the calculation endpoint THEN the system SHALL send obfuscated coordinates instead of precise GPS coordinates
2. WHEN sending to the calculation endpoint THEN the system SHALL include the Device_Identifier in the request metadata
3. WHEN the calculation endpoint processes the request THEN the system SHALL store the SQM_Reading with obfuscated coordinates and Device_Identifier
4. WHEN the calculation endpoint stores a measurement THEN the system SHALL return the calculated SQM value and a unique measurement identifier
5. WHEN the SQM_Application receives the response THEN the system SHALL store both the precise coordinates in Local_Storage and the measurement identifier for future deletion

### Requirement 3

**User Story:** As a user, I want a unique device identifier to be associated with my measurements, so that I can manage my own data without requiring account creation.

#### Acceptance Criteria

1. WHEN the SQM_Application launches for the first time THEN the system SHALL generate a unique Device_Identifier
2. WHEN Device_Identifier is generated THEN the system SHALL persist it in Local_Storage for future use
3. WHEN Device_Identifier is generated THEN the system SHALL use a cryptographically secure random generation method
4. WHEN the SQM_Application sends measurements to Backend_API THEN the system SHALL include the Device_Identifier
5. WHEN the user reinstalls the SQM_Application THEN the system SHALL generate a new Device_Identifier

### Requirement 4

**User Story:** As a user, I want to delete a single measurement from my local history and the public database, so that I can remove readings I don't want to share.

#### Acceptance Criteria

1. WHEN a user selects delete on a specific SQM_Reading THEN the system SHALL remove it from Local_Storage
2. WHEN a user deletes a specific SQM_Reading THEN the system SHALL send a delete request to Backend_API with the measurement identifier and Device_Identifier
3. WHEN Backend_API receives a delete request THEN the system SHALL verify the Device_Identifier matches the stored measurement
4. WHEN Device_Identifier matches THEN the Backend_API SHALL remove the measurement from Public_Database
5. IF Device_Identifier does not match THEN the Backend_API SHALL reject the delete request and return an authorization error
6. IF Backend_API is unreachable THEN the system SHALL remove from Local_Storage and notify the user that public data may still exist

### Requirement 5

**User Story:** As a user, I want to delete all my measurements from both local history and the public database, so that I can completely remove my contributions.

#### Acceptance Criteria

1. WHEN a user selects clear all measurements THEN the system SHALL prompt for confirmation before proceeding
2. WHEN the user confirms clear all THEN the system SHALL remove all measurements from Local_Storage
3. WHEN the user confirms clear all THEN the system SHALL send a bulk delete request to Backend_API with the Device_Identifier
4. WHEN Backend_API receives a bulk delete request THEN the system SHALL remove all measurements associated with the Device_Identifier from Public_Database
5. WHEN bulk delete completes THEN the system SHALL return a count of deleted records to the user
6. IF Backend_API is unreachable THEN the system SHALL clear Local_Storage and notify the user that public data may still exist

### Requirement 6

**User Story:** As a developer, I want the location obfuscation algorithm to be consistent and testable, so that privacy guarantees are reliable.

#### Acceptance Criteria

1. WHEN Location_Obfuscation is applied to coordinates THEN the system SHALL reduce latitude and longitude precision to 2 decimal places
2. WHEN Location_Obfuscation adds random offset THEN the system SHALL use a uniform random distribution within the Fuzzing_Radius
3. WHEN calculating Fuzzing_Radius THEN the system SHALL set it to 500 meters
4. WHEN obfuscating coordinates THEN the system SHALL ensure the obfuscated location remains within valid GPS coordinate ranges
5. WHEN obfuscating coordinates THEN the system SHALL apply the same algorithm to all measurements regardless of location

### Requirement 7

**User Story:** As a system administrator, I want the backend API to support measurement management operations, so that users can control their data.

#### Acceptance Criteria

1. WHEN the calculation endpoint receives a request THEN the system SHALL validate required fields including Device_Identifier and store it with the measurement
2. WHEN Backend_API receives a DELETE request for a single measurement THEN the system SHALL verify Device_Identifier ownership before deletion
3. WHEN Backend_API receives a DELETE request for all measurements by Device_Identifier THEN the system SHALL remove all matching records
4. WHEN Backend_API processes any request THEN the system SHALL return appropriate HTTP status codes for success and error conditions
5. WHEN Backend_API encounters an error THEN the system SHALL return descriptive error messages to aid debugging
