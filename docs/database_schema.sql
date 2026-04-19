-- =====================================================
-- 模具选型数据库模型
-- =====================================================
-- 基于文本内容生成的MySQL建表脚本
-- =====================================================

-- 1. 模具信息表
CREATE TABLE mold_info (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- 基本信息
    manufacturer VARCHAR(200) COMMENT '模具制造商',
    manager VARCHAR(100) COMMENT '负责人',
    manager_phone VARCHAR(50) COMMENT '负责人电话',
    mold_id VARCHAR(100) COMMENT '模具编号',
    hot_runner_id VARCHAR(100) COMMENT '热流道系统编号',
    nozzle_count INT COMMENT '热咀数量',
    cavity_count INT COMMENT '产品腔数',
    
    -- 选型选项
    mold_status ENUM('新模', '旧模改制') COMMENT '模具状态',
    mold_type ENUM('单色', '双色', '叠模') COMMENT '模具类型',
    locating_ring_eccentric ENUM('允许', '不允许') COMMENT '定位环偏心',
    order_requirement ENUM('方案', '模流', '方案+模流') COMMENT '订单需求',
    hot_runner_type ENUM('单咀', '单点针阀', '含分流板的开放式', '含分流板的针阀式') COMMENT '热流道类型',
    point_numbering_rule ENUM('客户指定', '我司标准') COMMENT '点位编号规则',
    driver_type ENUM('气动', '油压') COMMENT '驱动器',
    solenoid_valve ENUM('气动电磁阀', '油动电磁阀', '不要电磁阀') COMMENT '电磁阀',
    solenoid_valve_position ENUM('操作侧', '非操作侧', '天侧', '地侧') COMMENT '电磁阀位置',
    gate_system_desc ENUM('正灌', '倒灌', '法向') COMMENT '进胶系统描述',
    
    -- 技术参数
    mold_core_eject BOOLEAN COMMENT '模仁是否需要弹开',
    balance_requirement ENUM('严格', '一般', '无') COMMENT '平衡性要求',
    plate_thickness_adjustable BOOLEAN COMMENT '模板厚度可调',
    runner_plate_style ENUM('整块板下面留铁', '通框', '拼接块') COMMENT '流道板样式',
    wire_frame_needed BOOLEAN COMMENT '线架是否需要',
    solenoid_valve_socket VARCHAR(100) COMMENT '电磁阀插座型号',
    signal_wiring_method ENUM('1关2开', '1关9开') COMMENT '信号线接线方式',
    
    -- 冷却与温控
    cooling_medium ENUM('常温水', '冰水', '油') COMMENT '模具冷却介质',
    water_oil_connector_position ENUM('操作侧', '非操作侧', '地侧') COMMENT '水路油路接头位置',
    has_mold_temp_controller BOOLEAN COMMENT '客户是否有模温机',
    has_temp_controller ENUM('有', '没有', '需要我司提供') COMMENT '客户是否有温控器',
    has_sequence_controller ENUM('有', '没有', '需要我司提供') COMMENT '客户是否有时序控制器',
    has_booster_pump ENUM('有', '没有', '需要我司提供') COMMENT '客户是否有增压泵',
    has_multiple_oil_pumps ENUM('有', '没有', '需要我司提供') COMMENT '客户是否有多个油压泵',
    
    -- 接线配置
    junction_box_position ENUM('天侧', '非操作侧', '操作侧', '地侧') COMMENT '接线盒位置',
    socket_type ENUM('公插', '母插', '公母插合用') COMMENT '插座类型',
    socket_pin_count INT COMMENT '插座芯数',
    thermocouple_type ENUM('J', 'K') COMMENT '感温线型号',
    delivery_wiring_method VARCHAR(100) COMMENT '交付接线方式',
    debug_wiring_method VARCHAR(100) COMMENT '调机接线方式',
    
    -- 注塑机参数
    injection_machine_model VARCHAR(100) COMMENT '注塑机型号',
    injection_machine_tonnage INT COMMENT '注塑机吨位(t)',
    barrel_sphere_radius DECIMAL(10,2) COMMENT '炮筒球半径(mm)',
    barrel_orifice DECIMAL(10,2) COMMENT '炮筒出胶孔(mm)',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='模具信息表';


-- 2. 产品信息表
CREATE TABLE product_info (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    mold_info_id BIGINT COMMENT '关联模具ID',
    
    product_name VARCHAR(200) COMMENT '产品名',
    application_field ENUM('汽车', '家电', '医疗', '日化', '美妆') COMMENT '应用领域',
    weight DECIMAL(10,2) COMMENT '重量(g)',
    wall_thickness ENUM('厚壁件（＞3mm）', '常规件（1-3mm）', '薄壁件（＜1mm）') COMMENT '平均肉厚',
    color ENUM('黑色', '白色', '透明', '浅色', '换色') COMMENT '颜色',
    surface_finish ENUM('高亮', '晒纹', '皮纹', '细皮纹', '厚植绒', '薄植绒', '换色', '一般') COMMENT '外观要求',
    precision_level ENUM('精密件（公差±0.02mm）', '常规件（公差±0.1mm）') COMMENT '尺寸精度控制',
    mechanical_requirement ENUM('承载件', '耐高温') COMMENT '力学性能要求',
    efficiency_requirement ENUM('快速', '一般') COMMENT '生产效率要求',
    production_batch ENUM('大批量（≥10万模次）', '中批量（1万-10万模次）', '小批量（＜1万模次）') COMMENT '生产批量',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (mold_info_id) REFERENCES mold_info(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='产品信息表';


-- 3. 材料主表
CREATE TABLE materials (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    abbreviation VARCHAR(20) NOT NULL UNIQUE COMMENT '塑料名称缩写',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='材料主表';


-- 4. 材料属性表
CREATE TABLE material_properties (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    material_id BIGINT NOT NULL COMMENT '关联材料ID',
    
    mold_temp VARCHAR(50) COMMENT '模温℃',
    melt_temp VARCHAR(50) COMMENT '熔融温度℃',
    degradation_temp VARCHAR(50) COMMENT '降解温度℃',
    molding_window INT COMMENT '成型窗口δ℃',
    ejection_temp VARCHAR(50) COMMENT '顶出温度℃',
    crystallinity ENUM('非晶', '高结晶', '半结晶') COMMENT '结晶度',
    moisture_absorption VARCHAR(50) COMMENT '吸湿性24h,%',
    viscosity ENUM('极低', '低', '中', '中高', '高') COMMENT '粘度Pa·s',
    metal_corrosion ENUM('无', '弱', '较强', '强') COMMENT '对金属腐蚀性',
    injection_pressure VARCHAR(50) COMMENT '参考注射压力Mpa',
    residence_time VARCHAR(50) COMMENT '存料时间min',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
    UNIQUE KEY uk_material_props (material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='材料属性表';


-- 5. 热流道系统表
CREATE TABLE hot_runner_system (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    mold_info_id BIGINT NOT NULL COMMENT '关联模具ID',
    
    resin_retention_cycles ENUM('X<1', '1<X<3', '3<X') COMMENT '系统存胶模数',
    
    -- 主射咀配置
    main_nozzle_heating BOOLEAN COMMENT '主射咀加热',
    main_nozzle_material ENUM('FS136', '4CR13') COMMENT '主射咀材质',
    main_nozzle_heater ENUM('EPM', 'GPM', 'MCM') COMMENT '主射咀加热器',
    
    -- 分流板配置
    manifold_bridging BOOLEAN COMMENT '分流板搭桥',
    manifold_material ENUM('FS136', '4CR13', 'SKD61', 'DC53', 'P20') COMMENT '分流板材质',
    manifold_runner_diameter DECIMAL(10,2) COMMENT '分流板流道直径',
    manifold_interface ENUM('M', '平压斜孔', 'T') COMMENT '分流板&热咀对接方式',
    manifold_calculate_expansion BOOLEAN COMMENT '分流板计算膨胀',
    manifold_plug ENUM('BALA', '镶件+BALA', '常规') COMMENT '分流板堵头',
    manifold_runner_diagram ENUM('默认', '按模流分析报告') COMMENT '流道走向示意图',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (mold_info_id) REFERENCES mold_info(id) ON DELETE CASCADE,
    UNIQUE KEY uk_mold_hotrunner (mold_info_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='热流道系统表';


-- 6. 热咀配置表
CREATE TABLE nozzle_config (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    hot_runner_id BIGINT NOT NULL COMMENT '关联热流道ID',
    nozzle_index INT DEFAULT 1 COMMENT '热咀序号',
    
    structure ENUM('SLT', 'TOE', 'SOE', 'TLS', 'OA', 'PLT', 'PLS', 'SAC', 'SLC', 'TAC', 'TLC', 'SCC', 'CC', 'CCH', 'CA', 'CT', 'CTC', 'CS', 'EVV', 'SVV', 'VV', 'VA', 'STVA', 'STVL', 'TVA', 'TVL', 'TVAP') COMMENT '热咀结构',
    heater ENUM('EPM', 'EPT', 'GPM', 'GPT', 'MCM', 'MCT') COMMENT '热咀加热器',
    gate_diameter DECIMAL(10,2) COMMENT '胶口直径',
    tip_material ENUM('SKD61', '铍铜', '铝合金', '钨铜', 'DC53') COMMENT '咀芯材质',
    tip_coating ENUM('Cr', 'Ni', 'Ti', 'Ni+Cr') COMMENT '咀芯涂层',
    cap_material ENUM('SKD61', '钛合金', 'Cr12MoV') COMMENT '咀帽材质',
    insulator_material ENUM('PI', 'PEEK', '钛合金') COMMENT '隔热帽材质',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hot_runner_id) REFERENCES hot_runner_system(id) ON DELETE CASCADE,
    UNIQUE KEY uk_hotrunner_nozzle (hot_runner_id, nozzle_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='热咀配置表';


-- 7. 阀针配置表
CREATE TABLE valve_pin_config (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    hot_runner_id BIGINT NOT NULL COMMENT '关联热流道ID',
    
    style ENUM('S', 'T') COMMENT '阀针样式',
    material ENUM('SKD61', 'SKH51') COMMENT '阀针材质',
    coating ENUM('TiN', 'CrN', 'ZrN', 'DLC', 'TiAlN', 'CrAlN', 'TiN+DLC', 'TiSiN', 'CrN+DLC') COMMENT '阀针镀层工艺',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hot_runner_id) REFERENCES hot_runner_system(id) ON DELETE CASCADE,
    UNIQUE KEY uk_hotrunner_valvepin (hot_runner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='阀针配置表';


-- 8. 关联规则表
CREATE TABLE association_rules (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    rule_code VARCHAR(30) NOT NULL UNIQUE COMMENT '规则编码',
    rule_name VARCHAR(100) NOT NULL COMMENT '规则名称',
    trigger_conditions JSON COMMENT '触发条件',
    recommendations JSON COMMENT '推荐配置',
    exclusions JSON COMMENT '排除选项',
    reason TEXT COMMENT '规则原因',
    priority INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='关联规则表';


-- ==================== 初始化材料数据 ====================

INSERT INTO materials (abbreviation) VALUES
('ABS'), ('ASA'), ('CAB'), ('EVA'), ('FEP'), ('HDPE'), ('HIPS(PS)'), ('LCP'), ('LDPE'),
('PA11'), ('PA12'), ('PA46'), ('PA6'), ('PA66'), ('PBTP(PBT)'), ('PC'), ('PC+ABS'), ('PC+ASA'),
('PCT'), ('PCTA'), ('PCTG'), ('PEEK'), ('PEI'), ('PES'), ('PET'), ('PETG'), ('PETP'),
('PMMA'), ('POM'), ('POM+25FV'), ('PP'), ('PP+40FV'), ('PPO/PPE'), ('PPS'), ('PS'), ('PSU'),
('SAN'), ('SB'), ('SEBS'), ('TPE'), ('TPU'), ('HPVC'), ('PVC');

INSERT INTO material_properties (material_id, mold_temp, melt_temp, degradation_temp, molding_window, ejection_temp, crystallinity, moisture_absorption, viscosity, metal_corrosion, injection_pressure, residence_time) VALUES
(1, '40~80', '220~260', '>270', 40, '70~90', '非晶', '0.2~0.4', '中高', '无', '80~140', '3~6'),
(2, '50~90', '230~270', '>280', 40, '80~100', '非晶', '0.2~0.4', '中高', '无', '90~150', '3~6'),
(3, '20~60', '200~230', '>240', 30, '40~60', '非晶', '<0.2', '中', '无', '70~120', '2~4'),
(4, '10~40', '160~190', '>200', 30, '30~50', '高结晶', '<0.1', '低', '无', '60~100', '2~4'),
(5, '150~200', '320~380', '>400', 60, '180~200', '高结晶', '<0.01', '低', '无', '60~100', '长期'),
(6, '20~60', '180~220', '>280', 40, '50~70', '高结晶', '<0.01', '低', '无', '60~100', '2~5'),
(7, '20~60', '180~220', '>250', 40, '50~70', '非晶', '0.1~0.3', '中', '无', '70~120', '2~5'),
(8, '100~150', '310~340', '>360', 30, '160~180', '高结晶', '0.02~0.05', '极低', '无', '70~120', '2~4'),
(9, '10~40', '170~200', '>260', 30, '40~60', '高结晶', '<0.01', '低', '无', '60~90', '2~5'),
(10, '60~100', '230~260', '>280', 30, '90~110', '高结晶', '0.2~0.4', '中', '弱', '80~140', '3~6'),
(11, '50~90', '220~250', '>270', 30, '80~100', '高结晶', '0.1~0.3', '中', '弱', '80~130', '3~6'),
(12, '100~150', '290~320', '>330', 30, '140~160', '高结晶', '0.1~0.3', '中', '弱', '90~160', '3~6'),
(13, '60~100', '240~270', '>280', 30, '90~110', '高结晶', '1.2~1.8', '中', '弱', '80~150', '2~4'),
(14, '70~110', '260~290', '>290', 30, '100~120', '高结晶', '1.3~2.0', '中', '弱', '90~160', '2~4'),
(15, '60~100', '240~270', '>280', 30, '90~110', '高结晶', '0.1~0.3', '中', '弱', '80~140', '3~6'),
(16, '70~110', '280~310', '>320', 30, '100~120', '非晶', '0.1~0.3', '中高', '无', '100~170', '3~6'),
(17, '50~90', '250~280', '>290', 30, '80~100', '非晶', '0.1~0.3', '中', '无', '90~150', '3~6'),
(18, '60~100', '260~290', '>300', 30, '90~110', '非晶', '0.1~0.3', '中高', '无', '90~150', '3~6'),
(19, '100~150', '280~310', '>320', 30, '140~160', '半结晶', '0.1~0.3', '中高', '无', '100~170', '3~6'),
(20, '60~100', '240~270', '>280', 30, '90~110', '非晶', '0.1~0.3', '中', '无', '80~140', '3~6'),
(21, '30~70', '230~260', '>270', 30, '60~80', '非晶', '0.1~0.3', '中', '无', '80~130', '3~6'),
(22, '160~190', '350~400', '>420', 50, '200~220', '高结晶', '<0.1', '高', '无', '100~180', '4~8'),
(23, '130~160', '330~390', '>400', 60, '160~180', '非晶', '0.1~0.3', '高', '无', '100~180', '4~8'),
(24, '140~180', '330~390', '>400', 60, '170~190', '非晶', '0.1~0.3', '高', '无', '100~180', '4~8'),
(25, '120~160', '260~290', '>300', 30, '130~150', '高结晶', '0.2~0.4', '中', '弱', '90~160', '2~4'),
(26, '30~70', '230~260', '>270', 30, '60~80', '非晶', '0.1~0.3', '中', '无', '80~130', '3~6'),
(27, '120~160', '260~290', '>300', 30, '130~150', '高结晶', '0.2~0.4', '中', '弱', '90~160', '2~4'),
(28, '40~80', '220~250', '>260', 30, '70~90', '非晶', '0.2~0.5', '高', '无', '100~170', '3~6'),
(29, '60~100', '190~220', '>230', 30, '90~110', '高结晶', '0.1~0.3', '低', '较强', '70~120', '2~4'),
(30, '80~120', '200~230', '>240', 30, '110~130', '高结晶', '0.1~0.3', '低', '较强', '80~140', '2~4'),
(31, '20~60', '200~230', '>260', 30, '50~70', '高结晶', '<0.01', '低', '无', '60~100', '2~5'),
(32, '40~80', '210~240', '>270', 30, '70~90', '高结晶', '<0.01', '低', '无', '80~140', '2~5'),
(33, '80~120', '270~300', '>310', 30, '120~140', '非晶', '0.1~0.3', '中高', '无', '90~150', '3~6'),
(34, '120~160', '290~320', '>350', 30, '150~170', '高结晶', '0.01~0.05', '中', '无', '90~160', '4~8'),
(35, '20~60', '180~220', '>250', 40, '50~70', '非晶', '0.1~0.3', '中', '无', '70~120', '2~5'),
(36, '120~160', '320~380', '>380', 60, '160~180', '非晶', '0.1~0.3', '高', '无', '100~180', '4~8'),
(37, '40~80', '210~240', '>250', 30, '70~90', '非晶', '0.1~0.3', '中', '无', '80~140', '3~6'),
(38, '20~60', '180~220', '>240', 40, '50~70', '非晶', '0.1~0.3', '低', '无', '70~120', '2~4'),
(39, '20~60', '190~230', '>240', 40, '50~70', '非晶', '<0.1', '低', '无', '60~100', '2~4'),
(40, '10~40', '170~200', '>220', 30, '40~60', '非晶', '<0.1', '低', '无', '70~120', '2~4'),
(41, '20~60', '180~210', '>220', 30, '50~70', '非晶', '0.1~0.3', '中', '无', '80~140', '2~4'),
(42, '20~50', '170~200', '>190', 30, '40~60', '非晶', '0.1~0.3', '中', '强', '80~140', '≤2'),
(43, '20~50', '160~190', '>180', 30, '40~60', '非晶', '0.1~0.3', '中', '强', '80~140', '≤2');


-- ==================== 索引优化 ====================

CREATE INDEX idx_mold_type ON mold_info(mold_type);
CREATE INDEX idx_hotrunner_type ON mold_info(hot_runner_type);
CREATE INDEX idx_application_field ON product_info(application_field);
CREATE INDEX idx_material_abbr ON materials(abbreviation);
