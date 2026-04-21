import { useCallback, useEffect, useMemo } from "react";
import { Alert, Button, Card, Space, Steps, Typography, message } from "antd";
import { Link, useSearchParams } from "react-router-dom";

import { WizardHotRunnerInfoFields } from "@/features/selection-catalog/WizardHotRunnerInfoFields";
import { WizardMoldFlowCaeFields } from "@/features/selection-catalog/WizardMoldFlowCaeFields";
import { WizardInjectionMachineFields } from "@/features/selection-catalog/WizardInjectionMachineFields";
import { WizardMoldInfoFields } from "@/features/selection-catalog/WizardMoldInfoFields";
import { WizardProductInfoFields } from "@/features/selection-catalog/WizardProductInfoFields";
import { WizardProjectInfoFields } from "@/features/selection-catalog/WizardProjectInfoFields";
import { useSelectionWizard } from "@/contexts/SelectionWizardContext";
import { useAuth } from "@/contexts/AuthContext";

/** 与 docs/选型向导-多步表单-需求说明.md 一致，共 6 步 */
const STEP_COUNT = 6;

const STEP_ITEMS: { title: string; description: string }[] = [
  {
    title: "项目信息",
    description: "项目/客户/订单等上下文；订单需求字典、模具制造商与负责人联系方式。",
  },
  {
    title: "产品信息",
    description: "产品名称、材料、克重、型腔数等；对齐模具表单中的产品维度。",
  },
  {
    title: "模具信息",
    description: "模具编号、型腔、模架、尺寸、温控等模具根信息。",
  },
  {
    title: "注塑机信息",
    description: "机台吨位、螺杆、射出能力等约束或选型参数。",
  },
  {
    title: "模流信息",
    description: "主射咀/桥/分流板/热咀流道直径、法向热咀结构、胶口直径等（选型字典下拉）。",
  },
  {
    title: "热流道信息",
    description: "热流道系统选项；可对齐扁平行规格与各 detail-options 字典包。",
  },
];

function parseStepFromSearch(params: URLSearchParams): number {
  const raw = params.get("step");
  if (raw == null) return 1;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n) || n < 1 || n > STEP_COUNT) return 1;
  return n;
}

