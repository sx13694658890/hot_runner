import type { SelMaterialPropertyRead } from "@/lib/selectionCatalogTypes";

/** 材料属性行卡片栅格展示（模具档案 / 领域表共用） */
export function MaterialPropertyDetailGrid({ p }: { p: SelMaterialPropertyRead }) {
  const cells: { label: string; value: string | number | null | undefined }[] = [
    { label: "模温℃", value: p.mold_temp },
    { label: "熔融℃", value: p.melt_temp },
    { label: "降解℃", value: p.degradation_temp },
    { label: "成型窗口δ", value: p.molding_window },
    { label: "顶出℃", value: p.ejection_temp },
    { label: "结晶度", value: p.crystallinity },
    { label: "吸湿24h", value: p.moisture_absorption },
    { label: "粘度", value: p.viscosity },
    { label: "腐蚀性", value: p.metal_corrosion },
    { label: "注射压力", value: p.injection_pressure },
    { label: "存料时间", value: p.residence_time },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cells.map((c) => (
        <div key={c.label} className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
          <div className="text-xs text-slate-500">{c.label}</div>
          <div className="mt-0.5 text-sm font-medium text-slate-800">
            {c.value === null || c.value === undefined || c.value === "" ? "—" : String(c.value)}
          </div>
        </div>
      ))}
    </div>
  );
}
