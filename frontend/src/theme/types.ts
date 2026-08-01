export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: string;
  shadowIntensity: 'low' | 'medium' | 'high';
  glassmorphismOpacity: number;
  animationSpeed: 'slow' | 'normal' | 'fast';
}

export interface ThemePreset {
  id: string;
  name: string;
  mode: 'dark' | 'light';
  config: ThemeConfig;
}

export type ThemeMode = 'dark' | 'light';
