import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  MenuItem,
  Divider,
} from '@mui/material';
import { Person, Lock } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCredentials } from '@/store/slices/authSlice';
import axiosInstance from '@/api/axiosInstance';
import { mapBackendErrors, extractFieldErrors, extractErrorMessage } from '@/utils/formErrors';

interface ProfileFormData {
  name: string;
  email: string;
  preferredLanguage: string;
}

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी (Hindi)' },
  { value: 'gu', label: 'ગુજરાતી (Gujarati)' },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, accessToken, refreshToken } = useAppSelector((state) => state.auth);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError: setFieldError,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    mode: 'onBlur',
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      preferredLanguage: user?.preferredLanguage || 'en',
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        preferredLanguage: user.preferredLanguage || 'en',
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    setLoading(true);
    setGeneralError(null);
    setSuccess(null);

    try {
      const response = await axiosInstance.put('/users/me', data);
      const updatedUser = response.data.data;

      // Update Redux store with fresh user data
      if (accessToken && refreshToken) {
        dispatch(
          setCredentials({
            user: {
              id: updatedUser.id ?? user!.id,
              name: updatedUser.name ?? data.name,
              email: updatedUser.email ?? data.email,
              role: updatedUser.role ?? user!.role,
              status: updatedUser.status ?? user!.status,
              preferredLanguage: updatedUser.preferredLanguage ?? data.preferredLanguage,
            },
            accessToken,
            refreshToken,
          }),
        );
      }

      setSuccess('Profile updated successfully.');
    } catch (err: unknown) {
      const fieldErrors = extractFieldErrors(err);
      if (fieldErrors) {
        mapBackendErrors(fieldErrors, setFieldError);
      } else {
        setGeneralError(extractErrorMessage(err, 'Failed to update profile. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', py: 4, px: 2 }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
        My Profile
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your personal information and preferences.
      </Typography>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Person color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Personal Information
            </Typography>
          </Box>

          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          {generalError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setGeneralError(null)}>
              {generalError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField
              fullWidth
              label="Full Name"
              {...register('name', {
                required: 'Name is required',
                minLength: { value: 1, message: 'Name must be at least 1 character' },
                maxLength: { value: 100, message: 'Name must be at most 100 characters' },
              })}
              error={!!errors.name}
              helperText={errors.name?.message}
              sx={{ mb: 2.5 }}
            />

            <TextField
              fullWidth
              label="Email Address"
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Please enter a valid email address',
                },
              })}
              error={!!errors.email}
              helperText={errors.email?.message}
              sx={{ mb: 2.5 }}
            />

            <TextField
              fullWidth
              select
              label="Preferred Language"
              defaultValue={user?.preferredLanguage || 'en'}
              {...register('preferredLanguage')}
              sx={{ mb: 3 }}
            >
              {LANGUAGES.map((lang) => (
                <MenuItem key={lang.value} value={lang.value}>
                  {lang.label}
                </MenuItem>
              ))}
            </TextField>

            <Button
              type="submit"
              variant="contained"
              disabled={loading || !isDirty}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              {loading ? <CircularProgress size={22} /> : 'Save Changes'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Divider sx={{ mb: 3 }} />

      {/* Password Change Section */}
      <Card variant="outlined">
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Lock color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Security
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Update your password to keep your account secure.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => navigate('/change-password')}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Change Password
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
