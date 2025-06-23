// src/components/OperadorResumoCard.jsx
import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    CircularProgress,
    TextField,
    Button,
    Collapse,
    IconButton,
} from "@mui/material";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import { getOperadoresDetalhe } from "../api/operadores";
import { useAuth } from "../context/AuthContext";

export default function OperadorResumoCard({ codusu }) {
    const [resumo, setResumo] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dataInicio, setDataInicio] = useState("");
    const [dataFim, setDataFim] = useState("");
    const [grupoSelecionado, setGrupoSelecionado] = useState(null);
    const [apontamentoExpandido, setApontamentoExpandido] = useState(null);
    const [error, setError] = useState(null);
    const { usuario } = useAuth();
    useEffect(() => {
        if (!codusu) return;

        async function fetchDetalhes() {
            setLoading(true);
            setError(null);

            try {
                // Montar query com agrupamento e filtro por codUsu
                const data = await getOperadoresDetalhe({codUsu:codusu, empresa:usuario.empresa});
                setResumo(data);
            } catch (error) {
                setError(error.message);
                setResumo([]);
            } finally {
                setLoading(false);
            }
        }

        fetchDetalhes();
    }, [codusu]);

    // Função para formatar minutos em "h:mm"
    function formatMinutesToHours(minutos) {
        if (!minutos) return "0:00";

        const dias = Math.floor(minutos / (60 * 24));
        const horas = Math.floor((minutos % (60 * 24)) / 60);
        const mins = minutos % 60;

        if (dias > 0) {
            return `${dias}d ${horas}:${mins.toString().padStart(2, "0")}`;
        } else {
            return `${horas}:${mins.toString().padStart(2, "0")}`;
        }
    }


    // Filtra resumo por datas selecionadas
    const resumoFiltrado = resumo.filter((item) => {
        if (!dataInicio && !dataFim) return true;

        const dhInicio = new Date(item.DHINICIO);
        const dhFim = new Date(item.DHFIM);
        const filtroInicio = dataInicio ? new Date(dataInicio + "T00:00:00") : null;
        const filtroFim = dataFim ? new Date(dataFim + "T23:59:59") : null;

        if (filtroInicio && filtroFim) {
            return dhFim >= filtroInicio && dhInicio <= filtroFim;
        } else if (filtroInicio) {
            return dhFim >= filtroInicio;
        } else if (filtroFim) {
            return dhInicio <= filtroFim;
        }

        return true;
    });


    // Agrupa por APONTAMENTO
    const resumoPorApontamento = resumoFiltrado.reduce((acc, cur) => {
        if (!acc[cur.APONTAMENTO]) {
            acc[cur.APONTAMENTO] = {
                APONTAMENTO: cur.APONTAMENTO,
                GRUPOAPONTAMENTO: cur.GRUPOAPONTAMENTO,
                QTD: 0,
                TEMPOAPTO: 0,
            };
        }
        acc[cur.APONTAMENTO].QTD += cur.QTD || 0;
        acc[cur.APONTAMENTO].TEMPOAPTO += cur.TEMPOAPTO || 0;
        return acc;
    }, {});

    // Totais para os cards
    const totalOps = Array.isArray(resumoFiltrado)
        ? new Set(resumoFiltrado.map((r) => r.NUOP)).size
        : 0;

    const tempoTotal = resumoFiltrado.reduce(
        (acc, r) => acc + (r.TEMPOAPTO || 0),
        0
    );
    const qtdTotal = resumoFiltrado.reduce((acc, r) => acc + (r.QTD || 0), 0);
    const resumoPorGrupo = resumoFiltrado.reduce((acc, cur) => {
        const grupo = cur.GRUPOAPONTAMENTO || "Sem Grupo";
        if (!acc[grupo]) {
            acc[grupo] = {
                GRUPOAPONTAMENTO: grupo,
                QTD: 0,
                TEMPOAPTO: 0,
            };
        }
        acc[grupo].QTD += cur.QTD || 0;
        acc[grupo].TEMPOAPTO += cur.TEMPOAPTO || 0;
        return acc;
    }, {});


    // Função para exportar CSV
    function exportToCSV() {
        const header = ["Apontamento", "Grupo Apontamento", "Qtd", "Tempo (horas)"];
        const rows = Object.values(resumoPorApontamento).map((item) => [
            item.APONTAMENTO,
            item.GRUPOAPONTAMENTO,
            item.QTD,
            formatMinutesToHours(item.TEMPOAPTO),
        ]);

        const csvContent =
            [header.join(";"), ...rows.map((r) => r.join(";"))].join("\n");

        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `resumo_apontamento_${codusu}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function filtrarTabelaPorGrupo(grupo) {
        setGrupoSelecionado(grupo);
    }
    function exportToCSV(apontamento) {
        const detalhes = resumoFiltrado
            .filter(r => r.APONTAMENTO === apontamento)
            .sort((a, b) => new Date(b.DHINICIO) - new Date(a.DHINICIO));

        const header = ["Produto", "Op", "Serviço", "Qtd", "Tempo", "Início", "Fim"];
        const rows = detalhes.map((r) => [
            r.PRODUTO,
            r.NUOP,
            r.SERVICO,
            r.QTD,
            formatMinutesToHours(r.TEMPOAPTO),
            new Date(r.DHINICIO).toLocaleString(),
            new Date(r.DHFIM).toLocaleString(),
        ]);

        const csvContent = [header.join(";"), ...rows.map(r => r.join(";"))].join("\n");
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `detalhes_${apontamento}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }



    return (
        <Box sx={{ mt: 2 }}>
            {loading ? (
                <Box display="flex" justifyContent="center" mt={2}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    <Typography variant="subtitle1" gutterBottom>
                        Resumo das OPs Apontadas
                    </Typography>

                    {/* Filtros de data */}
                    <Box display="flex" gap={2} mb={3}>
                        <TextField
                            label="Data Início"
                            type="date"
                            size="small"
                            value={dataInicio}
                            onChange={(e) => setDataInicio(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="Data Fim"
                            type="date"
                            size="small"
                            value={dataFim}
                            onChange={(e) => setDataFim(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>

                    <Grid container spacing={2} mb={3}>
                        {/* Cards com resumo 
                        /<Grid item xs={12} sm={4}>
                            <Card>
                                <CardContent>
                                    <Typography variant="subtitle2">Total de Registros</Typography>
                                    <Typography variant="h6">{totalOps}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>*/}
                        {Object.values(resumoPorGrupo).map((grupo, index) => (
                            <Grid item xs={12} sm={4} key={index}>
                                <Card onClick={() => filtrarTabelaPorGrupo(grupo.GRUPOAPONTAMENTO)} sx={{ cursor: "pointer" }}>
                                    <CardContent>
                                        <Typography variant="subtitle2">{grupo.GRUPOAPONTAMENTO}</Typography>
                                        <Typography variant="body2">Qtd: {grupo.QTD.toLocaleString()}</Typography>
                                        <Typography variant="body2">Tempo: {formatMinutesToHours(grupo.TEMPOAPTO)}</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}

                    </Grid>

                    {grupoSelecionado && (
                        <Box mb={2}>
                            <Button variant="outlined" onClick={() => setGrupoSelecionado(null)}>
                                Limpar Filtro de Grupo
                            </Button>
                        </Box>
                    )}

                    {/* Botão exportar CSV */}
                    <Box mt={2} mb={1}>
                        <Button variant="outlined" onClick={exportToCSV}>
                            Exportar CSV
                        </Button>
                    </Box>

                    {/* Tabela */}
                    <Box mt={1}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Apontamento</TableCell>
                                    <TableCell>Grupo</TableCell>
                                    <TableCell>Qtd</TableCell>
                                    <TableCell>Tempo (h:mm)</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {Object.values(resumoPorApontamento)
                                    .filter(item => !grupoSelecionado || item.GRUPOAPONTAMENTO === grupoSelecionado)
                                    .map((item, idx) => {
                                        const isOpen = apontamentoExpandido === item.APONTAMENTO;
                                        return (
                                            <React.Fragment key={idx}>
                                                <TableRow hover>
                                                    <TableCell>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() =>
                                                                setApontamentoExpandido(isOpen ? null : item.APONTAMENTO)
                                                            }
                                                        >
                                                            {isOpen ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                                                        </IconButton>{" "}
                                                        {item.APONTAMENTO}
                                                    </TableCell>
                                                    <TableCell>{item.GRUPOAPONTAMENTO}</TableCell>
                                                    <TableCell>{item.QTD.toLocaleString()}</TableCell>
                                                    <TableCell>{formatMinutesToHours(item.TEMPOAPTO)}</TableCell>
                                                </TableRow>

                                                {/* Linha colapsável */}
                                                <TableRow>
                                                    <TableCell colSpan={6} style={{ paddingBottom: 0, paddingTop: 0 }}>
                                                        <Collapse in={isOpen} timeout="auto" unmountOnExit>
                                                            <Box margin={1}>
                                                                <Typography variant="subtitle2" gutterBottom>
                                                                    Detalhes de {item.APONTAMENTO}

                                                                </Typography>
                                                                <Button variant="outlined" onClick={() => exportToCSV(item.APONTAMENTO)}>                                                                    Exportar CSV
                                                                </Button>
                                                                {/* Botão exportar CSV */}



                                                                <Table size="small">
                                                                    <TableHead>
                                                                        <TableRow>
                                                                            <TableCell>Produto</TableCell>
                                                                            <TableCell>Op</TableCell>
                                                                            <TableCell>Serviço</TableCell>
                                                                            <TableCell>Qtd</TableCell>
                                                                            <TableCell>Tempo</TableCell>
                                                                            <TableCell>Início</TableCell>
                                                                            <TableCell>Fim</TableCell>
                                                                        </TableRow>
                                                                    </TableHead>
                                                                    <TableBody>
                                                                        {resumoFiltrado
                                                                            .filter(r => r.APONTAMENTO === item.APONTAMENTO)
                                                                            .sort((a, b) => new Date(b.DHINICIO) - new Date(a.DHINICIO)) // ← ordena do mais recente para o mais antigo
                                                                            .map((r, i) => (
                                                                                <TableRow key={i}>
                                                                                    <TableCell>{r.PRODUTO}</TableCell>
                                                                                    <TableCell>{r.NUOP}</TableCell>
                                                                                    <TableCell>{r.SERVICO}</TableCell>
                                                                                    <TableCell>{r.QTD}</TableCell>
                                                                                    <TableCell>{formatMinutesToHours(r.TEMPOAPTO)}</TableCell>
                                                                                    <TableCell>{new Date(r.DHINICIO).toLocaleString()}</TableCell>
                                                                                    <TableCell>{new Date(r.DHFIM).toLocaleString()}</TableCell>
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
                    </Box>
                </>
            )}
        </Box>
    );
}
