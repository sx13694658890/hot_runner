import { useCallback, useEffect, useMemo } from "react";
import { message } from "antd";
import { useSearchParams } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";
import { useSelectionWizard } from "@/contexts/SelectionWizardContext";

/** 与 docs/选型向导-多步表单-需求说明.md 一致，共 11 步 */
export const WIZARD_STEP_COUNT = 11;

export const WIZARD_STEP_ITEMS: { title: string; description: string }[] = [
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
  {
    title: "主射咀大类",
    description: "主射咀各大类（hrspec_mnz_*）各一个字典下拉，选中项写入向导草稿。",
  },
  {
    title: "分流板大类",
    description: "分流板各大类（hrspec_mfld_*）各一个字典下拉，选中项写入向导草稿。",
  },
  {
    title: "热咀大类",
    description:
      "热咀各大类（hrspec_hnz_*）与驱动系统（hrspec_drv_*）各分类字典下拉，选中项写入向导草稿。",
  },
  {
    title: "系统存胶模数",
    description: "存胶模数档位：小于1模、1～3模、大于3模（向导内置下拉）。",
  },
  {
    title: "零配件",
    description: "铭牌、压线片等（向导内置下拉；后续可接字典或 BOM）。",
  },
];

export function parseWizardStepFromSearch(params: URLSearchParams): number {
  const raw = params.get("step");
  if (raw == null) return 1;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n) || n < 1 || n > WIZARD_STEP_COUNT) return 1;
  return n;
}

export function useSelectionCatalogWizardPage() {
  const { can } = useAuth();
  const canRead = can("selection:read");
  const canWrite = can("selection:write");

  const [searchParams, setSearchParams] = useSearchParams();

  const { projectInfo, setProjectInfo, productDraft, setProductDraft, moldDraft, setMoldDraft } =
    useSelectionWizard();

  const step = useMemo(() => parseWizardStepFromSearch(searchParams), [searchParams]);

  const setStep = useCallback(
    (n: number) => {
      const clamped = Math.min(Math.max(1, n), WIZARD_STEP_COUNT);
      setSearchParams({ step: String(clamped) }, { replace: true });
    },
    [setSearchParams],
  );

  useEffect(() => {
    const n = parseWizardStepFromSearch(searchParams);
    const raw = searchParams.get("step");
    if (raw !== String(n)) {
      setSearchParams({ step: String(n) }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const currentMeta = WIZARD_STEP_ITEMS[step - 1];

  const handleFinish = () => {
    message.success("表单数据已汇总（提交与后端对接待实现）");
  };

  const fieldsDisabled = !canWrite;

  return {
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
  };
}
