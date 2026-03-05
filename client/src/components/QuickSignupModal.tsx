import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Lock, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

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
  
  // API mutations
  const signupMutation = ((trpc.auth as any)?.signup?.useMutation?.() || { mutateAsync: async () => {} }) as any;
  const loginMutation = ((trpc.auth as any)?.login?.useMutation?.() || { mutateAsync: async () => {} }) as any;
  
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

    if (signupData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signupMutation.mutateAsync({
        email: signupData.email,
        password: signupData.password,
        name: signupData.name,
      });
      
      toast.success(result.message || 'Account created successfully!');
      
      // Display trial information if user is a beta tester
      if (result.trial?.isTrialUser) {
        toast.success(`Welcome! You've got 3 months of premium access free!`);
      }
      
      onClose();
      
      if (onSignupSuccess) {
        onSignupSuccess();
      }
      
      // Reload to pick up the session cookie set by the server
      setTimeout(() => window.location.reload(), 500);
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
      
      // Reload to pick up the session cookie set by the server
      setTimeout(() => window.location.reload(), 500);
    } catch (error: any) {
      const errorMessage = error?.message || 'Login failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getModalTitle = () => {
    if (actionType === 'book') {
      return `Book this ${targetType}`;
    } else if (actionType === 'message') {
      return `Message this ${targetType}`;
    }
    return 'Welcome to Ologywood';
  };

  const getModalDescription = () => {
    if (actionType === 'book') {
      return `Create an account to book this ${targetType}. It only takes a minute!`;
    } else if (actionType === 'message') {
      return `Create an account to message this ${targetType}. Connect and collaborate today!`;
    }
    return 'Sign up or log in to discover and book talented artists for your events.';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{getModalTitle()}</DialogTitle>
          <DialogDescription>{getModalDescription()}</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'signup' | 'login')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
            <TabsTrigger value="login">Log In</TabsTrigger>
          </TabsList>

          {/* Sign Up Tab */}
          <TabsContent value="signup" className="space-y-4">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name
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
                  Email
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
                  Password
                </Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={signupData.password}
                  onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-confirm-password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Confirm Password
                </Label>
                <Input
                  id="signup-confirm-password"
                  type="password"
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
                By signing up, you agree to our{' '}
                <a href="/terms" className="text-purple-600 hover:underline dark:text-purple-400">Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy" className="text-purple-600 hover:underline dark:text-purple-400">Privacy Policy</a>
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
                <Input
                  id="login-password"
                  type="password"
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
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
