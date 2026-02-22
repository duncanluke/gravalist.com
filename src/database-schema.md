# Gravalist Database Schema Documentation

## Complete Database Structure for 500km Ultra Events Platform

This document defines the complete database schema required for the Gravalist platform, capturing every single data point from user interactions across all 16 onboarding steps and event management.

## Core Database Entities

### 1. Events Table
```typescript
interface EventEntity {
  // Primary identifiers
  id: string; // UUID primary key
  created_at: timestamp;
  updated_at: timestamp;
  
  // Basic event info
  name: string; // "Utrecht 500"
  slug: string; // "utrecht-500-2024-01"
  date: date; // Event date
  location: string; // "Utrecht, Netherlands"
  status: 'draft' | 'open' | 'closed' | 'active' | 'completed';
  
  // Event configuration
  total_riders: number;
  max_capacity: number;
  registration_opens: timestamp;
  registration_closes: timestamp;
  
  // Event content
  description: text; // Full event description
  short_description: text; // Summary for listings
  
  // Route information
  route_file: string; // "utrecht-500-2024.gpx"
  route_briefing: text; // Complete route instructions
  total_distance: number; // 500
  total_elevation: number; // meters
  
  // Event management
  admin_users: string[]; // Array of admin user IDs
  is_published: boolean;
  featured: boolean;
}
```

### 2. Event Highlights Table
```typescript
interface EventHighlightsEntity {
  id: string; // UUID primary key
  event_id: string; // Foreign key to events
  order_index: number; // 1, 2, 3
  title: string; // "Castle Route"
  description: text; // "Ride past 15+ medieval castles..."
  created_at: timestamp;
}
```

### 3. Users Table
```typescript
interface UserEntity {
  // Primary identifiers
  id: string; // UUID primary key
  created_at: timestamp;
  updated_at: timestamp;
  last_login: timestamp;
  
  // Basic profile
  email: string; // Unique
  password_hash: string;
  full_name: string;
  profile_image_url?: string;
  
  // Account status
  is_verified: boolean;
  is_active: boolean;
  subscription_type: 'free' | 'premium' | 'elite';
  
  // Preferences
  timezone: string;
  preferred_language: string;
  marketing_emails: boolean;
  
  // Platform stats
  total_events_completed: number;
  total_distance_completed: number; // km
  first_event_date?: date;
  last_event_date?: date;
}
```

