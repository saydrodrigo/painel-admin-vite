import React from "react";
import { Typography, Paper } from "@mui/material";

function Dashboard() {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Bem-vindo ao Painel
      </Typography>
      <Typography variant="body1">
        Aqui você pode visualizar informações do sistema.
      </Typography>
    </Paper>
  );
}

export default Dashboard;
