import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";

export function useLoginPage() {
  const { token, user, login, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && user) navigate("/", { replace: true });
  }, [token, user, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearError();
    try {
      await login(username, password);
      navigate("/", { replace: true });
    } catch {
      /* error 已在 context */
    } finally {
      setLoading(false);
    }
  };

  return {
    token,
    user,
    error,
    username,
    setUsername,
    password,
    setPassword,
    loading,
    onSubmit,
  };
}
