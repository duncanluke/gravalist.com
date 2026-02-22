# Email Reminder System - Quick Reference Card

## 🚀 Deployment Commands

```bash
# Deploy edge function
supabase functions deploy send-incomplete-registration-reminders

# Test manually
curl -X POST \
  'https://YOUR_PROJECT.supabase.co/functions/v1/send-incomplete-registration-reminders' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY'
```

## 📊 Key SQL Queries

### Check Eligible Users
```sql
SELECT * FROM get_reminder_eligible_registrations();
```

### View Recent Sends
```sql
SELECT * FROM email_reminder_log ORDER BY sent_at DESC LIMIT 10;
```

### Get Statistics
```sql
SELECT get_email_reminder_stats();
```

### Completion Rates by Phase
```sql
SELECT 
  reminder_phase,
  COUNT(*) as sent,
  COUNT(*) FILTER (WHERE user_completed_after_email = true) as completed,
  ROUND(COUNT(*) FILTER (WHERE user_completed_after_email = true)::DECIMAL / COUNT(*) * 100, 2) as rate
FROM email_reminder_log
GROUP BY reminder_phase;
```

## ⏰ Cron Schedule Examples

```bash
0 9 * * *       # Daily at 9am
0 9,21 * * *    # Twice daily (9am, 9pm)
0 */6 * * *     # Every 6 hours
0 9 * * 1,3,5   # Mon/Wed/Fri at 9am
```

## 🎯 Sending Rules

| Phase | Timing | Max Reminders |
|-------|--------|---------------|
| Register | 24h after last activity | 3 |
| Start Line | 3 days before event | 3 |
| End | 7 days after event | 3 |

## 📧 Manual Send

```tsx
import { SendReminderEmailButton } from './components/SendReminderEmailButton';

<SendReminderEmailButton 
  eventId="uuid"
  eventName="Ride Name"
  currentPhase="register"
/>
```

## 📈 View Analytics

```tsx
import { EmailReminderAnalytics } from './components/EmailReminderAnalytics';

<EmailReminderAnalytics />
```

## 🐛 Debugging

### Check Function Logs
Supabase Dashboard → Edge Functions → Logs

### Check Email Service
```sql
SELECT COUNT(*) FROM email_reminder_log WHERE sent_at >= NOW() - INTERVAL '24 hours';
```

### Find Failed Sends
```sql
SELECT * FROM v_email_reminder_analytics 
WHERE user_completed_after_email = false 
  AND sent_at >= NOW() - INTERVAL '7 days';
```

## 📁 File Locations

| File | Purpose |
|------|---------|
| `/supabase/migrations/add_email_reminder_tracking.sql` | Database schema |
| `/supabase/functions/send-incomplete-registration-reminders/` | Cron job |
| `/components/EmailReminderAnalytics.tsx` | Dashboard |
| `/DEPLOYMENT_GUIDE.md` | Full deployment steps |

## ✅ Deployment Checklist

- [ ] Run migration SQL files
- [ ] Deploy edge function
- [ ] Set up cron job
- [ ] Add analytics to admin page
- [ ] Test with manual send
- [ ] Monitor for 24 hours
- [ ] Check completion rates

## 🎯 Success Targets

- **Completion Rate**: >15% overall
- **Open Rate**: >20%
- **Time to Complete**: <3 days
- **Error Rate**: <1%

## 📞 Quick Links

- Full Guide: `/DEPLOYMENT_GUIDE.md`
- Technical Docs: `/INCOMPLETE_REGISTRATION_EMAIL.md`
- Examples: `/INTEGRATION_EXAMPLE.tsx`
- Summary: `/COMPLETE_AUTOMATION_SUMMARY.md`
