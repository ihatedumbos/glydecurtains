import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCredentials, setLoading, setError } from '@/store/slices/authSlice';
import axiosInstance from '@/api/axiosInstance';
import Logo from '@/components/layout/Logo';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface LoginApiResponse {
  data: {
    accessToken: string;
    refreshToken: string;
    user: {
      id: number;
      name: string;
      email: string;
      role: 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE' | 'CUSTOMER';
      status: string;
      preferredLanguage?: string;
      passwordChangedAt?: string | null;
    };
  };
}

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  const [showPassword, setShowPassword] = useState(false);
  const [accountLocked, setAccountLocked] = useState(false);
  const [showPasswordBanner, setShowPasswordBanner] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    mode: 'onBlur',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    setAccountLocked(false);
    setShowPasswordBanner(false);

    try {
      const response = await axiosInstance.post<LoginApiResponse>('/auth/login', {
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      });

      const { accessToken, refreshToken, user } = response.data.data;

      dispatch(
        setCredentials({
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            preferredLanguage: user.preferredLanguage,
          },
          accessToken,
          refreshToken,
        }),
      );

      // Check if password has never been changed
      if (user.passwordChangedAt === null || user.passwordChangedAt === undefined) {
        setShowPasswordBanner(true);
        // Brief delay so user sees the banner before redirect
        setTimeout(() => {
          const redirectPath = user.role === 'CUSTOMER' ? '/' : '/admin/dashboard';
          navigate(redirectPath, { replace: true });
        }, 3000);
      } else {
        const redirectPath = user.role === 'CUSTOMER' ? '/' : '/admin/dashboard';
        navigate(redirectPath, { replace: true });
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string; errorCode?: string }; status?: number } };
      const message = axiosError?.response?.data?.message || 'Login failed. Please try again.';
      const errorCode = axiosError?.response?.data?.errorCode;

      if (errorCode === 'ACCOUNT_LOCKED' || message.toLowerCase().includes('locked')) {
        setAccountLocked(true);
      }

      dispatch(setError(message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at top, rgba(255,255,255,0.9) 0%, rgba(243,244,246,1) 35%, rgba(229,231,235,0.96) 100%)',
        padding: 2,
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 440,
          background: 'rgba(255, 255, 255, 0.82)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          border: '1px solid rgba(15, 23, 42, 0.08)',
          borderRadius: 4,
          boxShadow: '0 24px 60px rgba(15, 23, 42, 0.09)',
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            {/* Use central Logo component which prefers CMS/backend-hosted images */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Logo variant="header" size="lg" />
            </Box>
          </Box>

          {/* Title */}
          <Typography
            variant="h5"
            component="h1"
            sx={{
              textAlign: 'center',
              mb: 1,
              fontWeight: 700,
              color: 'text.primary',
            }}
          >
            Welcome back
          </Typography>
          <Typography
            variant="body2"
            sx={{
              textAlign: 'center',
              mb: 3,
              color: 'text.secondary',
            }}
          >
            Sign in to your account
          </Typography>

          {/* Password change banner */}
          {showPasswordBanner && (
            <Alert
              severity="warning"
              sx={{
                mb: 2,
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                color: '#9a5b00',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                '& .MuiAlert-icon': { color: '#b45309' },
              }}
            >
              <Typography variant="body2" fontWeight={600}>
                Password Change Recommended
              </Typography>
              <Typography variant="caption">
                Your password has never been changed. Please update it immediately for security.
              </Typography>
            </Alert>
          )}

          {/* Account locked alert */}
          {accountLocked && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                backgroundColor: 'rgba(220, 38, 38, 0.05)',
                color: '#991b1b',
                border: '1px solid rgba(220, 38, 38, 0.15)',
                '& .MuiAlert-icon': { color: '#b91c1c' },
              }}
            >
              <Typography variant="body2" fontWeight={600}>
                Account Locked
              </Typography>
              <Typography variant="caption">
                Too many failed attempts. Please try again after 15 minutes.
              </Typography>
            </Alert>
          )}

          {/* General error */}
          {error && !accountLocked && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                backgroundColor: 'rgba(220, 38, 38, 0.05)',
                color: '#991b1b',
                border: '1px solid rgba(220, 38, 38, 0.15)',
                '& .MuiAlert-icon': { color: '#b91c1c' },
              }}
            >
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              autoComplete="email"
              autoFocus
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Please enter a valid email address',
                },
              })}
              error={!!errors.email}
              helperText={errors.email?.message}
              sx={{
                mb: 2.5,
                '& .MuiOutlinedInput-root': {
                  color: 'text.primary',
                  backgroundColor: '#f9fafb',
                  '& fieldset': {
                    borderColor: 'rgba(148, 163, 184, 0.4)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(15, 23, 42, 0.35)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#111827',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'text.secondary',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#111827',
                },
                '& .MuiFormHelperText-root': {
                  color: '#b91c1c',
                },
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              {...register('password', {
                required: 'Password is required',
              })}
              error={!!errors.password}
              helperText={errors.password?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                      sx={{ color: 'text.secondary' }}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 1.5,
                '& .MuiOutlinedInput-root': {
                  color: 'text.primary',
                  backgroundColor: '#f9fafb',
                  '& fieldset': {
                    borderColor: 'rgba(148, 163, 184, 0.4)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(15, 23, 42, 0.35)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#111827',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'text.secondary',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#111827',
                },
                '& .MuiFormHelperText-root': {
                  color: '#b91c1c',
                },
              }}
            />

            {/* Remember Me + Forgot Password row */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    {...register('rememberMe')}
                    sx={{
                      color: 'rgba(15, 23, 42, 0.4)',
                      '&.Mui-checked': { color: '#111827' },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Remember me
                  </Typography>
                }
              />
              <Link
                to="/forgot-password"
                style={{
                  textDecoration: 'none',
                  color: '#111827',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                Forgot password?
              </Link>
            </Box>

            {/* Submit button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                py: 1.5,
                mb: 2.5,
                fontWeight: 600,
                fontSize: '1rem',
                textTransform: 'none',
                background: 'linear-gradient(135deg, #111827 0%, #374151 100%)',
                borderRadius: 2,
                boxShadow: '0 10px 20px rgba(17, 24, 39, 0.12)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
                },
                '&.Mui-disabled': {
                  background: 'rgba(17, 24, 39, 0.25)',
                  color: 'rgba(255, 255, 255, 0.75)',
                },
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Sign In'}
            </Button>

            {/* Register link */}
            <Typography
              variant="body2"
              sx={{
                textAlign: 'center',
                color: 'text.secondary',
              }}
            >
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
                style={{
                  textDecoration: 'none',
                  color: '#111827',
                  fontWeight: 700,
                }}
              >
                Sign up
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
