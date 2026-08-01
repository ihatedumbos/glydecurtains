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
        background: 'linear-gradient(135deg, #0f0c29 0%, #1a1a2e 50%, #16213e 100%)',
        padding: 2,
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 440,
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Box
              component="img"
              src="/assets/logo/logo.jpg"
              alt="Glyde Curtains"
              sx={{
                height: { xs: 80, sm: 100, md: 120 },
                width: 'auto',
                objectFit: 'contain',
                borderRadius: 2,
                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
              }}
            />
          </Box>

          {/* Title */}
          <Typography
            variant="h5"
            component="h1"
            sx={{
              textAlign: 'center',
              mb: 1,
              fontWeight: 700,
              color: 'rgba(255, 255, 255, 0.95)',
            }}
          >
            Welcome Back
          </Typography>
          <Typography
            variant="body2"
            sx={{
              textAlign: 'center',
              mb: 3,
              color: 'rgba(255, 255, 255, 0.6)',
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
                backgroundColor: 'rgba(255, 152, 0, 0.15)',
                color: '#ffb74d',
                border: '1px solid rgba(255, 152, 0, 0.3)',
                '& .MuiAlert-icon': { color: '#ffb74d' },
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
                backgroundColor: 'rgba(244, 67, 54, 0.15)',
                color: '#ef5350',
                border: '1px solid rgba(244, 67, 54, 0.3)',
                '& .MuiAlert-icon': { color: '#ef5350' },
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
                backgroundColor: 'rgba(244, 67, 54, 0.15)',
                color: '#ef5350',
                border: '1px solid rgba(244, 67, 54, 0.3)',
                '& .MuiAlert-icon': { color: '#ef5350' },
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
                  color: 'rgba(255, 255, 255, 0.9)',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#7c4dff',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.5)',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#7c4dff',
                },
                '& .MuiFormHelperText-root': {
                  color: '#ef5350',
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
                      sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
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
                  color: 'rgba(255, 255, 255, 0.9)',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#7c4dff',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.5)',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#7c4dff',
                },
                '& .MuiFormHelperText-root': {
                  color: '#ef5350',
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
                      color: 'rgba(255, 255, 255, 0.4)',
                      '&.Mui-checked': { color: '#7c4dff' },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Remember me
                  </Typography>
                }
              />
              <Link
                to="/forgot-password"
                style={{
                  textDecoration: 'none',
                  color: '#7c4dff',
                  fontSize: '0.875rem',
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
                background: 'linear-gradient(135deg, #7c4dff 0%, #651fff 100%)',
                borderRadius: 2,
                boxShadow: '0 4px 15px rgba(124, 77, 255, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #651fff 0%, #5200cc 100%)',
                  boxShadow: '0 6px 20px rgba(124, 77, 255, 0.4)',
                },
                '&.Mui-disabled': {
                  background: 'rgba(124, 77, 255, 0.3)',
                  color: 'rgba(255, 255, 255, 0.5)',
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
                color: 'rgba(255, 255, 255, 0.6)',
              }}
            >
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
                style={{
                  textDecoration: 'none',
                  color: '#7c4dff',
                  fontWeight: 600,
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
