// src/components/Topbar.jsx
import { AppBar, Toolbar, Typography, Box, IconButton, Button } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircle from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Topbar({ onMenuClick }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton color="inherit" edge="start" onClick={onMenuClick} sx={{ mr: 2 }}>
          <MenuIcon />
        </IconButton>

        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          Sistema de Produção
        </Typography>

        {usuario && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <AccountCircle />
            <Typography>{usuario.nome}</Typography>
            <Button
              onClick={handleLogout}
              variant="outlined"
              color="inherit"
              size="small"
              startIcon={<LogoutIcon />}
            >
              Sair
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
