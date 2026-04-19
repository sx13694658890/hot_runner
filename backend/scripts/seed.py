"""初始化权限、角色与 M0 演示账号。迁移完成后执行: uv run python scripts/seed.py"""

from __future__ import annotations

import asyncio
import uuid

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.department import Department
from app.models.notification import Notification
from app.models.permission import Permission
from app.models.position import Position
from app.models.project import Project, ProjectMember
from app.models.role import Role, RolePermission, UserRole
from app.models.user import User
from app.security import hash_password

PERMISSIONS: list[tuple[str, str, str]] = [
    ("department:read", "部门查看", "org"),
    ("department:write", "部门维护", "org"),
    ("position:read", "岗位查看", "org"),
    ("position:write", "岗位维护", "org"),
    ("user:read", "用户查看", "iam"),
    ("user:write", "用户维护", "iam"),
    ("role:read", "角色与权限查看", "iam"),
    ("role:assign", "分配用户角色", "iam"),
    ("project:read", "项目查看", "pmo"),
    ("project:write", "项目维护", "pmo"),
    ("project:member:manage", "项目成员管理", "pmo"),
    ("file:upload", "文件上传", "file"),
    ("file:read", "文件元数据查看", "file"),
    ("audit:read", "审计日志查看", "audit"),
    ("notification:write", "发送站内通知", "notify"),
    ("wbs:read", "WBS任务查看", "pmo"),
    ("wbs:write", "WBS任务维护", "pmo"),
    ("milestone:read", "里程碑查看", "pmo"),
    ("milestone:write", "里程碑维护", "pmo"),
    ("risk:read", "风险登记查看", "pmo"),
    ("risk:write", "风险登记维护", "pmo"),
    ("design_task:read", "设计任务查看", "pmo"),
    ("design_task:write", "设计任务维护", "pmo"),
    ("design_change:read", "设计变更查看", "pmo"),
    ("design_change:write", "设计变更维护", "pmo"),
    ("selection:read", "选型存根查看", "pmo"),
    ("selection:write", "选型存根维护", "pmo"),
    ("standard_part:read", "标准件查看", "library"),
    ("standard_part:write", "标准件维护", "library"),
    ("drawing_version:read", "图纸版本查看", "library"),
    ("drawing_version:write", "图纸版本维护", "library"),
    ("rd:read", "研发域查看", "rd"),
    ("rd:write", "研发域维护", "rd"),
    ("rd:intake_approve", "研发成果入库审批", "rd"),
    ("field:read", "工艺与现场查看", "field"),
    ("field:write", "工艺与现场维护", "field"),
    ("dashboard:read", "驾驶舱与KPI查看", "cockpit"),
    ("integration:read", "集成作业查看", "integration"),
    ("integration:write", "集成作业触发", "integration"),
]

DESIGNER_CODES = {
    "department:read",
    "position:read",
    "user:read",
    "role:read",
    "project:read",
    "file:upload",
    "file:read",
    "wbs:read",
    "wbs:write",
    "milestone:read",
    "risk:read",
    "design_task:read",
    "design_task:write",
    "design_change:read",
    "design_change:write",
    "selection:read",
    "selection:write",
    "standard_part:read",
    "drawing_version:read",
    "field:read",
    "dashboard:read",
    "integration:read",
}


async def main() -> None:
    async with AsyncSessionLocal() as db:
        existing = await db.execute(select(Role.id).where(Role.code == "admin"))
        if existing.scalar_one_or_none():
            print("已存在 admin 角色，跳过 seed")
            return

        perm_map: dict[str, uuid.UUID] = {}
        for code, name, module in PERMISSIONS:
            p = Permission(code=code, name=name, module=module)
            db.add(p)
            await db.flush()
            perm_map[code] = p.id

        admin_role = Role(
            name="系统管理员", code="admin", description="M0 全权限演示角色"
        )
        designer_role = Role(
            name="设计工程师", code="designer", description="M0 受限演示角色"
        )
        db.add_all([admin_role, designer_role])
        await db.flush()

        for pid in perm_map.values():
            db.add(RolePermission(role_id=admin_role.id, permission_id=pid))
        for code in DESIGNER_CODES:
            db.add(RolePermission(role_id=designer_role.id, permission_id=perm_map[code]))

        dept = Department(name="技术中心", code="ROOT-TECH", parent_id=None, sort_order=0)
        db.add(dept)
        await db.flush()

        pos = Position(name="高级工程师", code="SR-ENG", department_id=dept.id)
        db.add(pos)
        await db.flush()

        admin_user = User(
            username="admin",
            email="admin@example.com",
            hashed_password=hash_password("Admin123456"),
            full_name="系统管理员",
            is_active=True,
            is_superuser=True,
            department_id=dept.id,
            position_id=pos.id,
        )
        designer_user = User(
            username="designer",
            email="designer@example.com",
            hashed_password=hash_password("Designer123456"),
            full_name="演示设计工程师",
            is_active=True,
            is_superuser=False,
            department_id=dept.id,
            position_id=pos.id,
        )
        db.add_all([admin_user, designer_user])
        await db.flush()

        db.add(UserRole(user_id=admin_user.id, role_id=admin_role.id))
        db.add(UserRole(user_id=designer_user.id, role_id=designer_role.id))

        proj = Project(name="演示项目", code="DEMO-001", status="active")
        db.add(proj)
        await db.flush()
        db.add(
            ProjectMember(
                project_id=proj.id, user_id=designer_user.id, role_in_project="member"
            )
        )

        db.add(
            Notification(
                user_id=designer_user.id,
                title="欢迎使用技术管理端",
                body=(
                    "请使用 designer / Designer123456 登录验证权限；"
                    "管理员为 admin / Admin123456。"
                ),
                channel="in_app",
            )
        )

        await db.commit()
        print("Seed 完成: admin / Admin123456 , designer / Designer123456")


if __name__ == "__main__":
    asyncio.run(main())