### 4. Event Registrations Table (Complete Rider Journey)
```typescript
interface EventRegistrationEntity {
  // Primary identifiers
  id: string; // UUID primary key
  event_id: string; // Foreign key to events
  user_id: string; // Foreign key to users
  created_at: timestamp;
  updated_at: timestamp;
  
  // Registration status
  current_step: number; // 1-16
  status: 'not_started' | 'in_progress' | 'completed' | 'riding' | 'finished' | 'withdrawn';
  registration_completed_at?: timestamp;
  
  // STEP 1: WELCOME
  welcome_completed: boolean;
  welcome_completed_at?: timestamp;
  selected_event: string; // Event name they selected
  
  // STEP 2: UNDERSTAND EVENT
  event_understanding: boolean;
  event_understanding_at?: timestamp;
  event_video_watched: boolean;
  event_video_watched_at?: timestamp;
  event_video_duration_watched?: number; // seconds
  
  // STEP 3: ROUTE DOWNLOAD
  route_downloaded: boolean;
  route_download_at?: timestamp;
  route_file_accessed: string; // filename
  gpx_download_ip: string; // IP address for tracking
  download_user_agent: text; // Browser info
  
  // STEP 4: EQUIPMENT CHECKLIST
  equipment_confirmed: boolean;
  equipment_confirmed_at?: timestamp;
  equipment_gps: boolean;
  equipment_lights: boolean;
  equipment_spare_tubes: boolean;
  equipment_multi_tool: boolean;
  equipment_first_aid: boolean;
  equipment_water: boolean;
  equipment_food: boolean;
  equipment_phone: boolean;
  equipment_charger: boolean;
  equipment_reflective_clothing: boolean;
  equipment_helmet: boolean;
  equipment_camera: boolean;
  equipment_basic_tools: boolean;
  equipment_total_checked: number;
  equipment_completion_percentage: decimal;
  
  // STEP 5: AGREEMENTS & SIGNATURES
  agreements_completed: boolean;
  agreements_completed_at?: timestamp;
  
  // Safety Agreement
  safety_agreement_read: boolean;
  safety_agreement_read_at?: timestamp;
  safety_agreement_read_duration?: number; // seconds spent reading
  safety_agreement_signed: string; // Digital signature text
  safety_agreement_signed_at?: timestamp;
  safety_agreement_ip: string;
  safety_agreement_user_agent: text;
  safety_agreement_location_lat?: decimal;
  safety_agreement_location_lng?: decimal;
  
  // Liability Waiver
  liability_waiver_read: boolean;
  liability_waiver_read_at?: timestamp;
  liability_waiver_read_duration?: number;
  liability_waiver_signed: string;
  liability_waiver_signed_at?: timestamp;
  liability_waiver_ip: string;
  liability_waiver_user_agent: text;
  liability_waiver_location_lat?: decimal;
  liability_waiver_location_lng?: decimal;
  
  // Privacy Policy
  privacy_policy_read: boolean;
  privacy_policy_read_at?: timestamp;
  privacy_policy_read_duration?: number;
  privacy_policy_signed: string;
  privacy_policy_signed_at?: timestamp;
  privacy_policy_ip: string;
  privacy_policy_user_agent: text;
  privacy_policy_location_lat?: decimal;
  privacy_policy_location_lng?: decimal;
  
  // Media Release (optional)
  media_release_read?: boolean;
  media_release_read_at?: timestamp;
  media_release_signed?: string;
  media_release_signed_at?: timestamp;
  
  // Agreement verification
  witness_email: string;
  witness_email_verified: boolean;
  witness_email_verified_at?: timestamp;
  signing_location_verified: boolean;
  agreements_legally_binding: boolean;
  
  // STEP 6: MEDICAL INSURANCE
  medical_insurance: boolean;
  medical_insurance_at?: timestamp;
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_document_url?: string;
  insurance_document_filename?: string;
  insurance_document_size?: number; // bytes
  insurance_upload_date?: timestamp;
  insurance_verified: boolean;
  insurance_verified_at?: timestamp;
  insurance_verified_by?: string; // admin user ID
  
  // Emergency contact information
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  emergency_contact_updated_at?: timestamp;
  
  // Medical information
  medical_conditions?: text;
  medical_allergies?: text;
  medical_medications?: text;
  medical_dietary_restrictions?: text;
  medical_blood_type?: string;
  medical_doctor_name?: string;
  medical_doctor_phone?: string;
  medical_updated_at?: timestamp;
  
  // STEP 7: RACEMAP CONNECTION
  racemap_connected: boolean;
  racemap_connected_at?: timestamp;
  racemap_device_id?: string;
  racemap_device_type?: string; // "smartphone" | "gps_watch" | "cycling_computer"
  racemap_test_completed: boolean;
  racemap_test_completed_at?: timestamp;
  racemap_test_signal_strength?: number;
  racemap_connection_method?: string; // "bluetooth" | "wifi" | "cellular"
  tracking_permission_granted: boolean;
  tracking_permission_at?: timestamp;
  live_tracking_enabled: boolean;
  emergency_tracking_enabled: boolean;
  
  // STEP 8: READY TO RIDE
  ready_confirmation: boolean;
  ready_confirmation_at?: timestamp;
  final_checklist_completed: boolean;
  final_checklist_completed_at?: timestamp;
  pre_event_questions_answered: boolean;
  estimated_completion_time?: string;
  preferred_start_time?: string;
  special_requirements?: text;
  
  // STEP 9: START/ARRIVAL
  start_countdown_started: boolean;
  start_countdown_at?: timestamp;
  arrival_time?: timestamp;
  arrival_location_lat?: decimal;
  arrival_location_lng?: decimal;
  check_in_completed: boolean;
  check_in_by?: string; // admin user or self-check
  
  // STEP 10: STARTING PHOTO
  starting_photo_uploaded: boolean;
  starting_photo_url?: string;
  starting_photo_filename?: string;
  starting_photo_timestamp?: timestamp;
  starting_photo_location_lat?: decimal;
  starting_photo_location_lng?: decimal;
  starting_photo_verified: boolean;
  
  // STEP 11: PRE-RIDE CHECK
  pre_ride_mood_selected?: string; // "excited" | "nervous" | "confident" | "anxious" | "ready"
  pre_ride_confidence?: number; // 1-5 scale
  pre_ride_notes?: text;
  pre_ride_check_completed_at?: timestamp;
  weather_conditions?: string;
  weather_temperature?: number;
  weather_wind_speed?: number;
  weather_forecast_checked: boolean;
  bike_check_completed: boolean;
  nutrition_plan_confirmed: boolean;
  
  // STEP 12: OFFICIAL RIDE START
  start_time?: timestamp;
  official_start_confirmed: boolean;
  official_start_confirmed_at?: timestamp;
  ride_start_location?: string;
  start_location_lat?: decimal;
  start_location_lng?: decimal;
  start_photo_timestamp?: timestamp;
  start_witness?: string; // Name of person who witnessed start
  start_method: 'self_start' | 'group_start' | 'staggered_start';
  
  // STEP 13: RECORD FINISH
  finish_time?: timestamp;
  finish_location?: string;
  finish_location_lat?: decimal;
  finish_location_lng?: decimal;
  finish_confirmed: boolean;
  finish_confirmed_at?: timestamp;
  finish_verification_method: 'gps' | 'photo' | 'witness' | 'self_report';
  total_ride_duration?: number; // minutes
  total_distance_actual?: decimal; // GPS tracked distance
  total_elevation_actual?: number; // GPS tracked elevation
  average_speed?: decimal;
  max_speed?: decimal;
  
  // STEP 14: FINISH PHOTO
  finish_photo_uploaded: boolean;
  finish_photo_url?: string;
  finish_photo_filename?: string;
  finish_photo_timestamp?: timestamp;
  finish_photo_location_lat?: decimal;
  finish_photo_location_lng?: decimal;
  finish_photo_verified: boolean;
  celebration_photo_url?: string;
  
  // STEP 15: POST-RIDE REFLECTION
  overall_experience?: string; // "amazing" | "good" | "challenging" | "difficult"
  route_rating?: number; // 1-5 scale
  difficulty_rating?: number; // 1-5 scale
  organization_rating?: number; // 1-5 scale
  would_recommend: boolean;
  ride_reflection_notes?: text;
  ride_reflection_completed_at?: timestamp;
  
  // Detailed feedback
  equipment_feedback?: text;
  safety_feedback?: text;
  improvement_suggestions?: text;
  
  // Physical state
  physical_condition_start?: string; // "excellent" | "good" | "fair" | "poor"
  physical_condition_finish?: string;
  injuries_reported?: text;
  medical_incidents?: text;
  
  // STEP 16: SOCIAL SHARING
  social_sharing_enabled: boolean;
  social_sharing_at?: timestamp;
  facebook_shared: boolean;
  facebook_shared_at?: timestamp;
  facebook_post_id?: string;
  instagram_shared: boolean;
  instagram_shared_at?: timestamp;
  instagram_post_id?: string;
  strava_shared: boolean;
  strava_shared_at?: timestamp;
  strava_activity_id?: string;
  twitter_shared: boolean;
  twitter_shared_at?: timestamp;
  linkedin_shared: boolean;
  linkedin_shared_at?: timestamp;
  
  // Custom sharing
  share_message?: text;
  custom_hashtags?: string;
  privacy_settings?: json; // Object with platform-specific privacy settings
  
  // Platform metrics
  results_page_views?: number;
  certificate_downloaded: boolean;
  certificate_downloaded_at?: timestamp;
  results_shared_timestamp?: timestamp;
  
  // Post-event engagement
  event_feedback_completed: boolean;
  event_feedback_rating?: number;
  event_feedback_comments?: text;
  newsletter_signup: boolean;
  future_events_interest: boolean;
  
  // Administrative tracking
  data_export_requested: boolean;
  data_export_at?: timestamp;
  gdpr_deletion_requested: boolean;
  gdpr_deletion_at?: timestamp;
  admin_notes?: text;
  flagged_for_review: boolean;
  review_reason?: string;
  reviewed_by?: string;
  reviewed_at?: timestamp;
}
```

