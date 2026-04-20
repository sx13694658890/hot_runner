# 热流道系统数据字典

## 📋 数据字典概述

本文档基于热流道.xlsx文件，定义了热流道系统的完整数据字典结构，支持多级级联数据存储。

---

## 🏭 大类分类结构

### 1. 分流板大类 (flow_plate_category)

**二级分类数量**：4个  
**属性项数量**：4个  

| 二级分类 | 属性名称 | 选项类型 | 示例值 |
|---------|---------|---------|--------|
| 属性类 | 分流板材质 | 枚举 | FS136, 4Cr13, 4Cr13H, SKD61, DC53, P20 |
| 桥板 | 分流板搭桥样式 | 枚举 | 板-转接环-板, 板-转接环-主射咀-板 |
| 法向分流板 | 子项包含"分流板主体"的所有内容 | 继承 | - |
| 线架 | 水路板 | 布尔 | 是/否 |

### 2. 主射咀大类 (nozzle_category)

**二级分类数量**：4个  
**属性项数量**：4个  

| 二级分类 | 属性名称 | 选项类型 | 示例值 |
|---------|---------|---------|--------|
| 主射咀本体 | 加热型本体 | 枚举 | 加热25, 加热30, 加热35, 单咀主射咀, 单阀主射咀 |
| SR球头 | SR球头规格 | 枚举 | SR11-φ4, SR11-φ6, SR11-φ8, SR16-φ4, SR16-φ6, SR16-φ8, SR21-φ4, SR21-φ6, SR21-φ8 |
| 主射咀加热器 | 加热器类型 | 枚举 | 铜套加热器, 弹簧加热器, 镶嵌φ1.0圆丝加热器, 镶嵌φ1.5圆丝加热器, 镶嵌φ1.8圆丝加热器, 镶嵌4.2*2.2扁丝加热器 |
| 感温线样式 | 安装方式 | 枚举 | 打孔外挂, φ1.0镶嵌, φ1.5镶嵌 |

### 3. 热咀大类 (hot_nozzle_category)

**二级分类数量**：6个  
**属性项数量**：6个  

| 二级分类 | 属性名称 | 选项类型 | 示例值 |
|---------|---------|---------|--------|
| 热咀本体 | 底座类型 | 枚举 | 板平压, 螺牙, 斜孔 |
| 垫圈 | 垫圈规格 | 数值 | 20, 25, 30, 35, 45 |
| 本体碟簧 | 碟簧规格 | 数值 | 20, 25, 30, 35, 45 |
| 热咀咀头 | 热咀结构代码 | 枚举 | 开放式, 大水口, SLT, TOE, SOE, TLS, OA, PLT, PLS, TLC, SLC |
| 衬套 | 衬套 | 布尔 | 是/否 |
| 运水套 | 运水套类型 | 枚举 | 不封针式运水套, 封针式运水套, 3D打印水套, 运水套顶杆, 密封圈, 压块, 螺丝 |

### 4. 驱动系统 (drive_system_category)

**二级分类数量**：5个  
**属性项数量**：5个  

| 二级分类 | 属性名称 | 选项类型 | 示例值 |
|---------|---------|---------|--------|
| 阀针 | 阀针规格 | 枚举 | φ3-φ1.0, φ3-φ1.5, φ4-φ1.5, φ4-φ2.0 |
| 阀套 | 阀套规格 | 枚举 | φ3, φ4, φ5, φ6, φ8, φ10 |
| 在气缸板上开孔的驱动器 | 驱动器型号 | 枚举 | HS40, FEP30, VC58, VC68, VC78, VC88 |
| 固定在分流板上的驱动器 | 接头类型 | 枚举 | 180°接头, 135°接头, 90°接头 |
| 单点针阀补充零件 | 补充零件 | 枚举 | 底座, 分流体, 防转销, 密封铜环, 叠模母模转接环 |

---

## 🗄️ 数据库表结构设计

### 表1: 热流道主分类表 (hot_runner_categories)

