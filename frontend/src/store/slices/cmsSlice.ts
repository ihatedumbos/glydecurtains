import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface HomepageSection {
  id: number;
  sectionType: string;
  title?: string;
  isEnabled: boolean;
  sortOrder: number;
  config?: Record<string, unknown>;
}

export interface Banner {
  id: number;
  sectionId: number;
  title?: string;
  subtitle?: string;
  imageBase64: string;
  buttonText?: string;
  buttonLink?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface SiteSettings {
  logoHeaderBase64?: string;
  logoFooterBase64?: string;
  logoMobileBase64?: string;
  logoAdminBase64?: string;
  faviconBase64?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  socialLinks?: Record<string, string>;
  announcementBar?: string;
  activeThemeId?: number;
}

export interface StaticPage {
  id: number;
  title: string;
  slug: string;
  content: string;
  pageType: string;
  isVisible: boolean;
}

export interface CmsState {
  sections: HomepageSection[];
  banners: Banner[];
  settings: SiteSettings | null;
  pages: StaticPage[];
  loading: boolean;
  error: string | null;
}

const initialState: CmsState = {
  sections: [],
  banners: [],
  settings: null,
  pages: [],
  loading: false,
  error: null,
};

const cmsSlice = createSlice({
  name: 'cms',
  initialState,
  reducers: {
    setSections(state, action: PayloadAction<HomepageSection[]>) {
      state.sections = action.payload;
    },
    setBanners(state, action: PayloadAction<Banner[]>) {
      state.banners = action.payload;
    },
    setSiteSettings(state, action: PayloadAction<SiteSettings>) {
      state.settings = action.payload;
    },
    setPages(state, action: PayloadAction<StaticPage[]>) {
      state.pages = action.payload;
    },
    setCmsLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setCmsError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const { setSections, setBanners, setSiteSettings, setPages, setCmsLoading, setCmsError } = cmsSlice.actions;
export default cmsSlice.reducer;
