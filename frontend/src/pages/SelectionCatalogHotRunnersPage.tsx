import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Form,
  Input,
  Modal,
  Pagination,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { Link } from "react-router-dom";

import { API_V1, ApiError, apiFetch, formatApiDetail, getToken } from "@/lib/api";
import type {
  MoldDictBundleResponse,
  SelMoldHotRunnerSpecListRead,
  SelMoldHotRunnerSpecPage,
  SelMoldHotRunnerSpecPatch,
} from "@/lib/selectionCatalogTypes";
import { useAuth } from "@/contexts/AuthContext";

function dashCell(v: unknown): string {
  if (v == null || v === "") return "—";
  return String(v);
}

type HrspecSelectField = {
  formKey: keyof SelMoldHotRunnerSpecPatch;
  label: string;
  category: string;
};

/** 与后端 HR_SPEC_DICT_COLUMN_TO_CATEGORY / SEL_HRSPEC_DICT_SEED 一致 */
const HRSPEC_SELECT_FIELDS: HrspecSelectField[] = [
  { formKey: "system_glue_storage_modulus_id", label: "系统存胶模数", category: "hrspec_system_glue_storage" },
  { formKey: "main_nozzle_heating_id", label: "主射咀加热", category: "hrspec_main_nozzle_heating" },
  { formKey: "main_nozzle_body_material_id", label: "主射咀/热咀本体材质", category: "hrspec_main_nozzle_body_material" },
  { formKey: "main_nozzle_heater_id", label: "主射咀加热器", category: "hrspec_main_nozzle_heater" },
  { formKey: "manifold_bridge_id", label: "分流板搭桥", category: "hrspec_manifold_bridge" },
  { formKey: "manifold_material_id", label: "分流板材质", category: "hrspec_manifold_material" },
  { formKey: "manifold_channel_diameter_id", label: "分流板流道直径", category: "hrspec_manifold_channel_diameter" },
  { formKey: "manifold_nozzle_connection_id", label: "分流板与热咀对接", category: "hrspec_manifold_nozzle_connection" },
  { formKey: "manifold_expansion_calc_id", label: "分流板计算膨胀", category: "hrspec_manifold_expansion_calc" },
  { formKey: "manifold_plug_id", label: "分流板堵头", category: "hrspec_manifold_plug" },
  { formKey: "channel_direction_diagram_id", label: "流道走向示意图", category: "hrspec_channel_direction_diagram" },
  { formKey: "hot_nozzle_structure_id", label: "热咀结构", category: "hrspec_hot_nozzle_structure" },
  { formKey: "hot_nozzle_heater_id", label: "热咀加热器", category: "hrspec_hot_nozzle_heater" },
  { formKey: "gate_diameter_id", label: "浇口直径", category: "hrspec_gate_diameter" },
  { formKey: "nozzle_core_material_id", label: "咀芯材质", category: "hrspec_nozzle_core_material" },
  { formKey: "nozzle_core_coating_id", label: "咀芯涂层", category: "hrspec_nozzle_core_coating" },
  { formKey: "nozzle_cap_material_id", label: "咀帽材质", category: "hrspec_nozzle_cap_material" },
  { formKey: "insulation_cap_material_id", label: "隔热帽材质", category: "hrspec_insulation_cap_material" },
  { formKey: "valve_pin_style_id", label: "阀针样式", category: "hrspec_valve_pin_style" },
  { formKey: "valve_pin_material_id", label: "阀针材质", category: "hrspec_valve_pin_material" },
  { formKey: "valve_pin_plating_process_id", label: "阀针镀层工艺", category: "hrspec_valve_pin_plating_process" },
  { formKey: "shipping_water_jacket_id", label: "出货运水套", category: "hrspec_shipping_water_jacket" },
  { formKey: "shipping_protective_sleeve_id", label: "出货保护套", category: "hrspec_shipping_protective_sleeve" },
];

const REFERENCE_SYSTEM_FIELD = "reference_system_number";

function specToFormStrings(d: SelMoldHotRunnerSpecListRead): Record<string, string> {
  const out: Record<string, string> = {};
  for (const { formKey } of HRSPEC_SELECT_FIELDS) {
    const raw = d[formKey as keyof SelMoldHotRunnerSpecListRead];
    out[formKey as string] = raw != null && raw !== "" ? String(raw) : "";
  }
  out[REFERENCE_SYSTEM_FIELD] = d.reference_system_number ?? "";
  return out;
}

