import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Divider,
    Paper,
    CircularProgress,
} from "@mui/material";
import { format, parseISO } from "date-fns";

function TabPanel({ children, value, index }) {
    return value === index && <Box sx={{ pt: 2 }}>{children}</Box>;
}

export default function DetalheOPComAbas({ op }) {
    const [aba, setAba] = useState(0);

    const [etapasOrcado, setEtapasOrcado] = useState(null);
    const [etapasRealizado, setEtapasRealizado] = useState(null);

    const [materiaisOrcado, setMateriaisOrcado] = useState(null);
    const [materiaisRealizado, setMateriaisRealizado] = useState(null);


    useEffect(() => {
        if (!op) return;
        carregarAba(aba);
        // Reset ao trocar OP
        setEtapasOrcado(null);
        setEtapasRealizado(null);
        setMateriaisOrcado(null);
        setMateriaisRealizado(null);
    }, [op]);

    const hhmmToMinutes = (hhmm) => {
    const horas = Math.floor(hhmm / 100);
    const minutos = hhmm % 100;
    return horas * 60 + minutos;
  };

    const carregarAba = async (index) => {
        console.log(op);
        setAba(index);
        if (index === 0 && !etapasOrcado && !etapasRealizado) {
            // Etapas Orçado
            const queryEtapasOrcado = `SELECT
                    A.CODATIVIDADE
                    ,PRO.DESCRPROD AS SERVICO
                    ,A.TIRAGEM
                    ,A.TEMPOTOTAL
                    FROM sankhya.AD_CONTOP3B A
                    INNER JOIN sankhya.TGFPRO PRO ON
                        PRO.CODPROD = A.CODATIVIDADE
                    WHERE
                        A.NUOP = ${op.NUOP}`;
            const res1 = await fetch("http://192.168.2.3:8081/api/crud/select", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(queryEtapasOrcado),
            });
            setEtapasOrcado(await res1.json());

            // Etapas Realizado
            const queryEtapasRealizado = `SELECT
                    A.CODATIVIDADE
                    ,PRO.DESCRPROD AS SERVICO
                    ,SUM(A.QTD) AS TIRAGEM
                    ,SUM(DATEDIFF(MINUTE, A.DHINICIO, A.DHFIM)) AS TEMPOTOTAL
                    FROM sankhya.AD_CADAPONTPROD A
                    INNER JOIN sankhya.TGFPRO PRO ON
                        PRO.CODPROD = A.CODATIVIDADE
                    WHERE
                        A.NUOP = ${op.NUOP}
                    AND A.CODTIPAPONT = 8
                    GROUP BY
                        A.CODATIVIDADE
                    ,PRO.DESCRPROD `;
            const res2 = await fetch("http://192.168.2.3:8081/api/crud/select", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(queryEtapasRealizado),
            });
            setEtapasRealizado(await res2.json());
        }

        if (index === 1 && !materiaisOrcado && !materiaisRealizado) {
            // Materiais Orçado (BOM)
            const queryMateriaisOrcado = `-- sua query para materiais planejados usando NUOP: ${op.NUOP}`;
            const res1 = await fetch("http://192.168.2.3:8081/api/crud/select", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(queryMateriaisOrcado),
            });
            setMateriaisOrcado(await res1.json());

            // Materiais Realizado (consumo)
            const queryMateriaisRealizado = `-- sua query de consumo apontado usando NUOP: ${op.NUOP}`;
            const res2 = await fetch("http://192.168.2.3:8081/api/crud/select", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(queryMateriaisRealizado),
            });
            setMateriaisRealizado(await res2.json());
        }
    };

    const formatarData = (data) =>
        data ? format(parseISO(data), "dd/MM/yyyy HH:mm") : "—";

    const renderLista = (lista, renderItem) =>
        lista.length === 0 ? (
            <Typography variant="body2" color="text.secondary">Nenhum item encontrado.</Typography>
        ) : (
            lista.map(renderItem)
        );

    return (
        <Paper sx={{ mt: 2, p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Detalhamento da OP #{op.NUOP}
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Tabs value={aba} onChange={(e, val) => carregarAba(val)} variant="fullWidth">
                <Tab label="Etapas" />
                <Tab label="Materiais" />
            </Tabs>

            {/* Etapas */}
            <TabPanel value={aba} index={0}>
                <Typography variant="subtitle1" sx={{ mt: 2 }}>
                    Etapas com Comparativo
                </Typography>

                {etapasOrcado === null || etapasRealizado === null ? (
                    <CircularProgress size={20} />
                ) : (
                    <Box sx={{ mt: 2 }}>
                        {etapasOrcado.map((orc, i) => {
                            const real = etapasRealizado.find(r => r.CODATIVIDADE === orc.CODATIVIDADE);
                            const tiragemOrc = Number(orc.TIRAGEM);
                            const tempoOrc = hhmmToMinutes(Number(orc.TEMPOTOTAL));

                            const tiragemReal = real ? Number(real.TIRAGEM) : 0;
                            const tempoReal = real ? Number(real.TEMPOTOTAL) : 0;

                            return (
                                <Box key={i} sx={{ mb: 2, pl: 1 }}>
                                    <Typography variant="subtitle2">{orc.SERVICO}</Typography>
                                    <Typography variant="body2">
                                        Tiragem: {tiragemOrc} /{" "}
                                        <Box
                                            component="span"
                                            sx={{
                                                color: tiragemReal > tiragemOrc ? "error.main" : "inherit",
                                                fontWeight: "bold",
                                            }}
                                        >
                                            {tiragemReal}
                                        </Box>
                                    </Typography>
                                    <Typography variant="body2">
                                        Tempo (min): {tempoOrc} /{" "}
                                        <Box
                                            component="span"
                                            sx={{
                                                color: tempoReal > tempoOrc ? "error.main" : "inherit",
                                                fontWeight: "bold",
                                            }}
                                        >
                                            {tempoReal}
                                        </Box>
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Box>
                )}
            </TabPanel>


            {/* Materiais */}
            <TabPanel value={aba} index={1}>
                <Typography variant="subtitle1" sx={{ mt: 2 }}>
                    Materiais Orçados
                </Typography>
                {materiaisOrcado === null ? (
                    <CircularProgress size={20} />
                ) : (
                    <Box sx={{ pl: 2, mt: 1 }}>
                        {renderLista(materiaisOrcado, (m, i) => (
                            <Typography key={i}>
                                • {m.NOMEPROD} — {m.QTDE} {m.UM}
                            </Typography>
                        ))}
                    </Box>
                )}

                <Typography variant="subtitle1" sx={{ mt: 3 }}>
                    Materiais Consumidos (Realizado)
                </Typography>
                {materiaisRealizado === null ? (
                    <CircularProgress size={20} />
                ) : (
                    <Box sx={{ pl: 2, mt: 1 }}>
                        {renderLista(materiaisRealizado, (m, i) => (
                            <Typography key={i}>
                                • {m.NOMEPROD} — {m.QTDE} {m.UM} (por {m.OPERADOR})
                            </Typography>
                        ))}
                    </Box>
                )}
            </TabPanel>
        </Paper>
    );
}
