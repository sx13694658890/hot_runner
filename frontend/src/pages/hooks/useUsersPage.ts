import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { ApiError, apiFetch, formatApiDetail } from "@/lib/api";
import type { Department, Position, Role, UserRead, UUID } from "@/lib/types";

export function useUsersPage() {
  const { can, user: currentUser } = useAuth();
  const canAssignRoles = Boolean(currentUser?.is_superuser || can("role:assign"));

  const [users, setUsers] = useState<UserRead[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRead | null>(null);
  const [assignUser, setAssignUser] = useState<UserRead | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Set<UUID>>(new Set());
  const [saving, setSaving] = useState(false);

  const [cUsername, setCUsername] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPassword, setCPassword] = useState("");
  const [cFullName, setCFullName] = useState("");
  const [cDept, setCDept] = useState("");
  const [cPos, setCPos] = useState("");
  const [cRoleIds, setCRoleIds] = useState<Set<UUID>>(new Set());

  const [eEmail, setEEmail] = useState("");
  const [eFullName, setEFullName] = useState("");
  const [eActive, setEActive] = useState(true);
  const [ePassword, setEPassword] = useState("");
  const [eDept, setEDept] = useState("");
  const [ePos, setEPos] = useState("");

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const u = await apiFetch<UserRead[]>("/users");
      setUsers(u);
      try {
        const r = await apiFetch<Role[]>("/roles");
        setRoles(r);
      } catch {
        setRoles([]);
      }
      try {
        const [d, p] = await Promise.all([
          apiFetch<Department[]>("/departments"),
          apiFetch<Position[]>("/positions"),
        ]);
        setDepartments(d);
        setPositions(p);
      } catch {
        setDepartments([]);
        setPositions([]);
      }
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleRole = (id: UUID, set: Set<UUID>, update: (s: Set<UUID>) => void) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    update(next);
  };

  const submitCreate = async () => {
    setSaving(true);
    setErr(null);
    try {
      await apiFetch<UserRead>("/users", {
        method: "POST",
        body: {
          username: cUsername,
          email: cEmail,
          password: cPassword,
          full_name: cFullName,
          department_id: cDept || null,
          position_id: cPos || null,
          is_active: true,
          role_ids: [...cRoleIds],
        },
      });
      setCreateOpen(false);
      setCUsername("");
      setCEmail("");
      setCPassword("");
      setCFullName("");
      setCDept("");
      setCPos("");
      setCRoleIds(new Set());
      await load();
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "创建失败");
    } finally {
      setSaving(false);
    }
  };

  const submitEdit = async () => {
    if (!editUser) return;
    setSaving(true);
    setErr(null);
    try {
      const body: Record<string, unknown> = {
        email: eEmail,
        full_name: eFullName,
        is_active: eActive,
        department_id: eDept || null,
        position_id: ePos || null,
      };
      if (ePassword.trim()) body.password = ePassword;
      await apiFetch(`/users/${editUser.id}`, { method: "PATCH", body });
      setEditUser(null);
      await load();
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "更新失败");
    } finally {
      setSaving(false);
    }
  };

  const submitAssign = async () => {
    if (!assignUser) return;
    setSaving(true);
    setErr(null);
    try {
      await apiFetch(`/users/${assignUser.id}/roles`, {
        method: "POST",
        body: { role_ids: [...selectedRoles] },
      });
      setAssignUser(null);
      await load();
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "分配失败");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (u: UserRead) => {
    setEditUser(u);
    setEEmail(u.email);
    setEFullName(u.full_name);
    setEActive(u.is_active);
    setEPassword("");
    setEDept(u.department_id ?? "");
    setEPos(u.position_id ?? "");
  };

  const openAssign = (u: UserRead) => {
    setAssignUser(u);
    setSelectedRoles(new Set());
  };

  return {
    can,
    canAssignRoles,
    users,
    roles,
    departments,
    positions,
    err,
    loading,
    createOpen,
    setCreateOpen,
    editUser,
    setEditUser,
    assignUser,
    setAssignUser,
    selectedRoles,
    saving,
    cUsername,
    setCUsername,
    cEmail,
    setCEmail,
    cPassword,
    setCPassword,
    cFullName,
    setCFullName,
    cDept,
    setCDept,
    cPos,
    setCPos,
    cRoleIds,
    setCRoleIds,
    eEmail,
    setEEmail,
    eFullName,
    setEFullName,
    eActive,
    setEActive,
    ePassword,
    setEPassword,
    eDept,
    setEDept,
    ePos,
    setEPos,
    toggleRole,
    submitCreate,
    submitEdit,
    submitAssign,
    openEdit,
    openAssign,
    setSelectedRoles,
  };
}
