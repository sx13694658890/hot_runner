import { useEffect, useMemo, useState } from "react";

import { fetchMoldDictBundle } from "@/lib/selectionCatalogDictApi";
import { moldDictCategoryCode } from "@/lib/selectionCatalogMoldPayload";
import type { MoldDictBundleResponse } from "@/lib/selectionCatalogTypes";

/**
 * 根据 mold-options 中 `hot_runner_type` 解析当前 `hot_runner_type_id` 的显示名（与第 6 步 `WizardHotRunnerInfoFields` 一致）。
 * 用于向导其它步（如第 8 步分流板）按 label 做联动，避免重复在各页拉字典。
 */
export function useMoldHotRunnerTypeLabel(hotRunnerTypeId: string | undefined): string | undefined {
  const [categories, setCategories] = useState<MoldDictBundleResponse["categories"] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchMoldDictBundle().then((b) => {
      if (!cancelled) setCategories(b);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => {
    const tid = hotRunnerTypeId?.trim();
    if (!categories || !tid) return undefined;
    const code = moldDictCategoryCode("hot_runner_type_id");
    return (categories[code] ?? []).find((o) => o.id === tid)?.label?.trim();
  }, [categories, hotRunnerTypeId]);
}
