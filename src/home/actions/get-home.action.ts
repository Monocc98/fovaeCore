import { fovaeCoreApi } from "@/api/fovaeCore.api"
import type { HomeResponse } from "../types/get-home.response";


export const getHomeAction = async():Promise<HomeResponse> => {
    const { data } = await fovaeCoreApi.get<HomeResponse>('/home');

    console.log(data);
    
    return data;
}