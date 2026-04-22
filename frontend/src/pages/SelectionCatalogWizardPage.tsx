import { Alert, Button, Card, Space, Steps, Typography } from "antd";
import { Link } from "react-router-dom";

import { WizardHotRunnerInfoFields } from "@/features/selection-catalog/WizardHotRunnerInfoFields";
import { WizardMainNozzleCategoryFields } from "@/features/selection-catalog/WizardMainNozzleCategoryFields";
import { useMoldHotRunnerTypeLabel } from "@/features/selection-catalog/useMoldHotRunnerTypeLabel";
import { WizardManifoldCategoryFields } from "@/features/selection-catalog/WizardManifoldCategoryFields";
import { WizardDriveSystemCategoryFields } from "@/features/selection-catalog/WizardDriveSystemCategoryFields";
import { WizardHotNozzleCategoryFields } from "@/features/selection-catalog/WizardHotNozzleCategoryFields";
import { WizardMoldFlowCaeFields } from "@/features/selection-catalog/WizardMoldFlowCaeFields";
import { WizardInjectionMachineFields } from "@/features/selection-catalog/WizardInjectionMachineFields";
import { WizardMoldInfoFields } from "@/features/selection-catalog/WizardMoldInfoFields";
import { WizardPartsFields } from "@/features/selection-catalog/WizardPartsFields";
import { WizardSystemGlueMoldFields } from "@/features/selection-catalog/WizardSystemGlueMoldFields";
import { WizardProductInfoFields } from "@/features/selection-catalog/WizardProductInfoFields";
import { WizardProjectInfoFields } from "@/features/selection-catalog/WizardProjectInfoFields";
import {
  useSelectionCatalogWizardPage,
  WIZARD_STEP_COUNT,
  WIZARD_STEP_ITEMS,
} from "@/pages/hooks/useSelectionCatalogWizardPage";
import { MOLD_HOT_RUNNER_TYPE_SINGLE_NOZZLE_LABEL } from "@/lib/selectionCatalogMoldPayload";

