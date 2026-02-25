// path: src/features/auth/actions/logoutAction.ts
import { logout as apiLogout } from "@/api/auth";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useChatStore } from "@/features/chat/store/chatStore";
import { useWorkspaceStore } from "@/features/workspaces/store/workspaceStore";

export async function logoutAction(): Promise<void> {
  try {
    await apiLogout();
  } catch {
    // ignore: still clear local state
  } finally {
    useChatStore.getState().reset();
    useWorkspaceStore.getState().reset();
    useAuthStore.getState().reset();
  }
}
