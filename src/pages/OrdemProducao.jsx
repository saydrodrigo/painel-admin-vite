// src/pages/OrdemProducao.jsx
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
  TablePagination,
  Chip,
  TableSortLabel,
  Button,
} from "@mui/material";
import { format, parseISO, isBefore, startOfToday, startOfDay } from "date-fns";
import DetalheOPComAbas from "../components/DetalheOPComAbas";
import { useAuth } from "../context/AuthContext";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ptBR } from "date-fns/locale";
import { getOrdensProducao } from "../api/ordemProducao";

// Utilitários para exportação CSV
const exportToCSV = (data, filename = "ordens.csv") => {
  const headers = ["Nº OP", "Produto", "Parceiro", "Qtd. Produção", "Entrega", "Status"];
  const rows = data.map(op => [
    op.NUOP,
    op.PRODUTO,
    op.PARCEIRO,
    op.QTDPRODUCAO,
    op.DTENTREGA ? format(parseISO(op.DTENTREGA), "dd/MM/yyyy") : "",
    op.STATUS,
  ]);
  const csvContent = [headers, ...rows].map(row => row.join(";")).join("\n");

  // Adiciona o BOM no início da string
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


export default function OrdemProducao() {
  const [ordens, setOrdens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [opSelecionada, setOpSelecionada] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState("STATUS");
  const [order, setOrder] = useState("asc");
  const { usuario, carregando } = useAuth();
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
    setPage(0);
  };
  const [dataInicio, setDataInicio] = useState(null);
  const [dataFim, setDataFim] = useState(null);

  const filteredOrdens = useMemo(() => {
    return ordens.filter((op) => {
      if (!op.DTENTREGA) return false;

      const dataEntrega = parseISO(op.DTENTREGA);

      if (dataInicio && isBefore(dataEntrega, startOfDay(dataInicio))) {
        return false;
      }

      if (dataFim && isBefore(startOfDay(dataFim), dataEntrega)) {
        return false;
      }

      return true;
    });
  }, [ordens, dataInicio, dataFim]);

  const sortedOrdens = useMemo(() => {
    return [...filteredOrdens].sort((a, b) => {
      let valA = a[orderBy] ?? "";
      let valB = b[orderBy] ?? "";

      if (orderBy === "DTENTREGA") {
        valA = a.DTENTREGA ? new Date(a.DTENTREGA) : new Date(0);
        valB = b.DTENTREGA ? new Date(b.DTENTREGA) : new Date(0);
      } else if (orderBy === "QTDPRODUCAO") {
        valA = parseFloat(valA);
        valB = parseFloat(valB);
      } else {
        valA = valA.toString().toLowerCase();
        valB = valB.toString().toLowerCase();
      }

      if (valA < valB) return order === "asc" ? -1 : 1;
      if (valA > valB) return order === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredOrdens, order, orderBy]);


  const currentOrdens = useMemo(() => {
    return sortedOrdens.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [sortedOrdens, page, rowsPerPage]);

  useEffect(() => {
    async function carregarOrdens() {
      try {
        const data = await getOrdensProducao(usuario.empresa);
        setOrdens(data);
      } catch (error) {
        console.error("Erro ao buscar ordens de produção:", error);
        setOrdens([]);
      } finally {
        setLoading(false);
      }
    }

    carregarOrdens();
    setPage(0);
  }, [dataInicio, dataFim, usuario.empresa]);


  const getStatusColor = (status) => {
    switch (status) {
      case "Em Andamento":
        return "primary";
      case "Programado":
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <Box sx={{ p: 3 }}>

      <Typography variant="h5" gutterBottom>
        Ordens de Produção
      </Typography>
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
        onClick={() => exportToCSV(filteredOrdens)}
      >
        Exportar CSV
      </Button>


      <Paper sx={{ mt: 2, p: 2 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" mt={2}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {["NUOP", "PRODUTO", "PARCEIRO", "QTDPRODUCAO", "DTENTREGA", "STATUS"].map((col) => (
                    <TableCell key={col}>
                      <TableSortLabel
                        active={orderBy === col}
                        direction={orderBy === col ? order : "asc"}
                        onClick={() => handleRequestSort(col)}
                      >
                        {{
                          NUOP: "Nº OP",
                          PRODUTO: "Produto",
                          PARCEIRO: "Parceiro",
                          QTDPRODUCAO: "Qtd. Produção",
                          DTENTREGA: "Entrega",
                          STATUS: "Status"
                        }[col]}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {currentOrdens.map((op) => {
                  const selecionada = opSelecionada?.NUOP === op.NUOP;
                  const atrasada = op.DTENTREGA && isBefore(parseISO(op.DTENTREGA), startOfToday());
                  return (
                    <React.Fragment key={op.NUOP}>
                      <TableRow
                        hover
                        onClick={() => setOpSelecionada(selecionada ? null : op)}
                        sx={{
                          cursor: "pointer",
                          bgcolor: selecionada
                            ? "grey.100"
                            : atrasada
                              ? "#ffe5e5"
                              : "inherit",
                        }}
                      >
                        <TableCell>{op.NUOP}</TableCell>
                        <TableCell>{op.PRODUTO}</TableCell>
                        <TableCell>{op.PARCEIRO}</TableCell>
                        <TableCell>{op.QTDPRODUCAO}</TableCell>
                        <TableCell>
                          {op.DTENTREGA
                            ? format(parseISO(op.DTENTREGA), "dd/MM/yyyy")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={op.STATUS}
                            color={getStatusColor(op.STATUS)}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>

                      {selecionada && (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <DetalheOPComAbas op={op} />
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={sortedOrdens.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              labelRowsPerPage="Linhas por página:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} de ${count}`
              }
            />
          </>
        )}
      </Paper>
    </Box>
  );
}