export function SelectionCatalogWizardPage() {
  const {
    canRead,
    canWrite,
    step,
    setStep,
    currentMeta,
    fieldsDisabled,
    projectInfo,
    setProjectInfo,
    productDraft,
    setProductDraft,
    moldDraft,
    setMoldDraft,
    handleFinish,
  } = useSelectionCatalogWizardPage();

  const hotRunnerTypeLabel = useMoldHotRunnerTypeLabel(moldDraft.root.hot_runner_type_id);
  const manifoldCategorySelectionForbidden = hotRunnerTypeLabel === MOLD_HOT_RUNNER_TYPE_SINGLE_NOZZLE_LABEL;

  if (!canRead) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        需要 <span className="font-mono">selection:read</span>
      </div>
    );
  }

  const renderStepBody = () => {
    switch (step) {
      case 1:
        return (
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
        );
      case 2:
        return (
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
        );
      case 3:
        return (
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
        );
      case 4:
        return (
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
        );
      case 5:
        return (
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
        );
      case 6:
        return (
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
        );
      case 7:
        return (
          <>
            <Alert
              type="info"
              showIcon
              className="mb-4"
              message="主射咀大类"
              description="选项来自 GET …/dict/main-nozzle-detail-options；按 hrspec_mnz_* 各分类分别下拉，值写入 moldDraft.root.wizard_mnz_*_id（字典项 UUID）。"
            />
            <WizardMainNozzleCategoryFields
              value={moldDraft}
              onChange={setMoldDraft}
              disabled={fieldsDisabled}
            />
          </>
        );
      case 8:
        return (
          <>
            <Alert
              type="info"
              showIcon
              className="mb-4"
              message="分流板大类"
              description="选项来自 GET …/dict/manifold-detail-options；按 hrspec_mfld_* 各分类分别下拉，值写入 moldDraft.root.wizard_mfld_*_id（字典项 UUID）。"
            />
            <WizardManifoldCategoryFields
              value={moldDraft}
              onChange={setMoldDraft}
              disabled={fieldsDisabled}
              selectionForbidden={manifoldCategorySelectionForbidden}
              selectionForbiddenMessage={
                manifoldCategorySelectionForbidden
                  ? "热流道类型为「单咀」时本步禁止选择；请在第 6 步修改类型。切换为单咀时已清空本步相关草稿键。"
                  : undefined
              }
            />
          </>
        );
      case 9:
        return (
          <>
            <Alert
              type="info"
              showIcon
              className="mb-4"
              message="热咀大类 / 驱动系统"
              description="热咀：GET …/dict/hot-nozzle-detail-options，值写入 wizard_hnz_*_id；咀头相关字段在「热咀咀头」分组。驱动系统：GET …/dict/drive-system-detail-options，值写入 wizard_drv_*_id。"
            />
            <div className="space-y-6">
              <WizardHotNozzleCategoryFields
                value={moldDraft}
                onChange={setMoldDraft}
                disabled={fieldsDisabled}
              />
              <WizardDriveSystemCategoryFields
                value={moldDraft}
                onChange={setMoldDraft}
                disabled={fieldsDisabled}
              />
            </div>
          </>
        );
      case 10:
        return (
          <>
            <Alert
              type="info"
              showIcon
              className="mb-4"
              message="系统存胶模数"
              description="选项为向导内置三档，值写入 moldDraft.root.wizard_system_glue_mold_count（字符串枚举，非字典 UUID）。"
            />
            <WizardSystemGlueMoldFields
              value={moldDraft}
              onChange={setMoldDraft}
              disabled={fieldsDisabled}
            />
          </>
        );
      case 11:
        return (
          <>
            <Alert
              type="info"
              showIcon
              className="mb-4"
              message="零配件"
              description="铭牌、压线片为向导内置下拉；值写入 moldDraft.root.wizard_parts_nameplate、wizard_parts_wire_clip。"
            />
            <WizardPartsFields value={moldDraft} onChange={setMoldDraft} disabled={fieldsDisabled} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link to="/selection-catalog" className="text-sm font-medium text-brand-600 hover:underline">
          ← 返回选型领域表
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-800">选型向导</h1>
        <p className="mt-1 text-sm text-slate-600">
          分步填写项目 → 产品 → 模具 → 注塑机 → 模流 → 热流道 → 主射咀大类 → 分流板大类 → 热咀大类 → 系统存胶模数 →
          零配件。左侧为步骤导航，可点击任意一步跳转；URL 同步{" "}
          <Typography.Text code>?step=1</Typography.Text>～
          <Typography.Text code>{WIZARD_STEP_COUNT}</Typography.Text>
          。草稿由 <Typography.Text code>Zustand</Typography.Text>（
          <Typography.Text code>useSelectionWizardStore</Typography.Text>）与{" "}
          <Typography.Text code>useSelectionWizard()</Typography.Text> 管理，经{" "}
          <Typography.Text code>SelectionWizardProvider</Typography.Text> 挂载后同步到{" "}
          <Typography.Text code>sessionStorage</Typography.Text>。
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="w-full shrink-0 lg:w-60 lg:max-w-[16rem]">
          <Card size="small" className="shadow-sm lg:sticky lg:top-4">
            <Steps
              direction="vertical"
              size="small"
              current={step - 1}
              onChange={(idx) => setStep(idx + 1)}
              items={WIZARD_STEP_ITEMS.map((s) => ({ title: s.title }))}
            />
          </Card>
        </aside>

        <div className="min-w-0 flex-1 space-y-4">
          <Card className="shadow-sm" title={currentMeta.title}>
            <p className="mb-4 text-sm text-slate-500">{currentMeta.description}</p>
            {renderStepBody()}
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
              {step < WIZARD_STEP_COUNT ? (
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
      </div>
    </div>
  );
}
