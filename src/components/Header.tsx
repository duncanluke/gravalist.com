import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { ArrowLeft, Mail, User, Check, Map, Trophy, Calendar, Crown, Plus, LogOut, UserPlus, Sun, Moon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner@2.0.3';
import { BookOpen } from 'lucide-react';
import logoImage from '@/assets/logo.png';
import { ViewMode } from '../types/app';
import { User as UserType } from '../utils/supabase/client';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../utils/supabase/client';
import { InviteFriendModal } from './InviteFriendModal';
import { useTheme } from 'next-themes';

interface HeaderProps {
  viewMode: ViewMode;
  onNavigateToHome: () => void;
  userEmail?: string;
  onNavigateToMap?: () => void;
  onNavigateToLeaderboard?: () => void;
  onNavigateToRides?: () => void;
  onNavigateToStories?: () => void;
  onNavigateToSubscribe?: () => void;
  onNavigateToAddRoute?: () => void;
  isAuthenticated?: boolean;
  userProfile?: UserType | null;
}

export function Header({
  viewMode,
  onNavigateToHome,
  userEmail,
  onNavigateToMap,
  onNavigateToLeaderboard,
  onNavigateToRides,
  onNavigateToStories,
  onNavigateToSubscribe,
  onNavigateToAddRoute,
  isAuthenticated,
  userProfile
}: HeaderProps) {
  const showBackButton = viewMode !== 'home';
  const [emailPopoverOpen, setEmailPopoverOpen] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [nameForm, setNameForm] = useState({
    firstName: '',
    lastName: '',
    city: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const { signOut, refreshProfile, updateProfile } = useAuth();
  const [localProfile, setLocalProfile] = useState(userProfile);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const { theme, setTheme } = useTheme();

  // Handle logout - sign out user and navigate to homepage
  const handleLogout = async () => {
    try {
      await signOut();
      onNavigateToHome(); // Navigate to homepage after successful logout
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, navigate to home to prevent user being stuck
      onNavigateToHome();
    }
  };

  // Update local profile when prop changes
  useEffect(() => {
    setLocalProfile(userProfile);
  }, [userProfile]);

  // Listen for profile refresh events
  useEffect(() => {
    const handleProfileRefresh = (event: CustomEvent) => {
      console.log('Header received profile refresh event:', event.detail);
      setLocalProfile(event.detail);
    };

    const handlePointsUpdate = (event: CustomEvent) => {
      console.log('Header received points update event:', event.detail);
      // Trigger a profile refresh when points are updated
      if (isAuthenticated && refreshProfile) {
        console.log('Header triggering profile refresh due to points update');
        refreshProfile();
      }
    };

    window.addEventListener('profileRefreshed', handleProfileRefresh as EventListener);
    window.addEventListener('pointsUpdated', handlePointsUpdate as EventListener);

    return () => {
      window.removeEventListener('profileRefreshed', handleProfileRefresh as EventListener);
      window.removeEventListener('pointsUpdated', handlePointsUpdate as EventListener);
    };
  }, [isAuthenticated, refreshProfile]);

  const displayEmail = userEmail || localProfile?.email;

  // Create display name from profile data
  const getDisplayName = () => {
    console.log('Header profile data:', {
      exists: !!localProfile,
      firstName: localProfile?.first_name,
      lastName: localProfile?.last_name,
      displayName: localProfile?.display_name,
      email: localProfile?.email,
      totalPoints: localProfile?.total_points
    });

    // Priority 1: Use first_name + last_name if both exist and are not empty
    if (localProfile?.first_name?.trim() && localProfile?.last_name?.trim()) {
      return `${localProfile.first_name.trim()} ${localProfile.last_name.trim()}`;
    }

    // Priority 2: Use display_name if it exists and is not empty
    if (localProfile?.display_name?.trim()) {
      return localProfile.display_name.trim();
    }

    // Priority 3: Extract username from email as fallback
    if (localProfile?.email) {
      return localProfile.email.split('@')[0];
    }

    return null;
  };

  const displayName = getDisplayName();
  const totalPoints = localProfile?.total_points || 0;

  // Listen for profile refresh events (e.g., when points are awarded)
  useEffect(() => {
    const handleRefreshProfile = () => {
      if (isAuthenticated && refreshProfile) {
        refreshProfile();
      }
    };

    window.addEventListener('refreshProfile', handleRefreshProfile);
    return () => window.removeEventListener('refreshProfile', handleRefreshProfile);
  }, [isAuthenticated, refreshProfile]);

  // Handle name modal opening
  const handleNameModalOpen = () => {
    setNameForm({
      firstName: localProfile?.first_name || '',
      lastName: localProfile?.last_name || '',
      city: localProfile?.city || ''
    });
    setShowNameModal(true);
  };

  // Handle name update
  const handleUpdateName = async () => {
    if (!nameForm.firstName.trim() || !nameForm.lastName.trim()) {
      toast.error('Please enter both first and last name');
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated) {
      toast.error('Please sign in to update your profile');
      setShowNameModal(false);
      // Trigger auth modal
      window.dispatchEvent(new CustomEvent('requestAuth', { detail: { mode: 'signin' } }));
      return;
    }

    setIsUpdating(true);
    try {
      const result = await updateProfile({
        first_name: nameForm.firstName.trim(),
        last_name: nameForm.lastName.trim(),
        city: nameForm.city.trim()
      });

      if (result.success) {
        setShowNameModal(false);
        toast.success('Profile updated successfully');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error updating profile:', error);

      // Handle authentication errors specifically
      if (error instanceof Error && error.message.includes('Authentication required')) {
        toast.error('Please sign in to update your profile');
        setShowNameModal(false);
        // Trigger auth modal
        window.dispatchEvent(new CustomEvent('requestAuth', { detail: { mode: 'signin' } }));
      } else {
        toast.error('Failed to update profile. Please try again.');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Check if user has premium subscription
  const isPremiumUser = userProfile?.is_premium_subscriber &&
    userProfile?.subscription_status === 'active';

  const navigationItems = [
    {
      id: 'rides',
      label: 'Rides',
      icon: Calendar,
      active: viewMode === 'rides' || viewMode === 'home',
      onClick: () => {
        // Always navigate to home/rides section
        if (onNavigateToRides) {
          onNavigateToRides();
          // After navigation, scroll to rides section if on home page
          setTimeout(() => {
            const ridesSection = document.getElementById('community-rides');
            if (ridesSection) {
              ridesSection.scrollIntoView({ behavior: 'smooth' });
            }
          }, 100);
        }
      }
    },
    {
      id: 'leaderboard',
      label: 'Leaderboard',
      icon: Trophy,
      active: viewMode === 'leaderboard',
      onClick: onNavigateToLeaderboard
    },
    {
      id: 'add-route',
      label: 'Add Route',
      icon: Plus,
      active: viewMode === 'add-route',
      onClick: onNavigateToAddRoute
    },
    {
      id: 'subscribe',
      label: isPremiumUser ? 'Premium' : 'Subscribe',
      icon: Crown,
      active: viewMode === 'upgrade',
      onClick: onNavigateToSubscribe,
      isPrimary: !isPremiumUser,
      isPremium: isPremiumUser
    }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border/20">
      <div className="px-4 py-4 flex items-center justify-between min-h-[80px] relative">
        {/* Left section: Logo (Home) */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <button
            onClick={() => {
              onNavigateToHome();
              // Scroll to top of page
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="hover:opacity-80 transition-opacity"
          >
            <img
              src={logoImage}
              alt="Gravalist"
              className="h-12 w-auto md:h-14"
            />
          </button>
        </div>

        {/* Center section: Navigation buttons */}
        <div className="flex items-center gap-2 flex-1 justify-center overflow-x-auto scrollbar-hide px-4">
          {/* Rides Button */}
          {(() => {
            const ridesItem = navigationItems.find(item => item.id === 'rides');
            if (!ridesItem) return null;
            const Icon = ridesItem.icon;
            const isActive = ridesItem.active;

            return (
              <Button
                variant="ghost"
                size="sm"
                onClick={ridesItem.onClick}
                className={`
                  flex-shrink-0 px-3 py-2 h-auto rounded-full border transition-colors
                  flex items-center gap-2 relative z-10
                  ${isActive
                    ? 'border-primary/20 bg-primary/10 text-primary hover:bg-primary/20'
                    : 'border-muted-foreground/20 text-muted-foreground hover:border-primary/20 hover:bg-primary/10 hover:text-primary'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{ridesItem.label}</span>
              </Button>
            );
          })()}

          {/* Leaderboard Button */}
          {(() => {
            const leaderboardItem = navigationItems.find(item => item.id === 'leaderboard');
            if (!leaderboardItem) return null;
            const Icon = leaderboardItem.icon;
            const isActive = leaderboardItem.active;

            return (
              <Button
                variant="ghost"
                size="sm"
                onClick={leaderboardItem.onClick}
                className={`
                  flex-shrink-0 px-3 py-2 h-auto rounded-full border transition-colors
                  flex items-center gap-2 relative z-10
                  ${isActive
                    ? 'border-primary/20 bg-primary/10 text-primary hover:bg-primary/20'
                    : 'border-muted-foreground/20 text-muted-foreground hover:border-primary/20 hover:bg-primary/10 hover:text-primary'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{leaderboardItem.label}</span>
              </Button>
            );
          })()}

          {/* Subscribe Button */}
          {(() => {
            const subscribeItem = navigationItems.find(item => item.id === 'subscribe');
            if (!subscribeItem) return null;
            const Icon = subscribeItem.icon;
            const isActive = subscribeItem.active;
            const isPrimary = subscribeItem.isPrimary;
            const isPremium = subscribeItem.isPremium;

            return (
              <Button
                variant="ghost"
                size="sm"
                onClick={subscribeItem.onClick}
                className={`
                  flex-shrink-0 px-3 py-2 h-auto rounded-full border transition-colors
                  flex items-center gap-2 relative z-10
                  ${isPremium
                    ? 'border-primary/30 bg-primary/20 text-primary hover:bg-primary/30 cursor-pointer'
                    : isPrimary
                      ? 'border-primary/20 bg-primary text-primary-foreground hover:bg-primary/90'
                      : isActive
                        ? 'border-primary/20 bg-primary/10 text-primary hover:bg-primary/20'
                        : 'border-muted-foreground/20 text-muted-foreground hover:border-primary/20 hover:bg-primary/10 hover:text-primary'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{subscribeItem.label}</span>
              </Button>
            );
          })()}
        </div>

        {/* Right section: Stories Link (Smaller) & User profile */}
        <div className="flex items-center gap-3 flex-shrink-0">

          <Button
            variant="ghost"
            size="sm"
            onClick={onNavigateToStories}
            className={`text-sm font-medium transition-colors hidden sm:flex ${window.location.pathname.startsWith('/stories')
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            Stories
          </Button>

          <div className="flex items-center">{isAuthenticated ? (
            <>
              {/* Authenticated: Full profile display */}
              <Popover>
                <PopoverTrigger asChild>
                  <div className="flex items-center gap-2 px-2 sm:px-3 py-2 bg-muted/30 rounded-full border border-muted cursor-pointer hover:bg-muted/50 transition-colors min-h-[40px]">
                    <User className="w-5 h-5 sm:w-4 sm:h-4 text-muted-foreground" />
                    <div className="hidden sm:flex items-center gap-2">
                      <span className="text-sm text-foreground truncate max-w-[120px]">
                        {localProfile?.email || userProfile?.email || "No email"}
                      </span>
                      <div className="flex items-center gap-1 px-2 py-1 bg-primary/20 rounded-full">
                        <Trophy className="w-3 h-3 text-primary" />
                        <span className="text-xs text-primary font-medium">
                          {localProfile?.total_points || userProfile?.total_points || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="p-4 space-y-4">
                    {/* User Info Header */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Profile</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleNameModalOpen}
                          className="text-xs h-6 px-2"
                        >
                          Edit
                        </Button>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{displayName || (localProfile?.email?.split('@')[0] || "Gravalist Rider")}</p>
                        <p className="text-xs text-muted-foreground">
                          {localProfile?.city || userProfile?.city || "City not set"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {displayEmail}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Points Section */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Points</span>
                        <div className="flex items-center gap-1 px-2 py-1 bg-primary/20 rounded-full">
                          <Trophy className="w-3 h-3 text-primary" />
                          <span className="text-sm text-primary font-medium">
                            {localProfile?.total_points || userProfile?.total_points || 0}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Earned from ride registrations and route contributions
                      </p>
                    </div>

                    <Separator />

                    {/* Actions */}
                    <div className="space-y-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowInviteModal(true)}
                        className="w-full justify-start h-8"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Invite Friend
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleNameModalOpen}
                        className="w-full justify-start h-8"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Update Profile
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLogout}
                        className="w-full justify-start h-8 text-destructive hover:text-destructive"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

            </>
          ) : (
            /* Unauthenticated: Login profile display */
            <div
              className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-full border border-muted cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('requestEmailInput'));
              }}
            >
              <User className="w-4 h-4 text-muted-foreground" />
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm text-foreground">
                  Create Profile
                </span>
                <div className="flex items-center gap-1 px-2 py-1 bg-primary/20 rounded-full">
                  <Trophy className="w-3 h-3 text-primary" />
                  <span className="text-xs text-primary font-medium">
                    0
                  </span>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Name Edit Modal */}
      <Dialog open={showNameModal} onOpenChange={setShowNameModal}>
        <DialogContent className="w-full max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Edit Your Profile</DialogTitle>
            <DialogDescription>
              Update your name and city to show on the leaderboard and in your profile
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={nameForm.firstName}
                onChange={(e) => setNameForm(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="Enter your first name"
                disabled={isUpdating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={nameForm.lastName}
                onChange={(e) => setNameForm(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Enter your last name"
                disabled={isUpdating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={nameForm.city}
                onChange={(e) => setNameForm(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Enter your city"
                disabled={isUpdating}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowNameModal(false)}
                disabled={isUpdating}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateName}
                disabled={isUpdating}
                className="flex-1"
              >
                {isUpdating ? 'Updating...' : 'Update Name'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Friend Modal */}
      <InviteFriendModal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
    </header>
  );
}