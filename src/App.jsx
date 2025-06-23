import { Box } from "@mui/material";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import Maquinas from "./pages/Maquinas";
import Users from "./pages/Users";
import { useState } from "react";
import OrdemProducao from "./pages/OrdemProducao";
import Operadores from "./pages/Operadores";
import Mrp from "./pages/Mrp";
import MrpPorOP from "./pages/MrpPorOp";
import Login from "./pages/Login";
import RotasPrivadas from "./components/RotasPrivadas";
import RequireAuth from "./components/RequireAuth";
import { useAuth } from "./context/AuthContext";

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { usuario } = useAuth(); // 👈
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: "flex" }}>
      {usuario && (
        <>
          <Topbar onMenuClick={handleDrawerToggle} />
          <Sidebar
            mobileOpen={mobileOpen}
            handleDrawerToggle={handleDrawerToggle}
          />
        </>
      )}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Box sx={{ height: "64px" }} /> {/* espaço para a Topbar */}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <RequireAuth>
                <RotasPrivadas />
              </RequireAuth>
            }
          />

        </Routes>
      </Box>
    </Box>
  );
}
