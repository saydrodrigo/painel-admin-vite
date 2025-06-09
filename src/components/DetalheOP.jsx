import React from "react";
import { Box, Typography, Divider, Grid, Paper } from "@mui/material";
import { format, parseISO } from "date-fns";

export default function DetalheOP({ op }) {
  if (!op) return null;

  const formatarData = (data) =>
    data ? format(parseISO(data), "dd/MM/yyyy HH:mm") : "—";

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Ordem de Produção #{op.NUOP}
      </Typography>

      <Divider sx={{ mb: 2 }} />

      {/* Produto + Parceiro */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2">Produto</Typography>
          <Typography>{op.PRODUTO || "—"}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2">Parceiro</Typography>
          <Typography>{op.PARCEIRO || "—"}</Typography>
        </Grid>
      </Grid>

      {/* Quantidade + Status */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={6} sm={3}>
          <Typography variant="subtitle2">Qtd Produção</Typography>
          <Typography>{op.QTDPRODUCAO || "—"}</Typography>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Typography variant="subtitle2">Qtd Produzida</Typography>
          <Typography>{op.QTDREAL || "—"}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2">Status</Typography>
          <Typography>{op.STATUS || "—"}</Typography>
        </Grid>
      </Grid>

      {/* Datas */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={6} sm={4}>
          <Typography variant="subtitle2">Data de Entrega</Typography>
          <Typography>{formatarData(op.DTENTREGA)}</Typography>
        </Grid>
        <Grid item xs={6} sm={4}>
          <Typography variant="subtitle2">Início</Typography>
          <Typography>{formatarData(op.DTINICIO)}</Typography>
        </Grid>
        <Grid item xs={6} sm={4}>
          <Typography variant="subtitle2">Término</Typography>
          <Typography>{formatarData(op.DTFIM)}</Typography>
        </Grid>
      </Grid>

      {/* Observações ou complementos */}
      {op.OBS && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2">Observações</Typography>
          <Typography>{op.OBS}</Typography>
        </Box>
      )}
    </Paper>
  );
}
