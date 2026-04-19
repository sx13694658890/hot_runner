import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Space, Spin, Table, Tabs, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";

import { ApiError, apiFetch, formatApiDetail } from "@/lib/api";
import type {
  SelAssociationRuleRead,
  SelMaterialMasterRead,
  SelMaterialPropertyFlatRead,
  SelNozzleListRead,
  SelProductInfoListRead,
  SelValvePinListRead,
} from "@/lib/selectionCatalogTypes";
import { useAuth } from "@/contexts/AuthContext";

type TabId =
  | "materialsMaster"
  | "materialPropsFlat"
  | "products"
  | "nozzles"
  | "valvePins"
  | "rules";

function JsonPreview(v: Record<string, unknown> | null): string {
  if (v == null) return "—";
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function fmtTs(iso: string | null | undefined): string {
  if (iso == null || iso === "") return "—";
  return iso.slice(0, 19).replace("T", " ");
}

function dashCell(v: unknown): string {
  if (v == null || v === "") return "—";
  return String(v);
}

export function SelectionCatalogPage() {
  const { can } = useAuth();
  const allowed = can("selection:read");

  const [tab, setTab] = useState<TabId>("products");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [materialsMaster, setMaterialsMaster] = useState<SelMaterialMasterRead[]>([]);
  const [materialPropsFlat, setMaterialPropsFlat] = useState<SelMaterialPropertyFlatRead[]>([]);
  const [products, setProducts] = useState<SelProductInfoListRead[]>([]);
  const [nozzles, setNozzles] = useState<SelNozzleListRead[]>([]);
  const [valvePins, setValvePins] = useState<SelValvePinListRead[]>([]);
  const [rules, setRules] = useState<SelAssociationRuleRead[]>([]);
  const [skip, setSkip] = useState(0);
  const [limit] = useState(50);

  const qFlat = useCallback(() => {
    const q = new URLSearchParams();
    q.set("skip", String(skip));
    q.set("limit", String(limit));
    return q.toString();
  }, [skip, limit]);

  const loadMaterialsMaster = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      setMaterialsMaster(
        await apiFetch<SelMaterialMasterRead[]>(`/selection-catalog/materials-master?${qFlat()}`),
      );
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载材料主表失败");
      setMaterialsMaster([]);
    } finally {
      setLoading(false);
    }
  }, [qFlat]);

  const loadMaterialPropsFlat = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      setMaterialPropsFlat(
        await apiFetch<SelMaterialPropertyFlatRead[]>(`/selection-catalog/material-properties?${qFlat()}`),
      );
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载材料属性失败");
      setMaterialPropsFlat([]);
    } finally {
      setLoading(false);
    }
  }, [qFlat]);

  const loadProducts = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      setProducts(await apiFetch<SelProductInfoListRead[]>(`/selection-catalog/product-infos?${qFlat()}`));
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载产品信息失败");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [qFlat]);

  const loadNozzles = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      setNozzles(await apiFetch<SelNozzleListRead[]>(`/selection-catalog/nozzle-configs?${qFlat()}`));
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载热咀配置失败");
      setNozzles([]);
    } finally {
      setLoading(false);
    }
  }, [qFlat]);

  const loadValvePins = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      setValvePins(
        await apiFetch<SelValvePinListRead[]>(`/selection-catalog/valve-pin-configs?${qFlat()}`),
      );
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载阀针配置失败");
      setValvePins([]);
    } finally {
      setLoading(false);
    }
  }, [qFlat]);

  const loadRules = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      setRules(await apiFetch<SelAssociationRuleRead[]>("/selection-catalog/association-rules"));
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载规则失败");
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!allowed) return;
    switch (tab) {
      case "materialsMaster":
        void loadMaterialsMaster();
        break;
      case "materialPropsFlat":
        void loadMaterialPropsFlat();
        break;
      case "products":
        void loadProducts();
        break;
      case "nozzles":
        void loadNozzles();
        break;
      case "valvePins":
        void loadValvePins();
        break;
      case "rules":
        void loadRules();
        break;
      default:
        break;
    }
  }, [
    allowed,
    tab,
    skip,
    loadMaterialsMaster,
    loadMaterialPropsFlat,
    loadProducts,
    loadNozzles,
    loadValvePins,
    loadRules,
  ]);

  if (!allowed) {
    return (
      <Alert
        type="warning"
        showIcon
        message={
          <>
            需要权限 <Typography.Text code>selection:read</Typography.Text> 查看选型领域表。
          </>
        }
      />
    );
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "materialsMaster", label: "材料主表" },
    { id: "materialPropsFlat", label: "材料属性行" },
    { id: "products", label: "产品信息" },
    { id: "nozzles", label: "热咀配置" },
    { id: "valvePins", label: "阀针配置" },
    { id: "rules", label: "关联规则" },
  ];

  const showPager =
    tab === "materialsMaster" ||
    tab === "materialPropsFlat" ||
    tab === "products" ||
    tab === "nozzles" ||
    tab === "valvePins";

  const pageLen =
    tab === "materialsMaster"
      ? materialsMaster.length
      : tab === "materialPropsFlat"
        ? materialPropsFlat.length
        : tab === "products"
          ? products.length
          : tab === "nozzles"
            ? nozzles.length
            : tab === "valvePins"
              ? valvePins.length
              : 0;

  const tabItems = tabs.map((t) => ({
    key: t.id,
    label: t.label,
  }));

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <div>
        <Typography.Title level={3} style={{ margin: 0 }}>
          模具选型 · 领域表
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0, marginTop: 4 }}>
          数据来自 <Typography.Text code>/api/v1/selection-catalog</Typography.Text>
          （中文枚举存库，与 JSON 契约选型向导并行）。材料附属性请在「模具档案」新建/编辑中选择关联材料。
          模具档案与热流道清单请从左侧导航进入。
        </Typography.Paragraph>
      </div>

      {err ? <Alert type="error" showIcon message={err} /> : null}

      <Tabs
        activeKey={tab}
        onChange={(k) => {
          setSkip(0);
          setTab(k as TabId);
        }}
        items={tabItems}
      />

      <Card styles={{ body: { padding: 0 } }}>
        {showPager ? (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid #f0f0f0" }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              分页
            </Typography.Text>
            <Button size="small" disabled={skip <= 0} onClick={() => setSkip((s) => Math.max(0, s - limit))}>
              上一页
            </Button>
            <Typography.Text type="secondary" style={{ fontSize: 12, fontFamily: "monospace" }}>
              skip={skip} · limit={limit}
            </Typography.Text>
            <Button size="small" disabled={pageLen < limit} onClick={() => setSkip((s) => s + limit)}>
              下一页
            </Button>
          </div>
        ) : null}

        {loading ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <Spin tip="加载中…" />
          </div>
        ) : tab === "materialsMaster" ? (
          <Table<SelMaterialMasterRead>
            size="small"
            rowKey="id"
            pagination={false}
            locale={{ emptyText: "暂无数据" }}
            scroll={{ x: 720 }}
            dataSource={materialsMaster}
            columns={
              [
                {
                  title: "缩写",
                  dataIndex: "abbreviation",
                  key: "abbreviation",
                  render: (abbr: string) => <Typography.Text code>{abbr}</Typography.Text>,
                },
                {
                  title: "启用",
                  dataIndex: "is_active",
                  key: "is_active",
                  width: 72,
                  render: (v: boolean) => (v ? "是" : "否"),
                },
                {
                  title: "创建时间",
                  dataIndex: "created_at",
                  key: "created_at",
                  render: (iso: string | null | undefined) => fmtTs(iso),
                },
              ] satisfies ColumnsType<SelMaterialMasterRead>
            }
          />
        ) : tab === "materialPropsFlat" ? (
          <Table<SelMaterialPropertyFlatRead>
            size="small"
            rowKey="id"
            pagination={false}
            locale={{ emptyText: "暂无数据" }}
            scroll={{ x: 1000 }}
            dataSource={materialPropsFlat}
            columns={
              [
                {
                  title: "缩写",
                  dataIndex: "abbreviation",
                  key: "abbreviation",
                  fixed: "left",
                  width: 120,
                  render: (abbr: string) => <Typography.Text code>{abbr}</Typography.Text>,
                },
                {
                  title: "模温℃",
                  dataIndex: "mold_temp",
                  key: "mold_temp",
                  render: (v: unknown) => (v == null || v === "" ? "—" : String(v)),
                },
                {
                  title: "熔融℃",
                  dataIndex: "melt_temp",
                  key: "melt_temp",
                  render: (v: unknown) => (v == null || v === "" ? "—" : String(v)),
                },
                {
                  title: "降解℃",
                  dataIndex: "degradation_temp",
                  key: "degradation_temp",
                  render: (v: unknown) => (v == null || v === "" ? "—" : String(v)),
                },
                {
                  title: "成型窗口δ",
                  dataIndex: "molding_window",
                  key: "molding_window",
                  render: (v: unknown) => (v == null || v === "" ? "—" : String(v)),
                },
                {
                  title: "粘度",
                  dataIndex: "viscosity",
                  key: "viscosity",
                  render: (v: unknown) => (v == null || v === "" ? "—" : String(v)),
                },
                {
                  title: "腐蚀性",
                  dataIndex: "metal_corrosion",
                  key: "metal_corrosion",
                  render: (v: unknown) => (v == null || v === "" ? "—" : String(v)),
                },
              ] satisfies ColumnsType<SelMaterialPropertyFlatRead>
            }
          />
        ) : tab === "products" ? (
          <Table<SelProductInfoListRead>
            size="small"
            rowKey="id"
            pagination={false}
            locale={{ emptyText: "暂无数据" }}
            scroll={{ x: 960 }}
            dataSource={products}
            columns={
              [
                {
                  title: "模具编号",
                  dataIndex: "mold_number",
                  key: "mold_number",
                  render: (v: string | null | undefined) => (
                    <Typography.Text type="secondary" className="font-mono text-xs">
                      {v ?? "—"}
                    </Typography.Text>
                  ),
                },
                {
                  title: "制造商",
                  dataIndex: "mold_manufacturer",
                  key: "mold_manufacturer",
                  render: (v: unknown) => dashCell(v),
                },
                {
                  title: "产品名称",
                  dataIndex: "product_name",
                  key: "product_name",
                  render: (v: unknown) => dashCell(v),
                },
                {
                  title: "应用领域",
                  dataIndex: "application_field_label",
                  key: "application_field_label",
                  render: (v: unknown) => dashCell(v),
                },
                { title: "重量", dataIndex: "weight", key: "weight", render: (v: unknown) => dashCell(v) },
                {
                  title: "更新",
                  dataIndex: "updated_at",
                  key: "updated_at",
                  render: (iso: string | null | undefined) => (
                    <Typography.Text type="secondary" className="text-xs">
                      {fmtTs(iso)}
                    </Typography.Text>
                  ),
                },
              ] satisfies ColumnsType<SelProductInfoListRead>
            }
          />
        ) : tab === "nozzles" ? (
          <Table<SelNozzleListRead>
            size="small"
            rowKey="id"
            pagination={false}
            locale={{ emptyText: "暂无数据" }}
            scroll={{ x: 960 }}
            dataSource={nozzles}
            columns={
              [
                {
                  title: "模具编号",
                  dataIndex: "mold_number",
                  key: "mold_number",
                  render: (v: string | null | undefined) => (
                    <Typography.Text type="secondary" className="font-mono text-xs">
                      {v ?? "—"}
                    </Typography.Text>
                  ),
                },
                {
                  title: "制造商",
                  dataIndex: "mold_manufacturer",
                  key: "mold_manufacturer",
                  render: (v: unknown) => dashCell(v),
                },
                {
                  title: "序号",
                  dataIndex: "nozzle_index",
                  key: "nozzle_index",
                  width: 72,
                  render: (v: unknown) => dashCell(v),
                },
                { title: "结构", dataIndex: "structure", key: "structure", render: (v: unknown) => dashCell(v) },
                { title: "加热器", dataIndex: "heater", key: "heater", render: (v: unknown) => dashCell(v) },
                {
                  title: "浇口直径",
                  dataIndex: "gate_diameter",
                  key: "gate_diameter",
                  render: (v: unknown) => dashCell(v),
                },
                {
                  title: "咀尖材质",
                  dataIndex: "tip_material",
                  key: "tip_material",
                  render: (v: unknown) => dashCell(v),
                },
              ] satisfies ColumnsType<SelNozzleListRead>
            }
          />
        ) : tab === "valvePins" ? (
          <Table<SelValvePinListRead>
            size="small"
            rowKey="id"
            pagination={false}
            locale={{ emptyText: "暂无数据" }}
            scroll={{ x: 720 }}
            dataSource={valvePins}
            columns={
              [
                {
                  title: "模具编号",
                  dataIndex: "mold_number",
                  key: "mold_number",
                  render: (v: string | null | undefined) => (
                    <Typography.Text type="secondary" className="font-mono text-xs">
                      {v ?? "—"}
                    </Typography.Text>
                  ),
                },
                {
                  title: "制造商",
                  dataIndex: "mold_manufacturer",
                  key: "mold_manufacturer",
                  render: (v: unknown) => dashCell(v),
                },
                { title: "样式", dataIndex: "style", key: "style", render: (v: unknown) => dashCell(v) },
                { title: "材质", dataIndex: "material", key: "material", render: (v: unknown) => dashCell(v) },
                { title: "涂层", dataIndex: "coating", key: "coating", render: (v: unknown) => dashCell(v) },
              ] satisfies ColumnsType<SelValvePinListRead>
            }
          />
        ) : tab === "rules" ? (
          <Table<SelAssociationRuleRead>
            size="small"
            rowKey="id"
            pagination={false}
            locale={{ emptyText: "暂无规则" }}
            scroll={{ x: "max-content" }}
            dataSource={rules}
            columns={
              [
                {
                  title: "规则编码",
                  dataIndex: "rule_code",
                  key: "rule_code",
                  width: 120,
                  render: (code: string) => <Typography.Text code>{code}</Typography.Text>,
                },
                {
                  title: "名称",
                  dataIndex: "rule_name",
                  key: "rule_name",
                  ellipsis: true,
                  render: (name: string) => <Typography.Text strong>{name}</Typography.Text>,
                },
                { title: "优先级", dataIndex: "priority", key: "priority", width: 88 },
                {
                  title: "启用",
                  dataIndex: "is_active",
                  key: "is_active",
                  width: 72,
                  render: (v: boolean) => (v ? "是" : "否"),
                },
                {
                  title: "原因",
                  dataIndex: "reason",
                  key: "reason",
                  width: 200,
                  ellipsis: true,
                  render: (v: string | null | undefined) => dashCell(v),
                },
                {
                  title: "触发条件(JSON)",
                  dataIndex: "trigger_conditions",
                  key: "trigger_conditions",
                  width: 180,
                  render: (raw: unknown) => (
                    <Typography.Paragraph className="mb-0 font-mono text-xs text-slate-600" style={{ wordBreak: "break-all" }}>
                      {JsonPreview(raw as Record<string, unknown> | null)}
                    </Typography.Paragraph>
                  ),
                },
                {
                  title: "推荐(JSON)",
                  dataIndex: "recommendations",
                  key: "recommendations",
                  width: 180,
                  render: (raw: unknown) => (
                    <Typography.Paragraph className="mb-0 font-mono text-xs text-slate-600" style={{ wordBreak: "break-all" }}>
                      {JsonPreview(raw as Record<string, unknown> | null)}
                    </Typography.Paragraph>
                  ),
                },
                {
                  title: "排除(JSON)",
                  dataIndex: "exclusions",
                  key: "exclusions",
                  width: 160,
                  render: (raw: unknown) => (
                    <Typography.Paragraph className="mb-0 font-mono text-xs text-slate-600" style={{ wordBreak: "break-all" }}>
                      {JsonPreview(raw as Record<string, unknown> | null)}
                    </Typography.Paragraph>
                  ),
                },
              ] satisfies ColumnsType<SelAssociationRuleRead>
            }
          />
        ) : null}
      </Card>
    </Space>
  );
}
