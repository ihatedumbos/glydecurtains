import { ThemePreset } from './types';

export const themePresets: ThemePreset[] = [
  {
    id: 'dark-premium',
    name: 'Dark Premium',
    mode: 'dark',
    config: {
      primaryColor: '#1a1a2e',
      secondaryColor: '#16213e',
      accentColor: '#c9a96e',
      backgroundColor: '#0f0f23',
      textColor: '#e0e0e0',
      borderRadius: '8px',
      shadowIntensity: 'medium',
      glassmorphismOpacity: 0.15,
      animationSpeed: 'normal',
    },
  },
  {
    id: 'light-elegant',
    name: 'Light Elegant',
    mode: 'light',
    config: {
      primaryColor: '#ffffff',
      secondaryColor: '#f8f9fa',
      accentColor: '#8b6914',
      backgroundColor: '#fafafa',
      textColor: '#1a1a1a',
      borderRadius: '12px',
      shadowIntensity: 'low',
      glassmorphismOpacity: 0.08,
      animationSpeed: 'normal',
    },
  },
  {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    mode: 'dark',
    config: {
      primaryColor: '#0d1b2a',
      secondaryColor: '#1b263b',
      accentColor: '#4fc3f7',
      backgroundColor: '#0a1628',
      textColor: '#e0e8f0',
      borderRadius: '8px',
      shadowIntensity: 'high',
      glassmorphismOpacity: 0.12,
      animationSpeed: 'normal',
    },
  },
  {
    id: 'warm-gold',
    name: 'Warm Gold',
    mode: 'light',
    config: {
      primaryColor: '#2c1810',
      secondaryColor: '#3d2415',
      accentColor: '#d4a853',
      backgroundColor: '#fef9f0',
      textColor: '#2c1810',
      borderRadius: '10px',
      shadowIntensity: 'medium',
      glassmorphismOpacity: 0.1,
      animationSpeed: 'slow',
    },
  },
  {
    id: 'forest-green',
    name: 'Forest Green',
    mode: 'dark',
    config: {
      primaryColor: '#1a2e1a',
      secondaryColor: '#1e3a1e',
      accentColor: '#66bb6a',
      backgroundColor: '#0f1f0f',
      textColor: '#d8e8d8',
      borderRadius: '6px',
      shadowIntensity: 'medium',
      glassmorphismOpacity: 0.14,
      animationSpeed: 'fast',
    },
  },
];

export const DEFAULT_THEME_ID = 'dark-premium';

export function getThemePresetById(id: string): ThemePreset | undefined {
  return themePresets.find((preset) => preset.id === id);
}
