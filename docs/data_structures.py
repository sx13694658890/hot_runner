"""
模具选型数据结构模型
===================
基于文本内容生成的完整数据结构定义
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime
import json


# ==================== 枚举定义 ====================

# 模具相关枚举
class MoldStatus(str, Enum):
    """模具状态"""
    NEW = "新模"
    REFURBISH = "旧模改制"


class MoldType(str, Enum):
    """模具类型"""
    SINGLE_COLOR = "单色"
    DUAL_COLOR = "双色"
    STACK = "叠模"


class LocatingRingEccentric(str, Enum):
    """定位环偏心"""
    ALLOWED = "允许"
    NOT_ALLOWED = "不允许"


class OrderRequirement(str, Enum):
    """订单需求"""
    SCHEME = "方案"
    MOLD_FLOW = "模流"
    SCHEME_AND_FLOW = "方案+模流"


class HotRunnerType(str, Enum):
    """热流道类型"""
    SINGLE_NOZZLE = "单咀"
    SINGLE_PIN_VALVE = "单点针阀"
    OPEN_WITH_MANIFOLD = "含分流板的开放式"
    PIN_VALVE_WITH_MANIFOLD = "含分流板的针阀式"


class PointNumberingRule(str, Enum):
    """点位编号规则"""
    CUSTOMER_SPECIFIED = "客户指定"
    COMPANY_STANDARD = "我司标准"


class DriverType(str, Enum):
    """驱动器"""
    PNEUMATIC = "气动"
    HYDRAULIC = "油压"


class SolenoidValve(str, Enum):
    """电磁阀"""
    PNEUMATIC_VALVE = "气动电磁阀"
    HYDRAULIC_VALVE = "油动电磁阀"
    NO_VALVE = "不要电磁阀"


class SolenoidValvePosition(str, Enum):
    """电磁阀位置"""
    OPERATOR_SIDE = "操作侧"
    NON_OPERATOR_SIDE = "非操作侧"
    TOP_SIDE = "天侧"
    BOTTOM_SIDE = "地侧"


class GateSystemDesc(str, Enum):
    """进胶系统描述"""
    NORMAL = "正灌"
    REVERSE = "倒灌"
    NORMAL_DIRECTION = "法向"


class BalanceRequirement(str, Enum):
    """平衡性要求"""
    STRICT = "严格"
    NORMAL = "一般"
    NONE = "无"


class RunnerPlateStyle(str, Enum):
    """流道板样式"""
    IRON_BELOW = "整块板下面留铁"
    THROUGH_FRAME = "通框"
    SPLICED = "拼接块"


class CoolingMedium(str, Enum):
    """模具冷却介质"""
    NORMAL_WATER = "常温水"
    ICE_WATER = "冰水"
    OIL = "油"


class CustomerEquipmentStatus(str, Enum):
    """客户设备状态"""
    HAVE = "有"
    NOT_HAVE = "没有"
    NEED_PROVIDE = "需要我司提供"


class SocketType(str, Enum):
    """插座类型"""
    MALE = "公插"
    FEMALE = "母插"
    MALE_FEMALE = "公母插合用"


class SocketPinCount(str, Enum):
    """插座芯数"""
    PIN_24 = "24"
    PIN_16 = "16"


class ThermocoupleType(str, Enum):
    """感温线型号"""
    J_TYPE = "J"
    K_TYPE = "K"


# 产品相关枚举
class ApplicationField(str, Enum):
    """应用领域"""
    AUTOMOTIVE = "汽车"
    HOME_APPLIANCE = "家电"
    MEDICAL = "医疗"
    DAILY_CHEMICAL = "日化"
    COSMETICS = "美妆"


class WallThickness(str, Enum):
    """平均肉厚"""
    THICK = "厚壁件（＞3mm）"
    NORMAL = "常规件（1-3mm）"
    THIN = "薄壁件（＜1mm）"


class ColorType(str, Enum):
    """颜色"""
    BLACK = "黑色"
    WHITE = "白色"
    TRANSPARENT = "透明"
    LIGHT = "浅色"
    COLOR_CHANGE = "换色"


class SurfaceFinish(str, Enum):
    """外观要求"""
    HIGH_GLOSS = "高亮"
    TEXTURE = "晒纹"
    LEATHER_GRAIN = "皮纹"
    FINE_LEATHER = "细皮纹"
    THICK_FLOCKING = "厚植绒"
    THIN_FLOCKING = "薄植绒"
    COLOR_CHANGE = "换色"
    GENERAL = "一般"


class PrecisionLevel(str, Enum):
    """尺寸精度控制"""
    PRECISION = "精密件（公差±0.02mm）"
    NORMAL = "常规件（公差±0.1mm）"


class MechanicalRequirement(str, Enum):
    """力学性能要求"""
    LOAD_BEARING = "承载件"
    HIGH_TEMP = "耐高温"


class EfficiencyRequirement(str, Enum):
    """生产效率要求"""
    FAST = "快速"
    NORMAL = "一般"


class ProductionBatch(str, Enum):
    """生产批量"""
    LARGE = "大批量（≥10万模次）"
    MEDIUM = "中批量（1万-10万模次）"
    SMALL = "小批量（＜1万模次）"


# 热流道系统相关枚举
class ResinRetentionCycles(str, Enum):
    """系统存胶模数"""
    LESS_THAN_1 = "X<1"
    BETWEEN_1_AND_3 = "1<X<3"
    GREATER_THAN_3 = "3<X"


class MainNozzleMaterial(str, Enum):
    """主射咀/热咀本体材质"""
    FS136 = "FS136"
    CR4 = "4CR13"


class MainNozzleHeater(str, Enum):
    """主射咀加热器"""
    EPM = "EPM"
    GPM = "GPM"
    MCM = "MCM"


class ManifoldMaterial(str, Enum):
    """分流板材质"""
    FS136 = "FS136"
    CR4 = "4CR13"
    SKD61 = "SKD61"
    DC53 = "DC53"
    P20 = "P20"


class ManifoldInterface(str, Enum):
    """分流板&热咀对接方式"""
    M_TYPE = "M"
    OBLIQUE_HOLE = "平压斜孔"
    T_TYPE = "T"


class ManifoldPlug(str, Enum):
    """分流板堵头"""
    BALA = "BALA"
    BALA_INSERT = "镶件+BALA"
    STANDARD = "常规"


class NozzleStructure(str, Enum):
    """热咀结构"""
    SLT = "SLT"
    TOE = "TOE"
    SOE = "SOE"
    TLS = "TLS"
    OA = "OA"
    PLT = "PLT"
    PLS = "PLS"
    SAC = "SAC"
    SLC = "SLC"
    TAC = "TAC"
    TLC = "TLC"
    SCC = "SCC"
    CC = "CC"
    CCH = "CCH"
    CA = "CA"
    CT = "CT"
    CTC = "CTC"
    CS = "CS"
    EVV = "EVV"
    SVV = "SVV"
    VV = "VV"
    VA = "VA"
    STVA = "STVA"
    STVL = "STVL"
    TVA = "TVA"
    TVL = "TVL"
    TVAP = "TVAP"


class NozzleHeater(str, Enum):
    """热咀加热器"""
    EPM = "EPM"
    EPT = "EPT"
    GPM = "GPM"
    GPT = "GPT"
    MCM = "MCM"
    MCT = "MCT"


class TipMaterial(str, Enum):
    """咀芯材质"""
    SKD61 = "SKD61"
    BERYLLIUM_COPPER = "铍铜"
    ALUMINUM_ALLOY = "铝合金"
    TUNGSTEN_COPPER = "钨铜"
    DC53 = "DC53"


class TipCoating(str, Enum):
    """咀芯涂层"""
    CR = "Cr"
    NI = "Ni"
    TI = "Ti"
    NI_CR = "Ni+Cr"


class CapMaterial(str, Enum):
    """咀帽材质"""
    SKD61 = "SKD61"
    TITANIUM_ALLOY = "钛合金"
    CR12MOV = "Cr12MoV"


class InsulatorMaterial(str, Enum):
    """隔热帽材质"""
    PI = "PI"
    PEEK = "PEEK"
    TITANIUM_ALLOY = "钛合金"


class ValvePinStyle(str, Enum):
    """阀针样式"""
    S_TYPE = "S"
    T_TYPE = "T"


class ValvePinMaterial(str, Enum):
    """阀针材质"""
    SKD61 = "SKD61"
    SKH51 = "SKH51"


class ValvePinCoating(str, Enum):
    """阀针镀层工艺"""
    TIN = "TiN"
    CRN = "CrN"
    ZRN = "ZrN"
    DLC = "DLC"
    TIALN = "TiAlN"
    CRALN = "CrAlN"
    TIN_DLC = "TiN+DLC"
    TISIN = "TiSiN"
    CRN_DLC = "CrN+DLC"


# 材料相关枚举
class Crystallinity(str, Enum):
    """结晶度"""
    AMORPHOUS = "非晶"
    HIGH_CRYSTALLINE = "高结晶"
    SEMI_CRYSTALLINE = "半结晶"


class Viscosity(str, Enum):
    """粘度"""
    VERY_LOW = "极低"
    LOW = "低"
    MEDIUM = "中"
    MEDIUM_HIGH = "中高"
    HIGH = "高"


class MetalCorrosion(str, Enum):
    """对金属腐蚀性"""
    NONE = "无"
    WEAK = "弱"
    MODERATE = "较强"
    STRONG = "强"


# ==================== 数据类定义 ====================

@dataclass
class MoldInfo:
    """模具信息"""
    # 基本信息
    manufacturer: Optional[str] = None              # 模具制造商
    manager: Optional[str] = None                   # 负责人
    manager_phone: Optional[str] = None             # 负责人电话
    mold_id: Optional[str] = None                   # 模具编号
    hot_runner_id: Optional[str] = None             # 热流道系统编号
    nozzle_count: Optional[int] = None              # 热咀数量
    cavity_count: Optional[int] = None              # 产品腔数
    
    # 选型选项
    mold_status: Optional[MoldStatus] = None
    mold_type: Optional[MoldType] = None
    locating_ring_eccentric: Optional[LocatingRingEccentric] = None
    order_requirement: Optional[OrderRequirement] = None
    hot_runner_type: Optional[HotRunnerType] = None
    point_numbering_rule: Optional[PointNumberingRule] = None
    driver_type: Optional[DriverType] = None
    solenoid_valve: Optional[SolenoidValve] = None
    solenoid_valve_position: Optional[SolenoidValvePosition] = None
    gate_system_desc: Optional[GateSystemDesc] = None
    
    # 技术参数
    mold_core_eject: Optional[bool] = None          # 模仁是否需要弹开
    balance_requirement: Optional[BalanceRequirement] = None
    plate_thickness_adjustable: Optional[bool] = None
    runner_plate_style: Optional[RunnerPlateStyle] = None
    wire_frame_needed: Optional[bool] = None        # 线架
    solenoid_valve_socket: Optional[str] = None     # 电磁阀插座型号
    signal_wiring_method: Optional[str] = None      # 信号线接线方式
    
    # 冷却与温控
    cooling_medium: Optional[CoolingMedium] = None
    water_oil_connector_position: Optional[str] = None
    has_mold_temp_controller: Optional[bool] = None
    has_temp_controller: Optional[CustomerEquipmentStatus] = None
    has_sequence_controller: Optional[CustomerEquipmentStatus] = None
    has_booster_pump: Optional[CustomerEquipmentStatus] = None
    has_multiple_oil_pumps: Optional[CustomerEquipmentStatus] = None
    
    # 接线配置
    junction_box_position: Optional[str] = None
    socket_type: Optional[SocketType] = None
    socket_pin_count: Optional[int] = None
    thermocouple_type: Optional[ThermocoupleType] = None
    delivery_wiring_method: Optional[str] = None
    debug_wiring_method: Optional[str] = None
    
    # 注塑机参数
    injection_machine_model: Optional[str] = None
    injection_machine_tonnage: Optional[int] = None
    barrel_sphere_radius: Optional[float] = None
    barrel_orifice: Optional[float] = None


@dataclass
class ProductInfo:
    """产品信息"""
    product_name: Optional[str] = None
    application_field: Optional[ApplicationField] = None
    weight: Optional[float] = None                  # 重量(g)
    wall_thickness: Optional[WallThickness] = None
    color: Optional[ColorType] = None
    surface_finish: Optional[SurfaceFinish] = None
    precision_level: Optional[PrecisionLevel] = None
    mechanical_requirement: Optional[MechanicalRequirement] = None
    efficiency_requirement: Optional[EfficiencyRequirement] = None
    production_batch: Optional[ProductionBatch] = None


@dataclass
class MaterialProperties:
    """材料属性"""
    mold_temp: str                                  # 模温℃
    melt_temp: str                                  # 熔融温度℃
    degradation_temp: str                           # 降解温度℃
    molding_window: int                             # 成型窗口 δ℃
    ejection_temp: str                              # 顶出温度℃
    crystallinity: Crystallinity                    # 结晶度
    moisture_absorption: str                        # 吸湿性 24h，%
    viscosity: Viscosity                            # 粘度 Pa・s
    metal_corrosion: MetalCorrosion                 # 对金属腐蚀性
    injection_pressure: str                         # 参考注射压力Mpa
    residence_time: str                             # 存料时间min


@dataclass
class Material:
    """材料信息"""
    abbreviation: str                               # 塑料名称缩写
    properties: MaterialProperties


@dataclass
class MainNozzleConfig:
    """主射咀配置"""
    heating: Optional[bool] = None
    material: Optional[MainNozzleMaterial] = None
    heater: Optional[MainNozzleHeater] = None


@dataclass
class ManifoldConfig:
    """分流板配置"""
    bridging: Optional[bool] = None
    material: Optional[ManifoldMaterial] = None
    runner_diameter: Optional[float] = None         # 5.0/6.0/8.0/10/15/22
    nozzle_interface: Optional[ManifoldInterface] = None
    calculate_expansion: Optional[bool] = None
    plug_type: Optional[ManifoldPlug] = None
    runner_diagram: Optional[str] = None            # 默认/按模流分析报告


@dataclass
class NozzleConfig:
    """热咀配置"""
    structure: Optional[NozzleStructure] = None
    heater: Optional[NozzleHeater] = None
    gate_diameter: Optional[float] = None           # 1.0-7.0
    tip_material: Optional[TipMaterial] = None
    tip_coating: Optional[TipCoating] = None
    cap_material: Optional[CapMaterial] = None
    insulator_material: Optional[InsulatorMaterial] = None


@dataclass
class ValvePinConfig:
    """阀针配置"""
    style: Optional[ValvePinStyle] = None
    material: Optional[ValvePinMaterial] = None
    coating: Optional[ValvePinCoating] = None


@dataclass
class HotRunnerSystem:
    """热流道系统"""
    resin_retention_cycles: Optional[ResinRetentionCycles] = None
    main_nozzle: MainNozzleConfig = field(default_factory=MainNozzleConfig)
    manifold: ManifoldConfig = field(default_factory=ManifoldConfig)
    nozzle: NozzleConfig = field(default_factory=NozzleConfig)
    valve_pin: ValvePinConfig = field(default_factory=ValvePinConfig)


@dataclass
class MoldSelectionProject:
    """模具选型项目"""
    project_id: Optional[str] = None
    project_name: Optional[str] = None
    create_time: Optional[datetime] = None
    
    mold_info: MoldInfo = field(default_factory=MoldInfo)
    product_info: ProductInfo = field(default_factory=ProductInfo)
    material: Optional[Material] = None
    hot_runner: HotRunnerSystem = field(default_factory=HotRunnerSystem)
    
    def to_json(self) -> str:
        """转换为JSON"""
        def serializer(obj):
            if isinstance(obj, datetime):
                return obj.isoformat()
            elif isinstance(obj, Enum):
                return obj.value
            elif hasattr(obj, '__dataclass_fields__'):
                return {k: v for k, v in obj.__dict__.items() if v is not None}
            return str(obj)
        return json.dumps(self, default=serializer, ensure_ascii=False, indent=2)


# ==================== 43种材料数据 ====================

MATERIALS_DATA: Dict[str, MaterialProperties] = {
    "ABS": MaterialProperties("40~80", "220~260", ">270", 40, "70~90", Crystallinity.AMORPHOUS, "0.2~0.4", Viscosity.MEDIUM_HIGH, MetalCorrosion.NONE, "80~140", "3~6"),
    "ASA": MaterialProperties("50~90", "230~270", ">280", 40, "80~100", Crystallinity.AMORPHOUS, "0.2~0.4", Viscosity.MEDIUM_HIGH, MetalCorrosion.NONE, "90~150", "3~6"),
    "CAB": MaterialProperties("20~60", "200~230", ">240", 30, "40~60", Crystallinity.AMORPHOUS, "<0.2", Viscosity.MEDIUM, MetalCorrosion.NONE, "70~120", "2~4"),
    "EVA": MaterialProperties("10~40", "160~190", ">200", 30, "30~50", Crystallinity.HIGH_CRYSTALLINE, "<0.1", Viscosity.LOW, MetalCorrosion.NONE, "60~100", "2~4"),
    "FEP": MaterialProperties("150~200", "320~380", ">400", 60, "180~200", Crystallinity.HIGH_CRYSTALLINE, "<0.01", Viscosity.LOW, MetalCorrosion.NONE, "60~100", "长期"),
    "HDPE": MaterialProperties("20~60", "180~220", ">280", 40, "50~70", Crystallinity.HIGH_CRYSTALLINE, "<0.01", Viscosity.LOW, MetalCorrosion.NONE, "60~100", "2~5"),
    "HIPS(PS)": MaterialProperties("20~60", "180~220", ">250", 40, "50~70", Crystallinity.AMORPHOUS, "0.1~0.3", Viscosity.MEDIUM, MetalCorrosion.NONE, "70~120", "2~5"),
    "LCP": MaterialProperties("100~150", "310~340", ">360", 30, "160~180", Crystallinity.HIGH_CRYSTALLINE, "0.02~0.05", Viscosity.VERY_LOW, MetalCorrosion.NONE, "70~120", "2~4"),
    "LDPE": MaterialProperties("10~40", "170~200", ">260", 30, "40~60", Crystallinity.HIGH_CRYSTALLINE, "<0.01", Viscosity.LOW, MetalCorrosion.NONE, "60~90", "2~5"),
    "PA11": MaterialProperties("60~100", "230~260", ">280", 30, "90~110", Crystallinity.HIGH_CRYSTALLINE, "0.2~0.4", Viscosity.MEDIUM, MetalCorrosion.WEAK, "80~140", "3~6"),
    "PA12": MaterialProperties("50~90", "220~250", ">270", 30, "80~100", Crystallinity.HIGH_CRYSTALLINE, "0.1~0.3", Viscosity.MEDIUM, MetalCorrosion.WEAK, "80~130", "3~6"),
    "PA46": MaterialProperties("100~150", "290~320", ">330", 30, "140~160", Crystallinity.HIGH_CRYSTALLINE, "0.1~0.3", Viscosity.MEDIUM, MetalCorrosion.WEAK, "90~160", "3~6"),
    "PA6": MaterialProperties("60~100", "240~270", ">280", 30, "90~110", Crystallinity.HIGH_CRYSTALLINE, "1.2~1.8", Viscosity.MEDIUM, MetalCorrosion.WEAK, "80~150", "2~4"),
    "PA66": MaterialProperties("70~110", "260~290", ">290", 30, "100~120", Crystallinity.HIGH_CRYSTALLINE, "1.3~2.0", Viscosity.MEDIUM, MetalCorrosion.WEAK, "90~160", "2~4"),
    "PBTP(PBT)": MaterialProperties("60~100", "240~270", ">280", 30, "90~110", Crystallinity.HIGH_CRYSTALLINE, "0.1~0.3", Viscosity.MEDIUM, MetalCorrosion.WEAK, "80~140", "3~6"),
    "PC": MaterialProperties("70~110", "280~310", ">320", 30, "100~120", Crystallinity.AMORPHOUS, "0.1~0.3", Viscosity.MEDIUM_HIGH, MetalCorrosion.NONE, "100~170", "3~6"),
    "PC+ABS": MaterialProperties("50~90", "250~280", ">290", 30, "80~100", Crystallinity.AMORPHOUS, "0.1~0.3", Viscosity.MEDIUM, MetalCorrosion.NONE, "90~150", "3~6"),
    "PC+ASA": MaterialProperties("60~100", "260~290", ">300", 30, "90~110", Crystallinity.AMORPHOUS, "0.1~0.3", Viscosity.MEDIUM_HIGH, MetalCorrosion.NONE, "90~150", "3~6"),
    "PCT": MaterialProperties("100~150", "280~310", ">320", 30, "140~160", Crystallinity.SEMI_CRYSTALLINE, "0.1~0.3", Viscosity.MEDIUM_HIGH, MetalCorrosion.NONE, "100~170", "3~6"),
    "PCTA": MaterialProperties("60~100", "240~270", ">280", 30, "90~110", Crystallinity.AMORPHOUS, "0.1~0.3", Viscosity.MEDIUM, MetalCorrosion.NONE, "80~140", "3~6"),
    "PCTG": MaterialProperties("30~70", "230~260", ">270", 30, "60~80", Crystallinity.AMORPHOUS, "0.1~0.3", Viscosity.MEDIUM, MetalCorrosion.NONE, "80~130", "3~6"),
    "PEEK": MaterialProperties("160~190", "350~400", ">420", 50, "200~220", Crystallinity.HIGH_CRYSTALLINE, "<0.1", Viscosity.HIGH, MetalCorrosion.NONE, "100~180", "4~8"),
    "PEI": MaterialProperties("130~160", "330~390", ">400", 60, "160~180", Crystallinity.AMORPHOUS, "0.1~0.3", Viscosity.HIGH, MetalCorrosion.NONE, "100~180", "4~8"),
    "PES": MaterialProperties("140~180", "330~390", ">400", 60, "170~190", Crystallinity.AMORPHOUS, "0.1~0.3", Viscosity.HIGH, MetalCorrosion.NONE, "100~180", "4~8"),
    "PET": MaterialProperties("120~160", "260~290", ">300", 30, "130~150", Crystallinity.HIGH_CRYSTALLINE, "0.2~0.4", Viscosity.MEDIUM, MetalCorrosion.WEAK, "90~160", "2~4"),
    "PETG": MaterialProperties("30~70", "230~260", ">270", 30, "60~80", Crystallinity.AMORPHOUS, "0.1~0.3", Viscosity.MEDIUM, MetalCorrosion.NONE, "80~130", "3~6"),
    "PETP": MaterialProperties("120~160", "260~290", ">300", 30, "130~150", Crystallinity.HIGH_CRYSTALLINE, "0.2~0.4", Viscosity.MEDIUM, MetalCorrosion.WEAK, "90~160", "2~4"),
    "PMMA": MaterialProperties("40~80", "220~250", ">260", 30, "70~90", Crystallinity.AMORPHOUS, "0.2~0.5", Viscosity.HIGH, MetalCorrosion.NONE, "100~170", "3~6"),
    "POM": MaterialProperties("60~100", "190~220", ">230", 30, "90~110", Crystallinity.HIGH_CRYSTALLINE, "0.1~0.3", Viscosity.LOW, MetalCorrosion.MODERATE, "70~120", "2~4"),
    "POM+25FV": MaterialProperties("80~120", "200~230", ">240", 30, "110~130", Crystallinity.HIGH_CRYSTALLINE, "0.1~0.3", Viscosity.LOW, MetalCorrosion.MODERATE, "80~140", "2~4"),
    "PP": MaterialProperties("20~60", "200~230", ">260", 30, "50~70", Crystallinity.HIGH_CRYSTALLINE, "<0.01", Viscosity.LOW, MetalCorrosion.NONE, "60~100", "2~5"),
    "PP+40FV": MaterialProperties("40~80", "210~240", ">270", 30, "70~90", Crystallinity.HIGH_CRYSTALLINE, "<0.01", Viscosity.LOW, MetalCorrosion.NONE, "80~140", "2~5"),
    "PPO/PPE": MaterialProperties("80~120", "270~300", ">310", 30, "120~140", Crystallinity.AMORPHOUS, "0.1~0.3", Viscosity.MEDIUM_HIGH, MetalCorrosion.NONE, "90~150", "3~6"),
    "PPS": MaterialProperties("120~160", "290~320", ">350", 30, "150~170", Crystallinity.HIGH_CRYSTALLINE, "0.01~0.05", Viscosity.MEDIUM, MetalCorrosion.NONE, "90~160", "4~8"),
    "PS": MaterialProperties("20~60", "180~220", ">250", 40, "50~70", Crystallinity.AMORPHOUS, "0.1~0.3", Viscosity.MEDIUM, MetalCorrosion.NONE, "70~120", "2~5"),
    "PSU": MaterialProperties("120~160", "320~380", ">380", 60, "160~180", Crystallinity.AMORPHOUS, "0.1~0.3", Viscosity.HIGH, MetalCorrosion.NONE, "100~180", "4~8"),
    "SAN": MaterialProperties("40~80", "210~240", ">250", 30, "70~90", Crystallinity.AMORPHOUS, "0.1~0.3", Viscosity.MEDIUM, MetalCorrosion.NONE, "80~140", "3~6"),
    "SB": MaterialProperties("20~60", "180~220", ">240", 40, "50~70", Crystallinity.AMORPHOUS, "0.1~0.3", Viscosity.LOW, MetalCorrosion.NONE, "70~120", "2~4"),
    "SEBS": MaterialProperties("20~60", "190~230", ">240", 40, "50~70", Crystallinity.AMORPHOUS, "<0.1", Viscosity.LOW, MetalCorrosion.NONE, "60~100", "2~4"),
    "TPE": MaterialProperties("10~40", "170~200", ">220", 30, "40~60", Crystallinity.AMORPHOUS, "<0.1", Viscosity.LOW, MetalCorrosion.NONE, "70~120", "2~4"),
    "TPU": MaterialProperties("20~60", "180~210", ">220", 30, "50~70", Crystallinity.AMORPHOUS, "0.1~0.3", Viscosity.MEDIUM, MetalCorrosion.NONE, "80~140", "2~4"),
    "HPVC": MaterialProperties("20~50", "170~200", ">190", 30, "40~60", Crystallinity.AMORPHOUS, "0.1~0.3", Viscosity.MEDIUM, MetalCorrosion.STRONG, "80~140", "≤2"),
    "PVC": MaterialProperties("20~50", "160~190", ">180", 30, "40~60", Crystallinity.AMORPHOUS, "0.1~0.3", Viscosity.MEDIUM, MetalCorrosion.STRONG, "80~140", "≤2"),
}


def get_material(abbreviation: str) -> Optional[Material]:
    """获取材料信息"""
    props = MATERIALS_DATA.get(abbreviation)
    if props:
        return Material(abbreviation=abbreviation, properties=props)
    return None


def list_all_materials() -> List[str]:
    """列出所有材料缩写"""
    return list(MATERIALS_DATA.keys())


if __name__ == "__main__":
    # 示例
    print("所有材料:", list_all_materials())
    print("\nABS属性:", get_material("ABS"))
    
    project = MoldSelectionProject(project_name="测试项目")
    project.mold_info.mold_type = MoldType.SINGLE_COLOR
    project.product_info.application_field = ApplicationField.AUTOMOTIVE
    print("\n项目JSON:", project.to_json())
