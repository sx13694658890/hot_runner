import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Input,
  Select,
  Space,
  Spin,
  Typography,
} from "antd";
import { Link, useMatch, useNavigate, useParams } from "react-router-dom";

import { MaterialPropertyDetailGrid } from "@/components/MaterialPropertyDetailGrid";
import { InjectionMachineCatalogFields } from "@/features/selection-catalog/InjectionMachineCatalogFields";
import { ApiError, apiFetch, formatApiDetail } from "@/lib/api";
import {
  emptyMoldForm,
  formToCreateBody,
  formToPatchBody,
  moldDictCategoryCode,
  type MoldAggregateFormState,
  MOLD_ROOT_DICT_FIELD_KEYS,
  MOLD_ROOT_FIELD_META,
  MOLD_ROOT_FREE_INPUT_KEYS,
  MOLD_ROOT_INJECTION_METAS_EXCLUDED,
  moldReadToForm,
  PRODUCT_FIELD_META,
  productDictCategoryCode,
  type TriBool,
} from "@/lib/selectionCatalogMoldPayload";
import type { MoldDictBundleResponse, SelMaterialRead, SelMoldInfoRead } from "@/lib/selectionCatalogTypes";
import { useAuth } from "@/contexts/AuthContext";

const inputBaseClass = "mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm";

function TriSelectYesNo({
  value,
  onChange,
  className = "",
}: {
  value: TriBool;
  onChange: (v: TriBool) => void;
  className?: string;
}) {
  return (
    <Select<TriBool>
      allowClear
      className={["w-full", className].filter(Boolean).join(" ")}
      value={value || undefined}
      onChange={(v) => onChange((v ?? "") as TriBool)}
      options={[
        { value: "true", label: "是" },
        { value: "false", label: "否" },
      ]}
      popupMatchSelectWidth={false}
    />
  );
}

function MoldRootFieldControl({
  meta,
  form,
  setRoot,
  setRootBool,
  dictBundle,
}: {
  meta: (typeof MOLD_ROOT_FIELD_META)[number];
  form: MoldAggregateFormState;
  setRoot: (key: string, v: string) => void;
  setRootBool: (key: string, v: TriBool) => void;
  dictBundle: Record<string, { id: string; label: string; sort_order: number }[]> | null;
}) {
  const { key, kind } = meta;

  if (kind === "tri") {
    const v = form.rootBool[key] ?? "";
    if (key === "wire_frame_needed") {
      return (
        <Select<TriBool>
          allowClear
          className={`${inputBaseClass} [&_.ant-select-selector]:rounded [&_.ant-select-selector]:border-slate-200`}
          value={v || undefined}
          onChange={(nv) => setRootBool(key, (nv ?? "") as TriBool)}
          options={[
            { value: "true", label: "需要" },
            { value: "false", label: "不需要" },
          ]}
          popupMatchSelectWidth={false}
        />
      );
    }
    if (key === "has_mold_temp_controller") {
      return (
        <Select<TriBool>
          allowClear
          className={`${inputBaseClass} [&_.ant-select-selector]:rounded [&_.ant-select-selector]:border-slate-200`}
          value={v || undefined}
          onChange={(nv) => setRootBool(key, (nv ?? "") as TriBool)}
          options={[
            { value: "true", label: "有" },
            { value: "false", label: "没有" },
          ]}
          popupMatchSelectWidth={false}
        />
      );
    }
    return <TriSelectYesNo value={v} onChange={(nv) => setRootBool(key, nv)} className="mt-1" />;
  }

  if (MOLD_ROOT_FREE_INPUT_KEYS.has(key)) {
    const isNum = kind === "int" || kind === "dec";
    return (
      <Input
        type={isNum ? "number" : "text"}
        step={kind === "dec" ? "any" : kind === "int" ? 1 : undefined}
        className={inputBaseClass}
        value={form.root[key] ?? ""}
        onChange={(e) => setRoot(key, e.target.value)}
      />
    );
  }

  if (MOLD_ROOT_DICT_FIELD_KEYS.has(key)) {
    const cat = moldDictCategoryCode(key);
    const opts = dictBundle?.[cat] ?? [];
    return (
      <Select<string>
        allowClear
        placeholder={dictBundle === null ? "字典加载中…" : undefined}
        disabled={dictBundle === null}
        className={`${inputBaseClass} [&_.ant-select-selector]:rounded [&_.ant-select-selector]:border-slate-200`}
        value={form.root[key] || undefined}
        onChange={(nv) => setRoot(key, nv ?? "")}
        options={opts.map((o) => ({ value: o.id, label: o.label }))}
        popupMatchSelectWidth={false}
      />
    );
  }

  return (
    <Input
      className={inputBaseClass}
      value={form.root[key] ?? ""}
      onChange={(e) => setRoot(key, e.target.value)}
    />
  );
}

