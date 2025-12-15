# Camera Screen UI Redesign

## Changes Made

### Visual Design
- **Background Color**: Changed from black (#000000) to dark grey (#2a2a2a)
- **Single Photo View**: Only one photo is displayed at a time
- **Tab Navigation**: Added tabs to switch between Sky Photo and Dark Photo views (only visible after both photos are taken)

### User Flow

#### Step 1: Take Sky Photo
- User is presented with a capture prompt for the Sky Photo
- Tapping the prompt opens the camera
- After taking the photo, user is automatically switched to the Dark Photo view

#### Step 2: Take Dark Photo
- User is presented with a capture prompt for the Dark Photo
- Includes hint text: "(Cover lenses with lens cap or hand)"
- After taking the photo, user can now switch between both photos using tabs

#### Step 3: Review and Analyze
- Tab navigation appears at the top showing "Sky Photo" and "Dark Photo"
- User can switch between tabs to review either photo
- "Retake" button appears on each photo for easy retaking
- "Check Sky Quality" button appears when both photos are taken
- SQM result displays in a prominent card below

### Key Features

1. **Progressive Workflow**
   - Step 1 instruction: "Take a sky photo"
   - Step 2 instruction: "Take a dark photo"
   - Clear, sequential guidance for users

2. **Photo Preview**
   - Full-width photo display (4:3 aspect ratio)
   - Retake button overlays in top-right corner
   - Red border and dark background for consistency

3. **Tab Navigation**
   - Only appears after both photos are taken
   - Active tab has red background
   - Inactive tabs have grey text

4. **Results Display**
   - Large, prominent SQM reading
   - Contained in a bordered card
   - Error messages displayed clearly

### Technical Implementation

- Added `activeTab` state to track which photo is being viewed
- Modified `takePicture` to automatically switch to dark photo after sky photo
- Complete redesign of `renderPictures` function
- New responsive layout with proper spacing
- Maintained camera view persistence (no black screen issues)

### Benefits

✅ Less cluttered interface  
✅ Clear sequential workflow  
✅ Easier to review individual photos  
✅ Better use of screen space  
✅ More intuitive user experience  
✅ Professional, modern appearance  

