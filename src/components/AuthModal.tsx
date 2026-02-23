import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import { useAuth } from '../hooks/useAuth';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: 'signin' | 'signup' | 'forgot_password';
  invitationToken?: string;
  initialEmail?: string;
  onNavigateToTerms?: () => void;
  onNavigateToPrivacy?: () => void;
}

export function AuthModal({
  open,
  onClose,
  defaultTab = 'signup',
  invitationToken,
  initialEmail = '',
  onNavigateToTerms,
  onNavigateToPrivacy
}: AuthModalProps) {
  const { signIn, signUp, loading, error, clearError, resetPassword } = useAuth();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [formData, setFormData] = useState({
    email: initialEmail,
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [emailExistsWarning, setEmailExistsWarning] = useState(false);

  // Update activeTab when defaultTab prop changes
  React.useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  // Update email when initialEmail prop changes
  React.useEffect(() => {
    if (initialEmail && initialEmail !== formData.email) {
      setFormData(prev => ({ ...prev, email: initialEmail }));
    }
  }, [initialEmail]);

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field-specific error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
    // Clear email exists warning when user changes email
    if (field === 'email' && emailExistsWarning) {
      setEmailExistsWarning(false);
    }
    // Clear global error
    if (error) {
      clearError();
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (activeTab === 'forgot_password') {
      setFormErrors(errors);
      return Object.keys(errors).length === 0;
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    // Sign up specific validations
    if (activeTab === 'signup') {
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }

      if (!formData.agreeToTerms) {
        errors.agreeToTerms = 'You must agree to the Terms of Service and Privacy Policy';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      let result;

      if (activeTab === 'forgot_password') {
        result = await resetPassword(formData.email);
        if (result.success) {
          // Keep them on the same tab but maybe show a success message
          setFormErrors({ email: 'Password reset link sent! Check your inbox.' });
          return;
        }
      } else if (activeTab === 'signin') {
        result = await signIn(formData.email, formData.password);
      } else {
        result = await signUp(
          formData.email,
          formData.password,
          '', // displayName will be set from About You step
          invitationToken
        );
      }

      if (result.success) {
        // Reset form
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          agreeToTerms: false
        });
        setFormErrors({});
        onClose();
      } else if (result.error === 'Email already exists') {
        setEmailExistsWarning(true);
      }
    } catch (err) {
      console.error('Auth submission error:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false
    });
    setFormErrors({});
    clearError();
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'signin' | 'signup' | 'forgot_password');
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-md mx-auto bg-background border border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">
            {activeTab === 'forgot_password'
              ? 'Reset Password'
              : invitationToken
                ? 'Join Gravalist'
                : 'Welcome to Gravalist'}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            {activeTab === 'forgot_password'
              ? 'Enter your email and we will send you a reset link'
              : invitationToken
                ? 'Complete your account setup to join the community'
                : 'Sign in to your account or create a new one to get started'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/30 p-1">
            <TabsTrigger
              value="signin"
              className="data-[state=active]:bg-background data-[state=active]:border data-[state=active]:border-primary data-[state=active]:text-foreground transition-all"
            >
              Sign In
            </TabsTrigger>
            <TabsTrigger
              value="signup"
              className="data-[state=active]:bg-background data-[state=active]:border data-[state=active]:border-primary data-[state=active]:text-foreground transition-all"
            >
              Sign Up
            </TabsTrigger>
          </TabsList>

          {/* Global error message */}
          {error && !emailExistsWarning && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Email exists warning - only show in signup tab */}
          {emailExistsWarning && activeTab === 'signup' && (
            <Alert className="mt-4 bg-primary/10 border-primary/30">
              <AlertCircle className="h-4 w-4 text-primary" />
              <AlertDescription className="space-y-3">
                <p>This email is already registered.</p>
                <Button
                  onClick={() => {
                    setActiveTab('signin');
                    setEmailExistsWarning(false);
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Sign In Instead
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Invitation message */}
          {invitationToken && (
            <Alert className="mt-4">
              <Mail className="h-4 w-4" />
              <AlertDescription>
                You've been invited to join the Gravalist community!
                Create your account to get started.
              </AlertDescription>
            </Alert>
          )}

          <TabsContent value="signin" className="space-y-4 mt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`pl-10 ${formErrors.email ? 'border-destructive' : ''}`}
                    disabled={loading}
                  />
                </div>
                {formErrors.email && (
                  <p className="text-sm text-destructive">{formErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="signin-password">Password</Label>
                  <button
                    type="button"
                    onClick={() => handleTabChange('forgot_password')}
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`pl-10 ${formErrors.password ? 'border-destructive' : ''}`}
                    disabled={loading}
                  />
                </div>
                {formErrors.password && (
                  <p className="text-sm text-destructive">{formErrors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4 mt-6">
            <form onSubmit={handleSubmit} className="space-y-4">


              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`pl-10 ${formErrors.email ? 'border-destructive' : ''}`}
                    disabled={loading}
                  />
                </div>
                {formErrors.email && (
                  <p className="text-sm text-destructive">{formErrors.email}</p>
                )}
                {emailExistsWarning && (
                  <p className="text-sm text-destructive">Email already exists. Please sign in or use a different email.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`pl-10 ${formErrors.password ? 'border-destructive' : ''}`}
                    disabled={loading}
                  />
                </div>
                {formErrors.password && (
                  <p className="text-sm text-destructive">{formErrors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-confirm">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="signup-confirm"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`pl-10 ${formErrors.confirmPassword ? 'border-destructive' : ''}`}
                    disabled={loading}
                  />
                </div>
                {formErrors.confirmPassword && (
                  <p className="text-sm text-destructive">{formErrors.confirmPassword}</p>
                )}
              </div>

              {/* Terms and Privacy Agreement */}
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="agree-terms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked: boolean) => handleInputChange('agreeToTerms', checked)}
                    className={`mt-0.5 ${!formData.agreeToTerms ? 'border-primary/60 hover:border-primary' : ''}`}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="agree-terms"
                      className="text-sm leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={() => {
                          onNavigateToTerms?.();
                          onClose();
                        }}
                        className="text-primary hover:underline"
                      >
                        Terms of Service
                      </button>
                      {' '}and{' '}
                      <button
                        type="button"
                        onClick={() => {
                          onNavigateToPrivacy?.();
                          onClose();
                        }}
                        className="text-primary hover:underline"
                      >
                        Privacy Policy
                      </button>
                    </label>
                  </div>
                </div>
                {formErrors.agreeToTerms && (
                  <p className="text-sm text-destructive ml-6">{formErrors.agreeToTerms}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="forgot_password" className="space-y-4 mt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`pl-10 ${formErrors.email && !formErrors.email.includes('sent') ? 'border-destructive' : ''}`}
                    disabled={loading}
                  />
                </div>
                {formErrors.email && (
                  <p className={`text-sm ${formErrors.email.includes('sent') ? 'text-green-500' : 'text-destructive'}`}>
                    {formErrors.email}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || formErrors.email?.includes('sent')}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending link...
                  </>
                ) : (
                  formErrors.email?.includes('sent') ? 'Link Sent' : 'Send Reset Link'
                )}
              </Button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => handleTabChange('signin')}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          </TabsContent>
        </Tabs>

        <div className="text-center text-sm text-muted-foreground mt-6">
          {activeTab === 'signin' ? (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setActiveTab('signup')}
                className="text-primary hover:underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setActiveTab('signin')}
                className="text-primary hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}