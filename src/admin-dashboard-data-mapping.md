# Admin Dashboard Data Mapping & Component Analysis

## Complete Frontend-to-Database Field Mapping

This document provides a comprehensive mapping of every user interface element to its corresponding database field, ensuring complete data capture for administrative oversight.

## Step-by-Step Component Analysis

### Step 1: WelcomeStep.tsx
**User Sees:**
- Welcome message with event name
- Trust your instincts message
- No official support warning
- Continue button

**Data Captured:**
```typescript
welcomeCompleted: boolean;
welcomeCompletedAt: timestamp;
selectedEvent: string; // Event name they're welcoming to
```

### Step 2: UnderstandEventStep.tsx
**User Sees:**
- Event responsibility card (self-organised)
- Time limit card (60 hours maximum)
- Self-supported card (no official support)
- Continue button

**Data Captured:**
```typescript
eventUnderstanding: boolean;
eventUnderstandingAt: timestamp;
eventVideoWatched: boolean; // If video component added
eventVideoWatchedAt?: timestamp;
eventVideoDurationWatched?: number; // seconds
```

### Step 3: RouteDownloadStep.tsx
**User Sees:**
- GPX file download card
- "Utrecht 500 Route.gpx" filename
- Download GPX File button
- Navigation tip

**Data Captured:**
```typescript
routeDownloaded: boolean;
routeDownloadAt: timestamp;
routeFileAccessed: string; // "utrecht-500-2024.gpx"
downloadIp: string; // User's IP address
downloadUserAgent: string; // Browser info
```

### Step 4: EquipmentDownloadStep.tsx
**User Sees:**
- Equipment checklist with 6 items:
  1. GPS Device or Smartphone (Essential)
  2. Front & Rear Lights (Essential)
  3. Cycling Helmet (Essential)
  4. Mobile Phone (Essential)
  5. Action Camera (Optional)
  6. Basic Repair Tools (Recommended)
- Individual checkboxes for each item
- Counter showing checked items
- Continue button

**Data Captured:**
```typescript
equipmentConfirmed: boolean;
equipmentConfirmedAt: timestamp;
// Individual items from the component
equipmentGps: boolean; // "GPS Device or Smartphone"
equipmentLights: boolean; // "Front & Rear Lights"
equipmentHelmet: boolean; // "Cycling Helmet"
equipmentPhone: boolean; // "Mobile Phone"
equipmentCamera: boolean; // "Action Camera"
equipmentTools: boolean; // "Basic Repair Tools"
// Additional comprehensive tracking
equipmentSpareInnerTubes: boolean;
equipmentMultiTool: boolean;
equipmentFirstAid: boolean;
equipmentWater: boolean;
equipmentFood: boolean;
equipmentCharger: boolean;
equipmentReflectiveClothing: boolean;
equipmentTotalChecked: number; // Count of checked items
equipmentCompletionPercentage: number; // Percentage complete
```

### Step 5: AgreementsStep.tsx
**User Sees:**
- Three agreements to read and sign:
  1. Liability Waiver (required)
  2. Indemnity Agreement (required)
  3. Media Release (optional)
- Each agreement has:
  - Summary text
  - "Read Full Agreement" button
  - Full agreement text in scrollable area
  - "I Have Read and Understand" button
  - Digital signature input field
  - Signature timestamp
- Verification section:
  - IP address (auto-collected)
  - Location permission request
  - Witness email input
- Progress indicators

