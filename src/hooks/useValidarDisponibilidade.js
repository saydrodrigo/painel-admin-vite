import { getDay, addDays, isBefore, isSameDay, differenceInMinutes } from 'date-fns';

// Corrigido para não mutar o objeto original
const aplicarHorario = (data, horario) => {
  const hora = Math.floor(horario / 100);
  const minuto = horario % 100;
  const novaData = new Date(data);
  novaData.setHours(hora, minuto, 0, 0);
  return novaData;
};

const diaSemanaToStr = (dia) => {
  return ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'][dia];
};

export function useCalendarioDisponivel(calendarios = []) {
  function validarDisponibilidade(DHINI, DHFIM) {
    const ini = DHINI instanceof Date ? DHINI : new Date(DHINI);
    const fim = DHFIM instanceof Date ? DHFIM : new Date(DHFIM);
    const tempoNecessario = differenceInMinutes(fim, ini);

    let tempoDisponivel = 0;
    let diaAtual = new Date(ini.getFullYear(), ini.getMonth(), ini.getDate());

    while (tempoDisponivel < tempoNecessario) {
      const diaSemana = getDay(diaAtual);
      const nomeDia = diaSemanaToStr(diaSemana);

      // Filtra calendários válidos e ativos para o dia
      const periodosPermitidos = calendarios.filter(
        (cal) => cal.tipo === "P" && cal.diasDaSemana[nomeDia]
      );

      const bloqueios = calendarios.filter(
        (cal) => cal.tipo === "A" && cal.diasDaSemana[nomeDia]
      );

      for (const periodo of periodosPermitidos) {
        let iniPeriodo = aplicarHorario(diaAtual, parseInt(periodo.hrIni));
        let fimPeriodo = aplicarHorario(diaAtual, parseInt(periodo.hrFim));
        if (parseInt(periodo.hrFim) < parseInt(periodo.hrIni)) {
          fimPeriodo = addDays(fimPeriodo, 1); // cruza meia-noite
        }

        // Subtrai os bloqueios do período
        let duracaoValida = differenceInMinutes(fimPeriodo, iniPeriodo);

        for (const bloco of bloqueios) {
          let iniBloco = aplicarHorario(diaAtual, parseInt(bloco.hrIni));
          let fimBloco = aplicarHorario(diaAtual, parseInt(bloco.hrFim));
          if (parseInt(bloco.hrFim) < parseInt(bloco.hrIni)) {
            fimBloco = addDays(fimBloco, 1);
          }

          // Se o bloco está dentro do período permitido, desconta
          if (
            isBefore(iniBloco, fimPeriodo) &&
            !isBefore(fimBloco, iniPeriodo)
          ) {
            const inicio = iniBloco < iniPeriodo ? iniPeriodo : iniBloco;
            const fim = fimBloco > fimPeriodo ? fimPeriodo : fimBloco;
            duracaoValida -= Math.max(0, differenceInMinutes(fim, inicio));
          }
        }

        tempoDisponivel += Math.max(0, duracaoValida);
        if (tempoDisponivel >= tempoNecessario) break;
      }

      diaAtual = addDays(diaAtual, 1);

      // Se passou do fim da OP sem conseguir validar, quebra o loop
      if (isBefore(fim, diaAtual)) break;
    }

    return tempoDisponivel >= tempoNecessario;
  }

  return { validarDisponibilidade };
}