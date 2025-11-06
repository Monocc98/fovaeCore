import { fovaeCoreApi } from "@/api/fovaeCore.api"
import type { AuthResponse } from "@/home/types/authResponse.interface";

export const loginAction = async( email: string, password: string): Promise<AuthResponse> => {

    try {
        
        const { data } = await fovaeCoreApi.post<AuthResponse>('/auth/login', {
            email,
            password
        })

        console.log(data);

        return data;
        

    } catch (error) {
        console.log(error);
        throw error;
    }

}
