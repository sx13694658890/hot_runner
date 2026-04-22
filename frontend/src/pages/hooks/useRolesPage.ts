import { useCallback, useEffect, useMemo, useState } from "react";

import { ApiError, apiFetch, formatApiDetail } from "@/lib/api";
import type { Permission, Role } from "@/lib/types";

export function useRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [perms, setPerms] = useState<Permission[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const [r, p] = await Promise.all([
        apiFetch<Role[]>("/roles"),
        apiFetch<Permission[]>("/roles/permissions"),
      ]);
      setRoles(r);
      setPerms(p);
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const byModule = useMemo(
    () =>
      perms.reduce<Record<string, Permission[]>>((acc, pr) => {
        (acc[pr.module] ??= []).push(pr);
        return acc;
      }, {}),
    [perms],
  );

  return { roles, err, loading, load, byModule };
}