**Data Captured:**
```typescript
agreementsCompleted: boolean;
agreementsCompletedAt: timestamp;

// Per agreement tracking (waiver = liability in UI)
safetyAgreementRead: boolean;
safetyAgreementReadAt: timestamp;
safetyAgreementReadDuration: number; // seconds spent reading
safetyAgreementSigned: string; // Digital signature text
safetyAgreementSignedAt: timestamp;
safetyAgreementIp: string;
safetyAgreementLocationLat?: number;
safetyAgreementLocationLng?: number;

liabilityWaiverRead: boolean; // "indemnity" in component
liabilityWaiverReadAt: timestamp;
liabilityWaiverReadDuration: number;
liabilityWaiverSigned: string;
liabilityWaiverSignedAt: timestamp;
liabilityWaiverIp: string;
liabilityWaiverLocationLat?: number;
liabilityWaiverLocationLng?: number;

privacyPolicyRead: boolean;
privacyPolicyReadAt: timestamp;
privacyPolicyReadDuration: number;
privacyPolicySigned: string;
privacyPolicySignedAt: timestamp;

mediaReleaseRead?: boolean; // Optional
mediaReleaseReadAt?: timestamp;
mediaReleaseSigned?: string;
mediaReleaseSignedAt?: timestamp;

// Verification data
witnessEmail: string;
witnessEmailValid: boolean;
witnessEmailVerifiedAt?: timestamp;
signingLocationVerified: boolean;
ipAddressCollected: boolean; // Always true
locationPermissionGranted: boolean;
agreementsLegallyBinding: boolean;
```

### Step 6: OnboardingFormStep.tsx (Medical)
**User Sees:**
- Medical Insurance card
- File upload area (drag/drop or click)
- "Choose File" button
- Format requirements (PDF, JPG, PNG, max 10MB)
- Insurance confirmation checkbox
- Continue button

**Data Captured:**
```typescript
medicalInsurance: boolean;
medicalInsuranceAt: timestamp;
insuranceProvider?: string; // Could be extracted from document
insurancePolicyNumber?: string; // User input or extracted
insuranceDocumentUrl?: string; // File storage path
insuranceDocumentFilename?: string;
insuranceDocumentSize?: number; // bytes
insuranceUploadDate?: timestamp;
insuranceVerified?: boolean; // Admin verification
insuranceVerifiedAt?: timestamp;
insuranceVerifiedBy?: string; // Admin user ID

// Emergency contact (collected elsewhere in flow)
emergencyContactName?: string;
emergencyContactPhone?: string;
emergencyContactRelationship?: string;
emergencyContactUpdatedAt?: timestamp;

// Medical details (extended collection)
medicalConditions?: string;
medicalAllergies?: string;
medicalMedications?: string;
medicalDietaryRestrictions?: string;
medicalBloodType?: string;
medicalDoctorName?: string;
medicalDoctorPhone?: string;
medicalUpdatedAt?: timestamp;
```

### Step 7: RacemapConnectStep.tsx
**User Sees:**
- Racemap connection instructions
- Device pairing interface
- Connection test button
- Signal strength indicator
- Continue button

**Data Captured:**
```typescript
racemapConnected: boolean;
racemapConnectedAt: timestamp;
racemapDeviceId?: string; // Device identifier
racemapDeviceType?: string; // "smartphone" | "gps_watch" | "cycling_computer"
racemapTestCompleted?: boolean;
racemapTestCompletedAt?: timestamp;
racemapTestSignalStrength?: number;
racemapConnectionMethod?: string; // "bluetooth" | "wifi" | "cellular"
trackingPermissionGranted: boolean;
trackingPermissionAt?: timestamp;
liveTrackingEnabled?: boolean;
emergencyTrackingEnabled?: boolean;
```

### Step 8: ReadyToRideStep.tsx
**User Sees:**
- Final readiness confirmation
- Pre-event checklist
- Estimated completion time
- Special requirements input
- Continue button

**Data Captured:**
```typescript
readyConfirmation: boolean;
readyConfirmationAt: timestamp;
finalChecklistCompleted: boolean;
finalChecklistCompletedAt: timestamp;
preEventQuestionsAnswered?: boolean;
estimatedCompletionTime?: string; // User's estimate
preferredStartTime?: string;
specialRequirements?: string;
```

### Step 9: StartStep.tsx
**User Sees:**
- Arrival check-in
- Countdown timer
- Final preparations
- Continue button

**Data Captured:**
```typescript
startCountdownStarted: boolean;
startCountdownAt: timestamp;
arrivalTime: timestamp;
arrivalLocationLat?: number;
arrivalLocationLng?: number;
checkInCompleted: boolean;
checkInBy?: string; // admin user ID or "self-check"
```

