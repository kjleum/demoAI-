import { PropsWithChildren } from "react";
import { useAuthStore } from "../../entities/user/auth.store";
import { EmptyState } from "../../shared/ui/EmptyState";

export function RoleGuard({ role, children }: PropsWithChildren<{ role: "admin" | "user" }>) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <EmptyState title="Unauthorized" subtitle="Login required" />;
  if (role === "admin" && user.role !== "admin") return <EmptyState title="Forbidden" subtitle="Admin only" />;
  return <>{children}</>;
}