| 字段名 | 数据类型 | 约束 | 说明 |
|-------|---------|------|------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 主键ID |
| category_code | VARCHAR(50) | UNIQUE, NOT NULL | 分类代码 |
| category_name | VARCHAR(100) | NOT NULL | 分类名称 |
| category_name_en | VARCHAR(100) | 英文名称 |
| description | TEXT | 分类描述 |
| sort_order | INT | 排序序号 |
| is_active | BOOLEAN | DEFAULT TRUE | 是否启用 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

### 表2: 二级分类表 (sub_categories)

| 字段名 | 数据类型 | 约束 | 说明 |
|-------|---------|------|------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 主键ID |
| category_id | BIGINT | NOT NULL, FK | 关联主分类ID |
| sub_category_code | VARCHAR(50) | NOT NULL | 子分类代码 |
| sub_category_name | VARCHAR(100) | NOT NULL | 子分类名称 |
| description | TEXT | 描述 |
| sort_order | INT | 排序序号 |
| is_active | BOOLEAN | DEFAULT TRUE | 是否启用 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

### 表3: 属性定义表 (category_attributes)

| 字段名 | 数据类型 | 约束 | 说明 |
|-------|---------|------|------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 主键ID |
| sub_category_id | BIGINT | NOT NULL, FK | 关联子分类ID |
| attribute_code | VARCHAR(50) | NOT NULL | 属性代码 |
| attribute_name | VARCHAR(100) | NOT NULL | 属性名称 |
| attribute_type | VARCHAR(20) | NOT NULL | 属性类型: ENUM, NUMERIC, BOOLEAN, TEXT |
| description | TEXT | 属性描述 |
| is_required | BOOLEAN | DEFAULT FALSE | 是否必填 |
| sort_order | INT | 排序序号 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

### 表4: 属性选项值表 (attribute_options)

| 字段名 | 数据类型 | 约束 | 说明 |
|-------|---------|------|------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 主键ID |
| attribute_id | BIGINT | NOT NULL, FK | 关联属性ID |
| option_value | VARCHAR(255) | NOT NULL | 选项值 |
| option_label | VARCHAR(255) | 选项显示标签 |
| sort_order | INT | 排序序号 |
| is_active | BOOLEAN | DEFAULT TRUE | 是否启用 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

---

## 📊 数据字典使用说明

### 级联查询逻辑

1. **选择大类**：查询 `hot_runner_categories` 获取主分类
2. **选择二级分类**：根据大类ID查询 `sub_categories` 
3. **选择属性**：根据二级分类ID查询 `category_attributes`
4. **选择选项值**：根据属性ID查询 `attribute_options`

### 数据字典初始化

数据字典包含以下预定义数据：

- **主分类**：4个（分流板、主射咀、热咀、驱动系统）
- **二级分类**：19个
- **属性定义**：19个
- **选项值**：数百个具体选项

### 扩展性设计

1. **支持无限层级**：可通过扩展表结构支持多级分类
2. **动态属性**：支持不同分类拥有不同的属性定义
3. **多数据类型**：支持枚举、数值、布尔、文本等多种数据类型
4. **版本控制**：通过 created_at/updated_at 字段支持数据版本管理

---

## 🔧 维护与更新

### 数据字典更新流程

1. 在Excel中更新数据
2. 运行数据导入脚本
3. 执行数据校验
4. 发布更新

### 数据一致性保证

- 使用外键约束保证数据关联完整性
- 使用唯一约束防止重复数据
- 设置适当的索引提高查询性能
- 定期执行数据完整性检查

---

## 📈 性能优化建议

1. **索引策略**：
   - category_code, sub_category_code, attribute_code 创建唯一索引
   - 外键字段创建普通索引
   - is_active 字段创建索引

2. **查询优化**：
   - 使用连接查询获取完整分类树
   - 考虑使用物化视图缓存常用查询结果
   - 对大数据量考虑分页查询

3. **缓存策略**：
   - 数据字典数据相对稳定，适合应用层缓存
   - 考虑使用Redis等缓存系统
   - 设置合理的缓存过期时间

---

*本文档最后更新时间：2026年04月20日*
