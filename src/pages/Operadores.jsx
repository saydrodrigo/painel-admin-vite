import React, { useEffect, useState } from "react";
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
  Collapse,
  IconButton,
  Chip
} from "@mui/material";
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
} from "@mui/icons-material";
import { format, parseISO } from "date-fns";
import OperadorResumoCard from "../components/OperadorResumoCard";
import { useAuth } from "../context/AuthContext";
import { getOperadores } from "../api/operadores";

export default function Operadores() {
  const [operadores, setOperadores] = useState([]);
  const [resumos, setResumos] = useState({});
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const { usuario, carregando } = useAuth();
  useEffect(() => {
    async function carregarOperadores() {
      try {
        const data = await getOperadores(usuario.empresa);
        setOperadores(data);

        // Agrupa para os cards de resumo
        const agrupado = agruparPorOperador(data);
        setResumos(agrupado);
      } catch (error) {
        console.error("Erro ao buscar operadores:", error);
        setOperadores([]);
      } finally {
        setLoading(false);
      }
    }

    carregarOperadores();
  }, [usuario.empresa]);

  function agruparPorOperador(dados) {
    const mapa = new Map();

    dados.forEach(item => {
      const chave = item.CODUSU;
      if (!mapa.has(chave)) {
        mapa.set(chave, {
          CODUSU: item.CODUSU,
          NOMEUSU: item.NOMEUSU,
          ops: new Set(),
          tempoAptoTotal: 0,
          apontamentos: {},
        });
      }

      const operador = mapa.get(chave);
      if (item.NUOP) operador.ops.add(item.NUOP);
      operador.tempoAptoTotal += item.TEMPOAPTO ?? 0;

      const tipo = item.APONTAMENTO || "Sem apontamento";
      operador.apontamentos[tipo] = (operador.apontamentos[tipo] || 0) + (item.QTD ?? 0);
    });

    const resultado = {};
    mapa.forEach((val, chave) => {
      resultado[chave] = {
        ...val,
        qtdOps: val.ops.size,
      };
    });

    return resultado;
  }

  const toggleExpand = (codusu) => {
    setExpanded((prev) => ({ ...prev, [codusu]: !prev[codusu] }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Operadores em Atividade
      </Typography>

      <Paper sx={{ mt: 2, p: 2 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" mt={2}>
            <CircularProgress />
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Código</TableCell>
                <TableCell>Nome</TableCell>
                <TableCell>Nº OP</TableCell>
                <TableCell>Início</TableCell>
                <TableCell>Fim</TableCell>
                <TableCell>Atividade</TableCell>
                <TableCell>Serviço</TableCell>
                <TableCell>Produto</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {operadores
                .sort((a, b) => {
                  const aEmAndamento = !a.DHFIM && a.DHINICIO;
                  const bEmAndamento = !b.DHFIM && b.DHINICIO;

                  if (aEmAndamento && !bEmAndamento) return -1; // a tem prioridade
                  if (!aEmAndamento && bEmAndamento) return 1;  // b tem prioridade

                  // Ambos em andamento ou ambos finalizados → ordenar por DHINICIO desc
                  return new Date(b.DHINICIO) - new Date(a.DHINICIO);
                })


                .map((op) => (
                  <React.Fragment key={op.CODUSU}>
                    <TableRow>
                      <TableCell>
                        <IconButton size="small" onClick={() => toggleExpand(op.CODUSU)}>
                          {expanded[op.CODUSU] ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                        </IconButton>
                      </TableCell>
                      <TableCell>{op.CODUSU}</TableCell>
                      <TableCell>{op.NOMEUSU}</TableCell>
                      <TableCell>{op.NUOP || "—"}</TableCell>
                      <TableCell>
                        {op.DHINICIO
                          ? format(parseISO(op.DHINICIO), "dd/MM/yyyy HH:mm")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {!op.DHINICIO ? (
                          "-"
                        ) : op.DHFIM ? (
                          format(parseISO(op.DHFIM), "dd/MM/yyyy HH:mm")
                        ) : (
                          <Chip label="Em Andamento" color="success" size="small" />
                        )}
                      </TableCell>

                      <TableCell>{op.CODATIVIDADE || "—"}</TableCell>
                      <TableCell>{op.SERVICO || "—"}</TableCell>
                      <TableCell>{op.PRODUTO || "—"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={8} sx={{ p: 0 }}>
                        <Collapse in={expanded[op.CODUSU]} timeout="auto" unmountOnExit>
                          <Box sx={{ m: 2 }}>
                            {resumos[op.CODUSU] ? (
                              <OperadorResumoCard codusu={op.CODUSU} />
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Sem dados de apontamento.
                              </Typography>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  );
}
