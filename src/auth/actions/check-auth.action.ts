import { fovaeCoreApi } from "@/api/fovaeCore.api";
import type { AuthResponse } from "@/home/types/authResponse.interface";


export const checkAuthAction = async ():Promise<AuthResponse> => {

    const token = localStorage.getItem('token');
    if ( !token ) throw new Error('No token found');

    try {
        const { data } = await fovaeCoreApi.get<AuthResponse>('/auth/renew');

        localStorage.setItem('token', data.token)

        return data;
    } catch (error) {
        localStorage.removeItem('token');
        throw new Error('Token not valid');
    }

}