function buildPatchFromDiff(
  current: Record<string, string>,
  initial: Record<string, string>,
): SelMoldHotRunnerSpecPatch {
  const patch: SelMoldHotRunnerSpecPatch = {};
  for (const { formKey } of HRSPEC_SELECT_FIELDS) {
    const k = formKey as string;
    const a = (current[k] ?? "").trim();
    const b = (initial[k] ?? "").trim();
    if (a !== b) {
      (patch as Record<string, string | null>)[k] = a === "" ? null : a;
    }
  }
  const ra = (current[REFERENCE_SYSTEM_FIELD] ?? "").trim();
  const rb = (initial[REFERENCE_SYSTEM_FIELD] ?? "").trim();
  if (ra !== rb) {
    patch.reference_system_number = ra === "" ? null : ra;
  }
  return patch;
}

export function SelectionCatalogHotRunnersPage() {
  const { can } = useAuth();
  const allowed = can("selection:read");
  const canWrite = can("selection:write");

  const [form] = Form.useForm<Record<string, string>>();
  const editInitialRef = useRef<Record<string, string>>({});

  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<SelMoldHotRunnerSpecListRead[]>([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [limit] = useState(50);
  const [searchDraft, setSearchDraft] = useState("");
  const [searchQ, setSearchQ] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailRow, setDetailRow] = useState<SelMoldHotRunnerSpecListRead | null>(null);
  const [pdfExporting, setPdfExporting] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editingSpecId, setEditingSpecId] = useState<string | null>(null);
  const [dictCategories, setDictCategories] = useState<MoldDictBundleResponse["categories"] | null>(null);

  const loadDictOptions = useCallback(async () => {
    try {
      const b = await apiFetch<MoldDictBundleResponse>("/selection-catalog/dict/hot-runner-spec-options");
      setDictCategories(b.categories);
    } catch {
      setDictCategories(null);
    }
  }, []);

  const loadRows = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("skip", String(skip));
      params.set("limit", String(limit));
      if (searchQ.trim()) params.set("q", searchQ.trim());
      const page = await apiFetch<SelMoldHotRunnerSpecPage>(`/selection-catalog/mold-hot-runner-specs?${params.toString()}`);
      setRows(page.items);
      setTotal(page.total);
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载热流道列表失败");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [skip, limit, searchQ]);

  useEffect(() => {
    if (!allowed) return;
    void loadRows();
  }, [allowed, loadRows]);

  useEffect(() => {
    if (!allowed) return;
    void loadDictOptions();
  }, [allowed, loadDictOptions]);

  useEffect(() => {
    if (!loading && rows.length === 0 && skip > 0) {
      setSkip(0);
    }
  }, [loading, rows.length, skip]);

  const currentPage = Math.floor(skip / limit) + 1;

  const runSearch = () => {
    setSearchQ(searchDraft);
    setSkip(0);
  };

  const fetchSpec = useCallback(async (specId: string) => {
    return apiFetch<SelMoldHotRunnerSpecListRead>(`/selection-catalog/mold-hot-runner-specs/${specId}`);
  }, []);

  const downloadDetailPdf = useCallback(async (specId: string, moldNumber: string | null | undefined) => {
    setPdfExporting(true);
    try {
      const headers = new Headers();
      const t = getToken();
      if (t) headers.set("Authorization", `Bearer ${t}`);
      const res = await fetch(`${API_V1}/selection-catalog/mold-hot-runner-specs/${specId}/export.pdf`, {
        headers,
      });
      if (!res.ok) {
        let detail: unknown = res.statusText;
        try {
          const errBody = await res.json();
          if (errBody && typeof errBody === "object" && "detail" in errBody) {
            detail = (errBody as { detail: unknown }).detail;
          }
        } catch {
          /* ignore */
        }
        throw new ApiError(res.status, detail);
      }
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition");
      let filename = `热流道规格_${moldNumber || specId}.pdf`;
      const m = cd ? /filename\*=UTF-8''([^;\s]+)/i.exec(cd) : null;
      if (m?.[1]) {
        try {
          filename = decodeURIComponent(m[1]);
        } catch {
          /* keep default */
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      message.success("已开始下载");
    } catch (e) {
      message.error(e instanceof ApiError ? formatApiDetail(e.detail) : "导出 PDF 失败");
    } finally {
      setPdfExporting(false);
    }
  }, []);

  const openDetail = useCallback(
    async (specId: string) => {
      setDetailOpen(true);
      setDetailRow(null);
      setDetailLoading(true);
      try {
        setDetailRow(await fetchSpec(specId));
      } catch (e) {
        message.error(e instanceof ApiError ? formatApiDetail(e.detail) : "加载详情失败");
        setDetailOpen(false);
      } finally {
        setDetailLoading(false);
      }
    },
    [fetchSpec],
  );

  const openEdit = useCallback(
    async (specId: string) => {
      setEditingSpecId(specId);
      setEditOpen(true);
      form.resetFields();
      setEditLoading(true);
      try {
        const d = await fetchSpec(specId);
        const init = specToFormStrings(d);
        editInitialRef.current = init;
        form.setFieldsValue(init);
      } catch (e) {
        message.error(e instanceof ApiError ? formatApiDetail(e.detail) : "加载编辑数据失败");
        setEditOpen(false);
        setEditingSpecId(null);
      } finally {
        setEditLoading(false);
      }
    },
    [fetchSpec, form],
  );

  const closeEdit = () => {
    setEditOpen(false);
    setEditingSpecId(null);
    form.resetFields();
  };

  const submitEdit = async () => {
    if (!editingSpecId) return;
    const values = (await form.validateFields()) as Record<string, string>;
    const patch = buildPatchFromDiff(values, editInitialRef.current);
    if (Object.keys(patch).length === 0) {
      message.info("未修改任何字段");
      return;
    }
    setEditSaving(true);
    try {
      await apiFetch<SelMoldHotRunnerSpecListRead>(`/selection-catalog/mold-hot-runner-specs/${editingSpecId}`, {
        method: "PATCH",
        body: patch,
      });
      message.success("已保存");
      closeEdit();
      void loadRows();
    } catch (e) {
      message.error(e instanceof ApiError ? formatApiDetail(e.detail) : "保存失败");
    } finally {
      setEditSaving(false);
    }
  };

  const confirmDelete = useCallback(
    (record: SelMoldHotRunnerSpecListRead) => {
      Modal.confirm({
        title: "确认删除该条热流道规格？",
        content: `模具：${record.mold_number ?? record.mold_info_id}，删除后不可恢复。`,
        okText: "删除",
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            await apiFetch(`/selection-catalog/mold-hot-runner-specs/${record.id}`, { method: "DELETE" });
            message.success("已删除");
            void loadRows();
          } catch (e) {
            message.error(e instanceof ApiError ? formatApiDetail(e.detail) : "删除失败");
            throw e;
          }
        },
      });
    },
    [loadRows],
  );

  const columns: ColumnsType<SelMoldHotRunnerSpecListRead> = useMemo(
    () => [
      {
        title: "模具编号",
        dataIndex: "mold_number",
        key: "mold_number",
        render: (v: string | null | undefined, record) => (
          <Link to={`/selection-catalog/mold/${record.mold_info_id}`} className="font-mono text-xs text-brand-600 hover:underline">
            {v ?? "—"}
          </Link>
        ),
      },
      {
        title: "制造商",
        dataIndex: "mold_manufacturer",
        key: "mold_manufacturer",
        render: (v: unknown) => dashCell(v),
      },
      {
        title: "存胶模数",
        dataIndex: "system_glue_storage_modulus_label",
        key: "system_glue_storage_modulus_label",
        width: 100,
        render: (v: unknown) => dashCell(v),
      },
      {
        title: "主射咀加热",
        dataIndex: "main_nozzle_heating_label",
        key: "main_nozzle_heating_label",
        width: 100,
        render: (v: unknown) => dashCell(v),
      },
      {
        title: "分流板材质",
        dataIndex: "manifold_material_label",
        key: "manifold_material_label",
        render: (v: unknown) => dashCell(v),
      },
      {
        title: "流道直径",
        dataIndex: "manifold_channel_diameter_label",
        key: "manifold_channel_diameter_label",
        width: 88,
        render: (v: unknown) => dashCell(v),
      },
      {
        title: "热咀结构",
        dataIndex: "hot_nozzle_structure_label",
        key: "hot_nozzle_structure_label",
        width: 96,
        render: (v: unknown) => dashCell(v),
      },
      {
        title: "浇口直径",
        dataIndex: "gate_diameter_label",
        key: "gate_diameter_label",
        width: 88,
        render: (v: unknown) => dashCell(v),
      },
      {
        title: "更新",
        dataIndex: "updated_at",
        key: "updated_at",
        width: 160,
        render: (iso: string | undefined) => (
          <Typography.Text type="secondary" className="text-xs">
            {iso ? iso.slice(0, 19).replace("T", " ") : "—"}
          </Typography.Text>
        ),
      },
      {
        title: "操作",
        key: "actions",
        fixed: "right",
        width: canWrite ? 200 : 88,
        render: (_, record) => (
          <Space size="small" wrap>
            <Button type="link" size="small" style={{ padding: 0 }} onClick={() => void openDetail(record.id)}>
              详情
            </Button>
            {canWrite ? (
              <>
                <Button type="link" size="small" style={{ padding: 0 }} onClick={() => void openEdit(record.id)}>
                  编辑
                </Button>
                <Button type="link" size="small" danger style={{ padding: 0 }} onClick={() => confirmDelete(record)}>
                  删除
                </Button>
              </>
            ) : null}
          </Space>
        ),
      },
    ],
    [canWrite, openDetail, openEdit, confirmDelete],
  );

  if (!allowed) {
    return (
      <Alert
        type="warning"
        showIcon
        message={
          <>
            需要权限 <Typography.Text code>selection:read</Typography.Text> 查看热流道列表。
          </>
        }
      />
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <div>
        <Typography.Title level={3} style={{ margin: 0 }}>
          热流道信息
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0, marginTop: 4 }}>
          数据来自模具热流道规格表（与档案 1:1 映射）；点击模具编号查看档案详情。支持按模具号模糊筛选。
          {canWrite ? null : (
            <>
              {" "}
              编辑与删除需要 <Typography.Text code>selection:write</Typography.Text>。
            </>
          )}
        </Typography.Paragraph>
      </div>

      {err ? <Alert type="error" showIcon message={err} /> : null}

      <Space wrap>
        <Input.Search
          allowClear
          placeholder="按模具号筛选"
          style={{ width: 280 }}
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          onSearch={() => runSearch()}
          enterButton="查询"
        />
        <Button onClick={() => void loadRows()}>刷新</Button>
      </Space>

      <Card styles={{ body: { padding: 0 } }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <Spin tip="加载中…" />
          </div>
        ) : (
          <>
            <Table<SelMoldHotRunnerSpecListRead>
              rootClassName="hot-runner-spec-table-wrap"
              size="small"
              rowKey="id"
              pagination={false}
              locale={{ emptyText: "暂无数据" }}
              scroll={{ x: canWrite ? 1240 : 1120 }}
              dataSource={rows}
              columns={columns}
            />
            <div
              style={{
                padding: "12px 16px",
                borderTop: "1px solid #f0f0f0",
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                alignItems: "center",
              }}
            >
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                共 {total} 条
              </Typography.Text>
              <Pagination
                size="small"
                current={currentPage}
                pageSize={limit}
                total={total}
                showSizeChanger={false}
                onChange={(page) => setSkip((page - 1) * limit)}
              />
            </div>
          </>
        )}
      </Card>

      <Modal
        title="热流道规格详情"
        open={detailOpen}
        onCancel={() => {
          setDetailOpen(false);
          setDetailRow(null);
        }}
        footer={
          detailRow ? (
            <Space>
              <Button
                onClick={() => {
                  setDetailOpen(false);
                  setDetailRow(null);
                }}
              >
                关闭
              </Button>
              <Button type="primary" loading={pdfExporting} onClick={() => void downloadDetailPdf(detailRow.id, detailRow.mold_number)}>
                导出 PDF
              </Button>
            </Space>
          ) : null
        }
        width={720}
        destroyOnHidden
      >
        {detailLoading ? (
          <div style={{ padding: 32, textAlign: "center" }}>
            <Spin />
          </div>
        ) : detailRow ? (
          <>
            <Descriptions size="small" column={2} bordered>
              <Descriptions.Item label="规格 ID" span={2}>
                <Typography.Text code className="text-xs">
                  {detailRow.id}
                </Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="模具档案 ID" span={2}>
                <Link to={`/selection-catalog/mold/${detailRow.mold_info_id}`}>
                  <Typography.Text code className="text-xs">
                    {detailRow.mold_info_id}
                  </Typography.Text>
                </Link>
              </Descriptions.Item>
              <Descriptions.Item label="模具编号">{dashCell(detailRow.mold_number)}</Descriptions.Item>
              <Descriptions.Item label="制造商">{dashCell(detailRow.mold_manufacturer)}</Descriptions.Item>
            </Descriptions>
            <Divider style={{ margin: "16px 0" }} />
            <Descriptions size="small" column={1} bordered>
              {HRSPEC_SELECT_FIELDS.map(({ formKey, label }) => {
                const lk = String(formKey).replace(/_id$/, "_label") as keyof SelMoldHotRunnerSpecListRead;
                return (
                  <Descriptions.Item key={formKey as string} label={label}>
                    {dashCell(detailRow[lk])}
                  </Descriptions.Item>
                );
              })}
              <Descriptions.Item label="可参考的系统编号">
                {dashCell(detailRow.reference_system_number)}
              </Descriptions.Item>
            </Descriptions>
            <Typography.Text type="secondary" className="mt-3 block text-xs">
              创建 {detailRow.created_at?.slice(0, 19)?.replace("T", " ") ?? "—"} · 更新{" "}
              {detailRow.updated_at?.slice(0, 19)?.replace("T", " ") ?? "—"}
            </Typography.Text>
          </>
        ) : null}
      </Modal>

      <Modal
        title="编辑热流道规格"
        open={editOpen}
        onCancel={closeEdit}
        width="min(960px, calc(100vw - 32px))"
        styles={{
          body: {
            paddingTop: 8,
            overflowX: "hidden",
            maxWidth: "100%",
          },
        }}
        destroyOnHidden
        confirmLoading={editSaving}
        okText="保存"
        onOk={() => void submitEdit()}
      >
        {editLoading ? (
          <div style={{ padding: 32, textAlign: "center" }}>
            <Spin />
          </div>
        ) : (
          <Form
            form={form}
            layout="vertical"
            className="app-scrollbar"
            style={{
              maxHeight: "70vh",
              overflowY: "auto",
              overflowX: "hidden",
              width: "100%",
              paddingRight: 8,
              boxSizing: "border-box",
              overscrollBehavior: "contain",
            }}
          >
            <div style={{ width: "100%", overflowX: "hidden" }}>
              <Row gutter={[16, 8]} wrap>
                {HRSPEC_SELECT_FIELDS.map(({ formKey, label, category }) => {
                  const opts = dictCategories?.[category] ?? [];
                  const showSearch = category === "hrspec_hot_nozzle_structure";
                  return (
                    <Col key={formKey as string} xs={24} sm={12} lg={8} style={{ minWidth: 0 }}>
                      <Form.Item name={formKey as string} label={label} className="mb-2">
                        <Select
                          allowClear
                          placeholder="请选择或清空"
                          options={opts.map((o) => ({ value: String(o.id), label: o.label }))}
                          showSearch={showSearch}
                          optionFilterProp="label"
                          notFoundContent={dictCategories ? "暂无选项" : "加载字典中…"}
                          style={{ width: "100%", maxWidth: "100%" }}
                        />
                      </Form.Item>
                    </Col>
                  );
                })}
                <Col xs={24} sm={12} lg={16} style={{ minWidth: 0 }}>
                  <Form.Item name={REFERENCE_SYSTEM_FIELD} label="可参考的系统编号" className="mb-2">
                    <Input allowClear placeholder="自由填写" style={{ maxWidth: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>
            </div>
            <Typography.Paragraph type="secondary" className="!mb-0 !mt-1 text-xs">
              选项来自选型字典；仅提交有变更的字段；清空下拉表示置空该项。
            </Typography.Paragraph>
          </Form>
        )}
      </Modal>
    </Space>
  );
}
