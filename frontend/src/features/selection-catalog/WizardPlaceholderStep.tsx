import { Alert, Typography } from "antd";
import type { ReactNode } from "react";

type WizardPlaceholderStepProps = {
  title: string;
  /** 占位说明，缺省为通用文案 */
  description?: ReactNode;
};

/** 选型向导第 7～11 步等：字段未接入时的占位 */
export function WizardPlaceholderStep({ title, description }: WizardPlaceholderStepProps) {
  return (
    <div className="space-y-4">
      <Alert
        type="info"
        showIcon
        message={`${title}（占位）`}
        description={
          description ??
          "本步字段与接口开发中，占位用于进度与导航验证；评审通过后接入字典或表单并写入草稿。"
        }
      />
      <Typography.Paragraph type="secondary" className="mb-0 text-sm">
        详见 docs/选型向导-多步表单-需求说明.md 第 4 节对应步骤说明。
      </Typography.Paragraph>
    </div>
  );
}
