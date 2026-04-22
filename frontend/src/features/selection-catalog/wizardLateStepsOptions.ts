/** 第 10～11 步：向导内置枚举（非 sel_dict，仅存 moldDraft.root 字符串） */

export const WIZARD_SYSTEM_GLUE_MOLD_OPTIONS = [
  { value: "lt_1", label: "小于1模" },
  { value: "1_to_3", label: "1~3模" },
  { value: "gt_3", label: "大于3模" },
] as const;

export const WIZARD_PARTS_NAMEPLATE_OPTIONS = [
  { value: "our_company", label: "本公司铭牌" },
  { value: "customer_company", label: "XX公司铭牌" },
] as const;

/** 压线片：业务未给细项时提供常用档位，后续可改种子或接字典 */
export const WIZARD_PARTS_WIRE_CLIP_OPTIONS = [
  { value: "standard", label: "标配压线片" },
  { value: "heavy", label: "加厚压线片" },
  { value: "none", label: "不需要压线片" },
] as const;
