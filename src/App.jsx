import { Box } from "@mui/material";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import Maquinas from "./pages/Maquinas";
import Users from "./pages/Users";
import { useState } from "react";

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: "flex" }}>
      <Topbar onMenuClick={handleDrawerToggle} />
      <Sidebar
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
      />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Box sx={{ height: "64px" }} /> {/* espaço para a Topbar */}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/maquinas/:codmaq" element={<Maquinas />} />
          <Route path="/usuarios" element={<Users />} />
        </Routes>
      </Box>
    </Box>
  );
}
