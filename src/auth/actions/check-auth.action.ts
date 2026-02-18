import { applyCsrfFromAuth, fovaeCoreApi } from "@/api/fovaeCore.api";
import type { AuthResponse } from "@/types";


export const checkAuthAction = async ():Promise<AuthResponse> => {
    const { data } = await fovaeCoreApi.post<AuthResponse>('/auth/renew');
    applyCsrfFromAuth(data.csrf);
    return data;
};
