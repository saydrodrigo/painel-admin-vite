import React, { useState, useEffect } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  useMediaQuery,
  useTheme,
  CircularProgress,
} from "@mui/material";
import {
  ExpandLess,
  ExpandMore,
  Build as BuildIcon,
  List as ListIcon,
  Add as AddIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Assessment as AssessmentIcon
} from "@mui/icons-material";
import { NavLink } from "react-router-dom";
import MaquinaCalendarioVisual from "./MaquinaCalendarioVisual"; // ajuste o caminho
import { useAuth } from "../context/AuthContext";
import { getMaquinas } from '../api/maquinas';
const drawerWidth = 240;

export default function Sidebar({ mobileOpen, handleDrawerToggle }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [openMaquinas, setOpenMaquinas] = useState(false);
  const [maquinas, setMaquinas] = useState(null); // null = carregando
  const [maquinaSelecionada, setMaquinaSelecionada] = useState(null);

  const toggleMaquinas = () => setOpenMaquinas(!openMaquinas);
  const { usuario } = useAuth(); // <- acesso global ao usuário
  
  useEffect(() => {
    const carregarMaquinas = async () => {
      try {
        const data = await getMaquinas(usuario.empresa);
        setMaquinas(data);
      } catch (error) {
        setErro(error.message);
        setMaquinas([]);
      }
    };

    carregarMaquinas();
  }, [usuario]);

  const drawer = (
    <List>
      {/* Dashboard */}
      <ListItem
        button
        component={NavLink}
        to="/"
        onClick={isMobile ? handleDrawerToggle : undefined}
        sx={{ "&.active": { backgroundColor: "rgba(0,0,0,0.08)" } }}
      >
        <ListItemIcon>
          <DashboardIcon />
        </ListItemIcon>
        <ListItemText primary="Dashboard" />
      </ListItem>

      {/* Máquinas com submenu dinâmico */}
      <ListItem button onClick={toggleMaquinas}>
        <ListItemIcon>
          <BuildIcon />
        </ListItemIcon>
        <ListItemText primary="Máquinas" />
        {openMaquinas ? <ExpandLess /> : <ExpandMore />}
      </ListItem>

      <Collapse in={openMaquinas} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {maquinas === null && (
            <ListItem sx={{ pl: 4 }}>
              <CircularProgress size={20} />
              <ListItemText primary="Carregando..." sx={{ ml: 1 }} />
            </ListItem>
          )}

          {maquinas && maquinas.length === 0 && (
            <ListItem sx={{ pl: 4 }}>
              <ListItemText primary="Nenhuma máquina encontrada" />
            </ListItem>
          )}

          {maquinas &&
            maquinas.map(({ codmqp, nome }) => (
              <ListItem
                button
                key={codmqp}
                component={NavLink}
                to={`/maquinas/${codmqp}`}
                state={{ nome }}
                o onClick={() => {
                  setMaquinaSelecionada(codmqp);
                  if (isMobile) handleDrawerToggle();
                }}
                sx={{ pl: 4 }}
              >
                <ListItemIcon>
                  <ListIcon />
                </ListItemIcon>
                <ListItemText primary={nome} />
              </ListItem>
            ))}

          {/* Item fixo "Cadastrar" */}
          <ListItem
            button
            component={NavLink}
            to="/maquinas/cadastrar"
            onClick={isMobile ? handleDrawerToggle : undefined}
            sx={{ pl: 4 }}
          >
            <ListItemIcon>
              <AddIcon />
            </ListItemIcon>
            <ListItemText primary="Cadastrar" />
          </ListItem>
        </List>
      </Collapse>
      {/* Usuários */}
      <ListItem
        button
        component={NavLink}
        to="/op"
        onClick={isMobile ? handleDrawerToggle : undefined}
        sx={{ "&.active": { backgroundColor: "rgba(0,0,0,0.08)" } }}
      >
        <ListItemIcon>
          <AssignmentIcon />
        </ListItemIcon>
        <ListItemText primary="Ordem Produção" />
      </ListItem>

      {/* Usuários */}
      <ListItem
        button
        component={NavLink}
        to="/operadores"
        onClick={isMobile ? handleDrawerToggle : undefined}
        sx={{ "&.active": { backgroundColor: "rgba(0,0,0,0.08)" } }}
      >
        <ListItemIcon>
          <PeopleIcon />
        </ListItemIcon>
        <ListItemText primary="Operadores" />
      </ListItem>
      <ListItem
        button
        component={NavLink}
        to="/mrp"
        onClick={isMobile ? handleDrawerToggle : undefined}
        sx={{ "&.active": { backgroundColor: "rgba(0,0,0,0.08)" } }}
      >
        <ListItemIcon>
          <AssessmentIcon />
        </ListItemIcon>
        <ListItemText primary="MRP" />
      </ListItem>
      <ListItem
        button
        component={NavLink}
        to="/mrpPorOp"
        onClick={isMobile ? handleDrawerToggle : undefined}
        sx={{ "&.active": { backgroundColor: "rgba(0,0,0,0.08)" } }}
      ><ListItemIcon>
          <AssessmentIcon />
        </ListItemIcon>
        <ListItemText primary="MRP Por OP" />
      </ListItem>
    </List>
  );

  return isMobile ? (
    <Drawer
      variant="temporary"
      open={mobileOpen}
      onClose={handleDrawerToggle}
      ModalProps={{ keepMounted: true }}
      sx={{
        zIndex: (theme) => theme.zIndex.appBar + 1,
        [`& .MuiDrawer-paper`]: { width: drawerWidth },
      }}
    >
      {drawer}
    </Drawer>
  ) : (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          top: "64px",
          height: "calc(100% - 64px)",
        },
      }}
      open
    >
      {drawer}
      {maquinaSelecionada && (
        <div style={{ padding: "16px" }}>
          <MaquinaCalendarioVisual codmaq={maquinaSelecionada} />
        </div>
      )}
    </Drawer>
  );
}
