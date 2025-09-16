'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login, verify2FA, setAuthToken } from '@/lib/auth';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authChallengeId, setAuthChallengeId] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
const [testOtp, setTestOtp] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await login(email, password);
     
      if (response.success) {
        if (response?.requires2FA) {
          setAuthChallengeId(response?.data?.authChallengeId || '');
          setTestOtp(response?.data?.testOtp||null)
          setRequires2FA(true);
        } else if (response.data?.accessToken && response.data?.user) {
          setAuthToken(response.data.accessToken, response.data.user);
          // Redirect based on role
          if (response.data.user.role === 'ADMIN') {
            router.push('/admin/dashboard');
          } else if (response.data.user.role === 'SELLER') {
            router.push('/seller/dashboard');
          } else {
            router.push('/');
          }
        }
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await verify2FA(authChallengeId, otp);
      
      if (response.success && response.data?.accessToken && response.data?.user) {
        setAuthToken(response.data.accessToken, response.data.user);
        // Redirect based on role
        if (response.data.user.role === 'ADMIN') {
          router.push('/admin/dashboard');
        } else if (response.data.user.role === 'SELLER') {
          router.push('/seller/dashboard');
        } else {
          router.push('/');
        }
      } else {
        setError(response.message || '2FA verification failed');
      }
    } catch (err) {
      setError('An error occurred during 2FA verification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>
              {requires2FA ? 'Two-Factor Authentication' : 'Sign in to your account'}
            </CardTitle>
            <CardDescription>
              {requires2FA ? (
    <>
      Enter the verification code sent to your device is : 
      <span style={{ color: 'black', fontWeight: 'bold' }}>{testOtp}</span>
    </>
  ) : (
    'Enter your credentials to access your account'
  )}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!requires2FA ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerify2FA} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify'}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setRequires2FA(false)}
                >
                  Back to Login
                </Button>
              </form>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-sm text-center">
              <span>Don't have an account? </span>
              <a href="/register" className="text-primary hover:underline">
                Sign up
              </a>
            </div>
            
            {requires2FA && (
              <div className="text-sm text-center text-muted-foreground">
                Didn't receive a code? Check your email or contact support.
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}