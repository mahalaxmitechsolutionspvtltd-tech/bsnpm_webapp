import { createSlice, PayloadAction } from "@reduxjs/toolkit"

type UserType = "admin" | "sanchalaka" | null

interface AuthState {
    user: any
    userType: UserType
    loading: boolean
}

const initialState: AuthState = {
    user: null,
    userType: null,
    loading: true
}

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setAuthUser: (state, action: PayloadAction<{ user: any; userType: UserType }>) => {
            state.user = action.payload.user
            state.userType = action.payload.userType
            state.loading = false
        },
        clearAuthUser: (state) => {
            state.user = null
            state.userType = null
            state.loading = false
        },
        setAuthLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload
        }
    }
})

export const { setAuthUser, clearAuthUser, setAuthLoading } = authSlice.actions
export default authSlice.reducer