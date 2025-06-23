import React, { useState } from "react";
import {
    Box,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
} from "@mui/material";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    LabelList,
} from "recharts";
import { format } from "date-fns";
import { formatarNumeroBR, formatarMinutosParaHHMM } from "../utils/formatters";

// Função genérica para preparar os dados por campo (QTD ou TEMPOAPTO)
const prepararDadosGenerico = (etapaOperadores, campo) => {
    const mapaPorData = {};

    Object.entries(etapaOperadores).forEach(([operador, dados]) => {
        const apontamentos = dados?.apontamentos;
        if (!Array.isArray(apontamentos)) return;

        apontamentos.forEach((item) => {
            const data = new Date(item.DHINICIO);
            if (isNaN(data.getTime())) return;

            const dataFormatada = format(data, "MM-yyyy");

            if (!mapaPorData[dataFormatada]) {
                mapaPorData[dataFormatada] = {};
            }

            mapaPorData[dataFormatada][operador] =
                (mapaPorData[dataFormatada][operador] || 0) + (item[campo] || 0);
        });
    });

    return Object.entries(mapaPorData)
        .sort(([a], [b]) => {
            const [mA, yA] = a.split("-").map(Number);
            const [mB, yB] = b.split("-").map(Number);
            return yA !== yB ? yA - yB : mA - mB;
        })
        .map(([data, valores]) => ({ data, ...valores }));
};

const prepararDadosGraficoRodando = (etapaOperadores) => {
    const mapaPorData = {};

    Object.entries(etapaOperadores).forEach(([operador, dados]) => {
        const apontamentos = dados?.apontamentos;
        if (!Array.isArray(apontamentos)) return;

        apontamentos.forEach((item) => {
            const data = new Date(item.DHINICIO);
            if (isNaN(data.getTime())) return;

            if (item.APONTAMENTO !== "201 - Rodando") return;

            const dataFormatada = format(data, "MM-yyyy");

            if (!mapaPorData[dataFormatada]) {
                mapaPorData[dataFormatada] = {};
            }

            mapaPorData[dataFormatada][operador] =
                (mapaPorData[dataFormatada][operador] || 0) + (item.TEMPOAPTO || 0);
        });
    });

    return Object.entries(mapaPorData)
        .sort(([a], [b]) => {
            const [mA, yA] = a.split("-").map(Number);
            const [mB, yB] = b.split("-").map(Number);
            return yA !== yB ? yA - yB : mA - mB;
        })
        .map(([data, valores]) => ({ data, ...valores }));
};

const prepararDadosGraficoAcerto = (etapaOperadores) => {
    const mapaPorData = {};

    Object.entries(etapaOperadores).forEach(([operador, dados]) => {
        const apontamentos = dados?.apontamentos;
        if (!Array.isArray(apontamentos)) return;

        apontamentos.forEach((item) => {
            const data = new Date(item.DHINICIO);
            if (isNaN(data.getTime())) return;

            if (item.GRUPOAPONTAMENTO !== "CE - ACERTO") return;

            const dataFormatada = format(data, "MM-yyyy");

            if (!mapaPorData[dataFormatada]) {
                mapaPorData[dataFormatada] = {};
            }

            mapaPorData[dataFormatada][operador] =
                (mapaPorData[dataFormatada][operador] || 0) + (item.TEMPOAPTO || 0);
        });
    });

    return Object.entries(mapaPorData)
        .sort(([a], [b]) => {
            const [mA, yA] = a.split("-").map(Number);
            const [mB, yB] = b.split("-").map(Number);
            return yA !== yB ? yA - yB : mA - mB;
        })
        .map(([data, valores]) => ({ data, ...valores }));
};

const prepararDadosGraficoDesperdicio = (etapaOperadores) => {
    const mapaPorData = {};

    Object.entries(etapaOperadores).forEach(([operador, dados]) => {
        const apontamentos = dados?.apontamentos;
        if (!Array.isArray(apontamentos)) return;

        apontamentos.forEach((item) => {
            const data = new Date(item.DHINICIO);
            if (isNaN(data.getTime())) return;

            if (!item.GRUPOAPONTAMENTO?.startsWith("CE - DESP.")) return;

            const dataFormatada = format(data, "MM-yyyy");

            if (!mapaPorData[dataFormatada]) {
                mapaPorData[dataFormatada] = {};
            }

            mapaPorData[dataFormatada][operador] =
                (mapaPorData[dataFormatada][operador] || 0) + (item.QTD || 0);
        });
    });

    return Object.entries(mapaPorData)
        .sort(([a], [b]) => {
            const [mA, yA] = a.split("-").map(Number);
            const [mB, yB] = b.split("-").map(Number);
            return yA !== yB ? yA - yB : mA - mB;
        })
        .map(([data, valores]) => ({ data, ...valores }));
};


const prepararDadosGraficoQtd = (etapaOperadores) =>
    prepararDadosGenerico(etapaOperadores, "QTD");

const prepararDadosGraficoTempo = (etapaOperadores) =>
    prepararDadosGenerico(etapaOperadores, "TEMPOAPTO");

