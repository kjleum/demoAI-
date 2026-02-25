// path: src/features/uploads/uploader.ts
import { presignUpload, completeUpload } from "@/api/uploads";
import { useAuthStore } from "@/features/auth/store/authStore";
import type { PendingUpload } from "@/features/chat/types";

export async function uploadFile(
  up: PendingUpload,
  onProgress: (pct: number) => void,
  onStatus: (status: PendingUpload["status"], error?: string, url?: string, abort?: () => void) => void
): Promise<void> {
  const auth = useAuthStore.getState();
  if (auth.mode !== "user") {
    onStatus("done", undefined, undefined);
    return;
  }

  const maxBytes = 10 * 1024 * 1024;
  if (up.file.size > maxBytes) {
    onStatus("error", "Файл больше 10MB");
    return;
  }

  const pres = await presignUpload({
    filename: up.file.name,
    contentType: up.file.type || "application/octet-stream",
    size: up.file.size
  });

  const xhr = new XMLHttpRequest();
  const abort = () => xhr.abort();
  onStatus("uploading", undefined, undefined, abort);

  await new Promise<void>((resolve, reject) => {
    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      const pct = Math.round((e.loaded / e.total) * 100);
      onProgress(pct);
    };
    xhr.onerror = () => reject(new Error("Upload network error"));
    xhr.onabort = () => reject(new Error("Upload canceled"));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed: ${xhr.status}`));
    };

    xhr.open("PUT", pres.uploadUrl);
    xhr.setRequestHeader("Content-Type", up.file.type || "application/octet-stream");
    xhr.send(up.file);
  });

  await completeUpload(pres.uploadId);
  onStatus("done", undefined, pres.fileUrl);
}
