import { Box } from '@mui/material';
import { resolveLogo, type LogoVariant } from '@/utils/logoResolver';
import { useAppSelector } from '@/store/hooks';

interface LogoProps {
  variant?: LogoVariant;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

const sizeMap = {
  sm: { desktop: 36, mobile: 32 },
  md: { desktop: 48, mobile: 36 },
  lg: { desktop: 56, mobile: 40 },
};

/**
 * Elegant logo component with subtle shadow on dark backgrounds,
 * proper spacing, and rounded corners.
 */
export default function Logo({ variant = 'header', size = 'md', className, onClick }: LogoProps) {
  const settings = useAppSelector((state) => state.cms.settings);
  const logoSrc = resolveLogo(settings, variant);
  const dimensions = sizeMap[size];

  return (
    <Box
      component="img"
      src={logoSrc}
      alt="Glyde Curtains"
      onClick={onClick}
      className={className}
      sx={{
        height: { xs: dimensions.mobile, md: dimensions.desktop },
        width: 'auto',
        objectFit: 'contain',
        borderRadius: 1,
        cursor: onClick ? 'pointer' : 'default',
        filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.15))',
        transition: 'filter 0.2s ease',
        '&:hover': onClick
          ? { filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))' }
          : undefined,
      }}
    />
  );
}
