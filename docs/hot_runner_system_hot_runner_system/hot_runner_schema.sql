-- 热流道系统数据字典 PostgreSQL 建表脚本
-- 作者：基于热流道.xlsx文件生成
-- 创建时间：2026年04月20日

-- 删除已存在的表（按外键依赖顺序）
DROP TABLE IF EXISTS attribute_options CASCADE;
DROP TABLE IF EXISTS category_attributes CASCADE;
DROP TABLE IF EXISTS sub_categories CASCADE;
DROP TABLE IF EXISTS hot_runner_categories CASCADE;

-- ========================================
-- 1. 热流道主分类表
-- ========================================
CREATE TABLE hot_runner_categories (
    id BIGSERIAL PRIMARY KEY,
    category_code VARCHAR(50) UNIQUE NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    category_name_en VARCHAR(100),
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 添加注释
COMMENT ON TABLE hot_runner_categories IS '热流道主分类表';
COMMENT ON COLUMN hot_runner_categories.category_code IS '分类代码，如：flow_plate_category';
COMMENT ON COLUMN hot_runner_categories.category_name IS '分类名称，如：分流板大类';
COMMENT ON COLUMN hot_runner_categories.category_name_en IS '英文名称';
COMMENT ON COLUMN hot_runner_categories.is_active IS '是否启用';

-- 创建索引
CREATE INDEX idx_categories_code ON hot_runner_categories(category_code);
CREATE INDEX idx_categories_active ON hot_runner_categories(is_active);
CREATE INDEX idx_categories_sort ON hot_runner_categories(sort_order);

-- ========================================
-- 2. 二级分类表
-- ========================================
CREATE TABLE sub_categories (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT NOT NULL,
    sub_category_code VARCHAR(50) NOT NULL,
    sub_category_name VARCHAR(100) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 外键约束
    CONSTRAINT fk_sub_category_category 
        FOREIGN KEY (category_id) 
        REFERENCES hot_runner_categories(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- 添加注释
COMMENT ON TABLE sub_categories IS '热流道二级分类表';
COMMENT ON COLUMN sub_categories.category_id IS '关联主分类ID';
COMMENT ON COLUMN sub_categories.sub_category_code IS '子分类代码';
COMMENT ON COLUMN sub_categories.sub_category_name IS '子分类名称';

-- 创建索引
CREATE INDEX idx_sub_categories_category_id ON sub_categories(category_id);
CREATE INDEX idx_sub_categories_code ON sub_categories(sub_category_code);
CREATE INDEX idx_sub_categories_active ON sub_categories(is_active);

-- ========================================
-- 3. 属性定义表
-- ========================================
CREATE TABLE category_attributes (
    id BIGSERIAL PRIMARY KEY,
    sub_category_id BIGINT NOT NULL,
    attribute_code VARCHAR(50) NOT NULL,
    attribute_name VARCHAR(100) NOT NULL,
    attribute_type VARCHAR(20) NOT NULL CHECK (attribute_type IN ('ENUM', 'NUMERIC', 'BOOLEAN', 'TEXT')),
    description TEXT,
    is_required BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 外键约束
    CONSTRAINT fk_attribute_sub_category 
        FOREIGN KEY (sub_category_id) 
        REFERENCES sub_categories(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- 添加注释
COMMENT ON TABLE category_attributes IS '分类属性定义表';
COMMENT ON COLUMN category_attributes.sub_category_id IS '关联子分类ID';
COMMENT ON COLUMN category_attributes.attribute_code IS '属性代码';
COMMENT ON COLUMN category_attributes.attribute_name IS '属性名称';
COMMENT ON COLUMN category_attributes.attribute_type IS '属性类型：ENUM枚举, NUMERIC数值, BOOLEAN布尔, TEXT文本';
COMMENT ON COLUMN category_attributes.is_required IS '是否必填';

-- 创建索引
CREATE INDEX idx_attributes_sub_category_id ON category_attributes(sub_category_id);
CREATE INDEX idx_attributes_code ON category_attributes(attribute_code);
CREATE INDEX idx_attributes_type ON category_attributes(attribute_type);

-- ========================================
-- 4. 属性选项值表
-- ========================================
CREATE TABLE attribute_options (
    id BIGSERIAL PRIMARY KEY,
    attribute_id BIGINT NOT NULL,
    option_value VARCHAR(255) NOT NULL,
    option_label VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 外键约束
    CONSTRAINT fk_option_attribute 
        FOREIGN KEY (attribute_id) 
        REFERENCES category_attributes(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- 添加注释
COMMENT ON TABLE attribute_options IS '属性选项值表';
COMMENT ON COLUMN attribute_options.attribute_id IS '关联属性ID';
COMMENT ON COLUMN attribute_options.option_value IS '选项值';
COMMENT ON COLUMN attribute_options.option_label IS '选项显示标签';

-- 创建索引
CREATE INDEX idx_options_attribute_id ON attribute_options(attribute_id);
CREATE INDEX idx_options_value ON attribute_options(option_value);
CREATE INDEX idx_options_active ON attribute_options(is_active);

-- ========================================
-- 创建更新触发器函数
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有表添加更新时间触发器
CREATE TRIGGER update_hot_runner_categories_updated_at BEFORE UPDATE ON hot_runner_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sub_categories_updated_at BEFORE UPDATE ON sub_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_category_attributes_updated_at BEFORE UPDATE ON category_attributes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 创建有用的视图
-- ========================================

-- 视图1：完整的分类树视图
CREATE OR REPLACE VIEW v_category_tree AS
SELECT 
    c.id as category_id,
    c.category_code,
    c.category_name,
    c.description as category_description,
    sc.id as sub_category_id,
    sc.sub_category_code,
    sc.sub_category_name,
    sc.description as sub_category_description,
    ca.id as attribute_id,
    ca.attribute_code,
    ca.attribute_name,
    ca.attribute_type,
    ca.is_required
FROM hot_runner_categories c
LEFT JOIN sub_categories sc ON c.id = sc.category_id
LEFT JOIN category_attributes ca ON sc.id = ca.sub_category_id
WHERE c.is_active = true;

-- 视图2：包含选项值的完整数据字典视图
CREATE OR REPLACE VIEW v_full_dictionary AS
SELECT 
    c.category_name as 大类,
    sc.sub_category_name as 二级分类,
    ca.attribute_name as 属性名称,
    ca.attribute_type as 属性类型,
    ao.option_value as 选项值,
    ao.option_label as 选项标签,
    ca.is_required as 是否必填
FROM hot_runner_categories c
JOIN sub_categories sc ON c.id = sc.category_id
JOIN category_attributes ca ON sc.id = ca.sub_category_id
LEFT JOIN attribute_options ao ON ca.id = ao.attribute_id
WHERE c.is_active = true 
  AND sc.is_active = true
  AND (ao.is_active = true OR ao.is_active IS NULL)
ORDER BY c.sort_order, sc.sort_order, ca.sort_order, ao.sort_order;

-- ========================================
-- 插入示例数据
-- ========================================

-- 插入主分类数据
INSERT INTO hot_runner_categories (category_code, category_name, category_name_en, description, sort_order) VALUES
('flow_plate_category', '分流板大类', 'Flow Plate Category', '热流道系统分流板相关配置', 1),
('nozzle_category', '主射咀大类', 'Nozzle Category', '热流道系统主射咀相关配置', 2),
('hot_nozzle_category', '热咀大类', 'Hot Nozzle Category', '热流道系统热咀相关配置', 3),
('drive_system_category', '驱动系统', 'Drive System Category', '热流道系统驱动相关配置', 4);

-- ========================================
-- 数据字典维护函数
-- ========================================

-- 函数：获取完整的分类树
CREATE OR REPLACE FUNCTION get_category_tree()
RETURNS TABLE (
    category_id BIGINT,
    category_name VARCHAR,
    sub_category_id BIGINT,
    sub_category_name VARCHAR,
    attribute_id BIGINT,
    attribute_name VARCHAR,
    attribute_type VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.category_name,
        sc.id,
        sc.sub_category_name,
        ca.id,
        ca.attribute_name,
        ca.attribute_type
    FROM hot_runner_categories c
    LEFT JOIN sub_categories sc ON c.id = sc.category_id
    LEFT JOIN category_attributes ca ON sc.id = ca.sub_category_id
    WHERE c.is_active = true
    ORDER BY c.sort_order, sc.sort_order, ca.sort_order;
END;
$$ LANGUAGE plpgsql;

-- 函数：根据主分类ID获取所有子分类和属性
CREATE OR REPLACE FUNCTION get_category_details(p_category_id BIGINT)
RETURNS TABLE (
    sub_category_id BIGINT,
    sub_category_name VARCHAR,
    attribute_id BIGINT,
    attribute_name VARCHAR,
    attribute_type VARCHAR,
    option_values TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sc.id,
        sc.sub_category_name,
        ca.id,
        ca.attribute_name,
        ca.attribute_type,
        ARRAY(
            SELECT ao.option_value 
            FROM attribute_options ao 
            WHERE ao.attribute_id = ca.id AND ao.is_active = true
            ORDER BY ao.sort_order
        )
    FROM sub_categories sc
    LEFT JOIN category_attributes ca ON sc.id = ca.sub_category_id
    WHERE sc.category_id = p_category_id AND sc.is_active = true
    ORDER BY sc.sort_order, ca.sort_order;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 数据完整性约束
-- ========================================

-- 确保同一个子分类下的属性代码不重复
CREATE UNIQUE INDEX idx_unique_sub_category_attribute 
ON category_attributes(sub_category_id, attribute_code);

-- 确保同一个属性下的选项值不重复
CREATE UNIQUE INDEX idx_unique_attribute_option 
ON attribute_options(attribute_id, option_value);

-- ========================================
-- 权限设置（可选，根据实际需求调整）
-- ========================================

-- 创建数据库用户和角色
-- CREATE ROLE hot_runner_user WITH LOGIN PASSWORD 'your_password';
-- GRANT CONNECT ON DATABASE hot_runner_db TO hot_runner_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO hot_runner_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO hot_runner_user;

-- ========================================
-- 数据字典初始化完成
-- ========================================

-- 输出初始化信息
DO $$
BEGIN
    RAISE NOTICE '热流道数据字典表结构创建完成！';
    RAISE NOTICE '主分类表: hot_runner_categories';
    RAISE NOTICE '二级分类表: sub_categories';
    RAISE NOTICE '属性定义表: category_attributes';
    RAISE NOTICE '选项值表: attribute_options';
    RAISE NOTICE '视图: v_category_tree, v_full_dictionary';
    RAISE NOTICE '函数: get_category_tree(), get_category_details()';
END $$;
