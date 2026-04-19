from fastapi import APIRouter

from app.api.v1.endpoints import (
    audit_logs,
    auth,
    departments,
    field_site,
    files,
    notifications,
    p5_integration,
    positions,
    project_work,
    projects,
    rd_research,
    roles,
    selection_catalog,
    selection_dict,
    standard_parts,
    users,
)

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(departments.router, prefix="/departments", tags=["departments"])
api_router.include_router(positions.router, prefix="/positions", tags=["positions"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(roles.router, prefix="/roles", tags=["roles"])
api_router.include_router(project_work.router, prefix="/projects", tags=["pmo"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(standard_parts.router, prefix="/standard-parts", tags=["library"])
api_router.include_router(files.router, prefix="/files", tags=["files"])
api_router.include_router(audit_logs.router, prefix="/audit-logs", tags=["audit"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(rd_research.router, prefix="/rd", tags=["rd"])
api_router.include_router(field_site.router, prefix="/field", tags=["field"])
api_router.include_router(p5_integration.dashboard_router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(p5_integration.integration_router, prefix="/integration", tags=["integration"])
api_router.include_router(
    selection_catalog.router,
    prefix="/selection-catalog",
    tags=["selection-catalog"],
)
api_router.include_router(
    selection_dict.router,
    prefix="/selection-catalog",
    tags=["selection-catalog"],
)
