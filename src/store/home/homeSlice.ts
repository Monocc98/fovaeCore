import type { HomeResponse } from '@/home/types/get-home.response';
import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export type Mode = "group" | "company" | "account";

export interface HomeState {
  mode: Mode;
  homeResponse: HomeResponse | null;
  activeGroupId: string | null;
  activeCompanyId: string | null;
  activeAccountId: string | null;
}

const initialState: HomeState = {
  mode: "group",
  homeResponse: null,
  activeGroupId: null,
  activeCompanyId: null,
  activeAccountId: null,
};

type HomeSnapshot = {
  mode: Mode;
  activeGroupId?: string | null;
  activeCompanyId?: string | null;
  activeAccountId?: string | null;
};

export const homeSlice = createSlice({
  name: 'home',
  initialState,
  reducers: {
    onInitFormHome: (state, action: PayloadAction<HomeResponse>) => {
        const home = action.payload;
        state.homeResponse = home;

        state.mode = 'group';

        const groups = home.groups??[];
        state.activeGroupId = groups.length  
                                ? groups[0]._id
                                : null
        state.activeCompanyId = null;
        state.activeAccountId = null;
        
    },
    //TODO Cuando pasen los 5 min resetear el homeResponse
    onResetHome: (state) => {
        const home = state.homeResponse!;
        state.homeResponse = home;

        state.mode = 'group';

        const groups = home.groups??[];
        state.activeGroupId = groups.length  
                                ? groups[0]._id
                                : null
        state.activeCompanyId = null;
        state.activeAccountId = null;
        
    },
    onChangeLevelUp: (state, action: PayloadAction<{ activeId: string }>) => {
      if (state.mode === 'group') {
        state.mode = 'company';
        state.activeCompanyId = action.payload.activeId;
      } else if ( state.mode === 'company' ) {
        state.mode = 'account';
        state.activeAccountId = action.payload.activeId;
      }
    },
    onChangeLevelDown: (state, action: PayloadAction<{ activeId: string }>) => {
      if (state.mode === 'account') {
        state.mode = 'company';
        state.activeCompanyId = action.payload.activeId;
        state.activeAccountId = null;
      } else if ( state.mode === 'company' ) {
        state.mode = 'group';
        state.activeGroupId = action.payload.activeId;
        state.activeCompanyId = null;
      }
    },
    onChangeTab: (state, action: PayloadAction<{ activeId: string }>) => {
      if(state.mode === 'group') state.activeGroupId = action.payload.activeId;
      if(state.mode === 'company') state.activeCompanyId = action.payload.activeId;
      if(state.mode === 'account') state.activeAccountId = action.payload.activeId;
    },
    onRestoreHomeSnapshot(state, action: PayloadAction<HomeSnapshot>) {
      const { mode, activeGroupId = null, activeCompanyId = null, activeAccountId = null } =
        action.payload;

      state.mode = mode;
      state.activeGroupId = activeGroupId;
      state.activeCompanyId = activeCompanyId;
      state.activeAccountId = activeAccountId;
    },
  },
})

// Action creators are generated for each case reducer function
export const { onInitFormHome, onChangeLevelUp, onChangeLevelDown, onChangeTab, onResetHome, onRestoreHomeSnapshot } = homeSlice.actions

export default homeSlice.reducer