### Step 10: StartingPhotoStep.tsx
**User Sees:**
- Photo upload interface
- Camera access request
- Photo preview
- Continue button

**Data Captured:**
```typescript
startingPhotoUploaded: boolean;
startingPhotoUrl?: string;
startingPhotoFilename?: string;
startingPhotoTimestamp: timestamp;
startingPhotoLocationLat?: number;
startingPhotoLocationLng?: number;
startingPhotoVerified?: boolean; // Admin verification
```

### Step 11: PreRideCheckStep.tsx
**User Sees:**
- Mental state selection from moodOptions.ts:
  - "Excited & Ready" (excited) - Success color
  - "Confident" (confident) - Primary color
  - "Calm & Focused" (calm) - Secondary color
  - "Nervous but Ready" (nervous) - Warning color
  - "Feeling Uncertain" (unsure) - Muted color
  - "Overwhelmed" (overwhelmed) - Destructive color
- Each option has icon, label, description
- Optional notes textarea
- Mood-specific message from moodMessages.ts
- Continue button

**Data Captured:**
```typescript
preRideMoodSelected: string; // "excited" | "confident" | "calm" | "nervous" | "unsure" | "overwhelmed"
preRideConfidence?: number; // 1-5 scale if added
preRideNotes?: string; // Optional textarea content
preRideCheckCompletedAt: timestamp;
weatherConditions?: string;
weatherTemperature?: number;
weatherWindSpeed?: number;
weatherForecastChecked?: boolean;
bikeCheckCompleted?: boolean;
nutritionPlanConfirmed?: boolean;
```

### Step 12: RideStartStep.tsx
**User Sees:**
- Official start countdown
- Start confirmation
- Location verification
- Start button

**Data Captured:**
```typescript
startTime: timestamp; // Official ride start
officialStartConfirmed: boolean;
officialStartConfirmedAt: timestamp;
rideStartLocation?: string;
startLocationLat?: number;
startLocationLng?: number;
startPhotoTimestamp?: timestamp;
startWitness?: string; // Name of witness
startMethod?: string; // "self_start" | "group_start" | "staggered_start"
```

### Step 13: FinishStep.tsx
**User Sees:**
- Finish time recording
- Location confirmation
- Completion verification
- Continue button

**Data Captured:**
```typescript
finishTime: timestamp;
finishLocation?: string;
finishLocationLat?: number;
finishLocationLng?: number;
finishConfirmed: boolean;
finishConfirmedAt: timestamp;
finishVerificationMethod?: string; // "gps" | "photo" | "witness" | "self_report"
totalRideDuration?: number; // minutes (calculated)
totalDistanceActual?: number; // GPS tracked
totalElevationActual?: number; // GPS tracked
averageSpeed?: number;
maxSpeed?: number;
```

### Step 14: FinishPhotoStep.tsx
**User Sees:**
- Finish photo upload
- Achievement photo
- Photo verification
- Continue button

**Data Captured:**
```typescript
finishPhotoUploaded: boolean;
finishPhotoUrl?: string;
finishPhotoFilename?: string;
finishPhotoTimestamp: timestamp;
finishPhotoLocationLat?: number;
finishPhotoLocationLng?: number;
finishPhotoVerified?: boolean;
celebrationPhotoUrl?: string;
```

### Step 15: PostRideReflectionStep.tsx
**User Sees:**
- Overall experience rating
- Route rating (1-5)
- Difficulty rating (1-5)
- Would recommend toggle
- Detailed feedback areas
- Physical condition assessment
- Continue button

**Data Captured:**
```typescript
overallExperience: string; // "amazing" | "good" | "challenging" | "difficult"
routeRating: number; // 1-5 scale
difficultyRating: number; // 1-5 scale
organizationRating?: number; // 1-5 scale
wouldRecommend: boolean;
rideReflectionNotes?: string;
rideReflectionCompletedAt: timestamp;

// Detailed feedback
equipmentFeedback?: string;
safetyFeedback?: string;
improvementSuggestions?: string;

// Physical state
physicalConditionStart?: string; // "excellent" | "good" | "fair" | "poor"
physicalConditionFinish?: string;
injuriesReported?: string;
medicalIncidents?: string;
```

