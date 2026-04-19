"""
模具选型决策模型
================
根据产品需求自动推荐模具和热流道配置
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from enum import Enum
import json


# ==================== 决策上下文 ====================

@dataclass
class SelectionContext:
    """选型上下文（用户输入）"""
    # 产品需求
    application_field: Optional[str] = None      # 应用领域
    product_weight: Optional[float] = None       # 产品重量(g)
    wall_thickness: Optional[str] = None         # 平均肉厚
    color: Optional[str] = None                  # 颜色
    surface_finish: Optional[str] = None         # 外观要求
    precision_level: Optional[str] = None        # 尺寸精度
    mechanical_requirement: Optional[str] = None # 力学性能
    efficiency_requirement: Optional[str] = None # 生产效率
    production_batch: Optional[str] = None       # 生产批量
    
    # 材料选择
    material: Optional[str] = None               # 材料缩写
    
    # 模具约束
    mold_type: Optional[str] = None              # 单色/双色/叠模
    nozzle_count: Optional[int] = None           # 热咀数量
    
    # 特殊需求
    color_change_required: bool = False          # 是否需要换色
    medical_grade: bool = False                  # 是否医疗级


@dataclass
class Recommendation:
    """推荐项"""
    field_name: str
    field_label: str
    recommended_values: List[str]
    reason: str
    priority: int = 1


@dataclass
class SelectionResult:
    """选型结果"""
    materials: List[str] = field(default_factory=list)
    hotrunner_types: List[str] = field(default_factory=list)
    recommendations: List[Recommendation] = field(default_factory=list)
    conflicts: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    notes: List[str] = field(default_factory=list)


# ==================== 决策规则库 ====================

# 应用领域 → 材料推荐
APP_MATERIAL_MAP = {
    "汽车": ["PP", "ABS", "PA6", "PA66", "PC+ABS", "POM", "TPE"],
    "家电": ["ABS", "PP", "HIPS(PS)", "PC", "PMMA"],
    "医疗": ["PP", "PE", "PC", "PMMA", "POM", "TPU"],
    "日化": ["PP", "PE", "PET", "PETG", "PVC"],
    "美妆": ["PP", "PE", "PETG", "PMMA", "ABS"],
}

# 外观 → 热咀结构
SURFACE_NOZZLE_MAP = {
    "高亮": {"recommend": ["OA", "PLT", "SOE"], "exclude": ["SLT", "TOE", "TLS"]},
    "晒纹": {"recommend": ["SLT", "SOE", "TLS", "OA"]},
    "皮纹": {"recommend": ["SLT", "TOE", "TLS", "TAC"]},
    "细皮纹": {"recommend": ["SLT", "SOE", "TLS"]},
    "一般": {"recommend": ["SLT", "SOE", "TLS", "OA", "PLT"]},
}

# 精度 → 热流道类型
PRECISION_HOTRUNNER_MAP = {
    "精密件（公差±0.02mm）": {
        "recommend": ["含分流板的针阀式", "单点针阀"],
        "exclude": ["单咀"],
        "balance": "严格",
    },
    "常规件（公差±0.1mm）": {
        "recommend": ["含分流板的开放式", "含分流板的针阀式", "单咀"],
        "balance": "一般",
    },
}

# 批量 → 材质
BATCH_MATERIAL_MAP = {
    "大批量（≥10万模次）": {
        "main_nozzle_material": ["FS136"],
        "tip_material": ["钨铜", "钼合金"],
        "coating": ["DLC", "TiAlN", "CrN+DLC"],
    },
    "中批量（1万-10万模次）": {
        "main_nozzle_material": ["FS136", "4CR13"],
        "tip_material": ["SKD61", "铍铜"],
        "coating": ["Ni", "TiN", "CrN"],
    },
    "小批量（＜1万模次）": {
        "main_nozzle_material": ["4CR13"],
        "tip_material": ["SKD61"],
        "coating": ["Cr", "Ni"],
    },
}

# 壁厚 → 参数
WALL_THICKNESS_MAP = {
    "薄壁件（＜1mm）": {
        "gate_diameter_min": 1.0,
        "tip_material": ["铍铜"],
        "injection_pressure": "高",
    },
    "常规件（1-3mm）": {
        "gate_diameter_min": 1.5,
        "tip_material": ["SKD61", "铍铜"],
    },
    "厚壁件（＞3mm）": {
        "gate_diameter_min": 2.5,
        "cooling_medium": ["冰水"],
    },
}

# 材料特殊规则
MATERIAL_SPECIAL_RULES = {
    # 高温材料
    "高温材料": {
        "materials": ["FEP", "LCP", "PEEK", "PEI", "PES", "PCT", "PPS", "PSU"],
        "rules": {
            "thermocouple_type": ["K"],
            "nozzle_heater": ["MCM", "MCT"],
            "main_nozzle_material": ["FS136"],
        }
    },
    # 腐蚀性材料
    "腐蚀性材料": {
        "materials": ["POM", "POM+25FV", "PVC", "HPVC"],
        "rules": {
            "main_nozzle_material": ["FS136"],
            "tip_coating": ["Ni", "DLC"],
        }
    },
    # 透明材料
    "透明材料": {
        "materials": ["PMMA", "PC", "PC+ABS", "PETG", "PCTG", "FEP"],
        "rules": {
            "tip_material": ["铍铜"],
            "balance_requirement": ["严格"],
        }
    },
}


# ==================== 选型引擎 ====================

class SelectionEngine:
    """选型决策引擎"""
    
    def recommend(self, ctx: SelectionContext) -> SelectionResult:
        """执行选型推荐"""
        result = SelectionResult()
        
        # 1. 推荐材料
        self._recommend_material(ctx, result)
        
        # 2. 推荐热流道
        self._recommend_hotrunner(ctx, result)
        
        # 3. 推荐组件
        self._recommend_components(ctx, result)
        
        # 4. 检测冲突
        self._detect_conflicts(ctx, result)
        
        # 5. 生成备注
        self._generate_notes(ctx, result)
        
        return result
    
    def _recommend_material(self, ctx: SelectionContext, result: SelectionResult):
        """推荐材料"""
        if ctx.material:
            # 已选定材料
            result.materials = [ctx.material]
            
            # 检查是否符合应用领域
            if ctx.application_field:
                recommended = APP_MATERIAL_MAP.get(ctx.application_field, [])
                if recommended and ctx.material not in recommended:
                    result.warnings.append(
                        f"材料 {ctx.material} 不是 {ctx.application_field} 领域的常用材料，建议选择: {', '.join(recommended[:3])}"
                    )
        else:
            # 根据应用领域推荐
            if ctx.application_field:
                result.materials = APP_MATERIAL_MAP.get(ctx.application_field, [])
                result.notes.append(f"根据应用领域 {ctx.application_field} 推荐材料")
    
    def _recommend_hotrunner(self, ctx: SelectionContext, result: SelectionResult):
        """推荐热流道类型"""
        hotrunner_types = []
        
        # 根据精度
        if ctx.precision_level:
            rule = PRECISION_HOTRUNNER_MAP.get(ctx.precision_level)
            if rule:
                hotrunner_types.extend(rule["recommend"])
                result.recommendations.append(Recommendation(
                    field_name="balance_requirement",
                    field_label="平衡性要求",
                    recommended_values=[rule["balance"]],
                    reason=f"基于{ctx.precision_level}要求"
                ))
        
        # 根据换色需求
        if ctx.color_change_required or ctx.color == "换色":
            hotrunner_types = [t for t in hotrunner_types if "针阀" in t] if hotrunner_types else ["单点针阀", "含分流板的针阀式"]
            result.notes.append("换色需求推荐针阀式热流道")
        
        # 根据模具类型
        if ctx.mold_type == "双色":
            hotrunner_types = ["含分流板的开放式", "含分流板的针阀式"]
            result.notes.append("双色模具需要分流板系统")
        
        if hotrunner_types:
            result.hotrunner_types = list(set(hotrunner_types))
    
    def _recommend_components(self, ctx: SelectionContext, result: SelectionResult):
        """推荐组件配置"""
        # 外观要求 → 热咀结构
        if ctx.surface_finish:
            rule = SURFACE_NOZZLE_MAP.get(ctx.surface_finish)
            if rule:
                result.recommendations.append(Recommendation(
                    field_name="nozzle_structure",
                    field_label="热咀结构",
                    recommended_values=rule["recommend"],
                    reason=f"基于外观要求: {ctx.surface_finish}"
                ))
                if rule.get("exclude"):
                    result.warnings.append(f"外观要求 {ctx.surface_finish} 不建议使用: {', '.join(rule['exclude'])}")
        
        # 生产批量 → 材质
        if ctx.production_batch:
            rule = BATCH_MATERIAL_MAP.get(ctx.production_batch)
            if rule:
                result.recommendations.append(Recommendation(
                    field_name="main_nozzle_material",
                    field_label="主射咀材质",
                    recommended_values=rule["main_nozzle_material"],
                    reason=f"基于生产批量: {ctx.production_batch}"
                ))
                result.recommendations.append(Recommendation(
                    field_name="tip_material",
                    field_label="咀芯材质",
                    recommended_values=rule["tip_material"],
                    reason=f"基于生产批量: {ctx.production_batch}"
                ))
        
        # 壁厚 → 参数
        if ctx.wall_thickness:
            rule = WALL_THICKNESS_MAP.get(ctx.wall_thickness)
            if rule:
                if rule.get("gate_diameter_min"):
                    result.recommendations.append(Recommendation(
                        field_name="gate_diameter",
                        field_label="胶口直径",
                        recommended_values=[f"≥{rule['gate_diameter_min']}mm"],
                        reason=f"基于壁厚: {ctx.wall_thickness}"
                    ))
                if rule.get("tip_material"):
                    result.recommendations.append(Recommendation(
                        field_name="tip_material",
                        field_label="咀芯材质",
                        recommended_values=rule["tip_material"],
                        reason=f"基于壁厚: {ctx.wall_thickness}"
                    ))
        
        # 材料特殊规则
        if ctx.material:
            for category, rule in MATERIAL_SPECIAL_RULES.items():
                if ctx.material in rule["materials"]:
                    for field, values in rule["rules"].items():
                        result.recommendations.append(Recommendation(
                            field_name=field,
                            field_label=field,
                            recommended_values=values,
                            reason=f"材料 {ctx.material} 属于{category}"
                        ))
        
        # 医疗级
        if ctx.medical_grade:
            result.recommendations.append(Recommendation(
                field_name="tip_coating",
                field_label="咀芯镀层",
                recommended_values=["Ni", "DLC"],
                reason="医疗级产品需要无毒镀层"
            ))
    
    def _detect_conflicts(self, ctx: SelectionContext, result: SelectionResult):
        """检测冲突"""
        # 针阀式必须有驱动
        if ctx.color_change_required or ctx.color == "换色":
            if ctx.mold_type != "双色":
                for hr in result.hotrunner_types:
                    if "针阀" in hr:
                        result.notes.append("针阀式热流道需要配置驱动器(气动或油压)")
        
        # 双色模检查
        if ctx.mold_type == "双色":
            result.notes.append("双色模具必须使用分流板系统")
        
        # 高温材料检查
        high_temp = ["FEP", "LCP", "PEEK", "PEI", "PES", "PCT", "PPS", "PSU"]
        if ctx.material in high_temp:
            result.notes.append(f"{ctx.material}是高温材料，需要K型感温线和大功率加热器")
    
    def _generate_notes(self, ctx: SelectionContext, result: SelectionResult):
        """生成备注"""
        if not ctx.application_field and not ctx.material:
            result.notes.append("建议先确定应用领域或材料，以获得更精准的推荐")
        
        if not ctx.production_batch:
            result.notes.append("生产批量影响材质选择，建议填写")
        
        if not ctx.surface_finish:
            result.notes.append("外观要求影响热咀结构选择，建议填写")


# ==================== 便捷函数 ====================

def quick_select(
    application_field: str = None,
    material: str = None,
    surface_finish: str = None,
    precision_level: str = None,
    production_batch: str = None,
    wall_thickness: str = None,
    color: str = None,
    mold_type: str = None,
    **kwargs
) -> SelectionResult:
    """快速选型"""
    ctx = SelectionContext(
        application_field=application_field,
        material=material,
        surface_finish=surface_finish,
        precision_level=precision_level,
        production_batch=production_batch,
        wall_thickness=wall_thickness,
        color=color,
        mold_type=mold_type,
        **kwargs
    )
    engine = SelectionEngine()
    return engine.recommend(ctx)


def print_result(result: SelectionResult):
    """打印结果"""
    print("=" * 60)
    print("【选型推荐结果】")
    print("=" * 60)
    
    if result.materials:
        print(f"\n📦 推荐材料: {', '.join(result.materials)}")
    
    if result.hotrunner_types:
        print(f"\n🔥 推荐热流道类型: {', '.join(result.hotrunner_types)}")
    
    if result.recommendations:
        print("\n⚙️ 组件推荐:")
        for rec in result.recommendations:
            values = ', '.join(str(v) for v in rec.recommended_values[:5])
            print(f"  - {rec.field_label}: {values}")
            print(f"    原因: {rec.reason}")
    
    if result.warnings:
        print("\n⚠️ 警告:")
        for w in result.warnings:
            print(f"  - {w}")
    
    if result.notes:
        print("\n📝 备注:")
        for n in result.notes:
            print(f"  - {n}")


if __name__ == "__main__":
    # 示例1: 汽车保险杠
    print("\n示例1: 汽车保险杠选型")
    result = quick_select(
        application_field="汽车",
        surface_finish="晒纹",
        precision_level="常规件（公差±0.1mm）",
        production_batch="大批量（≥10万模次）",
        wall_thickness="常规件（1-3mm）"
    )
    print_result(result)
    
    # 示例2: 医疗透明件
    print("\n\n示例2: 医疗透明件选型")
    result = quick_select(
        application_field="医疗",
        surface_finish="高亮",
        color="透明",
        precision_level="精密件（公差±0.02mm）",
        production_batch="中批量（1万-10万模次）",
        medical_grade=True
    )
    print_result(result)
