// path: src/api/workspaces.ts
import { apiRequest } from "@/api/client";

export type Workspace = {
  id: string;
  name: string;
  role: "owner" | "admin" | "member";
};

export async function listWorkspaces(): Promise<Workspace[]> {
  return apiRequest<Workspace[]>("/workspaces", { method: "GET" });
}
