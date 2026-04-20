# 热流道数据字典系统 - 使用指南

## 📚 项目概述

本项目提供了一个完整的热流道系统数据字典解决方案，支持多级级联数据管理和PostgreSQL数据库存储。系统基于Excel数据源，自动生成数据字典、数据库结构和导入工具。

### 🎯 核心功能

- ✅ 多级级联数据结构支持（大类 → 二级分类 → 属性 → 选项值）
- ✅ 基于Excel数据源的自动数据提取
- ✅ PostgreSQL数据库完整表结构设计
- ✅ Python自动化数据导入工具
- ✅ 完整的数据字典文档
- ✅ 数据库视图和存储函数
- ✅ 数据完整性验证

---

## 📁 项目文件结构

```
热流道数据字典系统/
├── 热流道.xlsx                           # 原始数据源
├── hot_runner_data_dictionary.md         # 数据字典文档
├── hot_runner_schema.sql                 # 数据库建表脚本
├── hot_runner_import_data.py             # 数据导入工具
├── README_HOT_RUNNER.md                  # 使用指南（本文件）
├── hot_runner_complete_data.json         # 解析后的数据结构
├── cascade_analysis.json                 # 级联分析结果
└── complete_hierarchy.json               # 完整层级结构
```

---

## 🚀 快速开始

### 1. 环境准备

#### 系统要求
- Python 3.7+
- PostgreSQL 12+
- pandas, openpyxl, psycopg2-binary

#### 安装依赖

```bash
# 安装Python依赖
pip install pandas openpyxl psycopg2-binary

# 或者使用requirements.txt
pip install -r requirements.txt
```

#### requirements.txt
```
pandas>=1.3.0
openpyxl>=3.0.7
psycopg2-binary>=2.9.0
```

### 2. 数据库准备

#### 创建数据库

```sql
-- 连接到PostgreSQL
psql -U postgres

-- 创建数据库
CREATE DATABASE hot_runner_db;

-- 创建用户（可选）
CREATE USER hot_runner_user WITH PASSWORD 'your_secure_password';

-- 授权
GRANT ALL PRIVILEGES ON DATABASE hot_runner_db TO hot_runner_user;

-- 退出
\q
```

#### 执行建表脚本

```bash
# 方式1: 使用psql命令
psql -U postgres -d hot_runner_db -f hot_runner_schema.sql

# 方式2: 在PostgreSQL客户端中执行
# 打开hot_runner_schema.sql文件，复制全部SQL语句执行
```

### 3. 配置数据库连接

编辑 `hot_runner_import_data.py` 文件，修改数据库配置：

```python
# 数据库配置 - 请根据实际情况修改
db_config = {
    'host': 'localhost',      # 数据库主机
    'port': 5432,             # 数据库端口
    'database': 'hot_runner_db',  # 数据库名称
    'user': 'postgres',        # 数据库用户名
    'password': 'your_password'  # 数据库密码
}
```

### 4. 导入数据

```bash
# 执行数据导入
python hot_runner_import_data.py
```

导入过程中会生成日志文件 `hot_runner_import.log`，可以查看详细的导入过程。

---

## 📊 数据结构详解

### 数据库表关系

```
hot_runner_categories (主分类)
    ↓ 1:N
sub_categories (二级分类)
    ↓ 1:N
category_attributes (属性定义)
    ↓ 1:N
attribute_options (选项值)
```

### 表结构说明

#### 1. hot_runner_categories（主分类表）
存储热流道系统的四大主分类：分流板、主射咀、热咀、驱动系统

#### 2. sub_categories（二级分类表）
存储每个主分类下的二级分类，如"属性类"、"桥板"、"主射咀本体"等

#### 3. category_attributes（属性定义表）
存储每个二级分类的具体属性，如"分流板材质"、"加热器类型"等

#### 4. attribute_options（选项值表）
存储每个属性的可选值，如"FS136, 4Cr13"、"φ5, φ6, φ8"等

---

## 💻 使用示例

### Python API 使用示例

#### 1. 查询完整分类树

