import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '@/api/axiosInstance';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post('/auth/forgot-password', { email: email.trim() });
    } catch {
      // Intentionally ignore errors — always show generic success message
      // to prevent email enumeration attacks
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ffffff] px-4">
        <div className="max-w-md w-full space-y-6 bg-[#ffffff] p-8 rounded-lg shadow-md">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#14232b]">Check your email</h2>
            <p className="mt-2 text-sm text-[#4b5b63]">
              If an account exists with the email address you entered, we've sent a password reset link.
              Please check your inbox and spam folder.
            </p>
          </div>
          <div className="text-center">
            <Link
              to="/login"
              className="text-sm font-medium text-[#a8400f] hover:text-[#7c2f0b]"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#ffffff] px-4">
      <div className="max-w-md w-full space-y-6 bg-[#ffffff] p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#14232b]">Forgot Password</h1>
          <p className="mt-2 text-sm text-[#4b5b63]">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#14232b]">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-[#14232b]/15 px-3 py-2 shadow-sm placeholder:text-[#8a97a0] focus:border-[#a8400f] focus:outline-none focus:ring-1 focus:ring-[#a8400f] sm:text-sm"
              placeholder="you@example.com"
            />
            {error && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#a8400f] hover:bg-[#7c2f0b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#a8400f] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="text-center">
          <Link
            to="/login"
            className="text-sm font-medium text-[#a8400f] hover:text-[#7c2f0b]"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
