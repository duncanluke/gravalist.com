import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Mail, TrendingUp, Users, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { createClient } from '../utils/supabase/client';

interface EmailStats {
  total_sent: number;
  sent_last_24h: number;
  sent_last_7d: number;
  sent_last_30d: number;
  by_phase: {
    register: number;
    start_line: number;
    end: number;
  };
  avg_completion_rate: number;
  avg_days_to_completion: number;
}

interface RecentEmail {
  id: string;
  recipient_email: string;
  event_name: string;
  reminder_phase: string;
  sent_at: string;
  email_opened: boolean;
  email_clicked: boolean;
  user_completed_after_email: boolean;
  completed_at: string | null;
}

export function EmailReminderAnalytics() {
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [recentEmails, setRecentEmails] = useState<RecentEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL || '',
        import.meta.env.VITE_SUPABASE_ANON_KEY || ''
      );

      // Fetch email statistics
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_email_reminder_stats');

      if (statsError) throw statsError;

      // Fetch recent emails
      const { data: emailsData, error: emailsError } = await supabase
        .from('email_reminder_log')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(10);

      if (emailsError) throw emailsError;

      setStats(statsData);
      setRecentEmails(emailsData || []);
    } catch (err) {
      console.error('Error fetching email analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="bg-destructive/10 border-destructive">
          <CardContent className="p-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const phaseColors = {
    register: 'bg-blue-500/20 text-blue-400 border-blue-500',
    start_line: 'bg-orange-500/20 text-orange-400 border-orange-500',
    end: 'bg-green-500/20 text-green-400 border-green-500'
  };

  const phaseLabels = {
    register: 'Registration',
    start_line: 'Start Line',
    end: 'End'
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="mb-2">Email Reminder Analytics</h2>
        <p className="text-muted-foreground">
          Track incomplete registration reminders and their effectiveness
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              Total Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_sent || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.sent_last_24h || 0} in last 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Last 7 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.sent_last_7d || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.sent_last_30d || 0} in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.avg_completion_rate ? `${stats.avg_completion_rate.toFixed(1)}%` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Users who completed after email
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Avg. Time to Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.avg_days_to_completion 
                ? `${stats.avg_days_to_completion.toFixed(1)}d` 
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Days from email to completion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Emails by Phase */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Reminders by Phase</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(stats?.by_phase || {}).map(([phase, count]) => (
              <div 
                key={phase}
                className="p-4 rounded-lg border border-border bg-card"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {phaseLabels[phase as keyof typeof phaseLabels]}
                  </span>
                  <Badge variant="outline" className={phaseColors[phase as keyof typeof phaseColors]}>
                    {phase.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="text-3xl font-bold">{count}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Emails */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Reminders</CardTitle>
        </CardHeader>
        <CardContent>
          {recentEmails.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No reminder emails sent yet
            </p>
          ) : (
            <div className="space-y-2">
              {recentEmails.map((email) => (
                <div 
                  key={email.id}
                  className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{email.recipient_email}</span>
                        <Badge variant="outline" className={phaseColors[email.reminder_phase as keyof typeof phaseColors]}>
                          {phaseLabels[email.reminder_phase as keyof typeof phaseLabels]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {email.event_name}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{new Date(email.sent_at).toLocaleDateString()}</span>
                        {email.email_opened && (
                          <span className="flex items-center gap-1 text-green-400">
                            <CheckCircle className="w-3 h-3" />
                            Opened
                          </span>
                        )}
                        {email.email_clicked && (
                          <span className="flex items-center gap-1 text-blue-400">
                            <CheckCircle className="w-3 h-3" />
                            Clicked
                          </span>
                        )}
                        {email.user_completed_after_email && (
                          <span className="flex items-center gap-1 text-primary">
                            <CheckCircle className="w-3 h-3" />
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                    {email.user_completed_after_email ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
