# 模具选型领域表 — 前端对接 API 文档

**版本**：v1.1  
**前缀**：`/api/v1/selection-catalog`  
**数据源**：PostgreSQL 表 `sel_*`，由迁移 `20260206_0001_sel_catalog_tables.py` 创建；演示模具见 `20260212_0002_sel_mold_demo_seed.py`，分表补充演示见 `20260412_0003_sel_flat_tables_demo_seed.py`。字段对齐 `docs/database_schema.sql`（语义以中文枚举/文案存储，可与 `docs/data_structures.py` 中文枚举对照）。

**说明**：

- 本文档接口与 **选型决策引擎**（`docs/selection_engine.py`、`docs/association_rules.py`）**无运行时耦合**；引擎仍以 `docs/` 下 Python 文件为准，服务端未嵌入其执行逻辑。
- 与 **`/api/v1/mold-selection`**（`MoldSelectionPayload` / `schemaVersion 2026.04`）为 **平行能力**：前者为「领域关系型表」CRUD；后者为 JSON 契约校验与材料 JSON。前端可按场景选用或并行展示。

---

## 鉴权

除另有说明外，均需：

```http
Authorization: Bearer <access_token>
```

| 权限码 | 说明 |
|--------|------|
| `selection:read` | 读材料表、关联规则、模具聚合 |
| `selection:write` | 新增/修改/删除 `sel_mold_info` 及其级联数据 |

---

## 1. 材料主数据与属性

### 1.1 列出材料（含单行属性）

| 方法 | 路径 | 权限 |
|------|------|------|
| GET | `/materials` | `selection:read` |

**响应**：`SelMaterialRead[]`

| JSON 字段 | 类型 | 说明 |
|-----------|------|------|
| id | UUID | |
| abbreviation | string | 缩写，如 `PEEK`、`PA66` |
| is_active | boolean | |
| material_property | object \| null | 对应 `sel_material_property`，字段名见下 |

**material_property**（可为 `null`）

| 字段 | 类型 |
|------|------|
| mold_temp、melt_temp、… | string / int，与文档表 3.2 一致 |

---

### 1.2 按缩写查询材料

| 方法 | 路径 | 权限 |
|------|------|------|
| GET | `/materials/by-abbrev/{abbreviation}` | `selection:read` |

**路径参数**：`abbreviation` — 需与表中 `abbreviation` 完全一致（区分大小写与括号，如 `HIPS(PS)`）。

**404**：材料不存在。

---

### 1.3 材料主表（不含属性行）

| 方法 | 路径 | 权限 |
|------|------|------|
| GET | `/materials-master` | `selection:read` |

**Query**：`skip`（默认 0）、`limit`（默认 200，最大 500）

**响应**：`SelMaterialMasterRead[]` — `id`、`abbreviation`、`is_active`、`created_at`。

---

### 1.4 材料属性表（扁平行 + 缩写）

| 方法 | 路径 | 权限 |
|------|------|------|
| GET | `/material-properties` | `selection:read` |

**Query**：`skip`、`limit`（同上）

**响应**：`SelMaterialPropertyFlatRead[]` — 与 `SelMaterialPropertyRead` 字段一致，另含 **`material_id`**、**`abbreviation`**（来自 `sel_material`）、**`created_at`**。

---

### 1.5 产品信息表（附模具业务字段）

| 方法 | 路径 | 权限 |
|------|------|------|
| GET | `/product-infos` | `selection:read` |

**Query**：`skip`、`limit`

**响应**：`SelProductInfoListRead[]` — 与 `SelProductInfoRead` 一致，另含 **`mold_number`**（`sel_mold_info.mold_id`）、**`mold_manufacturer`**、**`created_at`** / **`updated_at`**。

---

### 1.6 热流道系统表（扁平行 + 模具标识）

| 方法 | 路径 | 权限 |
|------|------|------|
| GET | `/hot-runner-systems` | `selection:read` |

**Query**：`skip`、`limit`

**响应**：`SelHotRunnerSystemListRead[]` — 热流道系统列 + **`mold_number`**、**`mold_manufacturer`**。

---

### 1.7 热咀配置（扁平行 + 模具上下文）

| 方法 | 路径 | 权限 |
|------|------|------|
| GET | `/nozzle-configs` | `selection:read` |

**Query**：`skip`、`limit`（默认 `limit=500`）

**响应**：`SelNozzleListRead[]` — `SelNozzleRead` + **`mold_number`**、**`mold_manufacturer`**。

---

### 1.8 阀针配置（扁平行 + 模具上下文）

| 方法 | 路径 | 权限 |
|------|------|------|
| GET | `/valve-pin-configs` | `selection:read` |

**Query**：`skip`、`limit`

