import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Container,
  Alert,
  CircularProgress,
} from '@mui/material';
import axiosInstance from '@/api/axiosInstance';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
}

function validateForm(data: ContactFormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.name.trim()) {
    errors.name = 'Name is required.';
  } else if (data.name.trim().length > 100) {
    errors.name = 'Name must be at most 100 characters.';
  }

  if (!data.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }

  if (data.phone.trim() && !/^[+]?[\d\s\-()]{7,15}$/.test(data.phone.trim())) {
    errors.phone = 'Please enter a valid phone number.';
  }

  if (!data.subject.trim()) {
    errors.subject = 'Subject is required.';
  } else if (data.subject.trim().length > 200) {
    errors.subject = 'Subject must be at most 200 characters.';
  }

  if (!data.message.trim()) {
    errors.message = 'Message is required.';
  } else if (data.message.trim().length > 2000) {
    errors.message = 'Message must be at most 2000 characters.';
  }

  return errors;
}

export default function ContactPage() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = (field: keyof ContactFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    // Clear field error on change
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    setSubmitError(null);

    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      await axiosInstance.post('/enquiries', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      });

      setSuccess(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setSubmitError(
        error.response?.data?.message ||
          'Failed to submit your enquiry. Please try again later.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm" className="py-8">
      <Typography variant="h3" component="h1" className="mb-2 font-bold">
        Contact Us
      </Typography>
      <Typography variant="body1" color="text.secondary" className="mb-6">
        Have a question or need assistance? Fill out the form below and we'll get back to you.
      </Typography>

      {success && (
        <Alert severity="success" className="mb-4">
          Thank you for reaching out! We've received your message and will respond shortly.
        </Alert>
      )}

      {submitError && (
        <Alert severity="error" className="mb-4">
          {submitError}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <TextField
          label="Name"
          value={formData.name}
          onChange={handleChange('name')}
          error={!!errors.name}
          helperText={errors.name}
          required
          fullWidth
        />

        <TextField
          label="Email"
          type="email"
          value={formData.email}
          onChange={handleChange('email')}
          error={!!errors.email}
          helperText={errors.email}
          required
          fullWidth
        />

        <TextField
          label="Phone (optional)"
          type="tel"
          value={formData.phone}
          onChange={handleChange('phone')}
          error={!!errors.phone}
          helperText={errors.phone}
          fullWidth
        />

        <TextField
          label="Subject"
          value={formData.subject}
          onChange={handleChange('subject')}
          error={!!errors.subject}
          helperText={errors.subject}
          required
          fullWidth
        />

        <TextField
          label="Message"
          value={formData.message}
          onChange={handleChange('message')}
          error={!!errors.message}
          helperText={errors.message}
          required
          fullWidth
          multiline
          minRows={4}
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={submitting}
          className="mt-2"
        >
          {submitting ? <CircularProgress size={24} color="inherit" /> : 'Send Message'}
        </Button>
      </Box>
    </Container>
  );
}
