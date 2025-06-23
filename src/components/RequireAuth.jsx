// src/components/RequireAuth.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireAuth({ children }) {
  const { usuario, carregando } = useAuth();
  const location = useLocation();

  if (carregando) {
    return <div>Carregando...</div>; // ou um spinner bonito
  }

  if (!usuario) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
