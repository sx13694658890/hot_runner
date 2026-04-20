#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
热流道数据字典导入工具
基于热流道.xlsx文件生成完整的数据字典并导入PostgreSQL数据库
"""

import pandas as pd
import json
import psycopg2
from psycopg2 import sql, extras
from datetime import datetime
from typing import List, Dict, Any
import logging
import sys

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('hot_runner_import.log')
    ]
)
logger = logging.getLogger(__name__)

class HotRunnerDataImporter:
    """热流道数据字典导入器"""
    
    def __init__(self, db_config: Dict[str, str]):
        """
        初始化导入器
        
        Args:
            db_config: 数据库配置字典
                {
                    'host': 'localhost',
                    'port': 5432,
                    'database': 'hot_runner_db',
                    'user': 'postgres',
                    'password': 'your_password'
                }
        """
        self.db_config = db_config
        self.conn = None
        self.data = None
        
    def connect(self):
        """连接数据库"""
        try:
            self.conn = psycopg2.connect(**self.db_config)
            self.conn.autocommit = False
            logger.info("数据库连接成功")
        except Exception as e:
            logger.error(f"数据库连接失败: {e}")
            raise
            
    def disconnect(self):
        """断开数据库连接"""
        if self.conn:
            self.conn.close()
            logger.info("数据库连接已关闭")
            
    def read_excel_data(self, file_path: str):
        """
        读取Excel文件并解析数据结构
        
        Args:
            file_path: Excel文件路径
        """
        logger.info(f"开始读取Excel文件: {file_path}")
        
        try:
            xls = pd.ExcelFile(file_path)
            self.data = []
            
            for sheet_name in xls.sheet_names:
                logger.info(f"处理工作表: {sheet_name}")
                sheet_data = self._extract_sheet_data(sheet_name, xls)
                self.data.append(sheet_data)
                
            # 保存解析的JSON数据
            with open('hot_runner_parsed_data.json', 'w', encoding='utf-8') as f:
                json.dump(self.data, f, ensure_ascii=False, indent=2)
                
            logger.info(f"Excel数据读取完成，共处理 {len(self.data)} 个工作表")
            
        except Exception as e:
            logger.error(f"读取Excel文件失败: {e}")
            raise
            
    def _extract_sheet_data(self, sheet_name: str, xls) -> Dict[str, Any]:
        """
        提取单个工作表的数据结构
        
        Args:
            sheet_name: 工作表名称
            xls: Excel文件对象
            
        Returns:
            工作表数据字典
        """
        df = pd.read_excel(file_path, sheet_name=sheet_name, header=None)
        
        result = {
            'sheet_name': sheet_name,
            'main_category': None,
            'category_code': None,
            'sub_categories': []
        }
        
        current_level1 = None  # 大类
        current_level2 = None  # 中类
        
        for idx, row in df.iterrows():
            # 第一列：大类
            if pd.notna(row[0]) and '表格' not in str(row[0]) and len(str(row[0])) > 2:
                current_level1 = str(row[0]).strip()
                result['main_category'] = current_level1
                # 生成英文代码
                result['category_code'] = self._generate_category_code(current_level1)
                current_level2 = None
                
            # 第二列：中类
            elif pd.notna(row[1]) and str(row[1]).strip() and len(str(row[1])) > 1:
                current_level2 = str(row[1]).strip()
                
                # 检查第三列是否有属性名
                if pd.notna(row[2]) and str(row[2]).strip():
                    attribute_name = str(row[2]).strip()
                    
                    # 提取所有选项值（从第4列开始）
                    options = []
                    for col_idx in range(3, len(row)):
                        if pd.notna(row[col_idx]) and str(row[col_idx]).strip():
                            options.append(str(row[col_idx]).strip())
                    
                    # 判断属性类型
                    attribute_type = self._determine_attribute_type(options)
                    
                    # 构建子类数据
                    sub_category = {
                        'sub_category_name': current_level2,
                        'sub_category_code': self._generate_sub_category_code(current_level2),
                        'attributes': [{
                            'attribute_name': attribute_name,
                            'attribute_code': self._generate_attribute_code(attribute_name),
                            'attribute_type': attribute_type,
                            'options': options
                        }]
                    }
                    result['sub_categories'].append(sub_category)
                    
        return result
        
    def _generate_category_code(self, category_name: str) -> str:
        """生成主分类代码"""
        # 简单的拼音或英文映射
        code_map = {
            '分流板大类': 'flow_plate_category',
            '主射咀大类': 'nozzle_category', 
            '热咀大类': 'hot_nozzle_category',
            '驱动系统': 'drive_system_category'
        }
        return code_map.get(category_name, category_name.lower().replace(' ', '_'))
        
    def _generate_sub_category_code(self, sub_category_name: str) -> str:
        """生成子分类代码"""
        # 移除特殊字符，使用拼音或英文
        import re
        code = re.sub(r'[^\w]', '_', sub_category_name.lower())
        return code[:50]  # 限制长度
        
    def _generate_attribute_code(self, attribute_name: str) -> str:
        """生成属性代码"""
        import re
        code = re.sub(r'[^\w]', '_', attribute_name.lower())
        return code[:50]  # 限制长度
        
    def _determine_attribute_type(self, options: List[str]) -> str:
        """判断属性类型"""
        if not options:
            return 'TEXT'
            
        # 检查是否都是数字
        try:
            [float(opt.replace('φ', '').replace('-', '')) for opt in options if opt]
            return 'NUMERIC'
        except (ValueError, TypeError):
            pass
            
        # 如果有多个选项，则为枚举类型
        if len(options) > 0:
            return 'ENUM'
            
        return 'TEXT'
        
    def clear_existing_data(self):
        """清理现有数据"""
        logger.info("开始清理现有数据...")
        
        try:
            with self.conn.cursor() as cursor:
                # 按外键顺序删除
                cursor.execute("DELETE FROM attribute_options")
                cursor.execute("DELETE FROM category_attributes")
                cursor.execute("DELETE FROM sub_categories")
                cursor.execute("DELETE FROM hot_runner_categories")
                
                self.conn.commit()
                logger.info("现有数据清理完成")
                
        except Exception as e:
            self.conn.rollback()
            logger.error(f"清理数据失败: {e}")
            raise
            
    def import_data(self):
        """导入数据到数据库"""
        if not self.data:
            logger.error("没有可导入的数据")
            return
            
        logger.info("开始导入数据到数据库...")
        
        try:
            with self.conn.cursor() as cursor:
                # 导入主分类
                category_map = {}  # {category_name: category_id}
                for sheet_data in self.data:
                    if sheet_data['main_category'] and sheet_data['category_code']:
                        cursor.execute("""
                            INSERT INTO hot_runner_categories 
                            (category_code, category_name, description, sort_order)
                            VALUES (%s, %s, %s, %s)
                            RETURNING id
                        """, (
                            sheet_data['category_code'],
                            sheet_data['main_category'],
                            f"{sheet_data['main_category']}相关配置",
                            len(category_map) + 1
                        ))
                        
                        category_id = cursor.fetchone()[0]
                        category_map[sheet_data['main_category']] = category_id
                        logger.info(f"导入主分类: {sheet_data['main_category']} (ID: {category_id})")
                
                # 导入子分类和属性
                for sheet_data in self.data:
                    category_id = category_map.get(sheet_data['main_category'])
                    if not category_id:
                        continue
                        
                    for sub_cat in sheet_data['sub_categories']:
                        # 插入子分类
                        cursor.execute("""
                            INSERT INTO sub_categories 
                            (category_id, sub_category_code, sub_category_name, description, sort_order)
                            VALUES (%s, %s, %s, %s, %s)
                            RETURNING id
                        """, (
                            category_id,
                            sub_cat['sub_category_code'],
                            sub_cat['sub_category_name'],
                            f"{sheet_data['main_category']} - {sub_cat['sub_category_name']}",
                            len(sub_cat['sub_category_code'])  # 简单排序
                        ))
                        
                        sub_category_id = cursor.fetchone()[0]
                        logger.info(f"导入子分类: {sub_cat['sub_category_name']} (ID: {sub_category_id})")
                        
                        # 插入属性
                        for attr in sub_cat['attributes']:
                            cursor.execute("""
                                INSERT INTO category_attributes 
                                (sub_category_id, attribute_code, attribute_name, attribute_type, description)
                                VALUES (%s, %s, %s, %s, %s)
                                RETURNING id
                            """, (
                                sub_category_id,
                                attr['attribute_code'],
                                attr['attribute_name'],
                                attr['attribute_type'],
                                f"{sub_cat['sub_category_name']} - {attr['attribute_name']}"
                            ))
                            
                            attribute_id = cursor.fetchone()[0]
                            logger.info(f"导入属性: {attr['attribute_name']} (ID: {attribute_id}, 类型: {attr['attribute_type']})")
                            
                            # 插入选项值
                            for idx, option_value in enumerate(attr['options']):
                                cursor.execute("""
                                    INSERT INTO attribute_options 
                                    (attribute_id, option_value, option_label, sort_order)
                                    VALUES (%s, %s, %s, %s)
                                """, (
                                    attribute_id,
                                    option_value,
                                    option_value,  # 使用相同的值作为标签
                                    idx + 1
                                ))
                                
                                logger.debug(f"导入选项: {option_value}")
                
                self.conn.commit()
                logger.info("数据导入完成！")
                
        except Exception as e:
            self.conn.rollback()
            logger.error(f"数据导入失败: {e}")
            raise
            
    def verify_data(self):
        """验证导入的数据"""
        logger.info("开始验证导入的数据...")
        
        try:
            with self.conn.cursor() as cursor:
                # 统计数据
                cursor.execute("SELECT COUNT(*) FROM hot_runner_categories")
                category_count = cursor.fetchone()[0]
                
                cursor.execute("SELECT COUNT(*) FROM sub_categories")
                sub_category_count = cursor.fetchone()[0]
                
                cursor.execute("SELECT COUNT(*) FROM category_attributes")
                attribute_count = cursor.fetchone()[0]
                
                cursor.execute("SELECT COUNT(*) FROM attribute_options")
                option_count = cursor.fetchone()[0]
                
                logger.info("数据验证结果:")
                logger.info(f"  主分类数量: {category_count}")
                logger.info(f"  子分类数量: {sub_category_count}")
                logger.info(f"  属性数量: {attribute_count}")
                logger.info(f"  选项值数量: {option_count}")
                
                # 验证数据完整性
                cursor.execute("""
                    SELECT c.category_name, COUNT(sc.id) as sub_count
                    FROM hot_runner_categories c
                    LEFT JOIN sub_categories sc ON c.id = sc.category_id
                    GROUP BY c.id, c.category_name
                    ORDER BY c.sort_order
                """)
                
                logger.info("\n主分类统计:")
                for row in cursor.fetchall():
                    logger.info(f"  {row[0]}: {row[1]} 个子分类")
                    
        except Exception as e:
            logger.error(f"数据验证失败: {e}")
            raise
            
    def run(self, excel_file: str, clear_data: bool = True):
        """
        执行完整的导入流程
        
        Args:
            excel_file: Excel文件路径
            clear_data: 是否清理现有数据
        """
        try:
            # 连接数据库
            self.connect()
            
            # 读取Excel数据
            self.read_excel_data(excel_file)
            
            # 清理现有数据
            if clear_data:
                self.clear_existing_data()
                
            # 导入数据
            self.import_data()
            
            # 验证数据
            self.verify_data()
            
            logger.info("数据字典导入流程完成！")
            
        finally:
            # 断开连接
            self.disconnect()


def main():
    """主函数"""
    # 数据库配置 - 请根据实际情况修改
    db_config = {
        'host': 'localhost',      # 数据库主机
        'port': 5432,             # 数据库端口
        'database': 'hot_runner_db',  # 数据库名称
        'user': 'postgres',        # 数据库用户名
        'password': 'your_password'  # 数据库密码
    }
    
    # Excel文件路径
    excel_file = '热流道.xlsx'
    
    # 创建导入器实例
    importer = HotRunnerDataImporter(db_config)
    
    # 执行导入
    try:
        importer.run(excel_file, clear_data=True)
    except Exception as e:
        logger.error(f"导入失败: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()