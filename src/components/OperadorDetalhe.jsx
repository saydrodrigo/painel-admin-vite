import React, { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Typography,
    Grid,
    Card,
    CardContent,
} from "@mui/material";
import { getOperadoresDetalhe } from "../api/operadores";

export default function OperadorDetalhe({ codUsu }) {
    const [detalhes, setDetalhes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!codUsu) return;

        async function fetchDetalhes() {
            setLoading(true);
            setError(null);

            try {
                // Montar query com agrupamento e filtro por codUsu


                const data = await getOperadoresDetalhe(codUsu);
                setDetalhes(data);
            } catch (err) {
                setError(err.message);
                setDetalhes([]);
            } finally {
                setLoading(false);
            }
        }

        fetchDetalhes();
    }, [codUsu]);

    if (loading) return <CircularProgress />;
    if (error) return <Typography color="error">{error}</Typography>;
    if (!detalhes.length) return <Typography>Nenhum detalhe encontrado</Typography>;

    return (
        <Grid container spacing={2}>
            {detalhes.map((detalhe, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card variant="outlined" sx={{ minWidth: 250 }}>
                        <CardContent>
                            <Typography variant="h6">OP: {detalhe.NUOP}</Typography>
                            <Typography variant="body2" color="textSecondary">Atividade: {detalhe.CODATIVIDADE}</Typography>
                            <Typography variant="body2">Serviço: {detalhe.SERVICO}</Typography>
                            <Typography variant="body2">Produto: {detalhe.PRODUTO}</Typography>
                            <Typography variant="body2">Apontamento: {detalhe.APONTAMENTO || "—"}</Typography>
                            <Typography variant="body2">Qtd: {detalhe.QTD}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );
}
