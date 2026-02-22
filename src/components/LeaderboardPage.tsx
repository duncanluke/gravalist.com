import React, { useState, useEffect, useCallback } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { toast } from 'sonner@2.0.3';
import { Skeleton } from './ui/skeleton';

import { Trophy, Medal, Award, Star, Heart, Crown, Search, UserPlus, Send, Loader2 } from 'lucide-react';
import { apiClient, LeaderboardEntry } from '../utils/supabase/client';
import { useAuth } from '../hooks/useAuth';
import { requireAuth } from '../utils/auth-helpers';
import foxImage from '@/assets/generic-3.png';

interface LeaderboardPageProps {
  onBackToHome: () => void;
  onNavigateToAddRoute: () => void;
}

interface CommunityMember {
  id: string;
  name: string;
  city: string;
  totalPoints: number;
  rank: number;
  adventures: number;
  pathfinderEvents: number;
  socialShares: number;
  routesAdded: number;
  formsCompleted: number;
  routeRatings: number;
}

// Point values for different activities - these match what's stored in the database
const pointActivities = [
  { points: 500, description: "Adding a route", action: "Add Route", type: "route" },
  { points: 200, description: "Completing a route", action: "Join Event", type: "event" },
  { points: 100, description: "Starting a route", action: "Join Event", type: "event" },
  { points: 50, description: "Community event signup", action: "Join Event", type: "event" },
  { points: 25, description: "Inviting friends", action: "Invite Friend", type: "social" },
  { points: 10, description: "Social media sharing", action: "Share", type: "social" }
];