### Step 16: ShareResultsStep.tsx
**User Sees:**
- Social platform toggles:
  - Facebook sharing
  - Instagram sharing
  - Strava sharing
  - Twitter sharing
  - LinkedIn sharing
- Custom share message
- Hashtag suggestions
- Privacy settings
- Continue button

**Data Captured:**
```typescript
socialSharingEnabled: boolean;
socialSharingAt: timestamp;
facebookShared: boolean;
facebookSharedAt?: timestamp;
facebookPostId?: string;
instagramShared: boolean;
instagramSharedAt?: timestamp;
instagramPostId?: string;
stravaShared: boolean;
stravaSharedAt?: timestamp;
stravaActivityId?: string;
twitterShared: boolean;
twitterSharedAt?: timestamp;
linkedinShared: boolean;
linkedinSharedAt?: timestamp;

// Custom sharing
shareMessage?: string;
customHashtags?: string;
privacySettings?: any; // Platform-specific settings

// Platform metrics
resultsPageViews?: number;
certificateDownloaded?: boolean;
certificateDownloadedAt?: timestamp;
resultsSharedTimestamp?: timestamp;

// Post-event engagement
eventFeedbackCompleted?: boolean;
eventFeedbackRating?: number;
eventFeedbackComments?: string;
newsletterSignup?: boolean;
futureEventsInterest?: boolean;
```

## Admin Dashboard Field Organization

### Table Columns Mapping

1. **Basic Info** (6 columns)
   - Name, Email, Event, Status, Progress, Signup Date

2. **Before Phase** (10 columns)
   - Steps 1-8 each get dedicated columns showing completion status and key data

3. **Starting Phase** (4 columns) 
   - Steps 9-12 showing arrival, photo, mood, and start details

4. **After Phase** (4 columns)
   - Steps 13-16 showing finish, photo, reflection, and sharing

5. **Admin Actions** (1 column)
   - Edit/Save/Cancel controls

### Data Validation Requirements

Each step has specific validation rules that must be enforced:

```typescript
const stepValidationRules = {
  1: { required: ['welcomeCompleted'] },
  2: { required: ['eventUnderstanding'] },
  3: { required: ['routeDownloaded', 'routeFileAccessed'] },
  4: { required: ['equipmentConfirmed', 'equipmentGps'] }, // GPS minimum
  5: { required: ['safetyAgreementSigned', 'liabilityWaiverSigned', 'witnessEmail'] },
  6: { required: ['medicalInsurance', 'emergencyContactName'] },
  7: { required: ['racemapConnected', 'trackingPermissionGranted'] },
  8: { required: ['readyConfirmation', 'finalChecklistCompleted'] },
  9: { required: ['arrivalTime'] },
  10: { required: ['startingPhotoUploaded'] },
  11: { required: ['preRideMoodSelected'] },
  12: { required: ['startTime', 'officialStartConfirmed'] },
  13: { required: ['finishTime', 'finishConfirmed'] },
  14: { required: ['finishPhotoUploaded'] },
  15: { required: ['overallExperience', 'routeRating', 'wouldRecommend'] },
  16: { required: ['socialSharingEnabled'] }
};
```

### Admin Dashboard Views Required

1. **Event Overview**: All event-level data and statistics
2. **Rider Progress**: Current step and completion status
3. **Equipment Analysis**: Equipment selection patterns
4. **Agreement Compliance**: Signature verification status
5. **Photo Gallery**: All uploaded photos with verification status
6. **Mood Analytics**: Pre-ride mental state patterns
7. **Performance Metrics**: Completion times and ratings
8. **Social Media Impact**: Sharing patterns and reach

This comprehensive mapping ensures that every user interaction is captured and made available to administrators for complete event oversight and rider support.