const prepararDadosGraficoOp = (etapaOperadores) => {
    const mapaPorData = {};

    Object.entries(etapaOperadores).forEach(([operador, dados]) => {
        const apontamentos = dados?.apontamentos;
        if (!Array.isArray(apontamentos)) return;

        const nuopsPorMes = {};

        apontamentos.forEach((item) => {
            const data = new Date(item.DHINICIO);
            if (isNaN(data.getTime())) return;

            const dataFormatada = format(data, "MM-yyyy");

            if (!nuopsPorMes[dataFormatada]) {
                nuopsPorMes[dataFormatada] = new Set();
            }

            if (item.NUOP) {
                nuopsPorMes[dataFormatada].add(item.NUOP);
            }
        });

        Object.entries(nuopsPorMes).forEach(([dataFormatada, nuopSet]) => {
            if (!mapaPorData[dataFormatada]) {
                mapaPorData[dataFormatada] = {};
            }

            mapaPorData[dataFormatada][operador] =
                (mapaPorData[dataFormatada][operador] || 0) + nuopSet.size;
        });
    });

    return Object.entries(mapaPorData)
        .sort(([a], [b]) => {
            const [mA, yA] = a.split("-").map(Number);
            const [mB, yB] = b.split("-").map(Number);
            return yA !== yB ? yA - yB : mA - mB;
        })
        .map(([data, valores]) => ({ data, ...valores }));
};

const GraficoProdutividade = ({ operadores }) => {
    const [modoAnalise, setModoAnalise] = useState("QTD");
    const [pontoSelecionado, setPontoSelecionado] = useState(null);
    const [apontamentosSelecionados, setApontamentosSelecionados] = useState([]);

    const filtrarApontamentos = (operador, mesFormatado) => {
        const dados = operadores[operador];
        if (!dados || !Array.isArray(dados.apontamentos)) return [];

        return dados.apontamentos.filter((item) => {
            const data = new Date(item.DHINICIO);
            return !isNaN(data.getTime()) && format(data, "MM-yyyy") === mesFormatado;
        });
    };

    let dadosGrafico;
    switch (modoAnalise) {
        case "QTD":
            dadosGrafico = prepararDadosGraficoQtd(operadores);
            break;
        case "RODANDO":
            dadosGrafico = prepararDadosGraficoRodando(operadores);
            break;
        case "SETUP":
            dadosGrafico = prepararDadosGraficoAcerto(operadores);
            break;
        case "DESP":
            dadosGrafico = prepararDadosGraficoDesperdicio(operadores);
            break;
        case "NUOP":
            dadosGrafico = prepararDadosGraficoOp(operadores);
            break;
        default:
            dadosGrafico = [];
            break;
    }

    const cores = ["#1976d2", "#388e3c", "#f57c00", "#d32f2f", "#7b1fa2"];

    return (
        <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>
                Análises Por Mês/Operador
            </Typography>

            <ToggleButtonGroup
                value={modoAnalise}
                exclusive
                onChange={(e, novoValor) => {
                    if (novoValor !== null) {
                        setModoAnalise(novoValor);
                        setPontoSelecionado(null);
                        setApontamentosSelecionados([]);
                    }
                }}
                size="small"
                sx={{ mb: 2 }}
            >
                <ToggleButton value="QTD">Quantidade</ToggleButton>
                <ToggleButton value="RODANDO">Rodando</ToggleButton>
                <ToggleButton value="SETUP">Setup</ToggleButton>
                <ToggleButton value="DESP">Desperdicio</ToggleButton>
                <ToggleButton value="NUOP">Ops</ToggleButton>
            </ToggleButtonGroup>

            <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dadosGrafico}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="data" />
                        <YAxis />
                        <Tooltip
                            formatter={(value, name) => {
                                const modosComHora = ["RODANDO", "SETUP"];
                                const isTempo = modosComHora.includes(modoAnalise);
                                const valorFormatado = isTempo
                                    ? formatarMinutosParaHHMM(value)
                                    : formatarNumeroBR(value);

                                return [valorFormatado, name];
                            }}
                            labelFormatter={(label) => `Mês: ${label}`}
                        />

                        <Legend />
                        {Object.keys(operadores).map((operador, index) => (
                            <Line
                                key={operador}
                                type="monotone"
                                dataKey={operador}
                                stroke={cores[index % cores.length]}
                                dot={({ cx, cy, payload, value }) => (
                                    <circle
                                        cx={cx}
                                        cy={cy}
                                        r={5}
                                        fill={cores[index % cores.length]}
                                        stroke="#fff"
                                        strokeWidth={2}
                                        onClick={() => {
                                            const mes = payload.data;
                                            const apontamentos = filtrarApontamentos(operador, mes);
                                            setPontoSelecionado({ operador, mes });
                                            setApontamentosSelecionados(apontamentos);
                                        }}
                                        style={{ cursor: "pointer" }}
                                    />
                                )}
                            >
                                {/*<LabelList
                                    dataKey={operador}
                                    position="top"
                                    formatter={(value) => {
                                        const modosComHora = ["RODANDO", "SETUP"];
                                        return modosComHora.includes(modoAnalise)
                                            ? formatarMinutosParaHHMM(value)
                                            : formatarNumeroBR(value);
                                    }}
                                />*/}
                            </Line>

                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </Box>

            {pontoSelecionado && (
                <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Apontamentos de {pontoSelecionado.operador} em {pontoSelecionado.mes}
                    </Typography>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                            setPontoSelecionado(null);
                            setApontamentosSelecionados([]);
                        }}
                    >
                        Recolher
                    </Button>

                    <TableContainer component={Paper}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Data/Hora Início</TableCell>
                                    <TableCell>Quantidade</TableCell>
                                    <TableCell>Tempo Apt.</TableCell>
                                    <TableCell>Nº OP</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {apontamentosSelecionados.map((item, i) => (
                                    <TableRow key={i}>
                                        <TableCell>{item.DHINICIO}</TableCell>
                                        <TableCell>{item.QTD}</TableCell>
                                        <TableCell>{item.TEMPOAPTO}</TableCell>
                                        <TableCell>{item.NUOP}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}
        </Box>
    );
};

export default GraficoProdutividade;
