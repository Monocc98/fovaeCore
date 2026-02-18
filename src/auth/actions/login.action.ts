import { applyCsrfFromAuth, fovaeCoreApi } from "@/api/fovaeCore.api";
import type { AuthResponse } from "@/types";

export const loginAction = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const { data } = await fovaeCoreApi.post<AuthResponse>("/auth/login", {
    email,
    password,
  });

  applyCsrfFromAuth(data.csrf);
  return data;
};
