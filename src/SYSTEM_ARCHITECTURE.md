# Email Reminder System - Architecture Overview

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      EMAIL REMINDER SYSTEM                       │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌───────────────┐     ┌──────────────────┐
│   Database   │────▶│  Cron Job     │────▶│  Email Service   │
│              │     │  (Edge Func)  │     │  (MailerSend)    │
└──────────────┘     └───────────────┘     └──────────────────┘
      │                     │                        │
      │                     │                        │
      ▼                     ▼                        ▼
┌──────────────┐     ┌───────────────┐     ┌──────────────────┐
│ Tracking     │     │  Filtering    │     │   User Inbox     │
│ Columns      │     │  Logic        │     │                  │
└──────────────┘     └───────────────┘     └──────────────────┘
      │                     │                        │
      │                     │                        │
      ▼                     ▼                        ▼
┌──────────────┐     ┌───────────────┐     ┌──────────────────┐
│ Analytics    │     │  Logging      │     │  User Action     │
│ Dashboard    │     │  System       │     │  (Complete)      │
└──────────────┘     └───────────────┘     └──────────────────┘
```

## 📊 Data Flow

### 1. User Starts Registration
```
User clicks "Register" 
  → Creates record in user_events table
  → Sets current_step_id = 1
  → Sets updated_at = NOW()
```

### 2. User Abandons (Doesn't Complete)
```
24 hours pass with no activity
  → updated_at remains old
  → registration_status != 'completed'
  → Becomes eligible for reminder
```

### 3. Cron Job Runs (Daily at 9am)
```
Edge Function executes
  → Calls get_reminder_eligible_registrations()
  → Filters by phase-specific rules
  → Sends email for each eligible user
  → Logs to email_reminder_log
  → Updates last_reminder_sent_at
```

### 4. User Receives Email
```
Email arrives in inbox
  → Opens email (tracked via webhook)
  → Clicks "Complete Registration" button
  → Returns to hub.gravalist.com/{event-slug}
```

### 5. User Completes Registration
```
User finishes remaining steps
  → registration_status = 'completed'
  → Trigger fires: mark_user_completed_after_email()
  → Updates email_reminder_log
  → Tracks conversion in analytics
```

## 🗄️ Database Schema

### user_events (existing + new columns)
```sql
user_events
├── id (UUID)
├── user_id (UUID) → users.id
├── event_id (UUID) → events.id
├── current_step_id (INTEGER)
├── current_phase (VARCHAR)
├── registration_status (VARCHAR)
├── updated_at (TIMESTAMP)
│
├── NEW: last_reminder_sent_at (TIMESTAMP)
├── NEW: reminder_count (INTEGER)
└── NEW: reminder_phase (VARCHAR)
```

### email_reminder_log (new table)
```sql
email_reminder_log
├── id (UUID)
├── user_id (UUID) → users.id
├── event_id (UUID) → events.id
├── user_event_id (UUID) → user_events.id
│
├── reminder_phase (VARCHAR)
├── recipient_email (VARCHAR)
├── user_display_name (VARCHAR)
├── event_name (VARCHAR)
│
├── sent_at (TIMESTAMP)
├── mailersend_message_id (VARCHAR)
│
├── current_step_id (INTEGER)
├── days_since_last_activity (DECIMAL)
├── days_until_event (DECIMAL)
│
├── email_opened (BOOLEAN)
├── email_clicked (BOOLEAN)
├── user_completed_after_email (BOOLEAN)
└── completed_at (TIMESTAMP)
```

## 🔧 Key Functions

### get_reminder_eligible_registrations()
```sql
Returns users who:
✓ Have incomplete registration
✓ current_step_id > 0 (started)
✓ Last activity > 24 hours ago
✓ Last reminder > 24 hours ago (or never)
✓ reminder_count < 3
```

### update_reminder_sent(user_event_id, phase)
```sql
Updates after sending:
✓ last_reminder_sent_at = NOW()
✓ reminder_count += 1
✓ reminder_phase = phase
```

### mark_user_completed_after_email(user_id, event_id)
```sql
Marks conversion:
✓ user_completed_after_email = true
✓ completed_at = NOW()
✓ Only for emails sent in last 30 days
```

### get_email_reminder_stats()
```sql
Returns analytics:
✓ Total sent (all time)
✓ Sent last 24h/7d/30d
✓ Breakdown by phase
✓ Avg completion rate
✓ Avg days to completion
```

## 🎯 Decision Tree

```
Is user eligible for reminder?
│
├─ Has current_step_id > 0? (started registration)
│  ├─ YES → Continue
│  └─ NO → Skip
│
├─ Is registration_status = 'completed'?
│  ├─ YES → Skip
│  └─ NO → Continue
│
├─ Last activity > 24 hours ago?
│  ├─ YES → Continue
│  └─ NO → Skip
│
├─ Last reminder > 24 hours ago (or never sent)?
│  ├─ YES → Continue
│  └─ NO → Skip
│
├─ reminder_count < 3?
│  ├─ YES → Continue
│  └─ NO → Skip (max reached)
│
└─ Phase-specific timing check:
   │
   ├─ REGISTER PHASE (steps 0-9)
   │  └─ Send if: inactive 24+ hours ✓
   │
   ├─ START_LINE PHASE (steps 10-14)
   │  └─ Send if: 3 days before event ✓
   │
   └─ END PHASE (steps 15-17)
      └─ Send if: 7 days after event ✓
