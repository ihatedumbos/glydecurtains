import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { Fab, Tooltip } from '@mui/material';
import { whatsappLink, useContact } from '@/config/contact';

/** Floating "chat on WhatsApp" button shown on every storefront page. */
export default function WhatsAppButton() {
  useContact();
  return (
    <Tooltip title="Chat with us on WhatsApp" placement="left">
      <Fab
        component="a"
        href={whatsappLink('Hi Glyde, I have an enquiry about your products.')}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        sx={{
          position: 'fixed',
          right: { xs: 16, md: 24 },
          bottom: { xs: 16, md: 24 },
          zIndex: 1200,
          bgcolor: '#25D366',
          color: '#ffffff',
          '&:hover': { bgcolor: '#1ebe5a' },
        }}
      >
        <WhatsAppIcon sx={{ fontSize: 32 }} />
      </Fab>
    </Tooltip>
  );
}