export function SelectionCatalogWizardPage() {
  const { can } = useAuth();
  const canRead = can("selection:read");
  const canWrite = can("selection:write");

  const [searchParams, setSearchParams] = useSearchParams();

  const { projectInfo, setProjectInfo, productDraft, setProductDraft, moldDraft, setMoldDraft } =
    useSelectionWizard();

  const step = useMemo(() => parseStepFromSearch(searchParams), [searchParams]);

  const setStep = useCallback(
    (n: number) => {
      const clamped = Math.min(Math.max(1, n), STEP_COUNT);
      setSearchParams({ step: String(clamped) }, { replace: true });
    },
    [setSearchParams],
  );

  useEffect(() => {
    const n = parseStepFromSearch(searchParams);
    const raw = searchParams.get("step");
    if (raw !== String(n)) {
      setSearchParams({ step: String(n) }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const currentMeta = STEP_ITEMS[step - 1];

  const handleFinish = () => {
    message.success("表单数据已汇总（提交与后端对接待实现）");
  };

  if (!canRead) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        需要 <span className="font-mono">selection:read</span>
      </div>
    );
  }

  const fieldsDisabled = !canWrite;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/selection-catalog" className="text-sm font-medium text-brand-600 hover:underline">
          ← 返回选型领域表
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-800">选型向导</h1>
        <p className="mt-1 text-sm text-slate-600">
          分步填写项目 → 产品 → 模具 → 注塑机 → 模流 → 热流道。可点击步骤条任意一步跳转；URL 同步{" "}
          <Typography.Text code>?step=1</Typography.Text>～
          <Typography.Text code>6</Typography.Text>
          。项目信息由全局状态 <Typography.Text code>SelectionWizardProvider</Typography.Text> 管理，并同步到{" "}
          <Typography.Text code>sessionStorage</Typography.Text>，其它页面可通过{" "}
          <Typography.Text code>useSelectionWizard()</Typography.Text> 读取。
        </p>
      </div>

      <Card className="shadow-sm">
        <Steps
          type="default"
          current={step - 1}
          onChange={(idx) => setStep(idx + 1)}
          items={STEP_ITEMS.map((s) => ({ title: s.title }))}
        />
      </Card>

      <Card className="shadow-sm" title={currentMeta.title}>
        {step === 1 ? (
          <>
            <Alert
              type="info"
              showIcon
              className="mb-4"
              message="项目信息"
              description="订单需求选项来自选型字典分类 order_requirement；制造商与负责人字段与模具根表一致，草稿刷新后仍保留（同浏览器会话）。"
            />
            <WizardProjectInfoFields
              value={projectInfo}
              onChange={setProjectInfo}
              disabled={fieldsDisabled}
            />
          </>
        ) : step === 2 ? (
          <>
            <Alert
              type="info"
              showIcon
              className="mb-4"
              message="产品信息"
              description="与「模具档案 → 新建/编辑」中勾选「填写产品信息」后的字段一致，选项来自 GET …/dict/mold-options 中的 product_* 分类。"
            />
            <WizardProductInfoFields
              value={productDraft}
              onChange={setProductDraft}
              disabled={fieldsDisabled}
            />
          </>
        ) : step === 3 ? (
          <>
            <Alert
              type="info"
              showIcon
              className="mb-4"
              message="模具信息"
              description="与「模具档案 → 新建/编辑」中模具根部字段一致：模具编号、状态、类型、冷却与客户设备等；选项来自 GET …/dict/mold-options。"
            />
            <WizardMoldInfoFields value={moldDraft} onChange={setMoldDraft} disabled={fieldsDisabled} />
          </>
        ) : step === 4 ? (
          <>
            <Alert
              type="info"
              showIcon
              className="mb-4"
              message="注塑机信息"
              description="注塑机品牌、客户设备库来自字典 dict/items；选品牌后型号来自 injection-machine-models；选型号后机型参数来自 injection-machine-model-specs。草稿写入 moldDraft.root。"
            />
            <WizardInjectionMachineFields value={moldDraft} onChange={setMoldDraft} disabled={fieldsDisabled} />
          </>
        ) : step === 5 ? (
          <>
            <Alert
              type="info"
              showIcon
              className="mb-4"
              message="模流信息"
              description="流道与咀部直径等六项为字典下拉（GET …/dict/wizard-cae-flow-options，sel_wizard_cae_*），草稿写入 moldDraft.root（wizard_cae_* 键）；与模具新建页根部字段独立，后续提交时可映射到规格或 CAE 表。"
            />
            <WizardMoldFlowCaeFields value={moldDraft} onChange={setMoldDraft} disabled={fieldsDisabled} />
          </>
        ) : (
          <>
            <Alert
              type="info"
              showIcon
              className="mb-4"
              message="热流道信息"
              description="与 sel_mold_info 根部热流道/阀/接线类字典字段一致，草稿写入 moldDraft.root / rootBool（与模具新建表单同一 payload 拼装）。"
            />
            <WizardHotRunnerInfoFields value={moldDraft} onChange={setMoldDraft} disabled={fieldsDisabled} />
          </>
        )}
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <Space>
          {step > 1 ? (
            <Button onClick={() => setStep(step - 1)}>上一步</Button>
          ) : (
            <span className="text-sm text-slate-400">上一步</span>
          )}
        </Space>
        <Space>
          {step < STEP_COUNT ? (
            <Button type="primary" onClick={() => setStep(step + 1)}>
              下一步
            </Button>
          ) : (
            <Button type="primary" disabled={!canWrite} onClick={handleFinish}>
              完成
            </Button>
          )}
        </Space>
      </div>

      {!canWrite ? (
        <p className="text-xs text-amber-800">当前账号无 selection:write，表单只读；「完成」已禁用。</p>
      ) : null}
    </div>
  );
}