```python
import psycopg2

def get_category_tree():
    """获取完整的分类树"""
    conn = psycopg2.connect(
        dbname="hot_runner_db",
        user="postgres",
        password="your_password",
        host="localhost"
    )
    
    cursor = conn.cursor()
    
    # 使用视图查询
    cursor.execute("""
        SELECT category_name, sub_category_name, attribute_name, option_value
        FROM v_full_dictionary
        ORDER BY category_name, sub_category_name, attribute_name
    """)
    
    results = cursor.fetchall()
    
    for row in results:
        print(f"{row[0]} > {row[1]} > {row[2]}: {row[3]}")
    
    cursor.close()
    conn.close()
```

#### 2. 级联选择实现

```python
def cascade_select():
    """实现级联选择逻辑"""
    
    # 第1步：选择大类
    categories = query_categories()
    selected_category = input(f"请选择大类: {categories}")
    
    # 第2步：根据大类选择二级分类
    sub_categories = query_sub_categories(selected_category)
    selected_sub_category = input(f"请选择二级分类: {sub_categories}")
    
    # 第3步：根据二级分类选择属性
    attributes = query_attributes(selected_sub_category)
    selected_attribute = input(f"请选择属性: {attributes}")
    
    # 第4步：根据属性选择选项值
    options = query_options(selected_attribute)
    selected_option = input(f"请选择选项值: {options}")
    
    return {
        'category': selected_category,
        'sub_category': selected_sub_category,
        'attribute': selected_attribute,
        'option': selected_option
    }
```

### SQL 查询示例

#### 1. 查询所有大类
```sql
SELECT * FROM hot_runner_categories ORDER BY sort_order;
```

#### 2. 查询特定大类的所有子分类
```sql
SELECT * FROM sub_categories 
WHERE category_id = 1  -- 替换为实际的category_id
ORDER BY sort_order;
```

#### 3. 查询属性的选项值
```sql
SELECT option_value, option_label 
FROM attribute_options 
WHERE attribute_id = 1  -- 替换为实际的attribute_id
ORDER BY sort_order;
```

#### 4. 使用完整数据字典视图
```sql
SELECT * FROM v_full_dictionary 
WHERE 大类 = '分流板大类' 
ORDER BY 二级分类, 属性名称;
```

---

## 🔧 高级功能

### 1. 数据库视图

#### v_category_tree（分类树视图）
提供完整的分类层次结构，包含所有层级信息。

```sql
SELECT * FROM v_category_tree;
```

#### v_full_dictionary（完整数据字典视图）
人类可读的数据字典视图，方便查询和使用。

```sql
SELECT * FROM v_full_dictionary;
```

### 2. 存储函数

#### get_category_tree()
获取完整的分类树数据。

```sql
SELECT * FROM get_category_tree();
```

#### get_category_details(p_category_id BIGINT)
根据主分类ID获取详细信息，包括选项值数组。

```sql
SELECT * FROM get_category_details(1);  -- 1是分流板大类的ID
```

### 3. 数据完整性约束

系统内置了多种数据完整性约束：
- 外键约束确保数据关联完整性
- 唯一约束防止重复数据
- 检查约束确保数据类型正确
- 级联删除保证数据一致性

---

## 📈 性能优化建议

### 1. 索引策略

系统已创建以下索引来提升查询性能：
- 主键索引（所有表）
- 外键索引（关联查询）
- 代码唯一索引（防止重复）
- 状态索引（活跃数据查询）

### 2. 查询优化

```sql
-- 使用EXPLAIN分析查询性能
EXPLAIN ANALYZE SELECT * FROM v_full_dictionary;

-- 对于大数据量，考虑分页查询
SELECT * FROM attribute_options 
WHERE attribute_id = 1 
LIMIT 10 OFFSET 0;
```

### 3. 缓存策略

由于数据字典数据相对稳定，建议在应用层实现缓存：

```python
import redis
import json

# Redis缓存示例
cache = redis.Redis(host='localhost', port=6379, db=0)

def get_cached_categories():
    """获取缓存的分类数据"""
    cached = cache.get('hot_runner_categories')
    if cached:
        return json.loads(cached)
    
    # 查询数据库
    categories = query_categories()
    
    # 缓存1小时
    cache.setex('hot_runner_categories', 3600, json.dumps(categories))
    
    return categories
```

---

## 🔄 数据更新流程

### 1. 更新Excel数据源

1. 打开 `热流道.xlsx` 文件
2. 修改相应的数据内容
3. 保存文件

### 2. 重新导入数据

```bash
# 执行数据导入（会自动清理旧数据）
python hot_runner_import_data.py
```

### 3. 验证数据

