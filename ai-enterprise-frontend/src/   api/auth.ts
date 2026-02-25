// path: src/api/auth.ts
import { apiRequest } from "@/api/client";

export type Me = {
  id: string;
  email: string;
  name?: string;
  role?: "owner" | "admin" | "member";
};

export async function loginEmail(email: string, password: string): Promise<void> {
  await apiRequest<void>("/auth/login", { method: "POST", body: { email, password } });
}

export async function loginTelegram(initData: string): Promise<void> {
  await apiRequest<void>("/auth/telegram", { method: "POST", body: { initData } });
}

export async function getMe(): Promise<Me> {
  return apiRequest<Me>("/auth/me", { method: "GET" });
}

export async function logout(): Promise<void> {
  await apiRequest<void>("/auth/logout", { method: "POST" });
}
