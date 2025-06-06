import React, { useEffect, useState } from "react";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Box,
    CircularProgress,
    Typography,
} from "@mui/material";

const diasDaSemana = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

const formatarHora = (horaStr) => {
    const horaNum = Number(horaStr);
    const hh = Math.floor(horaNum / 100)
        .toString()
        .padStart(2, "0");
    const mm = (horaNum % 100).toString().padStart(2, "0");
    return `${hh}:${mm}`;
};

const parseMachineCalendar = (raw) => ({
    codmaqp: Number(raw.CODMQP),
    nome: raw.NOME,
    codcal: Number(raw.CODCAL),
    tipo: raw.TIPO,
    diasDaSemana: {
        domingo: raw.DOMINGO === "S",
        segunda: raw.SEGUNDA === "S",
        terca: raw.TERCA === "S",
        quarta: raw.QUARTA === "S",
        quinta: raw.QUINTA === "S",
        sexta: raw.SEXTA === "S",
        sabado: raw.SABADO === "S",
    },
    hrIni: String(raw.HRINI).padStart(4, "0"),
    hrFim: String(raw.HRFIM).padStart(4, "0"),
    descricaoDias: raw.DIAS_DA_SEMANA?.split("|") || [],
});

const MaquinaCalendarioVisual = ({ codmaq }) => {
    const [calendarios, setCalendarios] = useState([]);
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState(null);

    useEffect(() => {
        async function fetchDados() {
            try {
                const query = `
          SELECT
            B.CODMQP
            ,B.NOME
            ,CODCAL
            ,TIPO
            ,DOMINGO
            ,SEGUNDA
            ,TERCA
            ,QUARTA
            ,QUINTA	
            ,SEXTA
            ,SABADO
            ,HRINI
            ,HRFIM
            ,DIAS_DA_SEMANA
            FROM sankhya.AD_TPRMCAL A
            INNER JOIN sankhya.TPRMQP B ON
                B.CODMQP = A.CODMQP
            WHERE
                A.CODMQP = ${codmaq}
          
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
                const dadosFormatados = data.map(parseMachineCalendar);
                setCalendarios(dadosFormatados);
            } catch (error) {
                console.error("Erro ao buscar dados da máquina:", error);
                setCalendarios([]);
            } finally {
                setLoading(false);
            }
        }

        fetchDados();
    }, [codmaq]);



    if (loading)
        return (
            <Box sx={{ textAlign: "center", p: 2 }}>
                <CircularProgress />
                <Typography>Carregando calendário...</Typography>
            </Box>
        );

    if (erro)
        return (
            <Typography color="error" sx={{ p: 2 }}>
                {erro}
            </Typography>
        );

    if (calendarios.length === 0)
        return <Typography sx={{ p: 2 }}>Nenhum calendário encontrado.</Typography>;

    return (
        <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ fontWeight: "bold" }}>
                            {calendarios[0]?.nome}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell></TableCell>
                        {diasDaSemana.map((dia) => (
                            <TableCell key={dia} align="center">
                                {dia}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {calendarios.map((cal) => (
                        <TableRow key={cal.codcal} hover>
                            <TableCell>
                                {formatarHora(cal.hrIni)} {formatarHora(cal.hrFim)}
                            </TableCell>
                            {["segunda", "terca", "quarta", "quinta", "sexta", "sabado"].map((dia) => (
                                <TableCell
                                    key={dia}
                                    align="center"
                                    sx={{
                                        bgcolor: cal.diasDaSemana[dia] ? "success.light" : "grey.300",
                                        color: cal.diasDaSemana[dia] ? "success.dark" : "grey.600",
                                        fontWeight: "bold",
                                        cursor: cal.diasDaSemana[dia] ? "default" : "not-allowed",
                                    }}
                                >
                                    {cal.diasDaSemana[dia] ? "S" : "N"}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Box>

    );
};

export default MaquinaCalendarioVisual;
