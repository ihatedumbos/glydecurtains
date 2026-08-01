import { SiteSettings } from '@/store/slices/cmsSlice';

const BUNDLED_LOGO = '/assets/logo/logo.jpg';

export type LogoVariant = 'header' | 'footer' | 'mobile' | 'admin';

/**
 * Resolves the logo URL/source based on CMS site settings with fallback to bundled logo.
 * Priority: CMS uploaded logo for the variant → bundled logo.jpg
 */
export function resolveLogo(
  settings: SiteSettings | null,
  variant: LogoVariant = 'header'
): string {
  if (!settings) return BUNDLED_LOGO;

  const variantMap: Record<LogoVariant, string | undefined> = {
    header: settings.logoHeaderBase64,
    footer: settings.logoFooterBase64,
    mobile: settings.logoMobileBase64,
    admin: settings.logoAdminBase64,
  };

  const base64Logo = variantMap[variant];
  if (base64Logo) {
    // If the base64 string already has the data URI prefix, return as-is
    if (base64Logo.startsWith('data:')) return base64Logo;
    // Otherwise, assume JPEG
    return `data:image/jpeg;base64,${base64Logo}`;
  }

  return BUNDLED_LOGO;
}