export function LeaderboardPage({ onBackToHome, onNavigateToAddRoute }: LeaderboardPageProps) {
  const { isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  
  // Real data state
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [currentChampion, setCurrentChampion] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const membersPerPage = 10;
  
  // Fetch leaderboard data from database
  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { leaderboard } = await apiClient.getLeaderboard();
      
      // Sort by total points and assign ranks
      const sortedLeaderboard = leaderboard
        .sort((a, b) => b.total_points - a.total_points)
        .map((entry, index) => ({
          ...entry,
          rank_position: index + 1
        }));
      
      setLeaderboardData(sortedLeaderboard);
      
      // Set current champion (top player)
      if (sortedLeaderboard.length > 0) {
        setCurrentChampion(sortedLeaderboard[0]);
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Listen for points updates to refresh leaderboard
  useEffect(() => {
    const handlePointsUpdate = () => {
      console.log('LEADERBOARD - Received points update, refreshing leaderboard');
      fetchLeaderboard();
    };

    const handleProfileRefresh = () => {
      console.log('LEADERBOARD - Received profile refresh, refreshing leaderboard');
      fetchLeaderboard();
    };

    window.addEventListener('pointsUpdated', handlePointsUpdate);
    window.addEventListener('profileRefreshed', handleProfileRefresh);

    return () => {
      window.removeEventListener('pointsUpdated', handlePointsUpdate);
      window.removeEventListener('profileRefreshed', handleProfileRefresh);
    };
  }, [fetchLeaderboard]);

  // Convert LeaderboardEntry to CommunityMember format for display
  const formatMemberData = (entry: LeaderboardEntry): CommunityMember => ({
    id: entry.id,
    name: entry.display_name || 
          (entry.first_name && entry.last_name ? `${entry.first_name} ${entry.last_name}` : '') ||
          entry.email.split('@')[0],
    city: entry.city || 'Location not provided',
    totalPoints: entry.total_points,
    rank: entry.rank_position,
    adventures: entry.events_completed,
    pathfinderEvents: 0, // Future feature
    socialShares: 0, // Future feature  
    routesAdded: 0, // Future feature
    formsCompleted: entry.events_completed,
    routeRatings: entry.achievements_earned || 0
  });

  // Format leaderboard data for display
  const formattedLeaderboardData = leaderboardData.map(formatMemberData);

  // Send invitation
  const handleSendInvitation = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to send invitations');
      return;
    }

    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setIsInviting(true);
    try {
      const { invitationLink, emailSent } = await apiClient.sendInvitation({
        email: inviteEmail.trim(),
        personalMessage: inviteMessage.trim() || undefined
      });

      if (emailSent) {
        toast.success('Invitation email sent successfully!');
      } else {
        toast.success('Invitation created! Share the link below.');
      }
      
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteMessage('');
      
      // Copy invitation link to clipboard
      navigator.clipboard.writeText(invitationLink);
      toast.success('Invitation link copied to clipboard!');
    } catch (err) {
      console.error('Error sending invitation:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  // Filter members based on search term
  const filteredMembers = formattedLeaderboardData.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.city.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredMembers.length / membersPerPage);
  const startIndex = (currentPage - 1) * membersPerPage;
  const currentMembers = filteredMembers.slice(startIndex, startIndex + membersPerPage);

  // Reset to page 1 when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Use the Supabase invitation function we already defined above
  const handleInviteFriend = handleSendInvitation;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-warning" />;
      case 2:
        return <Medal className="h-5 w-5 text-muted-foreground" />;
      case 3:
        return <Award className="h-5 w-5 text-warning/70" />;
      default:
        return <span className="text-sm font-medium text-muted-foreground">#{rank}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4 relative pb-32">
        {/* Decorative background image */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-md mx-auto pointer-events-none z-0">
          <img 
            src={foxImage} 
            alt="Community mascot"
            className="w-full h-auto opacity-30"
            style={{
              maskImage: 'radial-gradient(ellipse 80% 80% at center, black 40%, transparent 100%)',
              WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at center, black 40%, transparent 100%)'
            }}
          />
        </div>
        
        <div className="relative z-10 flex items-center justify-center gap-3">
          <Trophy className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-semibold">Community Leaderboard</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto relative z-10">
          Our completely virtual community thrives on member initiative. Take action, earn points, and build the ultra cycling community together.
        </p>
      </div>

      {/* Main Layout - Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaderboard - Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Members Stats */}
          <div className="text-center lg:text-left">
            <p className="text-sm text-muted-foreground">
              {searchTerm ? (
                <>
                  Showing {startIndex + 1}-{Math.min(startIndex + membersPerPage, filteredMembers.length)} of {filteredMembers.length} results
                  {filteredMembers.length !== formattedLeaderboardData.length && (
                    <span className=" text-muted-foreground/70"> (filtered from {formattedLeaderboardData.length} total members)</span>
                  )}
                </>
              ) : (
                <>
                  Showing {startIndex + 1}-{Math.min(startIndex + membersPerPage, filteredMembers.length)} of {filteredMembers.length} community members
                </>
              )}
            </p>
          </div>

          {/* Leaderboard List */}
          <div className="space-y-2">
            {loading ? (
              // Loading skeletons
              Array.from({ length: membersPerPage }).map((_, index) => (
                <Card key={index}>
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="w-24 h-4" />
                          <Skeleton className="w-16 h-3" />
                        </div>
                      </div>
                      <div className="text-right">
                        <Skeleton className="w-20 h-4" />
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : error ? (
              <Card>
                <div className="p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Unable to load leaderboard</p>
                  <p className="text-xs text-muted-foreground">{error}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </div>
              </Card>
            ) : formattedLeaderboardData.length === 0 ? (
              <Card>
                <div className="p-6 text-center">
                  <Trophy className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-sm font-medium mb-1">No leaderboard data yet</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Be the first to earn points by completing events or adding routes!
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" size="sm" onClick={onBackToHome}>
                      Browse Events
                    </Button>
                    <Button variant="outline" size="sm" onClick={onNavigateToAddRoute}>
                      Add Route
                    </Button>
                  </div>
                </div>
              </Card>
            ) : currentMembers.length > 0 ? (
              currentMembers.map((member) => (
                <Card key={member.id} className={`${
                  member.rank === 1 ? 'border-primary/50 bg-primary/5' : 
                  member.rank <= 3 ? 'border-warning/30 bg-warning/5' : ''
                }`}>
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted/30">
                          {getRankIcon(member.rank)}
                        </div>
                        
                        <div className="space-y-1">
                          <div className="text-sm font-medium">{member.name}</div>
                          <div className="text-xs text-muted-foreground">{member.city}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-primary" />
                          <span className="text-sm font-semibold text-primary">{member.totalPoints.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card>
                <div className="p-6 text-center">
                  <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-sm font-medium mb-1">No results found</h3>
                  <p className="text-xs text-muted-foreground">
                    Try searching with a different name or city
                  </p>
                </div>
              </Card>
            )}
          </div>

          {/* Pagination */}
          {currentMembers.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>

        {/* Points Scoring Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <Star className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">How to Earn Points</h3>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                Points are earned by taking action in our community:
              </p>

              <div className="space-y-2">
                <Button 
                  onClick={onNavigateToAddRoute}
                  variant="ghost"
                  className="flex items-center justify-between p-2 bg-muted/30 hover:bg-muted/50 hover:border-primary/30 border border-muted/50 rounded-lg h-auto w-full transition-all duration-200 cursor-pointer hover:shadow-sm hover:scale-[1.01] focus:ring-2 focus:ring-primary/20"
                >
                  <div className="flex-1 text-left">
                    <div className="text-sm">Adding a route</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-primary" />
                    <span className="text-sm font-semibold text-primary">500</span>
                  </div>
                </Button>

                <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <div className="text-sm">Completing a Ride</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-primary" />
                    <span className="text-sm font-semibold text-primary">200</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <div className="text-sm">Starting a Ride</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-primary" />
                    <span className="text-sm font-semibold text-primary">100</span>
                  </div>
                </div>

                <Button 
                  onClick={onBackToHome}
                  variant="ghost"
                  className="flex items-center justify-between p-2 bg-muted/30 hover:bg-muted/50 hover:border-primary/30 border border-muted/50 rounded-lg h-auto w-full transition-all duration-200 cursor-pointer hover:shadow-sm hover:scale-[1.01] focus:ring-2 focus:ring-primary/20"
                >
                  <div className="flex-1 text-left">
                    <div className="text-sm">Register for a Ride</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-primary" />
                    <span className="text-sm font-semibold text-primary">50</span>
                  </div>
                </Button>

                <Button 
                  onClick={() => requireAuth(isAuthenticated, () => setShowInviteModal(true))}
                  variant="ghost"
                  className="flex items-center justify-between p-2 bg-muted/30 hover:bg-muted/50 hover:border-primary/30 border border-muted/50 rounded-lg h-auto w-full transition-all duration-200 cursor-pointer hover:shadow-sm hover:scale-[1.01] focus:ring-2 focus:ring-primary/20"
                >
                  <div className="flex-1 text-left">
                    <div className="text-sm">Inviting friends</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-primary" />
                    <span className="text-sm font-semibold text-primary">25</span>
                  </div>
                </Button>

                <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <div className="text-sm">Social media sharing</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-primary" />
                    <span className="text-sm font-semibold text-primary">10</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-medium text-primary">Community Initiative</h4>
                </div>
                <p className="text-xs text-muted-foreground">
                  This is a self-managed community where your initiative drives your success.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Past Champions Section */}
      <Card className="border-primary/30">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Crown className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold">Champions</h2>
          </div>

          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {/* Current Champion */}
            {currentChampion ? (
              <Card className="flex-shrink-0 w-64 border-primary/50 bg-primary/5">
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-primary mb-3">2025 (Current Leader)</h3>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">
                      {currentChampion.display_name || 
                       (currentChampion.first_name && currentChampion.last_name ? 
                        `${currentChampion.first_name} ${currentChampion.last_name}` : '') ||
                       currentChampion.email.split('@')[0]}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {currentChampion.city || 'Location not provided'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-primary" />
                      <span className="text-sm font-semibold text-primary">
                        {currentChampion.total_points.toLocaleString()} points
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="flex-shrink-0 w-64 border-muted">
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-3">2025 Champion</h3>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Be the first to earn points and claim the championship!
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </Card>

      {/* Annual Championship Section - Moved to Bottom */}
      <Card className="border-primary/50 bg-primary/5">
        <div className="p-4">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-primary">Annual Championship</h2>
            </div>
            <p className="text-sm">
              A premium prize from one of our partners will be awarded to the annual points leader.
            </p>
            <div className="bg-background/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                Winner determined by total points earned throughout the year.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Back to Home */}
      <div className="pt-4">
        <Button 
          variant="outline" 
          onClick={onBackToHome}
          className="w-full"
        >
          Back to Home
        </Button>
      </div>

      {/* Invite Friend Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="w-[95%] max-w-md mx-auto">
          <DialogHeader className="text-left">
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Invite a Friend
            </DialogTitle>
            <DialogDescription>
              Share gravalist.com with a friend and earn 25 community points when they join.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Friend's Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="Enter your friend's email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="bg-input-background border-border focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-message">Personal Message (Optional)</Label>
              <textarea
                id="invite-message"
                placeholder="Add a personal message to your invitation..."
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                className="w-full min-h-[80px] px-3 py-2 bg-input-background border border-border rounded-md resize-none focus:outline-none focus:border-primary text-sm"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                {inviteMessage.length}/200 characters
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm text-muted-foreground">
                Your friend will receive an email with an invitation to join gravalist.com and participate in ultra events.
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowInviteModal(false)}
              disabled={isInviting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleInviteFriend}
              disabled={isInviting}
              className="bg-primary hover:bg-primary/90"
            >
              {isInviting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}