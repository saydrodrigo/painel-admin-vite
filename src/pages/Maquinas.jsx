// src/pages/MaquinaDetalhes.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Box,
} from "@mui/material";

export default function MaquinaDetalhes() {
  const { codmaq } = useParams();
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDados() {
      try {
        const query = `
          SELECT TOP 10
            A.NUOP,
            A.CODATIVIDADE,
            SER.DESCRPROD,
            A.CODETAPA,
            ETA.NOMEETAPA AS ETAPA
          FROM sankhya.AD_PCPCEN A
          INNER JOIN sankhya.TGFPRO SER ON SER.CODPROD = A.CODATIVIDADE
          INNER JOIN sankhya.TGFETA ETA ON ETA.CODETAPA = A.CODETAPA
          WHERE A.CODMQP = ${codmaq}
        `;

        const response = await fetch(
          "http://192.168.2.3:8081/api/crud/select",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(query),
          }
        );

        const data = await response.json();
        setDados(data);
      } catch (error) {
        console.error("Erro ao buscar dados da máquina:", error);
        setDados([]);
      } finally {
        setLoading(false);
      }
    }

    fetchDados();
  }, [codmaq]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Detalhes da Máquina #{codmaq}
      </Typography>

      {dados?.length > 0 ? (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>NUOP</TableCell>
              <TableCell>CODATIVIDADE</TableCell>
              <TableCell>DESCRPROD</TableCell>
              <TableCell>CODETAPA</TableCell>
              <TableCell>ETAPA</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dados.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell>{row.NUOP}</TableCell>
                <TableCell>{row.CODATIVIDADE}</TableCell>
                <TableCell>{row.DESCRPROD}</TableCell>
                <TableCell>{row.CODETAPA}</TableCell>
                <TableCell>{row.ETAPA}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Typography variant="body1">Nenhum dado encontrado.</Typography>
      )}
    </Paper>
  );
}
