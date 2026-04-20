/**
 * 选型字典 API（/api/v1/selection-catalog/dict/*）
 */

import { apiFetch } from "@/lib/api";
import type { MoldDictBundleResponse } from "@/lib/selectionCatalogTypes";

/** GET …/dict/hot-runner-spec-options */
export async function fetchHotRunnerSpecDictBundle(): Promise<MoldDictBundleResponse["categories"]> {
  const b = await apiFetch<MoldDictBundleResponse>("/selection-catalog/dict/hot-runner-spec-options");
  return b.categories;
}

/** GET …/dict/manifold-detail-options — 分流板大类截图/Excel 扩展字典（code 前缀 hrspec_mfld_） */
export async function fetchManifoldDetailDictBundle(): Promise<MoldDictBundleResponse["categories"]> {
  const b = await apiFetch<MoldDictBundleResponse>("/selection-catalog/dict/manifold-detail-options");
  return b.categories;
}

/** GET …/dict/main-nozzle-detail-options — 主射咀大类截图/Excel 扩展字典（code 前缀 hrspec_mnz_） */
export async function fetchMainNozzleDetailDictBundle(): Promise<MoldDictBundleResponse["categories"]> {
  const b = await apiFetch<MoldDictBundleResponse>("/selection-catalog/dict/main-nozzle-detail-options");
  return b.categories;
}

/** GET …/dict/hot-nozzle-detail-options — 热咀大类截图/Excel 扩展字典（code 前缀 hrspec_hnz_） */
export async function fetchHotNozzleDetailDictBundle(): Promise<MoldDictBundleResponse["categories"]> {
  const b = await apiFetch<MoldDictBundleResponse>("/selection-catalog/dict/hot-nozzle-detail-options");
  return b.categories;
}

/** GET …/dict/drive-system-detail-options — 驱动系统截图/Excel 扩展字典（code 前缀 hrspec_drv_） */
export async function fetchDriveSystemDetailDictBundle(): Promise<MoldDictBundleResponse["categories"]> {
  const b = await apiFetch<MoldDictBundleResponse>("/selection-catalog/dict/drive-system-detail-options");
  return b.categories;
}

/** GET …/dict/mold-options */
export async function fetchMoldDictBundle(): Promise<MoldDictBundleResponse["categories"]> {
  const b = await apiFetch<MoldDictBundleResponse>("/selection-catalog/dict/mold-options");
  return b.categories;
}
