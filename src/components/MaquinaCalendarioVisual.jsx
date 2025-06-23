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
import { getCalendarioMaquina } from "../api/maquinas";

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
                const data = await getCalendarioMaquina(codmaq);
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
        <Box sx={{ overflowX: "auto", p: 1 }}>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ fontWeight: "bold" }}>
                            {calendarios[0]?.nome}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell align="left" sx={{ fontWeight: "bold" }}>
                            Dia
                        </TableCell>
                        {calendarios.map((cal, idx) => (
                            <TableCell key={idx} align="center" sx={{ fontWeight: "bold" }}>
                                {formatarHora(cal.hrIni)} - {formatarHora(cal.hrFim)}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {diasDaSemana.map((dia, idx) => {
                        const chave = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado"][idx];
                        return (
                            <TableRow key={dia}>
                                <TableCell>{dia}</TableCell>
                                {calendarios.map((cal, i) => (
                                    <TableCell
                                        key={i}
                                        align="center"
                                        sx={{
                                            bgcolor: cal.diasDaSemana[chave] ? "success.light" : "grey.300",
                                            color: cal.diasDaSemana[chave] ? "success.dark" : "grey.600",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        {cal.diasDaSemana[chave] ? "S" : "N"}
                                    </TableCell>
                                ))}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </Box>
    );

};

export default MaquinaCalendarioVisual;
