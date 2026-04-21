import { Button, Layout as AntLayout, Menu, Typography } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";

const { Sider, Content } = AntLayout;

/** 与 Sider width 一致；主区用 marginLeft 占位，避免被 fixed 侧栏遮挡 */
const SIDER_WIDTH = 220;

type NavItem = {
  to: string;
  label: string;
  perm: string | null;
  anyPerm?: string[];
};

const navItems: NavItem[] = [
  { to: "/", label: "工作台", perm: null },
  { to: "/departments", label: "部门", perm: "department:read" },
  { to: "/positions", label: "岗位", perm: "position:read" },
  { to: "/users", label: "用户", perm: "user:read" },
  { to: "/roles", label: "角色权限", perm: "role:read" },
  { to: "/projects", label: "项目", perm: "project:read" },
  { to: "/rd/research", label: "研发项目", perm: "rd:read" },
  { to: "/rd/library-intakes", label: "成果入库", perm: "rd:read" },
  { to: "/field", label: "工艺与现场", perm: "field:read" },
  { to: "/integration", label: "ERP/BOM集成", perm: "integration:read" },
  { to: "/selection-catalog", label: "选型领域表", perm: "selection:read" },
  { to: "/selection-catalog/wizard", label: "选型向导", perm: "selection:read" },
  { to: "/selection-catalog/molds", label: "模具档案", perm: "selection:read" },
  { to: "/selection-catalog/hot-runners", label: "热流道列表", perm: "selection:read" },
  { to: "/selection-catalog/dict", label: "选型字典", perm: "selection:read" },
  { to: "/selection-catalog/manifold-dict", label: "分流板字典", perm: "selection:read" },
  { to: "/selection-catalog/main-nozzle-dict", label: "主射咀大类字典", perm: "selection:read" },
  { to: "/selection-catalog/hot-nozzle-dict", label: "热咀大类字典", perm: "selection:read" },
  { to: "/selection-catalog/drive-system-dict", label: "驱动系统字典", perm: "selection:read" },
  {
    to: "/standard-parts",
    label: "标准件图库",
    perm: null,
    anyPerm: ["standard_part:read", "drawing_version:read"],
  },
  { to: "/files", label: "文件", perm: null, anyPerm: ["file:read", "file:upload"] },
  { to: "/audit", label: "审计日志", perm: "audit:read" },
  { to: "/notifications", label: "通知", perm: null },
];

function visible(can: (code: string) => boolean, item: NavItem): boolean {
  if (item.anyPerm?.length) {
    return item.anyPerm.some((p) => can(p));
  }
  if (item.perm == null) return true;
  return can(item.perm);
}

/** 模具档案详情/新建/编辑挂在 /selection-catalog/mold/...，不得被父级 /selection-catalog 前缀匹配吞掉 */
function isMoldArchivePath(pathname: string): boolean {
  if (pathname === "/selection-catalog/mold/new") return true;
  return /^\/selection-catalog\/mold\/[^/]+(\/edit)?$/.test(pathname);
}

/** 长路径优先，避免 /selection-catalog 吞掉 /selection-catalog/dict */
function resolveMenuSelectedKey(pathname: string, can: (code: string) => boolean): string {
  const moldsNav = navItems.find((i) => i.to === "/selection-catalog/molds");
  if (moldsNav && isMoldArchivePath(pathname) && visible(can, moldsNav)) {
    return "/selection-catalog/molds";
  }
  const items = navItems.filter((item) => visible(can, item)).sort((a, b) => b.to.length - a.to.length);
  for (const item of items) {
    if (item.to === "/") {
      if (pathname === "/") return "/";
      continue;
    }
    if (pathname === item.to || pathname.startsWith(`${item.to}/`)) {
      return item.to;
    }
  }
  return "/";
}

export function Layout() {
  const { user, logout, can } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const selectedKey = resolveMenuSelectedKey(pathname, can);

  const menuItems = navItems
    .filter((item) => visible(can, item))
    .map((item) => ({
      key: item.to,
      label: item.label,
    }));

  return (
    <AntLayout style={{ minHeight: "100vh", height: "100vh", overflow: "hidden" }}>
      <Sider
        className="app-shell-sider"
        theme="light"
        width={SIDER_WIDTH}
        style={{
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          zIndex: 100,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid #f0f0f0",
        }}
      >
        <div style={{ flexShrink: 0, padding: "16px 16px 12px", borderBottom: "1px solid #f0f0f0" }}>
          <Typography.Text type="secondary" style={{ fontSize: 11, letterSpacing: 0.5 }}>
            技术管理端
          </Typography.Text>
          <Typography.Title level={5} style={{ margin: "4px 0 0", fontWeight: 600 }}>
            M0 基础平台
          </Typography.Title>
        </div>
        <div
          role="navigation"
          aria-label="主导航"
          className="app-scrollbar sider-nav-scroll"
          style={{ flex: 1, minHeight: 0, overflow: "auto" }}
        >
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            style={{ borderInlineEnd: 0, paddingBlock: 4 }}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
          />
        </div>
        <div style={{ flexShrink: 0, padding: 12, borderTop: "1px solid #f0f0f0" }}>
          <Typography.Text ellipsis style={{ display: "block", fontSize: 12, color: "#8c8c8c" }}>
            {user?.full_name}
          </Typography.Text>
          <Typography.Text
            ellipsis
            style={{ display: "block", fontSize: 11, fontFamily: "monospace", color: "#bfbfbf" }}
          >
            {user?.username}
          </Typography.Text>
          <Button size="small" block style={{ marginTop: 8 }} onClick={() => {
            logout();
            navigate("/login", { replace: true });
          }}>
            退出登录
          </Button>
        </div>
      </Sider>
      <AntLayout
        style={{
          marginLeft: SIDER_WIDTH,
          height: "100vh",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          background: "#f5f5f5",
        }}
      >
        <Content
          className="app-scrollbar"
          style={{
            flex: 1,
            minHeight: 0,
            overflow: "auto",
            padding: 24,
            overscrollBehavior: "contain",
          }}
        >
          <div style={{ maxWidth: 1152, margin: "0 auto" }}>
            <Outlet />
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
