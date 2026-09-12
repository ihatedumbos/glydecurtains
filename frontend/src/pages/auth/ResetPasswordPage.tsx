import { useState, FormEvent } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axiosInstance from '@/api/axiosInstance';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validate = (): string | null => {
    if (!token) {
      return 'Invalid or missing reset token. Please request a new password reset link.';
    }
    if (!newPassword) {
      return 'Please enter a new password.';
    }
    if (newPassword.length < 8) {
      return 'Password must be at least 8 characters long.';
    }
    if (newPassword !== confirmPassword) {
      return 'Passwords do not match.';
    }
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post('/auth/reset-password', {
        token,
        newPassword,
      });
      setSuccess(true);
    } catch (err: unknown) {
      // Handle specific error responses for expired/invalid tokens
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { status?: number; data?: { message?: string } } }).response;
        if (response?.status === 400 || response?.status === 410) {
          setError(
            response.data?.message ||
            'This reset link has expired or is invalid. Please request a new password reset.'
          );
        } else {
          setError(
            response?.data?.message || 'An error occurred. Please try again.'
          );
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4ede1] px-4">
        <div className="max-w-md w-full space-y-6 bg-[#faf5ea] p-8 rounded-lg shadow-md">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#2c2c2c]">Password Reset Successful</h2>
            <p className="mt-2 text-sm text-[#6b5d52]">
              Your password has been updated. You can now sign in with your new password.
            </p>
          </div>
          <div className="text-center">
            <button
              onClick={() => navigate('/login')}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#a06b3a] hover:bg-[#7a4f28] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#a06b3a]"
            >
              Go to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4ede1] px-4">
        <div className="max-w-md w-full space-y-6 bg-[#faf5ea] p-8 rounded-lg shadow-md">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#2c2c2c]">Invalid Reset Link</h2>
            <p className="mt-2 text-sm text-[#6b5d52]">
              This password reset link is invalid or missing a token. Please request a new one.
            </p>
          </div>
          <div className="text-center">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-[#a06b3a] hover:text-[#7a4f28]"
            >
              Request New Reset Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4ede1] px-4">
      <div className="max-w-md w-full space-y-6 bg-[#faf5ea] p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#2c2c2c]">Reset Password</h1>
          <p className="mt-2 text-sm text-[#6b5d52]">
            Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-[#2c2c2c]">
              New Password
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-[#2c2c2c]/15 px-3 py-2 shadow-sm placeholder:text-[#8a7a6b] focus:border-[#a06b3a] focus:outline-none focus:ring-1 focus:ring-[#a06b3a] sm:text-sm"
              placeholder="Minimum 8 characters"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#2c2c2c]">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-[#2c2c2c]/15 px-3 py-2 shadow-sm placeholder:text-[#8a7a6b] focus:border-[#a06b3a] focus:outline-none focus:ring-1 focus:ring-[#a06b3a] sm:text-sm"
              placeholder="Re-enter your new password"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#a06b3a] hover:bg-[#7a4f28] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#a06b3a] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="text-center">
          <Link
            to="/login"
            className="text-sm font-medium text-[#a06b3a] hover:text-[#7a4f28]"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
