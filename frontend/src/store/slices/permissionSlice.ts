import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PermissionEntry {
  entity: string;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

export interface PermissionMatrix {
  [role: string]: PermissionEntry[];
}

export interface UserPermissions {
  userId: number;
  permissions: PermissionEntry[];
}

export interface PermissionState {
  matrix: PermissionMatrix;
  userPermissions: UserPermissions | null;
  myPermissions: PermissionEntry[];
  loading: boolean;
  error: string | null;
}

const initialState: PermissionState = {
  matrix: {},
  userPermissions: null,
  myPermissions: [],
  loading: false,
  error: null,
};

const permissionSlice = createSlice({
  name: 'permissions',
  initialState,
  reducers: {
    setPermissionMatrix(state, action: PayloadAction<PermissionMatrix>) {
      state.matrix = action.payload;
    },
    setUserPermissions(state, action: PayloadAction<UserPermissions | null>) {
      state.userPermissions = action.payload;
    },
    setMyPermissions(state, action: PayloadAction<PermissionEntry[]>) {
      state.myPermissions = action.payload;
    },
    setPermissionLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setPermissionError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const { setPermissionMatrix, setUserPermissions, setMyPermissions, setPermissionLoading, setPermissionError } = permissionSlice.actions;
export default permissionSlice.reducer;
