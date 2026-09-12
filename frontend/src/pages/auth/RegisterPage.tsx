import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  IconButton,
  InputAdornment,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { motion } from 'framer-motion';
import axiosInstance from '@/api/axiosInstance';
import { supportedLanguages } from '@/i18n';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  preferredLanguage: string;
}

interface FieldError {
  field: string;
  message: string;
}

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

export default function RegisterPage() {
  const { t } = useTranslation(['auth', 'validation']);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [backendErrors, setBackendErrors] = useState<FieldError[]>([]);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    mode: 'onBlur',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      preferredLanguage: 'en',
    },
  });

  const password = watch('password');

  const getBackendError = (field: string): string | undefined => {
    return backendErrors.find((e) => e.field === field)?.message;
  };

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    setBackendErrors([]);
    setGeneralError(null);

    try {
      await axiosInstance.post('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
        preferredLanguage: data.preferredLanguage,
      });
      setSuccess(true);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; fieldErrors?: FieldError[] }; status?: number } };
      if (err.response?.data?.fieldErrors) {
        setBackendErrors(err.response.data.fieldErrors);
      } else if (err.response?.data?.message) {
        setGeneralError(err.response.data.message);
      } else {
        setGeneralError(t('common:errors.serverError', 'An unexpected error occurred. Please try again later.'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Paper elevation={3} className="p-8 max-w-md w-full text-center">
            <Typography variant="h5" className="mb-4 font-bold">
              {t('auth:registerTitle')}
            </Typography>
            <Alert severity="success" className="mb-4">
              {t('auth:registrationSuccess')}
            </Alert>
            <Typography variant="body2" color="text.secondary" className="mb-4">
              {t('auth:accountPending')}
            </Typography>
            <Button component={Link} to="/login" variant="outlined" fullWidth>
              {t('auth:signInHere')}
            </Button>
          </Paper>
        </motion.div>
      </Box>
    );
  }

  return (
    <Box className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Paper elevation={3} className="p-8">
          <Typography variant="h5" className="mb-6 font-bold text-center">
            {t('auth:registerTitle')}
          </Typography>

          {generalError && (
            <Alert severity="error" className="mb-4">
              {generalError}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Name Field */}
            <TextField
              label={t('auth:fullName')}
              fullWidth
              margin="normal"
              error={!!errors.name || !!getBackendError('name')}
              helperText={
                errors.name?.message || getBackendError('name')
              }
              {...register('name', {
                required: t('validation:required', { field: t('auth:fullName') }),
                minLength: {
                  value: 1,
                  message: t('validation:minLength', { field: t('auth:fullName'), min: 1 }),
                },
                maxLength: {
                  value: 100,
                  message: t('validation:maxLength', { field: t('auth:fullName'), max: 100 }),
                },
              })}
            />

            {/* Email Field */}
            <TextField
              label={t('auth:email')}
              type="email"
              fullWidth
              margin="normal"
              error={!!errors.email || !!getBackendError('email')}
              helperText={
                errors.email?.message || getBackendError('email')
              }
              {...register('email', {
                required: t('validation:required', { field: t('auth:email') }),
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: t('validation:email'),
                },
              })}
            />

            {/* Password Field */}
            <TextField
              label={t('auth:password')}
              type={showPassword ? 'text' : 'password'}
              fullWidth
              margin="normal"
              error={!!errors.password || !!getBackendError('password')}
              helperText={
                errors.password?.message || getBackendError('password')
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              {...register('password', {
                required: t('validation:required', { field: t('auth:password') }),
                pattern: {
                  value: PASSWORD_REGEX,
                  message: t('validation:passwordStrength'),
                },
              })}
            />

            {/* Confirm Password Field */}
            <TextField
              label={t('auth:confirmPassword')}
              type={showConfirmPassword ? 'text' : 'password'}
              fullWidth
              margin="normal"
              error={!!errors.confirmPassword || !!getBackendError('confirmPassword')}
              helperText={
                errors.confirmPassword?.message || getBackendError('confirmPassword')
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              {...register('confirmPassword', {
                required: t('validation:required', { field: t('auth:confirmPassword') }),
                validate: (value) =>
                  value === password || t('validation:passwordMismatch'),
              })}
            />

            {/* Preferred Language Selector */}
            <TextField
              label={t('common:language', 'Preferred Language')}
              select
              fullWidth
              margin="normal"
              defaultValue="en"
              {...register('preferredLanguage')}
            >
              {supportedLanguages.map((lang) => (
                <MenuItem key={lang.code} value={lang.code}>
                  {lang.nativeLabel} ({lang.label})
                </MenuItem>
              ))}
            </TextField>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              className="mt-4"
              sx={{ mt: 3, py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : t('auth:register')}
            </Button>
          </form>

          {/* Link to Login */}
          <Typography variant="body2" className="mt-4 text-center" sx={{ mt: 3, textAlign: 'center' }}>
            {t('auth:haveAccount')}{' '}
            <Link to="/login" className="text-[#a06b3a] hover:text-[#7a4f28] hover:underline">
              {t('auth:signInHere')}
            </Link>
          </Typography>
        </Paper>
      </motion.div>
    </Box>
  );
}
