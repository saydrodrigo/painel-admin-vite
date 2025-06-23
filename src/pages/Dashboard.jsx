import React, { useEffect, useState, useMemo } from "react";
import {
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Alert,
  TextField,
  Box,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  isWithinInterval,
  startOfYear,
  endOfYear,
  format,
} from "date-fns";
import { useAuth } from "../context/AuthContext";
import { getOperadoresDetalhe } from "../api/operadores";
import ptBR from "date-fns/locale/pt-BR";
import { formatarNumeroBR, formatarMinutosParaHHMM } from "../utils/formatters";
import GraficoProdutividade from "../components/GraficoProdutividade";

function Dashboard() {
  const { usuario } = useAuth();
  const [dadosOriginais, setDadosOriginais] = useState([]);
  const [apontamentos, setApontamentos] = useState([]);
  const [erro, setErro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataInicio, setDataInicio] = useState(startOfYear(new Date()));
  const [dataFim, setDataFim] = useState(endOfYear(new Date()));

  useEffect(() => {
    const carregarApontamentos = async () => {
      try {
        const data = await getOperadoresDetalhe({ empresa: usuario.empresa });
        setDadosOriginais(data);
        const filtrado = filtrarPorData(data, dataInicio, dataFim);
        setApontamentos(filtrado);
      } catch (error) {
        setErro(error.message);
        setApontamentos([]);
      } finally {
        setLoading(false);
      }
    };

    carregarApontamentos();
  }, [usuario.empresa]);

  const filtrarPorData = (dados, inicio, fim) => {
    return dados.filter((item) => {
      if (!item.DHINICIO) return false;
      const data = new Date(item.DHINICIO);
      if (isNaN(data.getTime())) return false;
      return isWithinInterval(data, { start: inicio, end: fim });
    });
  };

  const handleFiltro = () => {
    const filtrado = filtrarPorData(dadosOriginais, dataInicio, dataFim);
    setApontamentos(filtrado);
  };

  const resumo = useMemo(() => {
    const tempoTotal = apontamentos.reduce(
      (sum, item) =>
        sum + (item.APONTAMENTO === '201 - Rodando' ? item.TEMPOAPTO || 0 : 0),
      0
    );
    const acertoTotal = apontamentos.reduce(
      (sum, item) =>
        sum + (item.GRUPOAPONTAMENTO === 'CE - ACERTO' ? item.TEMPOAPTO || 0 : 0),
      0
    );

    const qtdTotal = apontamentos.reduce((sum, item) => sum + (item.QTD || 0), 0);
    return { totalApontamentos: apontamentos.length, acertoTotal, tempoTotal, qtdTotal };
  }, [apontamentos]);

  const gruposPorEtapa = useMemo(() => {
    const grupos = {};

    for (const item of apontamentos) {
      const etapa = item.ETAPA || "Etapa não informada";

      if (!grupos[etapa]) grupos[etapa] = {};

      const operador = item.NOMEUSU;
      if (!grupos[etapa][operador]) {
        grupos[etapa][operador] = {
          tempoTotal: 0,
          qtdTotal: 0,
          acertoTotal: 0,
          apontamentos: [],
        };
      }

      const tempo = item.TEMPOAPTO || 0;

      if (item.GRUPOAPONTAMENTO === 'CE - ACERTO') {
        grupos[etapa][operador].acertoTotal += tempo;
      }
      if (item.APONTAMENTO === '201 - Rodando') {
        grupos[etapa][operador].tempoTotal += tempo;
      }
      if (item.APONTAMENTO === '201 - Rodando') {
        grupos[etapa][operador].qtdTotal += item.QTD || 0;
      }

      grupos[etapa][operador].apontamentos.push(item);

    }

    return grupos;
  }, [apontamentos]);

  const opsPorOperador = useMemo(() => {
    const mapa = {};

    for (const item of apontamentos) {
      const operador = item.NOMEUSU;
      const op = item.NUOP;

      if (!operador || !op) continue;

      if (!mapa[operador]) {
        mapa[operador] = new Set();
      }

      mapa[operador].add(op);
    }

    // Converte para objeto com contagem
    const resultado = {};
    for (const [operador, setOps] of Object.entries(mapa)) {
      resultado[operador] = setOps.size;
    }

    return resultado;
  }, [apontamentos]);


  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Painel de Operadores por Etapa
      </Typography>

      {erro && <Alert severity="error">{erro}</Alert>}
      {loading ? (
        <CircularProgress />
      ) : (
        <>
          {/* Filtros por data */}
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
            <Grid container spacing={2} sx={{ my: 2 }}>
              <Grid item xs={12} sm={4}>
                <DatePicker
                  label="Data Início"
                  value={dataInicio}
                  onChange={(newValue) => setDataInicio(newValue)}
                  renderInput={(params) => <TextField fullWidth {...params} />}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <DatePicker
                  label="Data Fim"
                  value={dataFim}
                  onChange={(newValue) => setDataFim(newValue)}
                  renderInput={(params) => <TextField fullWidth {...params} />}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card onClick={handleFiltro} sx={{ cursor: "pointer", height: "100%" }}>
                  <CardContent>
                    <Typography align="center" variant="button">
                      Aplicar Filtro
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </LocalizationProvider>

          {/* Resumo */}
          <Grid container spacing={2} sx={{ my: 2 }}>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Apontamentos</Typography>
                  <Typography variant="h4">{resumo.totalApontamentos}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Tempo Total (min)</Typography>
                  <Typography variant="h4">{resumo.tempoTotal}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Quantidade Total</Typography>
                  <Typography variant="h4">{resumo.qtdTotal}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Comparativos por Etapa */}
          {Object.entries(gruposPorEtapa).map(([etapa, operadores]) => (
            <Paper key={etapa} sx={{ my: 3, p: 2 }} elevation={3}>
              <Typography variant="h6" gutterBottom>
                Etapa: {etapa}
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Operador</TableCell>
                    <TableCell>Tempo Rodando (min)</TableCell>
                    <TableCell>Tempo Acerto (min)</TableCell>
                    <TableCell>Quantidade Total</TableCell>
                    <TableCell>Apontamentos</TableCell>
                    <TableCell>Ops</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(operadores).map(([nome, dados]) => (
                    <TableRow key={nome}>
                      <TableCell>{nome}</TableCell>
                      <TableCell>{formatarMinutosParaHHMM(dados.tempoTotal)}</TableCell>
                      <TableCell>{formatarMinutosParaHHMM(dados.acertoTotal)}</TableCell>
                      <TableCell>{formatarNumeroBR(dados.qtdTotal)}</TableCell>
                      <TableCell>{dados.apontamentos.length}</TableCell>
                      <TableCell>{opsPorOperador[nome] || 0}</TableCell>

                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <GraficoProdutividade operadores={operadores} />

            </Paper>
          ))}
        </>
      )}
    </Paper>
  );
}

export default Dashboard;
