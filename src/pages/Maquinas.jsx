// src/pages/MaquinaDetalhes.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { format, parseISO } from 'date-fns';
import { addMinutes } from 'date-fns';
import { IconButton, Tooltip } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AdjustIcon from '@mui/icons-material/Adjust';
import { LocalizationProvider, DateTimePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { Snackbar, Alert } from "@mui/material";

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
  Grid,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField
} from "@mui/material";
import { useCalendarioMaquina } from "../hooks/useCalendarioMaquina";
import { useCalendarioDisponivel } from "../hooks/useValidarDisponibilidade";
import { calcularFimDaOP } from "../hooks/calcularFimDaOP";



export default function MaquinaDetalhes() {
  const { codmaq } = useParams();
  const [dados, setDados] = useState(null);
  const [dadosEmAndamento, setDadosEmAndamento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [linhaSelecionada, setLinhaSelecionada] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [fixarDialogAberto, setFixarDialogAberto] = useState(false);
  const [indiceFixar, setIndiceFixar] = useState(null);
  const [dataHoraFixar, setDataHoraFixar] = useState(new Date());
  const [snackbarAberto, setSnackbarAberto] = useState(false);
  const [snackbarMensagem, setSnackbarMensagem] = useState("");
  const { calendario, loading2, erro } = useCalendarioMaquina(codmaq);
  const { validarDisponibilidade } = useCalendarioDisponivel(calendario || []);

  useEffect(() => {
    async function fetchDados() {
      try {
        const query = `
          SELECT TOP 100
            A.NUOP
            ,sankhya.FC_GET_OPCAO_CAMPO('AD_PCPCEN', 'STATUS', A.STATUS) AS STATUS
            ,A.CODATIVIDADE
            ,SER.DESCRPROD
            ,A.CODETAPA
            ,A.DH_I AS DHINI
            ,A.DH_F AS DHFIM
            ,A.PRODUTOS
            ,A.TEMPOTOTAL
            ,sankhya.FC_HRMOV_HRBR(TEMPOTOTAL) TEMPOTOTALFORMATADO

            ,A.TIRAGEM
            ,ETA.NOMEETAPA AS ETAPA
            ,A.DT_ENTREGA AS DTENTREGA
          FROM sankhya.AD_PCPCEN A
          INNER JOIN sankhya.TGFPRO SER ON SER.CODPROD = A.CODATIVIDADE
          INNER JOIN sankhya.TGFETA ETA ON ETA.CODETAPA = A.CODETAPA
          WHERE A.CODMQP = ${codmaq}
          AND A.STATUS NOT IN('F', 'C')
          ORDER BY
            CASE WHEN STATUS = 'AP' AND A.DH_I IS NULL THEN 2 ELSE 1 END ASC,
            A.DH_I ASC     
          
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
        setDados(data.filter(item => item.STATUS !== "Em Andamento"));
        setDadosEmAndamento(data.filter(item => item.STATUS === "Em Andamento"));
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

  const contagemStatus = dados?.reduce(
    (acc, row) => {
      const status = row.STATUS || "Desconhecido";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {}
  );

  const handleClick = (row) => {
    setLinhaSelecionada(row);
  };

  const moverOpPraCima = (indice) => {
    if (indice <= 0) return;
    if (dados[indice].STATUS !== "Programado") {
      mostrarSnackbar("Apenas OPs com status 'Programado' podem ser reordenadas.");
      return;
    }
    const novaOrdem = [...dados];

    // Trocar OP atual com a anterior
    const temp = novaOrdem[indice - 1];
    novaOrdem[indice - 1] = novaOrdem[indice];
    novaOrdem[indice] = temp;

    // Se a OP foi movida para a posição 0, definimos a data de início manualmente
    if (indice - 1 === 0) {
      const referencia = novaOrdem[1].DHINI ?? new Date().toISOString();
      const opMovida = novaOrdem[0];

      opMovida.STATUS = "Programado";
      opMovida.DHINI = referencia;

      const minutosTotais = hhmmToMinutes(Number(opMovida.TEMPOTOTAL));
      const novaDHFim = addMinutes(parseISO(referencia), minutosTotais);
      opMovida.DHFIM = novaDHFim.toISOString();

      // Agora recalcular a partir da próxima
      const nova = recalcularEmCascata(novaOrdem, 1);
      setDados(nova);
    } else {
      // Caso normal: recalcular a partir da posição movida
      const nova = recalcularEmCascata(novaOrdem, indice - 1);
      setDados(nova);
    }
  };



  const moverOpPraBaixo = (indice) => {
    if (indice >= dados.length - 1) return;
    if (dados[indice].STATUS !== "Programado") {
      mostrarSnackbar("Apenas OPs com status 'Programado' podem ser reordenadas.");
      return;
    }
    if (!validarDisponibilidade(dados[indice].DHINI, dados[indice].DHFIM, minutosTotais)) {
      mostrarSnackbar('Horário da OP está fora do calendário da máquina');
      return;
    }
    const novaOrdem = [...dados];
    const temp = novaOrdem[indice + 1];
    novaOrdem[indice + 1] = novaOrdem[indice];
    novaOrdem[indice] = temp;

    // Recalcular a partir da OP que desceu
    const nova = recalcularEmCascata(novaOrdem, indice);
    setDados(nova);
  };



  const hhmmToMinutes = (hhmm) => {
    const horas = Math.floor(hhmm / 100);
    const minutos = hhmm % 100;
    return horas * 60 + minutos;
  };

  const recalcularEmCascata = (lista, aPartirDe) => {
    const novaLista = [...lista];

    for (let i = aPartirDe; i < novaLista.length; i++) {
      const anterior = novaLista[i - 1];
      const atual = novaLista[i];

      // Recalcula só para STATUS Programado
      if (atual.STATUS !== "Programado") continue;

      if (!anterior?.DHFIM || !atual?.TEMPOTOTAL) continue;

      const novaDHIni = parseISO(anterior.DHFIM);

      // Converte HHMM para minutos totais
      const minutosTotais = hhmmToMinutes(Number(atual.TEMPOTOTAL));

      const novaDHFim = calcularFimDaOP(novaDHIni, minutosTotais, calendario);

      atual.DHINI = novaDHIni.toISOString();
      atual.DHFIM = novaDHFim.toISOString();
    }

    return novaLista;
  };

  const abrirDialogFixar = (indice) => {
    setIndiceFixar(indice);
    setDataHoraFixar(new Date()); // default: agora
    setFixarDialogAberto(true);
  };

  const confirmarFixar = () => {
    const novaLista = [...dados];
    const opFixada = { ...novaLista[indiceFixar] };

    const minutos = hhmmToMinutes(Number(opFixada.TEMPOTOTAL));
    const novoDHINI = dataHoraFixar;
    const novoDHFIM = calcularFimDaOP(novoDHINI, minutos, calendario);

    if (!validarDisponibilidade(novoDHINI, novoDHFIM, minutos)) {
      mostrarSnackbar('Horário da OP está fora do calendário da máquina');
      return;
    }

    // Atualiza a OP fixada
    opFixada.DHINI = novoDHINI.toISOString();
    opFixada.DHFIM = novoDHFIM.toISOString();

    // Remove OP fixada da lista
    novaLista.splice(indiceFixar, 1);

    // Insere a OP fixada na lista ordenada
    novaLista.push(opFixada);
    novaLista.sort((a, b) => {
      const d1 = a.DHINI ? parseISO(a.DHINI) : new Date(8640000000000000);
      const d2 = b.DHINI ? parseISO(b.DHINI) : new Date(8640000000000000);
      return d1 - d2;
    });

    // Encontra o índice da OP fixada
    const novaPosicao = novaLista.findIndex(op => op.NUOP === opFixada.NUOP);

    // Agora empurra para baixo as OPs que estejam com conflito de horário
    // Percorre da novaPosicao + 1 em diante e, se o início da OP
    // anterior for maior ou igual que a OP atual, desloca a atual para
    // iniciar após o fim da anterior

    for (let i = novaPosicao + 1; i < novaLista.length; i++) {
      const anterior = novaLista[i - 1];
      const atual = novaLista[i];

      if (atual.STATUS !== "Programado") continue;

      const inicioAnterior = parseISO(anterior.DHFIM);
      const inicioAtual = parseISO(atual.DHINI);

      if (inicioAtual <= inicioAnterior) {
        // desloca atual para começar após o fim da anterior
        const minutosTotaisAtual = hhmmToMinutes(Number(atual.TEMPOTOTAL));
        const novoInicio = inicioAnterior;
        const novoFim = calcularFimDaOP(novoInicio, minutosTotaisAtual, calendario);

        atual.DHINI = novoInicio.toISOString();
        atual.DHFIM = novoFim.toISOString();
      }
    }

    // Por fim, recalcula em cascata para garantir integridade
    const nova = recalcularEmCascata(novaLista, novaPosicao + 1);

    setDados(nova);
    setFixarDialogAberto(false);
  };



  const programarOP = (opSelecionada) => {
    const listaAtual = dados
      .filter((row) => row.STATUS !== "Em Andamento")
      .sort((a, b) => {
        if (a.STATUS === "Programado" && b.STATUS !== "Programado") return -1;
        if (a.STATUS !== "Programado" && b.STATUS === "Programado") return 1;
        return 0;
      });

    const idxSelecionado = listaAtual.findIndex(op => op.NUOP === opSelecionada.NUOP);

    let ultimaProgramadaAntes = null;
    for (let i = idxSelecionado - 1; i >= 0; i--) {
      if (listaAtual[i].STATUS === "Programado" && listaAtual[i].DHFIM) {
        ultimaProgramadaAntes = listaAtual[i];
        break;
      }
    }

    const novaDHINI = ultimaProgramadaAntes?.DHFIM
      ? new Date(ultimaProgramadaAntes.DHFIM)
      : new Date();

    // Conversão do HHMM para minutos totais

    const minutosTotais = hhmmToMinutes(Number(opSelecionada.TEMPOTOTAL));

    const novaDHFIM = calcularFimDaOP(novaDHINI, minutosTotais, calendario);

    if (!validarDisponibilidade(novaDHINI, novaDHFIM, minutosTotais)) {
      mostrarSnackbar('Horário da OP está fora do calendário da máquina');
      return;
    }
    const novaOp = {
      ...opSelecionada,
      STATUS: "Programado",
      DHINI: novaDHINI.toISOString(),
      DHFIM: novaDHFIM.toISOString(),
    };

    setDados(prev =>
      prev.map(op => (op.NUOP === opSelecionada.NUOP ? novaOp : op))
    );

    console.log("OP programada com hierarquia:", novaOp);
  };

  const mostrarSnackbar = (mensagem) => {
    setSnackbarMensagem(mensagem);
    setSnackbarAberto(true);
  };



  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 2 }}>
      {/* Primeiro Paper: tabela */}
      {/* Segundo Paper: conteúdo adicional */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Status das OPs
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, bgcolor: 'success.light' }}>
              <Typography variant="caption" color="text.secondary">Em Andamento</Typography>
              <Typography variant="h6">{dadosEmAndamento.length || 0}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, bgcolor: 'info.light' }}>
              <Typography variant="caption" color="text.secondary">Programado</Typography>
              <Typography variant="h6">{contagemStatus["Programado"] || 0}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, bgcolor: 'warning.light' }}>
              <Typography variant="caption" color="text.secondary">Aguardando Programação</Typography>
              <Typography variant="h6">{contagemStatus["Aguardando Programação"] || 0}</Typography>
            </Paper>
          </Grid>

        </Grid>
      </Paper>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Em Andamento
        </Typography>

        {dadosEmAndamento?.length > 0 ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Op</TableCell>
                <TableCell>Dt. Ent.</TableCell>
                <TableCell>Produto(s)</TableCell>
                <TableCell>Atividade</TableCell>
                <TableCell>Etapa</TableCell>
                <TableCell>Tempo Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dadosEmAndamento

                .map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{row.NUOP}</TableCell>
                    <TableCell>{format(parseISO(row.DTENTREGA), "dd/MM/yyyy")}</TableCell>
                    <TableCell>{row.PRODUTOS}</TableCell>
                    <TableCell>{row.DESCRPROD}</TableCell>
                    <TableCell>{row.ETAPA}</TableCell>
                    <TableCell>{row.TEMPOTOTALFORMATADO}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        ) : (
          <Typography variant="body1">Nenhum dado encontrado.</Typography>
        )}
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Próximas
        </Typography>

        {dados?.length > 0 ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Op</TableCell>
                <TableCell>Dt. Ent.</TableCell>
                <TableCell>Produto(s)</TableCell>
                <TableCell>Atividade</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Dt. Ini.</TableCell>
                <TableCell>Dt. Fim</TableCell>
                <TableCell>Tempo Total</TableCell>
                <TableCell colSpan={2}>Opções</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dados
                .filter((row) => row.STATUS !== "Em Andamento")
                .sort((a, b) => {
                  if (a.STATUS === "Programado" && b.STATUS !== "Programado") return -1;
                  if (a.STATUS !== "Programado" && b.STATUS === "Programado") return 1;
                  return 0;
                })
                .map((row, idx) => (
                  <TableRow
                    key={idx}
                    hover
                    onClick={() => handleClick(row)}
                    onDoubleClick={() => programarOP(row)}
                    onMouseEnter={() => setHoveredRow(row.NUOP)}
                    onMouseLeave={() => setHoveredRow(null)}
                    selected={linhaSelecionada?.NUOP === row.NUOP}
                    sx={{ cursor: "pointer", position: "relative" }}
                  >
                    <TableCell>{row.NUOP}</TableCell>
                    <TableCell>{format(parseISO(row.DTENTREGA), "dd/MM/yyyy")}</TableCell>
                    <TableCell>{row.PRODUTOS}</TableCell>
                    <TableCell>{row.DESCRPROD}</TableCell>
                    <TableCell>{row.STATUS}</TableCell>
                    <TableCell>{row.DHINI ? format(parseISO(row.DHINI), "dd/MM/yyyy HH:mm") : "-"}</TableCell>
                    <TableCell>{row.DHFIM ? format(parseISO(row.DHFIM), "dd/MM/yyyy HH:mm") : "-"}</TableCell>
                    <TableCell>{row.TEMPOTOTALFORMATADO}</TableCell>
                    <TableCell align="center" colSpan={2}></TableCell>
                    {/* Botão flutuante */}
                    {hoveredRow === row.NUOP && (
                      <TableCell align="center" colSpan={2}
                        sx={{
                          position: "absolute",
                          right: -25,
                          top: "50%",
                          transform: "translateY(-50%)",
                          zIndex: 10,
                          display: "flex",
                          flexDirection: "row",

                        }}
                      >
                        <Tooltip title="Pra Cima">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              moverOpPraCima(idx);
                              console.log("Ver detalhes:", row.NUOP);
                            }}
                          >
                            <ArrowUpwardIcon />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Fixar">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              abrirDialogFixar(idx);
                              console.log("Excluir:", row.NUOP);
                            }}
                          >
                            <AdjustIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Pra Baixo">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              moverOpPraBaixo(idx);
                              console.log("Excluir:", row.NUOP);
                            }}
                          >
                            <ArrowDownwardIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}

                  </TableRow>
                ))}
            </TableBody>


          </Table>
        ) : (
          <Typography variant="body1">Nenhum dado encontrado.</Typography>
        )}
      </Paper>


      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
        <Dialog open={fixarDialogAberto} onClose={() => setFixarDialogAberto(false)}>
          <DialogTitle>Fixar início da OP</DialogTitle>
          <DialogContent>
            <DateTimePicker
              label="Data e hora de início"
              value={dataHoraFixar}
              onChange={(newValue) => setDataHoraFixar(newValue)}
              renderInput={(params) => <TextField {...params} fullWidth sx={{ mt: 2 }} />}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFixarDialogAberto(false)}>Cancelar</Button>
            <Button variant="contained" onClick={confirmarFixar}>Confirmar</Button>
          </DialogActions>
        </Dialog>
      </LocalizationProvider>
      <Snackbar
        open={snackbarAberto}
        autoHideDuration={4000}
        onClose={() => setSnackbarAberto(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setSnackbarAberto(false)} severity="warning" variant="filled" sx={{ width: "100%" }}>
          {snackbarMensagem}
        </Alert>
      </Snackbar>

    </Box>

  );

}
