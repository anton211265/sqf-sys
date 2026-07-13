import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserType } from 'types/UserType';

interface UserState {
  data: UserType | null; // Update to allow null
}

const initialState: UserState = {
  data: null, // Initialize to null
};

const userSlice = createSlice({
  name: 'user',
  initialState,

  reducers: {
    setData: (state, action) => {
      const { data } = action.payload;
      state.data = data;
    },
  },
});

export const { setData } = userSlice.actions;

export default userSlice.reducer;
