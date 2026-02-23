import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../utils/supabase/client';

interface ResetPasswordPageProps {
    onNavigateToHome: () => void;
}

export function ResetPasswordPage({ onNavigateToHome }: ResetPasswordPageProps) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isRecoverySession, setIsRecoverySession] = useState(false);

    useEffect(() => {
        // Check if we came from a recovery link
        const checkSession = async () => {
            const { data } = await supabase.auth.getSession();

            // If we have a session, assume we are good to update the password
            if (data.session) {
                setIsRecoverySession(true);
            } else {
                // We might be waiting for the hash to be parsed
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                if (hashParams.get('type') === 'recovery' || hashParams.has('access_token')) {
                    setIsRecoverySession(true);
                } else {
                    // If no recovery token, we shouldn't be here unless already logged in and changing password
                    // For now, allow it to try, but it might fail
                }
            }
        };

        checkSession();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) {
                setError(error.message);
            } else {
                setSuccess(true);
                // Automatically sign out or keep them signed in? 
                // We'll keep them signed in, but they can return home.
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="border-green-500/20 bg-background/95 backdrop-blur">
                    <CardHeader className="text-center pb-2">
                        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                        </div>
                        <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-green-600">
                            Password Updated
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center pt-4">
                        <p className="text-muted-foreground mb-6">
                            Your password has been successfully reset. You can now use your new password to sign in.
                        </p>
                        <Button
                            onClick={onNavigateToHome}
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            Continue to Gravalist
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="bg-background/95 backdrop-blur border-border/50">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
                    <CardDescription>
                        Please enter your new password below.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                    id="new-password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm New Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="pl-10"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading || password.length === 0}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Update Password'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