**响应**：`SelValvePinListRead[]` — `SelValvePinRead` + **`mold_number`**、**`mold_manufacturer`**。

---

## 2. 关联规则（持久化快照）

表中存 JSON 字段，可与 `association_rules.py` 中规则语义对照，但 **不以该 Python 模块为数据源**。

| 方法 | 路径 | 权限 |
|------|------|------|
| GET | `/association-rules` | `selection:read` |

**响应**：`SelAssociationRuleRead[]`

| 字段 | 类型 |
|------|------|
| rule_code | string |
| rule_name | string |
| trigger_conditions | object \| null（JSON） |
| recommendations | object \| null |
| exclusions | object \| null |
| reason | string \| null |
| priority | number |
| is_active | boolean |

迁移已预置示例规则：`MAT_HIGH_TEMP`、`MAT_CORROSIVE`。可自行扩展表数据（需数据库操作或后续管理接口）。

---

## 3. 模具聚合（模具 / 产品 / 热流道 / 热咀 / 阀针）

对应表：`sel_mold_info`、`sel_product_info`、`sel_hot_runner_system`、`sel_nozzle_config`、`sel_valve_pin_config`。  
枚举类字段均以 **varchar 存文档中的中文选项**（与 `database_schema.sql` ENUM 文案一致）。

### 3.1 列表（仅根部字段）

| 方法 | 路径 | 权限 |
|------|------|------|
| GET | `/mold-infos` | `selection:read` |

**Query**

| 参数 | 默认 | 说明 |
|------|------|------|
| skip | 0 | |
| limit | 100 | 最大 500 |

**响应**：`SelMoldInfoRead[]`。为减轻负载，**列表项中 `product`、`hot_runner` 恒为 `null`**；明细见单条 GET。

---

### 3.2 详情（含嵌套）

| 方法 | 路径 | 权限 |
|------|------|------|
| GET | `/mold-infos/{mold_id}` | `selection:read` |

**响应**：`SelMoldInfoRead`，包含：

- 根部：与 `sel_mold_info` 列同名（snake_case）。
- `product`：`SelProductInfoRead \| null`
- `hot_runner`：`SelHotRunnerRead \| null`，内含：
  - `nozzles`: `SelNozzleRead[]`
  - `valve_pin`: `SelValvePinRead \| null`

---

### 3.3 创建

| 方法 | 路径 | 权限 |
|------|------|------|
| POST | `/mold-infos` | `selection:write` |

**请求体**：`SelMoldInfoCreate`

- 继承根部所有可选字段（与 PATCH 形状相同）。
- **`product`**：`SelProductInfoWrite \| null`，可选。
- **`hot_runner`**：`SelHotRunnerWrite \| null`，可选：
  - 含分流板、主射咀等字段；
  - **`nozzles`**：`SelNozzleWrite[]`，可为空；
  - **`valve_pin`**：`SelValvePinWrite \| null`。

**响应**：201，`SelMoldInfoRead`（完整嵌套）。

---

### 3.4 更新

| 方法 | 路径 | 权限 |
|------|------|------|
| PATCH | `/mold-infos/{mold_id}` | `selection:write` |

**语义**：

- 根部：仅提交需修改的字段（Pydantic `exclude_unset`）。
- **`product`**：若传入对象，则 **创建或覆盖** `sel_product_info` 一行。
- **`hot_runner`**：若传入对象，则 **删除该模具下原有热流道系统及下属热咀/阀针**，再 **整体重建**（等价于替换整块子树）。

---

### 3.5 删除

| 方法 | 路径 | 权限 |
|------|------|------|
| DELETE | `/mold-infos/{mold_id}` | `selection:write` |

**响应**：204；级联删除产品及热流道相关行（数据库 `ON DELETE CASCADE`）。

---

## 4. 字段与文档索引

| 聚合 | 文档章节 |
|------|-----------|
| 模具根部 + 选型/技术/冷却/接线/注塑机 | `docs/数据模型.md` 一、§1.1～1.6 |
| 产品 | `docs/数据模型.md` 二 |
| 材料属性列 | `docs/数据模型.md` 三 |
| 热流道 / 热咀 / 阀针 | `docs/数据模型.md` 四 |
| 关联规则语义 | `docs/数据模型.md` 五（表内存 JSON 快照） |

---

## 5. OpenAPI

服务启动后在 `{BASE}/docs` 查看自动生成的 Schema；权威字段类型以 **`openapi.json`** 为准。

---

**变更记录**

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-02-06 | 初版：对齐 `sel_*` 迁移与路由 |
| v1.1 | 2026-04-12 | 增加分表扁平列表 GET（材料主表/属性/产品/热流道/热咀/阀针）；种子迁移 `20260412_0003` |