### 5. GPS Tracking Data
```typescript
interface GPSTrackingEntity {
  id: string;
  registration_id: string; // Foreign key to event_registrations
  timestamp: timestamp;
  latitude: decimal;
  longitude: decimal;
  altitude?: number;
  speed?: decimal;
  heading?: number;
  accuracy?: number;
  battery_level?: number;
  signal_strength?: number;
  tracking_source: 'racemap' | 'smartphone' | 'gps_device';
  is_checkpoint: boolean;
  checkpoint_name?: string;
}
```

### 6. File Uploads
```typescript
interface FileUploadsEntity {
  id: string;
  registration_id: string;
  file_type: 'insurance_document' | 'starting_photo' | 'finish_photo' | 'route_gpx';
  original_filename: string;
  stored_filename: string;
  file_size: number;
  mime_type: string;
  upload_timestamp: timestamp;
  upload_ip: string;
  s3_bucket?: string;
  s3_key?: string;
  cdn_url?: string;
  is_verified: boolean;
  verified_by?: string;
  verified_at?: timestamp;
}
```

### 7. Audit Log
```typescript
interface AuditLogEntity {
  id: string;
  registration_id?: string;
  user_id?: string;
  event_id?: string;
  action: string; // "step_completed", "signature_added", "photo_uploaded", etc.
  step_number?: number;
  old_values?: json;
  new_values?: json;
  ip_address: string;
  user_agent: text;
  timestamp: timestamp;
  session_id?: string;
}
```

