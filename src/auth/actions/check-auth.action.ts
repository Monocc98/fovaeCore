import { fovaeCoreApi } from "@/api/fovaeCore.api";
import type { AuthResponse } from "@/types";


export const checkAuthAction = async ():Promise<AuthResponse> => {

    const token = localStorage.getItem('token');
    if ( !token ) throw new Error('No token found');

    try {
        const { data } = await fovaeCoreApi.post<AuthResponse>('/auth/renew');

        localStorage.setItem('token', data.token)

        return data;
    } catch (error) {
        localStorage.removeItem('token');
        throw new Error('Token not valid');
    }

}