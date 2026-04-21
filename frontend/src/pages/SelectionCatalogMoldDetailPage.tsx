import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { MaterialPropertyDetailGrid } from "@/components/MaterialPropertyDetailGrid";
import { ApiError, apiFetch, formatApiDetail } from "@/lib/api";
import { IM_SPEC_DISPLAY_CELLS } from "@/features/selection-catalog/InjectionMachineCatalogFields";
import type { SelMoldInfoRead } from "@/lib/selectionCatalogTypes";
import { useAuth } from "@/contexts/AuthContext";

function Dl({
  rows,
}: {
  rows: { label: string; value: string | number | boolean | null | undefined }[];
}) {
  return (
    <dl className="grid gap-2 sm:grid-cols-2">
      {rows.map((r) => (
        <div key={r.label} className="flex gap-2 text-sm">
          <dt className="w-40 shrink-0 text-slate-500">{r.label}</dt>
          <dd className="min-w-0 break-words text-slate-800">{formatVal(r.value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function formatVal(v: string | number | boolean | null | undefined): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "是" : "否";
  return String(v);
}

/** 线架布尔在库中为 boolean，详情展示与表单「需要/不需要」一致 */
function formatWireFrame(v: boolean | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return v ? "需要" : "不需要";
}

function formatHaveNo(v: boolean | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return v ? "有" : "没有";
}

function fmtSpec(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

function InjectionMachineSpecBlock({
  spec,
}: {
  spec: NonNullable<SelMoldInfoRead["injection_machine_model_spec"]>;
}) {
  return (
    <div className="mt-6 rounded-lg border border-slate-100 bg-slate-50/80 px-4 py-3">
      <h3 className="text-sm font-medium text-slate-800">机型技术参数（目录）</h3>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {IM_SPEC_DISPLAY_CELLS.map(({ key, label }) => (
          <div
            key={key}
            className="rounded-md border border-slate-100 bg-white px-3 py-2 shadow-sm"
          >
            <div className="text-xs text-slate-500">{label}</div>
            <div className="mt-0.5 text-sm font-medium text-slate-800">{fmtSpec(spec[key])}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SelectionCatalogMoldDetailPage() {
  const { moldId } = useParams<{ moldId: string }>();
  const { can } = useAuth();
  const [row, setRow] = useState<SelMoldInfoRead | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!moldId || !can("selection:read")) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setErr(null);
      setLoading(true);
      try {
        const data = await apiFetch<SelMoldInfoRead>(`/selection-catalog/mold-infos/${moldId}`);
        if (!cancelled) setRow(data);
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载失败");
          setRow(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [moldId, can]);

  if (!can("selection:read")) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        需要 <span className="font-mono">selection:read</span>
      </div>
    );
  }

  if (!moldId) {
    return <p className="text-sm text-red-600">无效的模具 ID</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/selection-catalog/molds" className="text-sm font-medium text-brand-600 hover:underline">
          ← 返回模具档案
        </Link>
        {can("selection:write") ? (
          <Link
            to={`/selection-catalog/mold/${moldId}/edit`}
            className="ml-4 text-sm font-medium text-brand-600 hover:underline"
          >
            编辑
          </Link>
        ) : null}
        <h1 className="mt-2 text-2xl font-bold text-slate-800">模具档案详情</h1>
        <p className="mt-1 font-mono text-xs text-slate-500">{moldId}</p>
      </div>

      {err ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">加载中…</p>
      ) : row ? (
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800">基本信息 · 选型 · 技术 · 冷却 · 接线 · 注塑机</h2>
            <div className="mt-4">
            
              <Dl
                rows={[
                  { label: "模具制造商", value: row.manufacturer },
                  { label: "负责人", value: row.manager },
                  { label: "负责人电话", value: row.manager_phone },
                  { label: "模具编号", value: row.mold_id },
                  { label: "热流道系统编号", value: row.hot_runner_id },
                  { label: "热咀数量", value: row.nozzle_count },
                  { label: "产品腔数", value: row.cavity_count },
                  { label: "模具状态", value: row.mold_status_label },
                  { label: "模具类型", value: row.mold_type_label },
                  { label: "定位环偏心", value: row.locating_ring_eccentric_label },
                  { label: "订单需求", value: row.order_requirement_label },
                  { label: "热流道类型", value: row.hot_runner_type_label },
                  { label: "热流道系统所有权", value: row.hot_runner_system_ownership_label },
                  { label: "点位编号规则", value: row.point_numbering_rule_label },
                  { label: "驱动器", value: row.driver_type_label },
                  { label: "电磁阀", value: row.solenoid_valve_label },
                  { label: "电磁阀位置", value: row.solenoid_valve_position_label },
                  { label: "进胶系统描述", value: row.gate_system_desc_label },
                  { label: "模仁是否需要弹开", value: row.mold_core_eject },
                  { label: "平衡性要求", value: row.balance_requirement_label },
                  { label: "模板厚度可调", value: row.plate_thickness_adjustable },
                  { label: "流道板样式", value: row.runner_plate_style_label },
                  {
                    label: "线架",
                    value:
                      row.wire_frame_needed === null || row.wire_frame_needed === undefined
                        ? null
                        : formatWireFrame(row.wire_frame_needed),
                  },
                  { label: "电磁阀插座型号", value: row.solenoid_valve_socket_label },
                  { label: "信号线接线方式", value: row.signal_wiring_method_label },
                  { label: "模具冷却介质", value: row.cooling_medium_label },
                  { label: "水路油路接头位置", value: row.water_oil_connector_position_label },
                  {
                    label: "客户是否有模温机",
                    value:
                      row.has_mold_temp_controller === null || row.has_mold_temp_controller === undefined
                        ? null
                        : formatHaveNo(row.has_mold_temp_controller),
                  },
                  { label: "客户是否有温控器", value: row.has_temp_controller_label },
                  { label: "客户是否有时序控制器", value: row.has_sequence_controller_label },
                  { label: "客户是否有增压泵", value: row.has_booster_pump_label },
                  { label: "客户是否有多个油压泵", value: row.has_multiple_oil_pumps_label },
                  { label: "接线盒位置", value: row.junction_box_position_label },
                  { label: "插座类型", value: row.socket_type_label },
                  { label: "插座芯数", value: row.socket_pin_count_label },
                  { label: "感温线型号", value: row.thermocouple_type_label },
                  { label: "交付接线方式", value: row.delivery_wiring_method_label },
                  { label: "调机接线方式", value: row.debug_wiring_method_label },
                  { label: "注塑机品牌", value: row.injection_machine_brand_label },
                  { label: "客户设备库", value: row.customer_equipment_library_label },
                  { label: "注塑机型号(目录)", value: row.injection_machine_catalog_label },
                  { label: "注塑机备注", value: row.injection_machine_model },
                  { label: "注塑机吨位(t)", value: row.injection_machine_tonnage },
                  { label: "炮筒球半径(mm)", value: row.barrel_sphere_radius },
                  { label: "炮筒出胶孔(mm)", value: row.barrel_orifice },
                  { label: "创建时间", value: row.created_at },
                  { label: "更新时间", value: row.updated_at },
                ]}
              />
              {row.injection_machine_model_spec ? (
                <InjectionMachineSpecBlock spec={row.injection_machine_model_spec} />
              ) : null}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800">关联材料（附属性）</h2>
            {row.material ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-slate-600">
                  缩写{" "}
                  <span className="font-mono font-semibold text-slate-800">{row.material.abbreviation}</span>
                </p>
                {row.material.material_property ? (
                  <MaterialPropertyDetailGrid p={row.material.material_property} />
                ) : (
                  <p className="text-sm text-amber-800">该材料暂无属性行。</p>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">未关联材料</p>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800">产品信息</h2>
            {row.product ? (
              <div className="mt-4">
                <Dl
                  rows={[
                    { label: "产品名", value: row.product.product_name },
                    { label: "应用领域", value: row.product.application_field_label },
                    { label: "重量(g)", value: row.product.weight != null ? String(row.product.weight) : null },
                    { label: "平均肉厚", value: row.product.wall_thickness_label },
                    { label: "颜色", value: row.product.color_label },
                    { label: "换色说明", value: row.product.color_remark },
                    { label: "外观要求", value: row.product.surface_finish_label },
                    { label: "尺寸精度控制", value: row.product.precision_level_label },
                    { label: "力学性能要求", value: row.product.mechanical_requirement_label },
                    { label: "生产效率要求", value: row.product.efficiency_requirement_label },
                    { label: "生产批量", value: row.product.production_batch_label },
                  ]}
                />
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">未填写</p>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800">热流道系统</h2>
            {row.hot_runner ? (
              <div className="mt-4 space-y-4">
                <Dl
                  rows={[
                    { label: "系统存胶模数", value: row.hot_runner.resin_retention_cycles },
                    { label: "主射咀加热", value: row.hot_runner.main_nozzle_heating },
                    { label: "主射咀材质", value: row.hot_runner.main_nozzle_material },
                    { label: "主射咀加热器", value: row.hot_runner.main_nozzle_heater },
                    { label: "分流板搭桥", value: row.hot_runner.manifold_bridging },
                    { label: "分流板材质", value: row.hot_runner.manifold_material },
                    { label: "分流板流道直径", value: row.hot_runner.manifold_runner_diameter },
                    { label: "分流板对接", value: row.hot_runner.manifold_interface },
                    { label: "分流板膨胀计算", value: row.hot_runner.manifold_calculate_expansion },
                    { label: "分流板堵头", value: row.hot_runner.manifold_plug },
                    { label: "流道示意图", value: row.hot_runner.manifold_runner_diagram },
                  ]}
                />

                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">阀针</h3>
                  {row.hot_runner.valve_pin ? (
                    <Dl
                      rows={[
                        { label: "样式", value: row.hot_runner.valve_pin.style },
                        { label: "材质", value: row.hot_runner.valve_pin.material },
                        { label: "镀层", value: row.hot_runner.valve_pin.coating },
                      ]}
                    />
                  ) : (
                    <p className="text-sm text-slate-500">—</p>
                  )}
                </div>

                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">热咀配置</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-xs">
                      <thead className="bg-slate-50 text-left text-slate-500">
                        <tr>
                          <th className="px-2 py-2">序号</th>
                          <th className="px-2 py-2">结构</th>
                          <th className="px-2 py-2">加热器</th>
                          <th className="px-2 py-2">浇口直径</th>
                          <th className="px-2 py-2">咀芯材质</th>
                          <th className="px-2 py-2">咀芯涂层</th>
                          <th className="px-2 py-2">咀帽</th>
                          <th className="px-2 py-2">隔热帽</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(row.hot_runner.nozzles ?? []).map((n) => (
                          <tr key={n.id}>
                            <td className="px-2 py-2">{n.nozzle_index}</td>
                            <td className="px-2 py-2">{n.structure ?? "—"}</td>
                            <td className="px-2 py-2">{n.heater ?? "—"}</td>
                            <td className="px-2 py-2">{n.gate_diameter ?? "—"}</td>
                            <td className="px-2 py-2">{n.tip_material ?? "—"}</td>
                            <td className="px-2 py-2">{n.tip_coating ?? "—"}</td>
                            <td className="px-2 py-2">{n.cap_material ?? "—"}</td>
                            <td className="px-2 py-2">{n.insulator_material ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {(row.hot_runner.nozzles ?? []).length === 0 ? (
                      <p className="py-2 text-sm text-slate-500">无热咀行</p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">未填写</p>
            )}
          </section>
        </div>
      ) : !err ? (
        <p className="text-sm text-slate-500">无数据</p>
      ) : null}
    </div>
  );
}
