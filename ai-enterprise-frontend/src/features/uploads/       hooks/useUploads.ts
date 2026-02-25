// path: src/features/uploads/hooks/useUploads.ts
import { useEffect } from "react";
import { useChatStore } from "@/features/chat/store/chatStore";
import { uploadFile } from "@/features/uploads/uploader";

export function useUploads(): void {
  const uploads = useChatStore((s) => s.uploads);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      for (const u of uploads) {
        if (cancelled) return;
        if (u.status !== "pending") continue;

        useChatStore.setState((s) => ({
          uploads: s.uploads.map((x) => (x.id === u.id ? { ...x, status: "uploading", progress: 0 } : x))
        }));

        try {
          await uploadFile(
            u,
            (pct) => {
              useChatStore.setState((s) => ({
                uploads: s.uploads.map((x) => (x.id === u.id ? { ...x, progress: pct } : x))
              }));
            },
            (status, error, url, abort) => {
              useChatStore.setState((s) => ({
                uploads: s.uploads.map((x) =>
                  x.id === u.id ? { ...x, status, error, url, abort, progress: status === "done" ? 100 : x.progress } : x
                )
              }));
            }
          );
        } catch (e) {
          useChatStore.setState((s) => ({
            uploads: s.uploads.map((x) =>
              x.id === u.id ? { ...x, status: "error", error: e instanceof Error ? e.message : String(e) } : x
            )
          }));
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [uploads]);
}