export function SelectionCatalogMoldFormPage() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const { moldId: routeMoldId } = useParams<{ moldId: string }>();
  const isNewMatch = useMatch({ path: "/selection-catalog/mold/new", end: true });
  const isCreate = Boolean(isNewMatch);
  const editMoldId = isCreate ? undefined : routeMoldId;

  const canRead = can("selection:read");
  const canWrite = can("selection:write");

  const [form, setForm] = useState<MoldAggregateFormState>(() => emptyMoldForm());
  const [dictBundle, setDictBundle] = useState<MoldDictBundleResponse["categories"] | null>(null);
  const [materials, setMaterials] = useState<SelMaterialRead[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);

  const setRoot = (key: string, v: string) => {
    setForm((f) => ({ ...f, root: { ...f.root, [key]: v } }));
  };
  const setRootBool = (key: string, v: TriBool) => {
    setForm((f) => ({ ...f, rootBool: { ...f.rootBool, [key]: v } }));
  };
  const setProduct = (key: string, v: string) => {
    setForm((f) => ({ ...f, product: { ...f.product, [key]: v } }));
  };

  const loadMold = useCallback(async () => {
    if (!editMoldId || !canRead) {
      setLoading(false);
      return;
    }
    setErr(null);
    setLoading(true);
    try {
      const m = await apiFetch<SelMoldInfoRead>(`/selection-catalog/mold-infos/${editMoldId}`);
      setForm(moldReadToForm(m));
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载失败");
      setForm(emptyMoldForm());
    } finally {
      setLoading(false);
    }
  }, [editMoldId, canRead]);

  useEffect(() => {
    void loadMold();
  }, [loadMold]);

  useEffect(() => {
    if (!canRead) return;
    let cancelled = false;
    void (async () => {
      try {
        const b = await apiFetch<MoldDictBundleResponse>("/selection-catalog/dict/mold-options");
        if (!cancelled) setDictBundle(b.categories);
      } catch {
        if (!cancelled) setDictBundle({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canRead]);

  useEffect(() => {
    if (!canRead) return;
    let cancelled = false;
    void (async () => {
      try {
        const list = await apiFetch<SelMaterialRead[]>("/selection-catalog/materials");
        if (!cancelled) setMaterials(list);
      } catch {
        if (!cancelled) setMaterials([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canRead]);

  const selectedMaterial = useMemo(() => {
    const id = form.materialId?.trim();
    if (!id) return null;
    return materials.find((m) => m.id === id) ?? null;
  }, [materials, form.materialId]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canWrite) return;
    setErr(null);
    setSaving(true);
    try {
      if (isCreate) {
        const body = formToCreateBody(form);
        const created = await apiFetch<SelMoldInfoRead>("/selection-catalog/mold-infos", {
          method: "POST",
          body,
        });
        navigate(`/selection-catalog/mold/${created.id}`);
      } else if (editMoldId) {
        await apiFetch(`/selection-catalog/mold-infos/${editMoldId}`, {
          method: "PATCH",
          body: formToPatchBody(form),
        });
        navigate(`/selection-catalog/mold/${editMoldId}`);
      }
    } catch (errSubmit) {
      setErr(errSubmit instanceof ApiError ? formatApiDetail(errSubmit.detail) : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  if (!canRead) {
    return (
      <Alert
        type="warning"
        showIcon
        message={
          <>
            需要 <Typography.Text code>selection:read</Typography.Text>
          </>
        }
      />
    );
  }

  const title = isCreate ? "新建模具档案" : "编辑模具档案";

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", paddingBottom: 48 }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <Space wrap>
            <Link to="/selection-catalog/molds">
              <Button type="link" style={{ paddingLeft: 0 }}>
                ← 返回模具档案
              </Button>
            </Link>
            {!isCreate && editMoldId ? (
              <Link to={`/selection-catalog/mold/${editMoldId}`}>
                <Button type="link">查看详情</Button>
              </Link>
            ) : null}
          </Space>
          <Typography.Title level={3} style={{ marginTop: 8, marginBottom: 0 }}>
            {title}
          </Typography.Title>
          {!isCreate ? (
            <Typography.Text type="secondary" copyable={{ text: editMoldId ?? "" }} style={{ fontSize: 12 }}>
              {editMoldId}
            </Typography.Text>
          ) : null}
        </div>

        {err ? <Alert type="error" showIcon message={err} /> : null}

        {!canWrite ? (
          <Alert
            type="warning"
            showIcon
            message={
              <>
                当前账号无 <Typography.Text code>selection:write</Typography.Text>，无法提交保存。
              </>
            }
          />
        ) : null}

        {loading ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <Spin tip="加载中…" />
          </div>
        ) : (
          <form onSubmit={(e) => void onSubmit(e)}>
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <Card title="关联材料（附属性）" size="small" styles={{ header: { minHeight: 40 } }}>
                <Typography.Paragraph type="secondary" style={{ marginTop: 0, fontSize: 12 }}>
                  选择材料后展示属性参数（只读）：数据按塑料牌号维护，此处展示该材料下排序第一的牌号所带属性行。
                </Typography.Paragraph>
                <label className="mt-1 block text-sm">
                  <span className="text-slate-600">材料缩写</span>
                  <Select<string>
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    placeholder="请选择材料…"
                    className={`${inputBaseClass} mt-1 [&_.ant-select-selector]:rounded [&_.ant-select-selector]:border-slate-200`}
                    value={form.materialId || undefined}
                    onChange={(v) => setForm((f) => ({ ...f, materialId: v ?? "" }))}
                    options={materials.map((m) => ({
                      value: m.id,
                      label: `${m.abbreviation}${!m.is_active ? "（未启用）" : ""}`,
                    }))}
                    popupMatchSelectWidth={false}
                  />
                </label>
                {selectedMaterial?.material_property ? (
                  <div className="mt-4">
                    <MaterialPropertyDetailGrid p={selectedMaterial.material_property} />
                  </div>
                ) : form.materialId.trim() ? (
                  <p className="mt-4 text-sm text-amber-800">该材料暂无属性行或列表未加载到对应项。</p>
                ) : null}
              </Card>

              <Card title="注塑机（品牌→型号→参数）" size="small" styles={{ header: { minHeight: 40 } }}>
                <Typography.Paragraph type="secondary" style={{ marginTop: 0, fontSize: 12 }}>
                  与选型向导第 4 步一致：先品牌字典，再型号目录，下方展示机型技术参数（只读）。
                </Typography.Paragraph>
                <InjectionMachineCatalogFields
                  root={form.root}
                  setRoot={setRoot}
                  disabled={!canWrite}
                />
              </Card>

              <Card
                title="模具档案 · 选型 / 技术 / 冷却 / 接线"
                size="small"
                styles={{ header: { minHeight: 40 } }}
              >
                <Typography.Paragraph type="secondary" style={{ marginTop: 0, fontSize: 12 }}>
                  带冒号项为任意输入；其余为下拉（选项来自选型字典）。
                </Typography.Paragraph>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {MOLD_ROOT_FIELD_META.filter((m) => !MOLD_ROOT_INJECTION_METAS_EXCLUDED.has(m.key)).map((m) => (
                    <label key={m.key} className="block text-sm">
                      <span className="text-slate-600">{m.label}</span>
                      <MoldRootFieldControl
                        meta={m}
                        form={form}
                        setRoot={setRoot}
                        setRootBool={setRootBool}
                        dictBundle={dictBundle}
                      />
                    </label>
                  ))}
                </div>
              </Card>

              <Card size="small" styles={{ header: { minHeight: 40 } }}>
                <Checkbox
                  checked={form.includeProduct}
                  onChange={(e) => setForm((f) => ({ ...f, includeProduct: e.target.checked }))}
                >
                  填写产品信息（勾选后 POST/PATCH 会写入或覆盖{" "}
                  <Typography.Text code>sel_product_info</Typography.Text>）
                </Checkbox>
                {form.includeProduct ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {PRODUCT_FIELD_META.map((m) => (
                      <label key={m.key} className="block text-sm">
                        <span className="text-slate-500">{m.label}</span>
                        {m.kind === "dict" ? (
                          <Select<string>
                            allowClear
                            placeholder={dictBundle === null ? "字典加载中…" : undefined}
                            disabled={dictBundle === null}
                            className={`${inputBaseClass} [&_.ant-select-selector]:rounded [&_.ant-select-selector]:border-slate-200`}
                            value={form.product[m.key] || undefined}
                            onChange={(nv) => setProduct(m.key, nv ?? "")}
                            options={(dictBundle?.[productDictCategoryCode(m.key)] ?? []).map((o) => ({
                              value: o.id,
                              label: o.label,
                            }))}
                            popupMatchSelectWidth={false}
                          />
                        ) : m.kind === "dec" ? (
                          <Input
                            type="number"
                            step="any"
                            className="mt-1"
                            value={form.product[m.key] ?? ""}
                            onChange={(e) => setProduct(m.key, e.target.value)}
                          />
                        ) : (
                          <Input
                            className="mt-1"
                            value={form.product[m.key] ?? ""}
                            onChange={(e) => setProduct(m.key, e.target.value)}
                          />
                        )}
                      </label>
                    ))}
                  </div>
                ) : (
                  <Typography.Paragraph type="secondary" style={{ marginBottom: 0, marginTop: 8 }}>
                    未勾选则不提交产品子表。
                  </Typography.Paragraph>
                )}
              </Card>

              <Typography.Paragraph type="secondary" style={{ marginBottom: 0, fontSize: 12 }}>
                热流道系统明细由档案字段映射生成，不在此表单填写；保存后可于「热流道列表」或模具详情查看。
              </Typography.Paragraph>

              <Space wrap>
                <Button type="primary" htmlType="submit" disabled={!canWrite || saving} loading={saving}>
                  保存
                </Button>
                <Link to="/selection-catalog/molds">
                  <Button>取消</Button>
                </Link>
              </Space>
            </Space>
          </form>
        )}
      </Space>
    </div>
  );
}
