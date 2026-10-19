import { useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import axiosInstance from '@/api/axiosInstance';

/** Lets whoever is signed in replace their password without leaving the admin panel. */
export default function ChangePasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const close = () => {
    setCurrent('');
    setNext('');
    setConfirm('');
    setError(null);
    setDone(false);
    onClose();
  };

  const tooShort = next.length > 0 && next.length < 8;
  const mismatch = confirm.length > 0 && confirm !== next;

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await axiosInstance.post('/auth/change-password', { currentPassword: current, newPassword: next });
      setDone(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; errors?: Record<string, string> } } };
      const fieldErrors = e.response?.data?.errors;
      setError((fieldErrors && Object.values(fieldErrors)[0]) || e.response?.data?.message || 'Could not change the password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={close} maxWidth="xs" fullWidth>
      <DialogTitle>Change your password</DialogTitle>
      <DialogContent>
        {done ? (
          <Alert severity="success">Password changed. Use the new one next time you sign in.</Alert>
        ) : (
          <div className="flex flex-col gap-4 pt-2">
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="Current password" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} fullWidth />
            <TextField
              label="New password"
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              error={tooShort}
              helperText="At least 8 characters, with a capital letter, a small letter, a number and a symbol."
              fullWidth
            />
            <TextField
              label="Type the new password again"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              error={mismatch}
              helperText={mismatch ? 'The two passwords are different.' : ' '}
              fullWidth
            />
          </div>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={close}>{done ? 'Close' : 'Cancel'}</Button>
        {!done && (
          <Button variant="contained" onClick={save} disabled={saving || !current || next.length < 8 || next !== confirm}>
            {saving ? 'Saving…' : 'Change password'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
