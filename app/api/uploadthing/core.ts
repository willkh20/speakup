import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  videoUploader: f({ video: { maxFileSize: "512MB", maxFileCount: 1 } })
    .middleware(async () => {
      // 인증 없이 누구나 업로드 가능 (RLS는 Supabase 쪽에서 처리)
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl, name: file.name };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
