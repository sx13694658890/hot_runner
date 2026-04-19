"""
模具选型关联规则模型
===================
定义各参数之间的约束关系和推荐规则
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, Set
from enum import Enum
import json


# ==================== 材料分类 ====================

# 高温材料（熔融温度 > 300℃）
HIGH_TEMP_MATERIALS = {"FEP", "LCP", "PEEK", "PEI", "PES", "PCT", "PPS", "PSU"}

# 腐蚀性材料
CORROSIVE_MATERIALS = {"POM", "POM+25FV", "PVC", "HPVC"}

# 高吸湿材料（吸湿性 > 0.3%）
HIGH_MOISTURE_MATERIALS = {"PA6", "PA66", "PA46", "PET", "ABS", "ASA", "PC", "PMMA"}

# 低粘度材料
LOW_VISCOSITY_MATERIALS = {"EVA", "FEP", "HDPE", "LDPE", "PP", "POM", "SEBS", "TPE"}

# 高粘度材料
HIGH_VISCOSITY_MATERIALS = {"PC", "PMMA", "PEEK", "PEI", "PES", "PSU"}

# 透明材料
TRANSPARENT_MATERIALS = {"PMMA", "PC", "PC+ABS", "PETG", "PCTG", "CAB", "FEP"}


# ==================== 关联规则定义 ====================

MATERIAL_RULES: Dict[str, Dict[str, Any]] = {
    "高温材料": {
        "materials": list(HIGH_TEMP_MATERIALS),
        "rules": {
            "main_nozzle_material": ["FS136"],
            "manifold_material": ["FS136", "SKD61"],
            "tip_material": ["钨铜", "钼合金"],
            "nozzle_heater": ["MCM", "MCT"],
            "thermocouple_type": ["K"],
        },
        "exclusions": {
            "nozzle_heater": ["EPM"],
        },
        "reason": "高温材料(>300℃)需要耐高温组件"
    },
    
    "腐蚀性材料": {
        "materials": list(CORROSIVE_MATERIALS),
        "rules": {
            "main_nozzle_material": ["FS136"],
            "manifold_material": ["FS136"],
            "tip_material": ["铍铜", "钼合金"],
            "tip_coating": ["Ni", "Ni+Cr", "DLC"],
            "valve_pin_coating": ["DLC", "CrN+DLC"],
        },
        "exclusions": {
            "tip_coating": ["Cr"],
        },
        "reason": "腐蚀性材料会腐蚀普通钢材"
    },
    
    "高吸湿材料": {
        "materials": list(HIGH_MOISTURE_MATERIALS),
        "rules": {
            "pre_drying": True,
            "drying_temp": "80~120℃",
            "drying_time": "2~6h",
            "resin_retention_cycles": ["1<X<3"],
        },
        "reason": "高吸湿材料需充分干燥"
    },
    
    "低粘度材料": {
        "materials": list(LOW_VISCOSITY_MATERIALS),
        "rules": {
            "hot_runner_type": ["单点针阀", "含分流板的针阀式"],
            "gate_diameter_min": 1.5,
            "nozzle_structure": ["TLS", "TAC", "TLC"],
        },
        "reason": "低粘度材料易流涎，推荐针阀式"
    },
    
    "高粘度材料": {
        "materials": list(HIGH_VISCOSITY_MATERIALS),
        "rules": {
            "runner_diameter_min": 8.0,
            "gate_diameter_min": 2.0,
            "injection_pressure": "100~180MPa",
            "nozzle_heater": ["MCM", "MCT"],
        },
        "reason": "高粘度材料流动困难，需要大流道"
    },
    
    "透明材料": {
        "materials": list(TRANSPARENT_MATERIALS),
        "rules": {
            "surface_finish": ["高亮"],
            "tip_material": ["铍铜"],
            "gate_diameter_max": 2.0,
            "balance_requirement": ["严格"],
        },
        "reason": "透明材料对外观要求高"
    }
}


PRODUCT_RULES: Dict[str, Dict[str, Any]] = {
    "外观要求_高亮": {
        "condition": {"surface_finish": "高亮"},
        "rules": {
            "nozzle_structure": ["OA", "PLT", "SOE"],
        },
        "exclusions": {
            "nozzle_structure": ["SLT", "TOE", "TLS"],
        },
        "reason": "高亮产品需要开放式热咀，避免浇口痕迹"
    },
    
    "精度_精密件": {
        "condition": {"precision_level": "精密件（公差±0.02mm）"},
        "rules": {
            "hot_runner_type": ["含分流板的针阀式", "单点针阀"],
            "balance_requirement": ["严格"],
            "valve_pin_style": ["T"],
        },
        "exclusions": {
            "hot_runner_type": ["单咀"],
        },
        "reason": "精密件需要精确控制注射"
    },
    
    "壁厚_薄壁": {
        "condition": {"wall_thickness": "薄壁件（＜1mm）"},
        "rules": {
            "injection_pressure": "高",
            "gate_diameter_min": 1.0,
            "tip_material": ["铍铜"],
            "nozzle_heater": ["MCM", "MCT"],
        },
        "reason": "薄壁件需要高注射压力和快速充填"
    },
    
    "壁厚_厚壁": {
        "condition": {"wall_thickness": "厚壁件（＞3mm）"},
        "rules": {
            "gate_diameter_min": 2.5,
            "cooling_medium": ["冰水"],
        },
        "reason": "厚壁件需要充分冷却"
    },
    
    "批量_大批量": {
        "condition": {"production_batch": "大批量（≥10万模次）"},
        "rules": {
            "main_nozzle_material": ["FS136"],
            "manifold_material": ["FS136"],
            "tip_material": ["钨铜", "钼合金"],
            "valve_pin_coating": ["DLC", "TiAlN", "CrN+DLC"],
        },
        "reason": "大批量生产需要高耐磨材质"
    },
    
    "颜色_换色": {
        "condition": {"color": "换色"},
        "rules": {
            "hot_runner_type": ["单点针阀", "含分流板的针阀式"],
            "resin_retention_cycles": ["X<1", "1<X<3"],
        },
        "exclusions": {
            "hot_runner_type": ["单咀", "含分流板的开放式"],
        },
        "reason": "换色需要针阀式热流道便于清洗"
    },
    
    "应用_医疗": {
        "condition": {"application_field": "医疗"},
        "rules": {
            "material_certification": ["FDA", "ISO10993"],
            "tip_coating": ["Ni", "DLC"],
        },
        "reason": "医疗级产品需要认证和无毒镀层"
    }
}


HOTRUNNER_RULES: Dict[str, Dict[str, Any]] = {
    "针阀式必须有驱动": {
        "condition": {"hot_runner_type": ["单点针阀", "含分流板的针阀式"]},
        "requires": {"driver_type": ["气动", "油压"]},
        "reason": "针阀式热流道必须配置驱动器"
    },
    
    "双色模必须有分流板": {
        "condition": {"mold_type": ["双色"]},
        "requires": {"hot_runner_type": ["含分流板的开放式", "含分流板的针阀式"]},
        "exclusions": {"hot_runner_type": ["单咀", "单点针阀"]},
        "reason": "双色模具必须使用分流板系统"
    }
}


# ==================== 规则引擎 ====================

class RuleEngine:
    """关联规则引擎"""
    
    def __init__(self):
        self.material_rules = MATERIAL_RULES
        self.product_rules = PRODUCT_RULES
        self.hotrunner_rules = HOTRUNNER_RULES
    
    def get_material_categories(self, material: str) -> List[str]:
        """获取材料所属分类"""
        categories = []
        if material in HIGH_TEMP_MATERIALS:
            categories.append("高温材料")
        if material in CORROSIVE_MATERIALS:
            categories.append("腐蚀性材料")
        if material in HIGH_MOISTURE_MATERIALS:
            categories.append("高吸湿材料")
        if material in LOW_VISCOSITY_MATERIALS:
            categories.append("低粘度材料")
        if material in HIGH_VISCOSITY_MATERIALS:
            categories.append("高粘度材料")
        if material in TRANSPARENT_MATERIALS:
            categories.append("透明材料")
        return categories
    
    def get_recommendations(self, 
                           material: str = None,
                           surface_finish: str = None,
                           precision_level: str = None,
                           wall_thickness: str = None,
                           production_batch: str = None,
                           color: str = None,
                           application_field: str = None,
                           mold_type: str = None,
                           hot_runner_type: str = None) -> Dict[str, Any]:
        """获取推荐配置"""
        recommendations = {}
        exclusions = {}
        reasons = []
        
        # 材料规则
        if material:
            categories = self.get_material_categories(material)
            for category in categories:
                rule = self.material_rules.get(category, {})
                for key, value in rule.get("rules", {}).items():
                    if key not in recommendations:
                        recommendations[key] = []
                    if isinstance(value, list):
                        recommendations[key].extend(value)
                    else:
                        recommendations[key].append(value)
                for key, value in rule.get("exclusions", {}).items():
                    if key not in exclusions:
                        exclusions[key] = []
                    exclusions[key].extend(value)
                if rule.get("reason"):
                    reasons.append(f"[{category}] {rule['reason']}")
        
        # 产品规则
        product_inputs = {
            "surface_finish": surface_finish,
            "precision_level": precision_level,
            "wall_thickness": wall_thickness,
            "production_batch": production_batch,
            "color": color,
            "application_field": application_field,
        }
        
        for rule_name, rule in self.product_rules.items():
            condition = rule.get("condition", {})
            matched = any(
                product_inputs.get(k) == v or (isinstance(v, list) and product_inputs.get(k) in v)
                for k, v in condition.items()
            )
            if matched:
                for key, value in rule.get("rules", {}).items():
                    if key not in recommendations:
                        recommendations[key] = []
                    if isinstance(value, list):
                        recommendations[key].extend(value)
                    else:
                        recommendations[key].append(value)
                for key, value in rule.get("exclusions", {}).items():
                    if key not in exclusions:
                        exclusions[key] = []
                    exclusions[key].extend(value)
                if rule.get("reason"):
                    reasons.append(f"[{rule_name}] {rule['reason']}")
        
        # 去重
        for key in recommendations:
            recommendations[key] = list(set(recommendations[key])) if isinstance(recommendations[key], list) else recommendations[key]
        for key in exclusions:
            exclusions[key] = list(set(exclusions[key])) if isinstance(exclusions[key], list) else exclusions[key]
        
        return {
            "recommendations": recommendations,
            "exclusions": exclusions,
            "reasons": reasons
        }
    
    def validate(self, 
                 material: str = None,
                 hot_runner_type: str = None,
                 mold_type: str = None,
                 driver_type: str = None,
                 **kwargs) -> List[Dict[str, Any]]:
        """验证约束，返回冲突列表"""
        conflicts = []
        
        # 针阀式必须有驱动
        if hot_runner_type in ["单点针阀", "含分流板的针阀式"]:
            if not driver_type:
                conflicts.append({
                    "rule": "针阀式必须有驱动",
                    "error": "针阀式热流道必须配置驱动器(气动或油压)",
                    "suggestion": "请选择驱动器类型"
                })
        
        # 双色模必须有分流板
        if mold_type == "双色":
            if hot_runner_type in ["单咀", "单点针阀"]:
                conflicts.append({
                    "rule": "双色模必须有分流板",
                    "error": "双色模具必须使用分流板系统",
                    "suggestion": "请选择: 含分流板的开放式 或 含分流板的针阀式"
                })
        
        # 高温材料检查
        if material in HIGH_TEMP_MATERIALS:
            thermocouple_type = kwargs.get("thermocouple_type")
            if thermocouple_type == "J":
                conflicts.append({
                    "rule": "高温材料必须用K型感温线",
                    "error": f"{material}是高温材料，必须使用K型感温线",
                    "suggestion": "请将感温线型号改为K型"
                })
        
        # 腐蚀性材料检查
        if material in CORROSIVE_MATERIALS:
            main_nozzle_material = kwargs.get("main_nozzle_material")
            if main_nozzle_material == "4CR13":
                conflicts.append({
                    "rule": "腐蚀性材料必须用FS136",
                    "error": f"{material}是腐蚀性材料，主射咀材质必须用FS136",
                    "suggestion": "请将主射咀材质改为FS136"
                })
        
        return conflicts


# ==================== 便捷函数 ====================

def get_engine() -> RuleEngine:
    """获取规则引擎"""
    return RuleEngine()


if __name__ == "__main__":
    engine = get_engine()
    
    # 示例1: PEEK材料推荐
    print("=" * 50)
    print("PEEK材料推荐配置:")
    result = engine.get_recommendations(material="PEEK")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    
    # 示例2: 高亮+精密件推荐
    print("\n" + "=" * 50)
    print("高亮+精密件推荐配置:")
    result = engine.get_recommendations(
        surface_finish="高亮",
        precision_level="精密件（公差±0.02mm）"
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))
    
    # 示例3: 约束验证
    print("\n" + "=" * 50)
    print("约束验证(PEEK+J型感温线):")
    conflicts = engine.validate(
        material="PEEK",
        hot_runner_type="含分流板的针阀式",
        driver_type="气动",
        thermocouple_type="J"
    )
    print(json.dumps(conflicts, ensure_ascii=False, indent=2))
