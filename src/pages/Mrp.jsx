import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  Button,
  Collapse,
  IconButton,
  Chip,
  TableSortLabel,
  Tooltip,
} from "@mui/material";
import {
  KeyboardArrowDown as ArrowDown,
  KeyboardArrowUp as ArrowUp,
} from "@mui/icons-material";
import { format, parseISO, isBefore, startOfToday, differenceInCalendarDays, startOfDay } from "date-fns";
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ptBR from 'date-fns/locale/pt-BR';
import { Autocomplete, TextField } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { getDadosMRP } from "../api/mrp";


export default function Mrp() {
  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openRow, setOpenRow] = useState(null);
  const [orderBy, setOrderBy] = useState("MATERIAPRIMA");
  const [order, setOrder] = useState("asc");
  const [dataInicio, setDataInicio] = useState(null);
  const [dataFim, setDataFim] = useState(null);
  const [gruposSelecionados, setGruposSelecionados] = useState([]);
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

  const agrupado = useMemo(() => {
    const filtro = Array.isArray(dados)
      ? dados.filter((item) => {
        if (!item.DTENTREGA) return false;
        const data = parseISO(item.DTENTREGA);
        if (dataInicio && data < dataInicio) return false;
        if (dataFim && data > dataFim) return false;
        if (gruposSelecionados.length > 0 && !gruposSelecionados.includes(item.GRUPOMP)) return false;
        return true;
      })
      : [];


    const grupos = {};
    filtro.forEach((item) => {
      const cod = item.CODMATERIAPRIMA;
      if (!grupos[cod]) {
        grupos[cod] = {
          CODMATERIAPRIMA: cod,
          MATERIAPRIMA: item.MATERIAPRIMA,
          TIPOMP: item.TIPOMP,
          ESTOQUE: item.ESTOQUE,
          TOTAL_QTDORCADA: 0,
          MENOR_DTENTREGA: item.DTENTREGA ? parseISO(item.DTENTREGA) : null,
          OPS: [],
        };
      }

      grupos[cod].TOTAL_QTDORCADA += parseFloat(item.QTDORCADA || 0);
      grupos[cod].OPS.push(item);

      const entregaAtual = item.DTENTREGA ? parseISO(item.DTENTREGA) : null;
      if (
        entregaAtual &&
        (!grupos[cod].MENOR_DTENTREGA ||
          entregaAtual < grupos[cod].MENOR_DTENTREGA)
      ) {
        grupos[cod].MENOR_DTENTREGA = entregaAtual;
      }
    });

    return Object.values(grupos);
  }, [dados, dataInicio, dataFim, gruposSelecionados]);

  const gruposDisponiveis = useMemo(() => {
    const set = new Set();

    dados.forEach((d) => {
      if (!d.DTENTREGA) return;

      const data = parseISO(d.DTENTREGA);

      if (
        (dataInicio && data < startOfDay(dataInicio)) ||
        (dataFim && data > endOfDay(dataFim))
      ) {
        return; // fora do intervalo
      }

      if (d.GRUPOMP) {
        set.add(d.GRUPOMP);
      }
    });

    return Array.from(set).sort();
  }, [dados, dataInicio, dataFim]);

  const formatNumeroBR = (valor) => {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor);
  };


  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedGrupos = useMemo(() => {
    return [...agrupado].sort((a, b) => {
      let valA = a[orderBy] ?? "";
      let valB = b[orderBy] ?? "";

      if (orderBy === "ESTOQUE" || orderBy === "TOTAL_QTDORCADA") {
        valA = parseFloat(valA);
        valB = parseFloat(valB);
      } else if (orderBy === "MENOR_DTENTREGA") {
        valA = valA ? new Date(a.MENOR_DTENTREGA) : new Date(8640000000000000);
        valB = valB ? new Date(b.MENOR_DTENTREGA) : new Date(8640000000000000);
      } else {
        valA = valA.toString().toLowerCase();
        valB = valB.toString().toLowerCase();
      }

      if (valA < valB) return order === "asc" ? -1 : 1;
      if (valA > valB) return order === "asc" ? 1 : -1;
      return 0;
    });
  }, [agrupado, order, orderBy]);

  const getUrgencyBadge = (dataEntrega) => {
    if (!dataEntrega) return null;
    const dias = differenceInCalendarDays(dataEntrega, new Date());

    if (dias <= 3) {
      return (
        <Tooltip title="Entrega em até 3 dias">
          <Chip label="URGENTE" color="error" size="small" />
        </Tooltip>
      );
    } else if (dias <= 7) {
      return (
        <Tooltip title="Entrega em até 7 dias">
          <Chip label="EM BREVE" color="warning" size="small" />
        </Tooltip>
      );
    }
    return null;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" gutterBottom>MRP - Necessidade de Materiais</Typography>
        <Button
          variant="outlined"
          onClick={() => {
            const headers = ["Matéria-Prima", "Tipo", "Estoque", "Total Qtd.", "Entrega Mais Próxima", "OP", "Produto", "Qtd", "Entrega", "Status"];
            const rows = agrupado.flatMap((grupo) =>
              grupo.OPS.map((op) => [
                grupo.MATERIAPRIMA,
                grupo.TIPOMP,
                grupo.ESTOQUE,
                grupo.TOTAL_QTDORCADA,
                grupo.MENOR_DTENTREGA ? format(grupo.MENOR_DTENTREGA, "dd/MM/yyyy") : "",
                op.NUOP,
                op.PRODUTO,
                op.QTDORCADA,
                op.DTENTREGA ? format(parseISO(op.DTENTREGA), "dd/MM/yyyy") : "",
                op.STATUS,
              ])
            );
            const csvContent = [headers, ...rows].map((r) => r.join(";")).join("\n");
            const blob = new Blob(["\uFEFF" + csvContent], {
              type: "text/csv;charset=utf-8;",
            });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.setAttribute("download", "mrp.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
        >
          Exportar CSV
        </Button>
      </Box>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
        <Box display="flex" gap={2} mb={2}>
          <DatePicker
            label="Dt. Entrega Ini."
            value={dataInicio}
            onChange={setDataInicio}
            format="dd/MM/yyyy"
          />
          <DatePicker
            label="Dt. Ent. Fim"
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
      <Autocomplete
        multiple
        size="small"
        options={gruposDisponiveis}
        value={gruposSelecionados}
        onChange={(event, newValue) => setGruposSelecionados(newValue)}
        renderInput={(params) => (
          <TextField {...params} label="Filtrar por Grupo de MP" placeholder="Grupo" />
        )}
        sx={{ minWidth: 300 }}
      />

      <Paper sx={{ mt: 3 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" mt={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell />
                {["MATERIAPRIMA", "TIPOMP", "ESTOQUE", "TOTAL_QTDORCADA", "MENOR_DTENTREGA", "SITUACAO"].map((col) => (
                  <TableCell key={col}>
                    {col !== "SITUACAO" ? (
                      <TableSortLabel
                        active={orderBy === col}
                        direction={orderBy === col ? order : "asc"}
                        onClick={() => handleRequestSort(col)}
                      >
                        {{
                          MATERIAPRIMA: "Matéria-Prima",
                          TIPOMP: "Tipo",
                          ESTOQUE: "Estoque",
                          TOTAL_QTDORCADA: "Total Necessário",
                          MENOR_DTENTREGA: "Entrega + Próxima OP",
                        }[col]}
                      </TableSortLabel>
                    ) : (
                      "Situação"
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedGrupos.map((grupo) => {
                const emFalta = grupo.ESTOQUE < grupo.TOTAL_QTDORCADA;
                const isOpen = openRow === grupo.CODMATERIAPRIMA;

                return (
                  <React.Fragment key={grupo.CODMATERIAPRIMA}>
                    <TableRow
                      hover
                      sx={{ cursor: "pointer", bgcolor: isOpen ? "grey.100" : "inherit" }}
                      onClick={() =>
                        setOpenRow(isOpen ? null : grupo.CODMATERIAPRIMA)
                      }
                    >
                      <TableCell>
                        <IconButton size="small">
                          {isOpen ? <ArrowUp /> : <ArrowDown />}
                        </IconButton>
                      </TableCell>
                      <TableCell>{grupo.MATERIAPRIMA}</TableCell>
                      <TableCell>{grupo.TIPOMP}</TableCell>
                      <TableCell sx={{ color: emFalta ? "red" : "inherit" }}>
                        {formatNumeroBR(grupo.ESTOQUE || 0)}
                      </TableCell>
                      <TableCell>{formatNumeroBR(grupo.TOTAL_QTDORCADA || 0)}</TableCell>
                      <TableCell>
                        {grupo.MENOR_DTENTREGA
                          ? format(grupo.MENOR_DTENTREGA, "dd/MM/yyyy")
                          : "—"}
                        &nbsp;
                        {getUrgencyBadge(grupo.MENOR_DTENTREGA)}
                      </TableCell>
                      <TableCell>
                        {emFalta ? (
                          <Chip label="Estoque insuficiente" color="error" size="small" />
                        ) : (
                          <Chip label="OK" color="success" size="small" />
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={7} sx={{ p: 0 }}>
                        <Collapse in={isOpen} timeout="auto" unmountOnExit>
                          <Box sx={{ m: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              OPs que consomem essa matéria-prima:
                            </Typography>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Nº OP</TableCell>
                                  <TableCell>Produto</TableCell>
                                  <TableCell>Qtd. PA.</TableCell>
                                  <TableCell>Qtd. Necessária</TableCell>
                                  <TableCell>Entrega OP</TableCell>
                                  <TableCell>Status</TableCell>
                                  <TableCell>Pedido Compra</TableCell>
                                  <TableCell>Qtd. Ped. Compra</TableCell>
                                  <TableCell>Previsão Entrega</TableCell>
                                  <TableCell>Compra</TableCell>
                                  <TableCell>Qtd. Compra</TableCell>
                                  <TableCell>Entrega</TableCell>

                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {grupo.OPS.map((op) => (
                                  <TableRow key={op.NUOP + "-" + op.CODPROD}>
                                    <TableCell>{op.NUOP}</TableCell>
                                    <TableCell>{op.PRODUTO}</TableCell>
                                    <TableCell>{formatNumeroBR(op.QTDPREVPRODUTO || 0)}</TableCell>
                                    <TableCell>{formatNumeroBR(op.QTDORCADA || 0)}</TableCell>
                                    <TableCell>
                                      {op.DTENTREGA
                                        ? format(parseISO(op.DTENTREGA), "dd/MM/yyyy")
                                        : "—"}
                                    </TableCell>
                                    <TableCell>
                                      <Chip label={op.STATUS} size="small" />
                                    </TableCell>
                                    <TableCell>
                                      {op.NUMPEDCOMPRA
                                        ? `${op.NUMPEDCOMPRA} (${op.NUUNPEDCOMPRA})`
                                        : "—"}
                                    </TableCell>
                                    <TableCell>
                                      {op.QTDPREVCOMPRA
                                        ? `${formatNumeroBR(op.QTDPREVCOMPRA)}`
                                        : "—"}
                                    </TableCell>
                                    <TableCell>
                                      {op.DTPREVISAOENTREGA
                                        ? format(parseISO(op.DTPREVISAOENTREGA), "dd/MM/yyyy")
                                        : "—"}
                                    </TableCell>
                                    <TableCell>
                                      {op.NUMCOMPRA
                                        ? `${op.NUMCOMPRA} (${op.NUUNCOMPRA})`
                                        : "—"}
                                    </TableCell>
                                    <TableCell>
                                      {op.QTDCOMPRA
                                        ? `${formatNumeroBR(op.QTDCOMPRA)}`
                                        : "—"}
                                    </TableCell>
                                    <TableCell>
                                      {op.DTENTRADACOMPRA
                                        ? format(parseISO(op.DTENTRADACOMPRA), "dd/MM/yyyy")
                                        : "—"}
                                    </TableCell>
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
    </Box>
  );
}
