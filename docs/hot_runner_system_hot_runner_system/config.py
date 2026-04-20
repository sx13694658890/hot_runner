# -*- coding: utf-8 -*-
"""
热流道数据字典系统 - 配置文件
用于在已有项目中快速集成和配置
"""

# 数据库配置
DATABASE_CONFIG = {
    'host': 'localhost',          # 数据库主机地址
    'port': 5432,                 # 数据库端口
    'database': 'hot_runner_db',  # 数据库名称
    'user': 'postgres',           # 数据库用户名
    'password': 'your_password', # 数据库密码 - 请修改为实际密码
}

# Excel文件路径
EXCEL_FILE_PATH = '热流道.xlsx'

# 日志配置
LOGGING_CONFIG = {
    'level': 'INFO',              # 日志级别: DEBUG, INFO, WARNING, ERROR, CRITICAL
    'format': '%(asctime)s - %(levelname)s - %(message)s',
    'file': 'hot_runner_import.log',  # 日志文件路径
    'console': True               # 是否输出到控制台
}

# 数据导入配置
IMPORT_CONFIG = {
    'clear_existing_data': True,   # 导入前是否清理现有数据
    'verify_after_import': True,   # 导入后是否验证数据
    'save_parsed_json': True,     # 是否保存解析后的JSON数据
}

# 缓存配置（可选）
CACHE_CONFIG = {
    'enabled': False,             # 是否启用缓存
    'type': 'redis',              # 缓存类型: redis, memory
    'ttl': 3600,                  # 缓存过期时间（秒）
    'redis_config': {             # Redis配置（如果启用）
        'host': 'localhost',
        'port': 6379,
        'db': 0
    }
}

# 级联选择配置
CASCADE_CONFIG = {
    'max_depth': 4,               # 最大级联深度
    'allow_multiple': True,       # 是否允许多选
    'show_empty_options': False   # 是否显示空选项
}

# 项目集成配置
INTEGRATION_CONFIG = {
    'auto_create_tables': True,  # 自动创建数据库表
    'auto_import_data': True,     # 自动导入Excel数据
    'validate_schema': True,      # 验证数据库模式
    'backup_before_import': False # 导入前备份数据
}

# API配置（如果需要提供Web API）
API_CONFIG = {
    'enabled': False,             # 是否启用API
    'host': '0.0.0.0',           # API监听地址
    'port': 5000,                # API监听端口
    'prefix': '/api/v1',         # API路径前缀
    'cors_enabled': True         # 是否启用CORS
}

# 数据字典维护配置
MAINTENANCE_CONFIG = {
    'auto_update': False,        # 自动更新数据字典
    'check_interval': 3600,      # 检查间隔（秒）
    'backup_enabled': True,       # 启用备份
    'backup_path': './backups',  # 备份路径
    'backup_retention': 7        # 备份保留天数
}