# Withdrawal Feature - Visual Flow Diagram

## User Journey Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER STARTS HERE                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   Homepage or    │
                    │ MyRegistrations  │
                    └──────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  User sees event with         │
              │  "I cannot make it" button    │
              │  (only for non-completed)     │
              └───────────────────────────────┘
                              │
                              ▼ [User Clicks]
                   ┌─────────────────────┐
                   │ WithdrawEventModal  │
                   │      Opens          │
                   └─────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  Modal displays:              │
              │  • Event name                 │
              │  • Withdrawal explanation     │
              │  • Optional reason textarea   │
              │  • "What happens next?" info  │
              └───────────────────────────────┘
                              │
                              ▼ [User Confirms]
                   ┌─────────────────────┐
                   │  Get Auth Token     │
                   │  from Supabase      │
                   └─────────────────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │   POST Request to   │
                   │  /events/:id/       │
                   │     withdraw        │
                   └─────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SERVER PROCESSING                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │  Validate Auth      │
                   │  Token              │
                   └─────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  Get User from Email          │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  Check Registration Exists    │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  Verify Not Already Withdrawn │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  UPDATE user_events SET:      │
              │  • registration_status =      │
              │    'withdrawn'                │
              │  • withdrawal_reason =        │
              │    <user input>               │
              │  • withdrawn_at =             │
              │    <timestamp>                │
              └───────────────────────────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │  Return Success     │
                   │  Response           │
                   └─────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND UPDATE                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  Show Success Modal           │
              │  (2 seconds)                  │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  Call onWithdrawSuccess()     │
              │  callback                     │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  Refresh Event Progress       │
              │  (HomePage)                   │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  Event Card Updates:          │
              │  • "I cannot make it" button  │
              │    disappears                 │
              │  • Progress indicator hidden  │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  MyRegistrationsCard Updates: │
              │  • Event moves to "Withdrawn" │
              │    section                    │
              │  • Shows reason & date        │
              └───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         USER SEES RESULT                         │
