import React, { useEffect, useState, useMemo } from "react";
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow,
  CircularProgress, Chip, IconButton, Collapse, Button, TableSortLabel
} from "@mui/material";
import { endOfDay, format, parseISO, startOfDay } from "date-fns";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ptBR } from "date-fns/locale";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Autocomplete
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { getDadosMRP } from "../api/mrp";

export default function MrpPorOP() {
  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openRow, setOpenRow] = useState(null);
  const [dataInicio, setDataInicio] = useState(null);
  const [dataFim, setDataFim] = useState(null);
  const [orderBy, setOrderBy] = useState("DTENTREGA");
  const [order, setOrder] = useState("asc");
  const [simulando, setSimulando] = useState(false);
  const [produtoSimulado, setProdutoSimulado] = useState(null);
  const [qtdSimulada, setQtdSimulada] = useState("");
  const [opSimulada, setOpSimulada] = useState(null);
  const { usuario, carregando } = useAuth();

  useEffect(() => {
    async function carregarDadosMRP() {
      try {

        const data = await getDadosMRP(usuario.empresa);
        setDados(data);
      } catch (error) {
        console.error("Erro ao buscar dados do MRP:", error);
        setDados([]);
      } finally {
        setLoading(false);
      }
    }

    carregarDadosMRP();
  }, [usuario.empresa]);

  const agrupadoPorOP = useMemo(() => {
    const mapa = new Map();

    dados.forEach(item => {
      const dtEntrega = item.DTENTREGA ? parseISO(item.DTENTREGA) : null;
      if (dataInicio && dtEntrega && dtEntrega < startOfDay(dataInicio)) return;
      if (dataFim && dtEntrega && dtEntrega > endOfDay(dataFim)) return;

      const key = item.NUOP;
      if (!mapa.has(key)) {
        mapa.set(key, {
          NUOP: item.NUOP,
          PRODUTO: item.PRODUTO,
          QTDPREVPRODUTO: item.QTDPREVPRODUTO,
          DTENTREGA: item.DTENTREGA,
          STATUS: item.STATUS,
          MATERIAS: [],
          PODE_PRODUZIR: true
        });
      }

      const grupo = mapa.get(key);
      const estoque = parseFloat(item.ESTOQUE || 0);
      const necessario = parseFloat(item.QTDORCADA || 0);
      if (estoque < necessario) grupo.PODE_PRODUZIR = false;

      grupo.MATERIAS.push({
        MATERIAPRIMA: item.MATERIAPRIMA,
        ESTOQUE: estoque,
        NECESSARIO: necessario,
        QTDPREVCOMPRA: item.QTDPREVCOMPRA,
        DTPREVISAOENTREGA: item.AD_DTPREVISAOENTREGA,
        NUMPEDCOMPRA: item.NUMPEDCOMPRA,
        QTDCOMPRA: item.QTDCOMPRA,
        DTENTRADACOMPRA: item.DTENTRADACOMPRA
      });
    });

    return Array.from(mapa.values());
  }, [dados, dataInicio, dataFim]);

  const formatNumeroBR = (valor) => new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valor);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedOps = useMemo(() => {
    const listaFinal = opSimulada ? [opSimulada, ...agrupadoPorOP] : agrupadoPorOP;
    return [...listaFinal].sort((a, b) => {
      if (a.NUOP === "#SIMULADA") return -1;
      if (b.NUOP === "#SIMULADA") return 1;

      let aVal = a[orderBy];
      let bVal = b[orderBy];

      if (orderBy === "DTENTREGA") {
        aVal = aVal ? new Date(aVal) : new Date();
        bVal = bVal ? new Date(bVal) : new Date();
      } else {
        aVal = aVal?.toString().toLowerCase();
        bVal = bVal?.toString().toLowerCase();
      }

      if (aVal < bVal) return order === "asc" ? -1 : 1;
      if (aVal > bVal) return order === "asc" ? 1 : -1;
      return 0;
    });

  }, [agrupadoPorOP, orderBy, order]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>MRP - Visão por Ordem de Produção</Typography>


      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
        <Box display="flex" gap={2} mb={2}>
          <DatePicker
            label="Dt. Entrega Ini."
            value={dataInicio}
            onChange={setDataInicio}
            format="dd/MM/yyyy"
          />
          <DatePicker
            label="Dt. Entrega Fim"
            value={dataFim}
            onChange={setDataFim}
            format="dd/MM/yyyy"
          />
          {(dataInicio || dataFim) && (
            <Button onClick={() => { setDataInicio(null); setDataFim(null); }}>
              Limpar Filtros
            </Button>
          )}
        </Box>
      </LocalizationProvider>
      <Button
        variant="outlined"
        onClick={() => {
          setSimulando(true);
          setProdutoSimulado(null);
          setQtdSimulada("");
        }}
      >
        + Simular OP
      </Button>
      <Paper sx={{ mt: 2 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" mt={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell />
                {["NUOP", "PRODUTO", "QTDPREVPRODUTO", "DTENTREGA", "STATUS"].map((col) => (
                  <TableCell key={col}>
                    <TableSortLabel
                      active={orderBy === col}
                      direction={order}
                      onClick={() => handleRequestSort(col)}
                    >
                      {{
                        NUOP: "OP",
                        PRODUTO: "Produto",
                        QTDPREVPRODUTO: "Qtd. Pa",
                        DTENTREGA: "Entrega",
                        STATUS: "Status"
                      }[col]}
                    </TableSortLabel>
                  </TableCell>
                ))}
                <TableCell>Produção</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedOps.map(op => {
                const isOpen = openRow === op.NUOP;
                return (
                  <React.Fragment key={op.NUOP}>
                    <TableRow hover onClick={() => setOpenRow(isOpen ? null : op.NUOP)}>
                      <TableCell>
                        <IconButton size="small">
                          {isOpen ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                        </IconButton>
                      </TableCell>
                      <TableCell>{op.NUOP}</TableCell>
                      <TableCell>{op.PRODUTO}</TableCell>
                      <TableCell>{formatNumeroBR(op.QTDPREVPRODUTO || 0)}</TableCell>
                      <TableCell>{op.DTENTREGA ? format(parseISO(op.DTENTREGA), 'dd/MM/yyyy') : "—"}</TableCell>
                      <TableCell><Chip label={op.STATUS} size="small" /></TableCell>
                      <TableCell>
                        <Chip
                          label={op.PODE_PRODUZIR ? "Sim" : "Não"}
                          color={op.PODE_PRODUZIR ? "success" : "error"}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={6} sx={{ p: 0 }}>
                        <Collapse in={isOpen} timeout="auto" unmountOnExit>
                          <Box sx={{ m: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>Matérias-Primas da OP:</Typography>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Matéria-Prima</TableCell>
                                  <TableCell>Estoque</TableCell>
                                  <TableCell>Qtd. Necessária</TableCell>
                                  <TableCell>Pedido Compra</TableCell>
                                  <TableCell>Qtd. Pedido</TableCell>
                                  <TableCell>Previsão Entrega</TableCell>
                                  <TableCell>Qtd. Compra</TableCell>
                                  <TableCell>Data Entrada</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {op.MATERIAS.map((mp, idx) => (
                                  <TableRow
                                    key={idx}
                                    sx={mp.ESTOQUE < mp.NECESSARIO ? { bgcolor: "#ffebee" } : {}}
                                  >
                                    <TableCell>{mp.MATERIAPRIMA}</TableCell>
                                    <TableCell>{formatNumeroBR(mp.ESTOQUE)}</TableCell>
                                    <TableCell>{formatNumeroBR(mp.NECESSARIO)}</TableCell>
                                    <TableCell>{mp.NUMPEDCOMPRA || "—"}</TableCell>
                                    <TableCell>{mp.QTDPREVCOMPRA ? formatNumeroBR(mp.QTDPREVCOMPRA) : "—"}</TableCell>
                                    <TableCell>{mp.DTPREVISAOENTREGA ? format(parseISO(mp.DTPREVISAOENTREGA), 'dd/MM/yyyy') : "—"}</TableCell>
                                    <TableCell>{mp.QTDCOMPRA ? formatNumeroBR(mp.QTDCOMPRA) : "—"}</TableCell>
                                    <TableCell>{mp.DTENTRADACOMPRA ? format(parseISO(mp.DTENTRADACOMPRA), 'dd/MM/yyyy') : "—"}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Paper>
      <Dialog open={simulando} onClose={() => setSimulando(false)} fullWidth maxWidth="sm">
        <DialogTitle>Simular nova OP</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={[...new Set(dados.map(d => d.CODPROD))].map(cod => {
              const item = dados.find(d => d.CODPROD === cod);
              return { cod, label: item?.PRODUTO || cod };
            })}
            onChange={(e, newValue) => setProdutoSimulado(newValue)}
            renderInput={(params) => <TextField {...params} label="Produto" margin="dense" />}
          />
          <TextField
            label="Quantidade a produzir"
            type="number"
            margin="dense"
            fullWidth
            value={qtdSimulada}
            onChange={(e) => setQtdSimulada(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSimulando(false)}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={!produtoSimulado || !qtdSimulada}
            onClick={() => {
              const base = dados.find(d => d.CODPROD === produtoSimulado.cod);
              if (!base) return;

              const coef = dados.filter(d =>
                d.CODPROD === base.CODPROD &&
                d.NUOP === base.NUOP
              );

              const qtd = parseFloat(qtdSimulada || 0);
              const qtdBase = parseFloat(coef[0]?.QTDPREVPRODUTO || 1);
              console.log(coef);
              const mpAgrupada = new Map();
              coef.forEach(mp => {
                const key = mp.CODMATERIAPRIMA;
                if (!mpAgrupada.has(key)) {
                  mpAgrupada.set(key, {
                    MATERIAPRIMA: mp.MATERIAPRIMA,
                    ESTOQUE: parseFloat(mp.ESTOQUE || 0),
                    NECESSARIO: 0,
                    NUMPEDCOMPRA: mp.NUMPEDCOMPRA,
                    QTDPREVCOMPRA: mp.QTDPREVCOMPRA,
                    DTPREVISAOENTREGA: mp.AD_DTPREVISAOENTREGA,
                    QTDCOMPRA: mp.QTDCOMPRA,
                    DTENTRADACOMPRA: mp.DTENTRADACOMPRA
                  });
                }
                const atual = mpAgrupada.get(key);
                const coeficiente = parseFloat(mp.QTDORCADA || 0);
                atual.NECESSARIO += (coeficiente / qtdBase) * qtd;
                console.log(mp.QTDORCADA);
                console.log(coeficiente);
                console.log(qtdBase);
                console.log(qtd);
              });

              const mpFinal = Array.from(mpAgrupada.values());
              const pode = mpFinal.every(mp => mp.ESTOQUE >= mp.NECESSARIO);

              const fakeOP = {
                NUOP: "#SIMULADA",
                PRODUTO: produtoSimulado.label,
                QTDPREVPRODUTO: qtd,
                DTENTREGA: null,
                STATUS: "SIMULAÇÃO",
                MATERIAS: mpFinal,
                PODE_PRODUZIR: pode
              };

              setOpSimulada(fakeOP);
              setSimulando(false);
            }}
          >
            Verificar Produção
          </Button>
        </DialogActions>
      </Dialog>
    </Box>

  );
}