### 8. Admin Dashboard Views
```typescript
interface AdminDashboardMetrics {
  event_id: string;
  total_registrations: number;
  completed_registrations: number;
  currently_riding: number;
  finished_riders: number;
  completion_rate: decimal;
  average_completion_time: number; // minutes
  step_completion_rates: json; // Object with completion rate for each step
  equipment_stats: json; // Object with equipment item statistics
  rating_averages: json; // Object with average ratings
  last_updated: timestamp;
}
```

## Database Indexes for Performance

```sql
-- Core performance indexes
CREATE INDEX idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_user_id ON event_registrations(user_id);
CREATE INDEX idx_event_registrations_status ON event_registrations(status);
CREATE INDEX idx_event_registrations_current_step ON event_registrations(current_step);

-- Timestamps for analytics
CREATE INDEX idx_event_registrations_created_at ON event_registrations(created_at);
CREATE INDEX idx_event_registrations_start_time ON event_registrations(start_time);
CREATE INDEX idx_event_registrations_finish_time ON event_registrations(finish_time);

-- Location-based queries
CREATE INDEX idx_gps_tracking_registration_timestamp ON gps_tracking_data(registration_id, timestamp);
CREATE INDEX idx_gps_tracking_location ON gps_tracking_data(latitude, longitude);

-- File management
CREATE INDEX idx_file_uploads_registration_type ON file_uploads(registration_id, file_type);

-- Admin dashboard performance
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_date ON events(date);
```

## Data Validation Rules

### Required Fields by Step
```typescript
const stepValidation = {
  1: ['welcome_completed'],
  2: ['event_understanding', 'event_video_watched'],
  3: ['route_downloaded', 'route_file_accessed'],
  4: ['equipment_confirmed', 'equipment_gps'], // GPS is minimum requirement
  5: ['safety_agreement_signed', 'liability_waiver_signed', 'witness_email'],
  6: ['medical_insurance', 'emergency_contact_name', 'emergency_contact_phone'],
  7: ['racemap_connected', 'tracking_permission_granted'],
  8: ['ready_confirmation', 'final_checklist_completed'],
  9: ['arrival_time'],
  10: ['starting_photo_uploaded'],
  11: ['pre_ride_mood_selected'],
  12: ['start_time', 'official_start_confirmed'],
  13: ['finish_time', 'finish_confirmed'],
  14: ['finish_photo_uploaded'],
  15: ['overall_experience', 'route_rating', 'would_recommend'],
  16: ['social_sharing_enabled']
};
```

## API Endpoints Structure

### Rider Journey Endpoints
```typescript
// Step progression
POST /api/events/{eventId}/registrations/{registrationId}/steps/{stepNumber}/complete
GET /api/events/{eventId}/registrations/{registrationId}/current-step
PUT /api/events/{eventId}/registrations/{registrationId}/step-data

// File uploads
POST /api/events/{eventId}/registrations/{registrationId}/files/upload
GET /api/events/{eventId}/registrations/{registrationId}/files/{fileType}

// Digital signatures
POST /api/events/{eventId}/registrations/{registrationId}/agreements/{agreementType}/sign
GET /api/events/{eventId}/registrations/{registrationId}/agreements/status

// GPS tracking
POST /api/events/{eventId}/registrations/{registrationId}/gps/track
GET /api/events/{eventId}/registrations/{registrationId}/gps/latest
```

### Admin Dashboard Endpoints
```typescript
// Event overview
GET /api/admin/events/{eventId}/overview
GET /api/admin/events/{eventId}/registrations
PUT /api/admin/events/{eventId}/registrations/{registrationId}

// Analytics
GET /api/admin/events/{eventId}/analytics/completion-rates
GET /api/admin/events/{eventId}/analytics/step-breakdown
GET /api/admin/events/{eventId}/analytics/equipment-stats

// Data export
GET /api/admin/events/{eventId}/export/csv
GET /api/admin/events/{eventId}/export/detailed
```

This comprehensive database schema captures every single interaction point in the rider journey from initial registration through post-event sharing, providing complete audit trails and enabling detailed analytics for event administrators.