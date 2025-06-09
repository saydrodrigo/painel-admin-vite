// src/pages/OrdemProducao.jsx
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
} from "@mui/material";
import { format, parseISO } from "date-fns";
import DetalheOP from "../components/DetalheOP";
import DetalheOPComAbas from "../components/DetalheOPComAbas";

export default function OrdemProducao() {
  const [ordens, setOrdens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [opSelecionada, setOpSelecionada] = useState(null);

  useEffect(() => {
    async function fetchOrdens() {
      try {
        const query = `
          SELECT
            OP.NUOP
            ,OP.DTENTREGA
            ,sankhya.FC_GET_NOME_PRODUTO_FORMULA_CEN(OP1.CODPROD, OP.CODPARC, OP1.IDFOR) AS PRODUTO
            ,PAR.CODPARC
            ,PAR.NOMEPARC AS PARCEIRO
            ,ROUND(OP1.QTDPRODUCAO, 2) AS QTDPRODUCAO
            ,sankhya.FC_GET_OPCAO_CAMPO('AD_CONTOP', 'STATUS', OP.STATUS) STATUS
          FROM sankhya.AD_CONTOP OP
          INNER JOIN sankhya.TGFPAR PAR ON PAR.CODPARC = OP.CODPARC
          INNER JOIN sankhya.AD_CONTOP1 OP1 ON OP1.NUOP = OP.NUOP
          WHERE OP.STATUS NOT IN('F', 'C') AND OP.TIPO NOT IN('CGDE')
        `;

        const response = await fetch("http://192.168.2.3:8081/api/crud/select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(query),
        });

        const data = await response.json();
        setOrdens(data);
      } catch (error) {
        console.error("Erro ao buscar ordens de produção:", error);
        setOrdens([]);
      } finally {
        setLoading(false);
      }
    }

    fetchOrdens();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Ordens de Produção
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
                <TableCell>Nº OP</TableCell>
                <TableCell>Produto</TableCell>
                <TableCell>Parceiro</TableCell>
                <TableCell>Qtd. Produção</TableCell>
                <TableCell>Entrega</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ordens.map((op, idx) => {
                const selecionada = opSelecionada?.NUOP === op.NUOP;
                return (
                  <React.Fragment key={idx}>
                    <TableRow
                      hover
                      onClick={() =>
                        setOpSelecionada(selecionada ? null : op)
                      }
                      sx={{
                        cursor: "pointer",
                        bgcolor: selecionada ? "grey.100" : "inherit",
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
                      <TableCell>{op.STATUS}</TableCell>
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
        )}
      </Paper>
    </Box>
  );
}