```

## ⚙️ Components Interaction

```
Frontend (React)
├── SendReminderEmailButton.tsx
│   └── Manual trigger for testing
│
└── EmailReminderAnalytics.tsx
    └── Display stats from database

Backend (Supabase)
├── /functions/send-incomplete-registration-reminders/
│   ├── Runs on cron schedule
│   ├── Queries eligible users
│   ├── Calls email API for each
│   └── Logs results
│
└── /functions/server/index.tsx
    └── POST /send-incomplete-registration-email
        ├── Validates request
        ├── Fetches user/event data
        ├── Calls MailerSend API
        └── Returns success/failure

Email Service (MailerSend)
└── Delivers HTML email
    ├── Tracks opens (webhook)
    ├── Tracks clicks (webhook)
    └── Returns message_id
```

## 📈 Metrics Pipeline

```
Email Send
    ↓
Log to email_reminder_log
    ↓
User Opens Email (webhook)
    ↓
mark_email_opened(message_id)
    ↓
User Clicks CTA (webhook)
    ↓
mark_email_clicked(message_id)
    ↓
User Completes Registration
    ↓
Trigger: mark_user_completed_after_email()
    ↓
Analytics Dashboard (real-time)
```

## 🔄 Daily Cycle

```
Day 1: 09:00 UTC
├── Cron job triggers
├── Query finds 10 eligible users
├── Send 10 emails
├── Log 10 records
└── Update 10 user_events

Day 1: 10:30 UTC
├── User A opens email
├── Webhook marks opened
└── Analytics updated

Day 1: 14:00 UTC
├── User A clicks CTA
├── Webhook marks clicked
├── User completes registration
└── Conversion logged

Day 2: 09:00 UTC
├── Cron job triggers again
├── User A excluded (completed)
├── New eligible users found
└── Cycle repeats
```

## 🎨 Email Template Structure

```
┌───────────────────────────┐
│  [Gravalist Logo]         │
│  Unsupported Ultracycling │
├───────────────────────────┤
│  ⏰ Action Required       │
│                           │
│  Clarens 500              │
│  📅 Dec 25, 2024         │
│  📍 Clarens, SA          │
├───────────────────────────┤
│  Hey John,                │
│  Breathe. You've got this.│
│                           │
│  You started registering  │
│  but haven't finished...  │
├───────────────────────────┤
│  CURRENT PHASE:           │
│  Registration Phase       │
├───────────────────────────┤
│  WHAT'S NEXT:             │
│  1. Set Username          │
│  2. Emergency Contact     │
│  3. Review Details        │
├───────────────────────────┤
│  ⭐ Earn 100 points       │
├───────────────────────────┤
│  THE JOURNEY:             │
│  1. Register ← You here   │
│  2. Start Line            │
│  3. End                   │
├───────────────────────────┤
│  [Complete Registration]  │
│  (Orange CTA Button)      │
└───────────────────────────┘
```

## 🚀 Performance Considerations

### Batch Processing
- Process users sequentially (500ms delay between)
- Prevents MailerSend rate limiting
- Allows early exit on errors

### Caching
- Query eligible users once per run
- Cache user/event data
- Reuse database connection

### Indexing
```sql
-- Optimized queries with indexes:
idx_user_events_incomplete
idx_user_events_reminder_eligible
idx_email_reminder_log_sent_at
idx_email_reminder_log_phase
```

### Scalability
- Handles 1000+ users per run
- ~5 minute runtime for 500 sends
- Can run multiple times daily if needed

## 🔒 Security

### Authentication
- Cron job uses SERVICE_ROLE_KEY
- User-triggered uses access_token
- RLS policies on email_reminder_log

### Data Privacy
- Email addresses only visible to authenticated users
- PII logging minimized
- GDPR compliant (can delete logs)

## 📊 Monitoring Points

```
✓ Cron job execution (daily)
✓ Eligible users found (should be > 0 weekly)
✓ Emails sent successfully (>95% success rate)
✓ Email opens (>20% open rate)
✓ Email clicks (>3% click rate)
✓ Completions after email (>15% conversion)
✓ Average time to completion (<3 days)
```

## 🎯 Success Criteria

| Metric | Target | Good | Excellent |
|--------|--------|------|-----------|
| Completion Rate | 10% | 15% | 25% |
| Open Rate | 15% | 20% | 30% |
| Click Rate | 2% | 3% | 5% |
| Time to Complete | 5 days | 3 days | 1 day |
| Error Rate | 5% | 1% | 0.1% |

---

This architecture provides:
✅ Automated daily reminders
✅ Smart phase-based timing
✅ Complete tracking and analytics
✅ Scalable and performant
✅ Secure and privacy-focused
✅ Easy to monitor and debug
