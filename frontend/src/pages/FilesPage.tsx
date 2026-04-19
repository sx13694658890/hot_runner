import { useState } from "react";

import { ApiError, apiFetch, formatApiDetail } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { FileAsset, UUID } from "@/lib/types";

export function FilesPage() {
  const { can } = useAuth();
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">文件</h1>
        <p className="mt-1 text-sm text-slate-600">上传（multipart 字段名 file）与元数据查询</p>
      </div>
      {err ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-2">
        {can("file:upload") ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-800">上传</h2>
            <p className="mt-1 text-xs text-slate-500">选择文件后自动上传</p>
            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-10 hover:border-brand-400 hover:bg-brand-50/30">
              <input type="file" className="hidden" onChange={(e) => void onUpload(e)} disabled={uploading} />
              <span className="text-sm font-medium text-brand-700">
                {uploading ? "上传中…" : "点击选择文件"}
              </span>
            </label>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            当前账号无 <code className="font-mono">file:upload</code> 权限
          </div>
        )}
        {can("file:read") ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-800">查询元数据</h2>
            <div className="mt-3 flex gap-2">
              <input
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
                placeholder="文件 UUID"
                value={fileId}
                onChange={(e) => setFileId(e.target.value)}
              />
              <button
                type="button"
                onClick={() => void loadMeta()}
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
              >
                查询
              </button>
            </div>
            {meta ? (
              <dl className="mt-4 space-y-2 rounded-lg bg-slate-50 p-3 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">ID</dt>
                  <dd className="font-mono text-xs text-slate-800">{meta.id}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">原名</dt>
                  <dd className="text-right font-medium">{meta.original_name}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">大小</dt>
                  <dd>{meta.size_bytes} bytes</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">存储路径</dt>
                  <dd className="break-all font-mono text-xs">{meta.storage_path}</dd>
                </div>
              </dl>
            ) : null}
          </div>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            当前账号无 <code className="font-mono">file:read</code> 权限
          </div>
        )}
      </div>
    </div>
  );
}
