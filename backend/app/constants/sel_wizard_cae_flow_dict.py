"""选型向导第 5 步（模流/流道直径）专用字典 → sel_dict_category.code 前缀 sel_wizard_cae_。

选项 label 与现有扁平行 / 大类字典对齐（从种子推导），库内分类与字典项由迁移补全；页面只消费 GET …/wizard-cae-flow-options。
"""

from __future__ import annotations

from app.constants.sel_hrspec_dict import SEL_HRSPEC_DICT_SEED
from app.constants.sel_hot_nozzle_detail_dict import SEL_HOT_NOZZLE_DICT_SEED
from app.constants.sel_manifold_detail_dict import SEL_MANIFOLD_DICT_SEED


def _labels(seed: list[tuple[str, str, int, list[str]]], code: str) -> list[str]:
    for c, _lbl, _so, labels in seed:
        if c == code:
            return list(labels)
    raise KeyError(f"dict seed missing code: {code}")


_MAIN_CHANNEL = _labels(SEL_HRSPEC_DICT_SEED, "hrspec_manifold_channel_diameter")
_BRIDGE = _labels(SEL_MANIFOLD_DICT_SEED, "hrspec_mfld_bridge_channel_diameter")
_MANIFOLD_RUNNER = _labels(SEL_MANIFOLD_DICT_SEED, "hrspec_mfld_manifold_runner_diameter")
_NORMAL_HNZ = _labels(SEL_HRSPEC_DICT_SEED, "hrspec_hot_nozzle_structure")
_GATE = _labels(SEL_HOT_NOZZLE_DICT_SEED, "hrspec_hnz_gate_diameter")

# (code, 分类显示名, sort_order, [选项 label])
SEL_WIZARD_CAE_FLOW_DICT_SEED: list[tuple[str, str, int, list[str]]] = [
    ("sel_wizard_cae_main_nozzle_runner_diameter", "主射咀流道直径", 9000, _MAIN_CHANNEL),
    ("sel_wizard_cae_bridge_runner_diameter", "桥流道直径", 9001, _BRIDGE),
    ("sel_wizard_cae_manifold_runner_diameter", "主分流板流道直径", 9002, _MANIFOLD_RUNNER),
    ("sel_wizard_cae_normal_hot_nozzle", "法向热咀", 9003, _NORMAL_HNZ),
    ("sel_wizard_cae_hot_nozzle_runner_diameter", "热咀流道直径", 9004, _MANIFOLD_RUNNER),
    ("sel_wizard_cae_gate_diameter", "胶口直径", 9005, _GATE),
]

WIZARD_CAE_FLOW_CATEGORY_CODES: frozenset[str] = frozenset(
    code for code, _, _, _ in SEL_WIZARD_CAE_FLOW_DICT_SEED
)
