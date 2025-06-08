import { getDay, addDays, differenceInMinutes, isSameDay, addMinutes } from 'date-fns';

const aplicarHorario = (data, horario) => {
  const hora = Math.floor(horario / 100);
  const minuto = horario % 100;
  const nova = new Date(data);
  nova.setHours(hora, minuto, 0, 0);
  return nova;
};

const diaSemanaToStr = (dia) => {
  return ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'][dia];
};

export function calcularFimDaOP(DHINI, tempoNecessarioMinutos, calendarios = []) {
  const inicio = new Date(DHINI);
  let tempoRestante = tempoNecessarioMinutos;
  let diaAtual = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());

  let fimEstimado = null;

  while (tempoRestante > 0) {
    const nomeDia = diaSemanaToStr(getDay(diaAtual));

    const periodosPermitidos = calendarios.filter(
      (cal) => cal.tipo === 'P' && cal.diasDaSemana[nomeDia]
    );
    const bloqueios = calendarios.filter(
      (cal) => cal.tipo === 'A' && cal.diasDaSemana[nomeDia]
    );

    for (const periodo of periodosPermitidos) {
      let iniPeriodo = aplicarHorario(diaAtual, parseInt(periodo.hrIni));
      let fimPeriodo = aplicarHorario(diaAtual, parseInt(periodo.hrFim));
      if (parseInt(periodo.hrFim) < parseInt(periodo.hrIni)) {
        fimPeriodo = addDays(fimPeriodo, 1);
      }

      if (fimPeriodo <= inicio) continue;

      if (isSameDay(diaAtual, inicio)) {
        if (inicio > iniPeriodo && inicio < fimPeriodo) {
          iniPeriodo = inicio;
        }
        if (inicio >= fimPeriodo) continue;
      }

      let cursor = new Date(iniPeriodo);

      while (cursor < fimPeriodo && tempoRestante > 0) {
        // Verifica se há bloqueio ativo no minuto atual
        const bloqueio = bloqueios.find(bloco => {
          let iniBloco = aplicarHorario(diaAtual, parseInt(bloco.hrIni));
          let fimBloco = aplicarHorario(diaAtual, parseInt(bloco.hrFim));
          if (parseInt(bloco.hrFim) < parseInt(bloco.hrIni)) {
            fimBloco = addDays(fimBloco, 1);
          }
          return cursor >= iniBloco && cursor < fimBloco;
        });

        if (bloqueio) {
          // pula para o fim do bloqueio
          cursor = aplicarHorario(diaAtual, parseInt(bloqueio.hrFim));
          continue;
        }

        // avança 1 minuto de produção
        cursor = addMinutes(cursor, 1);
        tempoRestante -= 1;
      }

      if (tempoRestante <= 0) {
        fimEstimado = cursor;
        break;
      }
    }

    diaAtual = addDays(diaAtual, 1);
  }

  return fimEstimado;
}