```sql
-- 验证导入的数据
SELECT COUNT(*) FROM hot_runner_categories;
SELECT COUNT(*) FROM sub_categories;
SELECT COUNT(*) FROM category_attributes;
SELECT COUNT(*) FROM attribute_options;
```

---

## 🛠️ 已有项目集成指南

### 1. Web应用集成（Flask示例）

```python
from flask import Flask, jsonify, request
import psycopg2
from psycopg2 import pool

app = Flask(__name__)

# 数据库连接池
db_pool = psycopg2.pool.SimpleConnectionPool(
    1, 20,
    host="localhost",
    database="hot_runner_db",
    user="postgres",
    password="your_password"
)

@app.route('/api/categories', methods=['GET'])
def get_categories():
    """获取所有大类"""
    conn = db_pool.getconn()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM hot_runner_categories WHERE is_active = true")
        results = cursor.fetchall()
        return jsonify(results)
    finally:
        db_pool.putconn(conn)

@app.route('/api/subcategories/<category_id>', methods=['GET'])
def get_subcategories(category_id):
    """获取指定大类的子分类"""
    conn = db_pool.getconn()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM sub_categories WHERE category_id = %s AND is_active = true",
            (category_id,)
        )
        results = cursor.fetchall()
        return jsonify(results)
    finally:
        db_pool.putconn(conn)

if __name__ == '__main__':
    app.run(debug=True)
```

### 2. 数据库迁移集成

如果您的项目使用数据库迁移工具（如Alembic），可以按照以下步骤集成：

1. 将 `hot_runner_schema.sql` 中的表结构转换为Alembic migration
2. 在migration脚本中调用数据导入工具
3. 确保数据字典表在应用表之前创建

### 3. 配置文件集成

在应用配置文件中添加数据字典相关配置：

```python
# config.py
class Config:
    # 数据库配置
    DATABASE_CONFIG = {
        'host': 'localhost',
        'port': 5432,
        'database': 'hot_runner_db',
        'user': 'postgres',
        'password': 'your_password'
    }
    
    # 数据字典配置
    HOT_RUNNER_CONFIG = {
        'excel_file': '热流道.xlsx',
        'cache_ttl': 3600,  # 缓存1小时
        'auto_import': True  # 自动导入
    }
```

---

## 📝 维护与监控

### 1. 日志监控

导入工具会生成详细的日志文件 `hot_runner_import.log`：

```bash
# 查看最新日志
tail -f hot_runner_import.log

# 搜索错误日志
grep ERROR hot_runner_import.log
```

### 2. 数据完整性检查

```sql
-- 检查孤儿数据
SELECT * FROM sub_categories 
WHERE category_id NOT IN (SELECT id FROM hot_runner_categories);

SELECT * FROM category_attributes 
WHERE sub_category_id NOT IN (SELECT id FROM sub_categories);

-- 检查重复数据
SELECT attribute_code, COUNT(*) 
FROM category_attributes 
GROUP BY attribute_code 
HAVING COUNT(*) > 1;
```

### 3. 性能监控

```sql
-- 查看表大小
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 查看索引使用情况
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes;
```

---

## ❓ 常见问题

### 1. 数据导入失败怎么办？

- 检查数据库连接配置是否正确
- 确认PostgreSQL数据库已启动
- 查看日志文件 `hot_runner_import.log` 了解详细错误信息
- 确认数据库用户有足够的权限

### 2. 如何添加新的分类？

- 在Excel中添加新的分类数据
- 重新运行导入脚本 `python hot_runner_import_data.py`
- 数据库会自动更新

### 3. 性能问题如何优化？

- 为常用查询字段添加索引
- 使用数据库连接池减少连接开销
- 在应用层实现缓存策略
- 定期进行数据库表维护（VACUUM, ANALYZE）

### 4. 如何备份数据？

```bash
# 导出数据库
pg_dump -U postgres hot_runner_db > hot_runner_backup.sql

# 导入数据库
psql -U postgres hot_runner_db < hot_runner_backup.sql
```

---

## 📞 技术支持

如遇到问题，请查看：

1. `hot_runner_data_dictionary.md` - 数据字典详细文档
2. `hot_runner_import.log` - 导入日志文件
3. PostgreSQL官方文档
4. Python相关文档

---

## 📄 许可证

本系统基于实际业务需求开发，仅供参考和学习使用。

---

*最后更新：2026年04月20日*
