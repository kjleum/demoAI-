// path: src/api/uploads.ts
import { apiRequest } from "@/api/client";

export type PresignResponse = {
  uploadId: string;
  uploadUrl: string; // PUT URL
  fileUrl: string; // final public/internal URL for attachment reference
};

export async function presignUpload(input: {
  filename: string;
  contentType: string;
  size: number;
}): Promise<PresignResponse> {
  return apiRequest<PresignResponse>("/uploads/presign", { method: "POST", body: input });
}

export async function completeUpload(uploadId: string): Promise<void> {
  await apiRequest<void>("/uploads/complete", { method: "POST", body: { uploadId } });
}
