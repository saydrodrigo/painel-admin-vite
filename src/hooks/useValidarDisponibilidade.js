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
  function validarDisponibilidade(DHINI, DHFIM, tempoTotalUtil) {
    const ini = DHINI instanceof Date ? DHINI : new Date(DHINI);
    const fim = DHFIM instanceof Date ? DHFIM : new Date(DHFIM);
    // const tempoNecessario = differenceInMinutes(fim, ini); // não usamos mais isso, pois o tempo é passado
    const tempoNecessario = tempoTotalUtil; // usa o parâmetro passado
    
    let tempoDisponivel = 0;
    let diaAtual = new Date(ini.getFullYear(), ini.getMonth(), ini.getDate());

    while (tempoDisponivel < tempoNecessario) {
      const diaSemana = getDay(diaAtual);
      const nomeDia = diaSemanaToStr(diaSemana);

      // Se for sexta, checar se sábado e domingo não têm turno permitido.
      if (diaSemana === 5) { // sexta
        const sabadoPermitido = calendarios.some(cal => cal.tipo === "P" && cal.diasDaSemana['sabado']);
        const domingoPermitido = calendarios.some(cal => cal.tipo === "P" && cal.diasDaSemana['domingo']);

        if (!sabadoPermitido && !domingoPermitido) {
          // pula sábado e domingo
          diaAtual = addDays(diaAtual, 3); // pula 3 dias (sábado, domingo, segunda)
          continue;
        }
      }

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

        let duracaoValida = differenceInMinutes(fimPeriodo, iniPeriodo);

        for (const bloco of bloqueios) {
          let iniBloco = aplicarHorario(diaAtual, parseInt(bloco.hrIni));
          let fimBloco = aplicarHorario(diaAtual, parseInt(bloco.hrFim));
          if (parseInt(bloco.hrFim) < parseInt(bloco.hrIni)) {
            fimBloco = addDays(fimBloco, 1);
          }

          if (
            isBefore(iniBloco, fimPeriodo) &&
            !isBefore(fimBloco, iniPeriodo)
          ) {
            const inicio = iniBloco < iniPeriodo ? iniPeriodo : iniBloco;
            const fim = fimBloco > fimPeriodo ? fimPeriodo : fimBloco;
            const duracaoBloco = Math.max(0, differenceInMinutes(fim, inicio));

            duracaoValida -= duracaoBloco;

            if (tempoDisponivel + duracaoValida < tempoNecessario) {
              tempoDisponivel += Math.max(0, duracaoValida);
              diaAtual = new Date(fimBloco);
              continue;
            }
          }
        }

        tempoDisponivel += Math.max(0, duracaoValida);
        if (tempoDisponivel >= tempoNecessario) break;
      }

      diaAtual = addDays(diaAtual, 1);

      if (isBefore(fim, diaAtual)) break;
    }

    return tempoDisponivel >= tempoNecessario;
  }

  return { validarDisponibilidade };
}
