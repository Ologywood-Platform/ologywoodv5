import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { PasswordStrengthIndicator } from '@/components/ui/password-strength';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Lock, User, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';

import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { getLoginUrl } from '@/const';

interface QuickSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignupSuccess?: () => void;
  actionType?: 'book' | 'message' | 'general';
  targetType?: 'artist' | 'venue' | '';
  defaultTab?: 'signup' | 'login';
}

export function QuickSignupModal({
  isOpen,
  onClose,
  onSignupSuccess,
  actionType = 'general',
  targetType = '',
  defaultTab = 'signup',
}: QuickSignupModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'signup' | 'login'>(defaultTab);
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [oauthEmail, setOauthEmail] = useState('');
  
  // Read redirect param from URL (used by team invite flow and other redirect scenarios)
  const redirectParam = new URLSearchParams(window.location.search).get('redirect');

  // Reset form state when modal opens/closes and sync tab with defaultTab
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    } else {
      // Clear all form fields when modal is closed
      setSignupData({ email: '', password: '', confirmPassword: '', name: '' });
      setLoginData({ email: '', password: '' });
      setSetPasswordData({ password: '', confirmPassword: '' });
      setShowSetPassword(false);
      setShowForgotPassword(false);
      setForgotPasswordEmail('');
      setForgotPasswordSent(false);
      setOauthEmail('');
    }
  }, [isOpen, defaultTab]);

  // API mutations
  const signupMutation = ((trpc.auth as any)?.signup?.useMutation?.() || { mutateAsync: async () => {} }) as any;
  const loginMutation = ((trpc.auth as any)?.login?.useMutation?.() || { mutateAsync: async () => {} }) as any;
  const setPasswordMutation = ((trpc.auth as any)?.setPassword?.useMutation?.() || { mutateAsync: async () => {} }) as any;
  const forgotPasswordMutation = ((trpc.auth as any)?.forgotPassword?.useMutation?.() || { mutateAsync: async () => {} }) as any;
  
  // Signup form state
  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });

  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  // Set password form state
  const [setPasswordData, setSetPasswordData] = useState({
    password: '',
    confirmPassword: '',
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupData.email || !signupData.password || !signupData.name) {
      toast.error('Please fill in all fields');
      return;
    }

    if (signupData.password !== signupData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Validate password meets all requirements
    if (signupData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (!/[A-Z]/.test(signupData.password)) {
      toast.error('Password must contain at least one uppercase letter');
      return;
    }
    if (!/[a-z]/.test(signupData.password)) {
      toast.error('Password must contain at least one lowercase letter');
      return;
    }
    if (!/[0-9]/.test(signupData.password)) {
      toast.error('Password must contain at least one number');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signupMutation.mutateAsync({
        email: signupData.email,
        password: signupData.password,
        name: signupData.name,
      });
      
      toast.success(result.message || 'Account created successfully! Check your email to verify.');
      
      if (result.trial?.isTrialUser) {
        toast.success(`Welcome! You've got 3 months of premium access free!`);
      }
      
      onClose();
      
      if (onSignupSuccess) {
        onSignupSuccess();
      }
      
      // Redirect to verify-email page so user knows to check their inbox
      if (result.requiresEmailVerification) {
        const verifyUrl = redirectParam
          ? `/verify-email?email=${encodeURIComponent(signupData.email)}&returnPath=${encodeURIComponent(redirectParam)}`
          : `/verify-email?email=${encodeURIComponent(signupData.email)}`;
        window.location.href = verifyUrl;
      } else if (redirectParam) {
        window.location.href = redirectParam;
      } else {
        setTimeout(() => window.location.reload(), 500);
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Signup failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginData.email || !loginData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginMutation.mutateAsync({
        email: loginData.email,
        password: loginData.password,
      });
      
      toast.success(result.message || 'Logged in successfully!');
      
      onClose();
      
      if (onSignupSuccess) {
        onSignupSuccess();
      }
      
      if (redirectParam) {
        window.location.href = redirectParam;
      } else {
        setTimeout(() => window.location.reload(), 500);
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Login failed. Please try again.';
      
      // Detect OAuth user without password — show Set Password flow
      if (errorMessage === 'OAUTH_NO_PASSWORD') {
        setOauthEmail(loginData.email);
        setShowSetPassword(true);
        setSetPasswordData({ password: '', confirmPassword: '' });
        toast.info('Your account was created with social login. Please set a password to continue.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!setPasswordData.password) {
      toast.error('Please enter a password');
      return;
    }

    if (setPasswordData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (setPasswordData.password !== setPasswordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const result = await setPasswordMutation.mutateAsync({
        email: oauthEmail,
        password: setPasswordData.password,
      });

      toast.success(result.message || 'Password set successfully!');

      onClose();

      if (onSignupSuccess) {
        onSignupSuccess();
      }

      setTimeout(() => window.location.reload(), 500);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to set password. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowSetPassword(false);
    setOauthEmail('');
    setSetPasswordData({ password: '', confirmPassword: '' });
  };

  const getModalTitle = () => {
    if (showSetPassword) return 'Set Your Password';
    if (actionType === 'book') return `Book this ${targetType}`;
    if (actionType === 'message') return `Message this ${targetType}`;
    return 'Welcome to Ologywood';
  };

  const getModalDescription = () => {
    if (showSetPassword) return `Set a password for ${oauthEmail} to log in.`;
    if (actionType === 'book') return `Create an account to book this ${targetType}. It only takes a minute!`;
    if (actionType === 'message') return `Create an account to message this ${targetType}. Connect and collaborate today!`;
    return 'Sign up or log in to discover and book talented artists for your events.';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setShowSetPassword(false);
        setOauthEmail('');
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{getModalTitle()}</DialogTitle>
          <DialogDescription>{getModalDescription()}</DialogDescription>
        </DialogHeader>

        {showSetPassword ? (
          /* Set Password Form for OAuth Users */
          <form onSubmit={handleSetPassword} className="space-y-4">
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3 text-sm text-blue-700 dark:text-blue-300">
              Your account ({oauthEmail}) was originally created with social login. Set a password below to log in with email and password going forward.
            </div>

            <div className="space-y-2">
              <Label htmlFor="set-password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                New Password
              </Label>
              <PasswordInput
                id="set-password"
                placeholder="Min. 8 characters"
                value={setPasswordData.password}
                onChange={(e) => setSetPasswordData({ ...setPasswordData, password: e.target.value })}
                disabled={isLoading}
                autoComplete="new-password"
              />
              <PasswordStrengthIndicator password={setPasswordData.password} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="set-confirm-password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Confirm Password
              </Label>
              <PasswordInput
                id="set-confirm-password"
                placeholder="Re-enter password"
                value={setPasswordData.confirmPassword}
                onChange={(e) => setSetPasswordData({ ...setPasswordData, confirmPassword: e.target.value })}
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Setting Password...' : 'Set Password & Log In'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={handleBackToLogin}
              disabled={isLoading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </form>
        ) : showForgotPassword ? (
          /* Forgot Password Form */
          <div className="space-y-4">
            {forgotPasswordSent ? (
              <div className="text-center space-y-4 py-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold">Check Your Email</h3>
                <p className="text-sm text-muted-foreground">
                  If an account exists for <strong>{forgotPasswordEmail}</strong>, we've sent a password reset link. Please check your inbox and spam folder.
                </p>
                <p className="text-xs text-muted-foreground">
                  The link expires in 1 hour.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordSent(false);
                  }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!forgotPasswordEmail) {
                    toast.error('Please enter your email address');
                    return;
                  }
                  setIsLoading(true);
                  try {
                    await forgotPasswordMutation.mutateAsync({ email: forgotPasswordEmail });
                    setForgotPasswordSent(true);
                  } catch (error: any) {
                    const msg = error?.message || 'Failed to send reset email';
                    if (msg.includes('Too many')) {
                      toast.error(msg);
                    } else {
                      // Always show success to prevent email enumeration
                      setForgotPasswordSent(true);
                    }
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className="space-y-4"
              >
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-semibold">Forgot Password</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter your email and we'll send you a link to reset your password.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="forgot-email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="you@example.com"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    disabled={isLoading}
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowForgotPassword(false)}
                  disabled={isLoading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </form>
            )}
          </div>
        ) : (
          /* Normal Sign Up / Log In Tabs */
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'signup' | 'login')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
              <TabsTrigger value="login">Log In</TabsTrigger>
            </TabsList>

            {/* Sign Up Tab */}
            <TabsContent value="signup" className="space-y-4">
              {/* Social Sign Up Buttons - Prominent */}
              <div className="space-y-3 pt-2">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-3 h-12 text-base font-medium border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800 transition-all shadow-sm"
                  onClick={() => {
                    const returnPath = redirectParam || (window.location.pathname + window.location.search);
                    window.location.href = `/api/auth/google?returnPath=${encodeURIComponent(returnPath)}`;
                  }}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </Button>

                <Button
                  className="w-full flex items-center justify-center gap-3 h-12 text-base font-medium bg-[#1DB954] hover:bg-[#1ed760] text-white border-0 transition-all shadow-sm"
                  onClick={() => {
                    const returnPath = redirectParam || '/';
                    window.location.href = `/api/auth/spotify?returnPath=${encodeURIComponent(returnPath)}`;
                  }}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" fill="white"/>
                  </svg>
                  Continue with Spotify
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground">Quick, secure sign-up with your existing account</p>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or sign up with email</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">All fields are required <span className="text-red-500">*</span></p>
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="signup-name"
                    placeholder="John Doe"
                    value={signupData.name}
                    onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                    disabled={isLoading}
                    autoComplete="name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <PasswordInput
                    id="signup-password"
                    placeholder="Min. 8 characters"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <PasswordStrengthIndicator password={signupData.password} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <PasswordInput
                    id="signup-confirm-password"
                    placeholder="Re-enter password"
                    value={signupData.confirmPassword}
                    onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>

                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  By signing up, you confirm you are at least 18 years old and agree to our{' '}
                  <a href="/terms" className="text-purple-600 hover:underline dark:text-purple-400">Terms of Service</a>,{' '}
                  <a href="/privacy" className="text-purple-600 hover:underline dark:text-purple-400">Privacy Policy</a>,{' '}
                  and{' '}
                  <a href="/disclaimer" className="text-purple-600 hover:underline dark:text-purple-400">Disclaimer</a>.
                </p>
              </form>
            </TabsContent>

            {/* Log In Tab */}
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Password
                  </Label>
                  <PasswordInput
                    id="login-password"
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? 'Logging In...' : 'Log In'}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setForgotPasswordEmail(loginData.email || '');
                      setForgotPasswordSent(false);
                    }}
                  >
                    Forgot your password?
                  </button>
                </div>
              </form>

              {/* Divider */}
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>

              {/* Social Sign In Buttons - Prominent */}
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-3 h-12 text-base font-medium border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800 transition-all shadow-sm"
                  onClick={() => {
                    const returnPath = redirectParam || (window.location.pathname + window.location.search);
                    window.location.href = `/api/auth/google?returnPath=${encodeURIComponent(returnPath)}`;
                  }}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Sign in with Google
                </Button>

                <Button
                  className="w-full flex items-center justify-center gap-3 h-12 text-base font-medium bg-[#1DB954] hover:bg-[#1ed760] text-white border-0 transition-all shadow-sm"
                  onClick={() => {
                    const returnPath = redirectParam || '/';
                    window.location.href = `/api/auth/spotify?returnPath=${encodeURIComponent(returnPath)}`;
                  }}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" fill="white"/>
                  </svg>
                  Sign in with Spotify
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
