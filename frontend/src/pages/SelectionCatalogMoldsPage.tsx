import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Modal, Pagination, Space, Spin, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Link } from "react-router-dom";

import { ApiError, apiFetch, formatApiDetail } from "@/lib/api";
import type { SelMoldInfoRead } from "@/lib/selectionCatalogTypes";
import { useAuth } from "@/contexts/AuthContext";
import { SelectionWizardDraftBanner } from "@/features/selection-catalog/SelectionWizardDraftBanner";

function dashCell(v: unknown): string {
  if (v == null || v === "") return "—";
  return String(v);
}

export function SelectionCatalogMoldsPage() {
  const { can } = useAuth();
  const allowed = can("selection:read");

  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [molds, setMolds] = useState<SelMoldInfoRead[]>([]);
  const [skip, setSkip] = useState(0);
  const [limit] = useState(50);

  const loadMolds = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const q = new URLSearchParams();
      q.set("skip", String(skip));
      q.set("limit", String(limit));
      setMolds(await apiFetch<SelMoldInfoRead[]>(`/selection-catalog/mold-infos?${q.toString()}`));
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载模具档案失败");
      setMolds([]);
    } finally {
      setLoading(false);
    }
  }, [skip, limit]);

  const requestDeleteMold = useCallback(
    (id: string) => {
      if (!can("selection:write")) return;
      Modal.confirm({
        title: "删除该模具档案？",
        content: "将级联删除该模具下的产品与热流道数据，且不可恢复。",
        okText: "删除",
        okType: "danger",
        cancelText: "取消",
        onOk: async () => {
          setErr(null);
          try {
            await apiFetch(`/selection-catalog/mold-infos/${id}`, { method: "DELETE" });
            await loadMolds();
          } catch (e) {
            setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "删除失败");
            throw e;
          }
        },
      });
    },
    [can, loadMolds],
  );

  useEffect(() => {
    if (!allowed) return;
    void loadMolds();
  }, [allowed, loadMolds]);

  /** 列表接口未返回 total：末页用精确条数，满页则多估一页以便显示「下一页」 */
  useEffect(() => {
    if (!loading && molds.length === 0 && skip > 0) {
      setSkip(0);
    }
  }, [loading, molds.length, skip]);

  const currentPage = Math.floor(skip / limit) + 1;
  const totalForPager = useMemo(() => {
    if (molds.length === 0) return skip;
    if (molds.length < limit) return skip + molds.length;
    return skip + molds.length + limit;
  }, [skip, limit, molds.length]);

  const canWrite = can("selection:write");

  const columns: ColumnsType<SelMoldInfoRead> = useMemo(
    () => [
      {
        title: "制造商",
        dataIndex: "manufacturer",
        key: "manufacturer",
        ellipsis: true,
        render: (v: string | null) => dashCell(v),
      },
      {
        title: "模具编号",
        dataIndex: "mold_id",
        key: "mold_id",
        width: 160,
        render: (v: string | null) => (
          <Typography.Text code className="text-xs">
            {dashCell(v)}
          </Typography.Text>
        ),
      },
      {
        title: "模具类型",
        dataIndex: "mold_type_label",
        key: "mold_type_label",
        ellipsis: true,
        render: (v: string | null) => dashCell(v),
      },
      {
        title: "热流道类型",
        dataIndex: "hot_runner_type_label",
        key: "hot_runner_type_label",
        ellipsis: true,
        render: (v: string | null) => dashCell(v),
      },
      {
        title: "状态",
        dataIndex: "mold_status_label",
        key: "mold_status_label",
        width: 100,
        render: (v: string | null) => dashCell(v),
      },
      {
        title: "创建时间",
        dataIndex: "created_at",
        key: "created_at",
        width: 168,
        render: (v: string | null | undefined) =>
          v ? (v.slice(0, 19)?.replace("T", " ") ?? "—") : "—",
      },
      {
        title: "操作",
        key: "actions",
        align: "right",
        width: canWrite ? 200 : 72,
        fixed: "right",
        render: (_, m) => (
          <Space size="small" wrap>
            <Link to={`/selection-catalog/mold/${m.id}`} className="text-brand-600 hover:underline">
              查看
            </Link>
            {canWrite ? (
              <>
                <Link to={`/selection-catalog/mold/${m.id}/edit`} className="text-brand-600 hover:underline">
                  编辑
                </Link>
                <Button type="link" danger size="small" onClick={() => requestDeleteMold(m.id)}>
                  删除
                </Button>
              </>
            ) : null}
          </Space>
        ),
      },
    ],
    [canWrite, requestDeleteMold],
  );

  if (!allowed) {
    return (
      <Alert
        type="warning"
        showIcon
        message={
          <>
            需要权限 <Typography.Text code>selection:read</Typography.Text> 查看模具档案。
          </>
        }
      />
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            模具档案
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0, marginTop: 4 }}>
            列表为聚合根摘要；点击「查看」进入详情（含产品、热流道嵌套）。
          </Typography.Paragraph>
        </div>
        {can("selection:write") ? (
          <Link to="/selection-catalog/mold/new">
            <Button type="primary">新建模具档案</Button>
          </Link>
        ) : null}
      </div>

      <SelectionWizardDraftBanner />

      {err ? <Alert type="error" showIcon message={err} /> : null}

      <Card styles={{ body: { padding: 0 } }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <Spin tip="加载中…" />
          </div>
        ) : (
          <Table<SelMoldInfoRead>
            rootClassName="sel-molds-table-wrap"
            rowKey="id"
            size="small"
            pagination={false}
            dataSource={molds}
            columns={columns}
            scroll={{ x: 960 }}
            locale={{
              emptyText: "暂无模具档案（列表不含嵌套，请点查看）",
            }}
          />
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "12px 16px",
            borderTop: "1px solid #f0f0f0",
          }}
        >
          <Pagination
            current={currentPage}
            pageSize={limit}
            total={totalForPager}
            showSizeChanger={false}
            showQuickJumper={false}
            size="small"
            onChange={(page) => setSkip((page - 1) * limit)}
            disabled={loading}
          />
        </div>
      </Card>
    </Space>
  );
}