└─────────────────────────────────────────────────────────────────┘
```

## Component Interaction Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐        ┌──────────────────────┐            │
│  │   HomePage      │───────▶│ WithdrawEventModal   │            │
│  │                 │        │                      │            │
│  │  • Event Cards  │        │  • Confirmation UI   │            │
│  │  • Withdrawal   │        │  • Reason Input      │            │
│  │    Button       │        │  • API Call          │            │
│  │  • Progress     │        │  • Success/Error     │            │
│  └─────────────────┘        └──────────────────────┘            │
│         │                              │                         │
│         │                              │                         │
│         │    ┌────────────────────────┐│                         │
│         │    │                        ││                         │
│         └───▶│  MyRegistrationsCard   ││                         │
│              │                        ││                         │
│              │  • Active Events       ││                         │
│              │  • Withdrawn Events    ││                         │
│              │  • Withdrawal Button   ││                         │
│              │  • Refresh Action      ││                         │
│              └────────────────────────┘│                         │
│                       │                │                         │
│                       │                │                         │
└───────────────────────┼────────────────┼─────────────────────────┘
                        │                │
                        ▼                ▼
┌──────────────────────────────────────────────────────────────────┐
│                         API CLIENT                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  apiClient.getUserRegistrations()                       │    │
│  │  • GET /user/registrations                              │    │
│  │  • Returns: registrations with event details            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                         SERVER LAYER                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  POST /make-server-91bdaa9f/events/:eventId/withdraw   │     │
│  │  • requireAuth()                                       │     │
│  │  • Validate user & registration                        │     │
│  │  • Update database                                     │     │
│  │  • Return success/error                                │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  GET /make-server-91bdaa9f/user/registrations          │     │
│  │  • requireAuth()                                       │     │
│  │  • Fetch user registrations with events                │     │
│  │  • Transform: events → event                           │     │
│  │  • Return registrations array                          │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  TABLE: user_events                                      │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │  id                    UUID PRIMARY KEY          │   │   │
│  │  │  user_id               UUID REFERENCES users     │   │   │
│  │  │  event_id              UUID REFERENCES events    │   │   │
│  │  │  registration_status   VARCHAR(20)               │   │   │
│  │  │                        ['registered',            │   │   │
│  │  │                         'withdrawn',             │   │   │
│  │  │                         'completed', ...]        │   │   │
│  │  │  registered_at         TIMESTAMP                 │   │   │
│  │  │  withdrawal_reason     TEXT        [NEW]         │   │   │
│  │  │  withdrawn_at          TIMESTAMP   [NEW]         │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  INDEX: idx_user_events_withdrawn                        │   │
│  │  ON user_events(registration_status, withdrawn_at)       │   │
│  │  WHERE registration_status = 'withdrawn'                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

## State Transitions

```
┌────────────────────┐
│   not_started      │  (User hasn't registered)
└────────────────────┘
         │
         │ [User Registers]
         ▼
┌────────────────────┐
│    registered      │  (User registered, can start journey)
└────────────────────┘
         │
         ├─────────────────┐
         │                 │
         │ [Continues]     │ [Withdraws]
         ▼                 ▼
┌────────────────────┐  ┌────────────────────┐
│   in_progress      │  │    withdrawn       │
│   (Steps 1-17)     │  │                    │
└────────────────────┘  │  • withdrawal_     │
         │              │    reason stored    │
         │              │  • withdrawn_at     │
         │ [Completes]  │    recorded         │
         ▼              └────────────────────┘
┌────────────────────┐           │
│    completed       │           │
│   (Finished!)      │           │ [Can Re-register]
└────────────────────┘           │
                                 ▼
                      ┌────────────────────┐
                      │    registered      │
                      │   (Fresh start)    │
                      └────────────────────┘
```

## Data Flow for Participant Counts

```
┌──────────────────────────────────────────────────────────────────┐
│                   PARTICIPANT COUNT QUERY                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  SELECT COUNT(*) FROM user_events                                │
│  WHERE event_id = :eventId                                       │
│  AND registration_status = 'registered'  ← EXCLUDES 'withdrawn' │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  Results:                              │
         │  • Includes: registered users          │
         │  • Excludes: withdrawn users           │
         │  • Excludes: completed users           │
         │  • Excludes: scratched/dnf users       │
         └────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  Cache for 2 minutes                   │
         │  • Key: participant_count:${eventId}   │
         │  • Invalidated on status changes       │
         └────────────────────────────────────────┘
```

## Error Handling Flow

```
┌────────────────────┐
│  User Action       │
└────────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│  TRY: Execute Withdrawal               │
└────────────────────────────────────────┘
         │
         ├─────────────────────┬──────────────────┐
         │                     │                  │
         ▼                     ▼                  ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Network Error    │  │ Auth Error       │  │ Business Logic   │
│                  │  │                  │  │ Error            │
│ • Timeout        │  │ • Invalid token  │  │                  │
│ • Connection     │  │ • Expired token  │  │ • Already        │
│   failed         │  │ • No permission  │  │   withdrawn      │
│                  │  │                  │  │ • Registration   │
│                  │  │                  │  │   not found      │
└──────────────────┘  └──────────────────┘  └──────────────────┘
         │                     │                  │
         └─────────────────────┴──────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│  CATCH: Log Error & Show User-Friendly Message                │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  • Console.error() for debugging                               │
│  • toast.error() for user feedback                             │
│  • Modal remains open for retry                                │
│  • isSubmitting = false (enable buttons)                       │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## Success Path with All Updates

```
┌─────────────────────────────────────────────────────────────────┐
│                 WITHDRAWAL SUCCESS CASCADE                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  1. Database Updated                   │
         │     • registration_status = withdrawn  │
         │     • withdrawal_reason saved          │
         │     • withdrawn_at timestamp           │
         └────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  2. Success Response to Frontend       │
         │     • { success: true, message: ... }  │
         └────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  3. UI Updates                         │
         │     • Success modal (2 seconds)        │
         │     • Toast notification               │
         └────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  4. Callback Executed                  │
         │     • onWithdrawSuccess()              │
         └────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  5. Data Refresh                       │
         │     • fetchAllEventsProgress()         │
         │     • fetchRegistrations()             │
         └────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  6. Component Re-renders               │
         │     • HomePage event cards update      │
         │     • MyRegistrationsCard reorganizes  │
         └────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  7. Cache Invalidation                 │
         │     • Participant counts refresh       │
         │     • Leaderboard recalculates         │
         └────────────────────────────────────────┘
```

## Quick Reference: Key Files

```
Frontend:
├── /components/modals/WithdrawEventModal.tsx     (UI & API call)
├── /components/HomePage.tsx                       (Integration)
├── /components/MyRegistrationsCard.tsx           (Display)
└── /utils/supabase/client.ts                     (API methods)

Backend:
└── /supabase/functions/server/index.tsx
    ├── POST /events/:eventId/withdraw            (line 1181)
    └── GET /user/registrations                   (line 1249)

Database:
├── /supabase-migration-add-withdrawal-fields.sql (Migration)
└── /supabase-schema.sql                          (Base schema)

Documentation:
├── /WITHDRAWAL_INTEGRATION_CHECKLIST.md          (Testing guide)
├── /WITHDRAWAL_FIXES_SUMMARY.md                  (Fixes applied)
├── /WITHDRAWAL_VERIFICATION_COMPLETE.md          (Complete review)
└── /WITHDRAWAL_FLOW_DIAGRAM.md                   (This file)
```

## Quick Test Command

```bash
# 1. Apply migration
psql $DATABASE_URL -f supabase-migration-add-withdrawal-fields.sql

# 2. Verify fields exist
psql $DATABASE_URL -c "\d user_events" | grep withdrawal

# 3. Test withdrawal (in browser)
# - Log in
# - Navigate to event with progress
# - Click "I cannot make it"
# - Complete withdrawal
# - Verify in MyRegistrationsCard

# 4. Verify in database
psql $DATABASE_URL -c "
SELECT 
  u.email,
  e.name,
  ue.registration_status,
  ue.withdrawal_reason,
  ue.withdrawn_at
FROM user_events ue
JOIN users u ON u.id = ue.user_id
JOIN events e ON e.id = ue.event_id
WHERE ue.registration_status = 'withdrawn'
ORDER BY ue.withdrawn_at DESC
LIMIT 5;
"
```

## Summary

The withdrawal feature follows a clean, linear flow:
1. User action → Modal
2. Modal → API call
3. API → Database update
4. Database → Response
5. Response → UI update
6. UI update → User feedback

All components work together seamlessly with proper error handling at each step. The feature integrates perfectly with existing systems (points, leaderboard, participant counts, sessions) and maintains the Gravalist philosophy of user control and transparency.
