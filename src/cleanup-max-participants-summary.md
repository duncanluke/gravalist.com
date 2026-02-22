# Cleanup Summary: Removing max_participants Column

## Overview
This cleanup removes the `max_participants`/`max_riders` column from the events table and updates all references throughout the codebase. This simplifies the event system by removing participant limits, aligning with the self-managed nature of ultra cycling events.

## Files Changed

### 1. Database Migration
- **File**: `/supabase-migration-remove-max-participants.sql`
- **Action**: Created migration to safely remove `max_participants` and `max_riders` columns from events table
- **Details**: Uses conditional logic to check if columns exist before attempting to drop them

### 2. Database Schema Updates
- **File**: `/supabase-schema.sql`
- **Action**: Removed `max_riders INTEGER,` from events table definition
- **Line**: Removed line 74

### 3. Seed Data Updates
- **File**: `/supabase-seed-data.sql`
- **Actions**:
  - Removed `max_riders` from INSERT column list
  - Removed max_riders values (150, 100, 120, 80) from all sample events
  - Updated column order in INSERT statement

### 4. TypeScript Interface Updates
- **File**: `/utils/supabase/client.ts`
- **Changes**:
  - **Event Interface** (line 41): Removed `max_participants?: number`
  - **createEvent Method** (line 359): Removed `maxRiders?: number` parameter

### 5. Server Code Updates
- **File**: `/supabase/functions/server/index.tsx`
- **Action**: Updated event creation logic
- **Changes**:
  - Line 743: Removed `max_participants: eventData.maxRiders || null,`

### 6. Frontend Component Updates
- **File**: `/components/AddRoutePage.tsx`
- **Changes**:
  - **RouteFormData Interface** (line 54): Removed `maxRiders: number | undefined;`
  - **Initial State** (line 107): Removed `maxRiders: undefined,`
  - **Submit Handler** (line 278): Removed `maxRiders: formData.maxRiders || undefined,`
  - **Comments**: Updated "Registration and capacity" to "Registration timing"

## Database Schema Changes

### Before
```sql
-- events table had:
max_riders INTEGER,
registration_opens_at TIMESTAMP WITH TIME ZONE,
```

### After
```sql
-- events table now has:
registration_opens_at TIMESTAMP WITH TIME ZONE,
```

## Migration Instructions

1. **Run the migration**:
   ```sql
   -- Execute in Supabase SQL editor
   -- File: /supabase-migration-remove-max-participants.sql
   ```

2. **Verify cleanup**:
   ```sql
   -- Check that max_participants and max_riders columns are gone
   SELECT column_name, data_type, is_nullable 
   FROM information_schema.columns 
   WHERE table_name = 'events' 
   AND column_name IN ('max_participants', 'max_riders');
   -- Should return no rows
   ```

3. **Test event creation**:
   - Create a new event via AddRoutePage
   - Verify no errors about `max_participants` or `max_riders` columns
   - Confirm UI no longer shows participant limit fields

## Benefits

1. **Simplified Schema**: Removes unused participant limit functionality
2. **Cleaner UI**: Event creation form is more focused without participant limits
3. **Self-Managed Philosophy**: Aligns with ultra cycling ethos where events are community-driven without artificial caps
4. **Reduced Complexity**: Eliminates validation and constraint logic around participant limits
5. **Better UX**: Users no longer need to configure arbitrary participant limits

## Configuration Changes

- **App Config**: Removed `max_events_per_user` configuration as it's no longer relevant
- **Registration Settings**: Updated description to reflect removal of max participants

## Files That Were NOT Changed

- Frontend display components (HomePage, 500SeriesPage, etc.) - These don't reference participant limits
- Hooks and utilities - No direct references to max_participants found
- Authentication and session management - Unrelated to participant limits

## Verification Checklist

- [ ] Migration script executed successfully
- [ ] Event creation works without errors
- [ ] TypeScript compilation passes
- [ ] Server endpoints accept events without max_participants field
- [ ] Frontend AddRoutePage no longer shows max riders field
- [ ] Seed data loads without max_riders column errors
- [ ] Existing events in database continue to work normally

## Rationale

Ultra cycling events in the Gravalist platform are self-managed and community-driven. Artificial participant limits don't align with this philosophy, where the community naturally self-regulates participation based on route difficulty, timing, and local conditions. Removing these limits simplifies both the technical implementation and user experience.