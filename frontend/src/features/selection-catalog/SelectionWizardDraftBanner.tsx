import { Alert } from "antd";
import { Link } from "react-router-dom";

import { useSelectionWizardOptional } from "@/contexts/SelectionWizardContext";

/**
 * 在选型相关页面顶部提示：当前浏览器会话中已有选型向导草稿（项目信息 / 产品信息等）。
 */
export function SelectionWizardDraftBanner() {
  const wizard = useSelectionWizardOptional();
  if (wizard == null || !wizard.hasWizardDraftData) return null;

  const { projectInfo, productDraft, moldDraft, hasProjectData, hasProductData, hasMoldData } = wizard;
  const parts: string[] = [];
  if (hasProjectData) {
    if (projectInfo.order_requirement_id) parts.push("订单需求已选");
    if (projectInfo.manufacturer.trim()) parts.push(`制造商 ${projectInfo.manufacturer.trim()}`);
    if (projectInfo.manager.trim()) parts.push(`负责人 ${projectInfo.manager.trim()}`);
    if (projectInfo.manager_phone.trim()) parts.push(`电话 ${projectInfo.manager_phone.trim()}`);
  }
  if (hasProductData) {
    const name = productDraft.product_name?.trim();
    const materialId = productDraft.material_id?.trim();
    const gradeId = productDraft.plastic_grade_id?.trim();
    if (name) parts.push(`产品：${name}`);
    else parts.push("产品信息已填写");
    if (materialId) parts.push("产品材质已选");
    if (gradeId) parts.push("塑料牌号已选");
  }
  if (hasMoldData) {
    const moldNo = moldDraft.root.mold_id?.trim();
    parts.push(moldNo ? `模具编号 ${moldNo}` : "模具信息已填写");
  }

  return (
    <Alert
      type="info"
      showIcon
      message="选型向导 · 草稿"
      description={
        <span>
          {parts.length > 0 ? (
            <>
              {parts.join(" · ")}
              {" · "}
            </>
          ) : null}
          <Link to="/selection-catalog/wizard" className="font-medium text-brand-600">
            打开向导继续编辑
          </Link>
        </span>
      }
    />
  );
}
