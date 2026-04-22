import { useState } from "react";

import { ApiError, apiFetch, formatApiDetail } from "@/lib/api";
import type { FileAsset, UUID } from "@/lib/types";

export function useFilesPage() {
  const [fileId, setFileId] = useState("");
  const [meta, setMeta] = useState<FileAsset | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setErr(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await apiFetch<FileAsset>("/files/upload", { method: "POST", body: fd });
      setMeta(res);
      setFileId(res.id);
    } catch (ex) {
      setErr(ex instanceof ApiError ? formatApiDetail(ex.detail) : "上传失败");
    } finally {
      setUploading(false);
    }
  };

  const loadMeta = async () => {
    setErr(null);
    setMeta(null);
    try {
      const id = fileId.trim() as UUID;
      const m = await apiFetch<FileAsset>(`/files/${id}`);
      setMeta(m);
    } catch (ex) {
      setErr(ex instanceof ApiError ? formatApiDetail(ex.detail) : "查询失败");
    }
  };

  return { fileId, setFileId, meta, err, uploading, onUpload, loadMeta };
}
