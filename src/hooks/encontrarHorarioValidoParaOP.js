import { getDay, addDays, setHours, setMinutes, setSeconds, setMilliseconds } from "date-fns";

/**
 * Encontra o próximo horário produtivo válido no calendário.
 * Ajusta o horário para o início do turno produtivo (menor hrIni do dia).
 *
 * @param {Date} tentativa - Data/hora inicial.
 * @param {Array} calendarios - Lista de calendários da máquina.
 * @returns {Date|null} - Próxima data válida ajustada para o início do turno ou null se não houver.
 */
export function encontrarHorarioValidoParaOP(tentativa, calendarios) {
  const diaSemanaMap = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

  const haDiaProdutivo = diaSemanaMap.some(dia =>
    calendarios.some(cal => cal.tipo === 'P' && cal.diasDaSemana[dia])
  );
  console.log(haDiaProdutivo);
  console.log("tentativa");
  console.log(calendarios);

  if (!haDiaProdutivo) return null;

  let tentativas = 0;
  const maxTentativas = 365;

  while (tentativas < maxTentativas) {
    const diaSemana = diaSemanaMap[getDay(tentativa)];

    const produtivosDia = calendarios.filter(cal =>
      cal.tipo === 'P' && cal.diasDaSemana[diaSemana]
    );

    if (produtivosDia.length > 0) {
      // Pega o menor horário de início do turno do dia (hrIni)
      const menorHrIni = produtivosDia.reduce((menor, cal) => {
        return cal.hrIni < menor ? cal.hrIni : menor;
      }, '9999');

      const hora = parseInt(menorHrIni.substring(0, 2), 10);
      const minuto = parseInt(menorHrIni.substring(2, 4), 10);

      // Ajusta a tentativa para o horário do início do turno
      let tentativaComHorario = setHours(tentativa, hora);
      tentativaComHorario = setMinutes(tentativaComHorario, minuto);
      tentativaComHorario = setSeconds(tentativaComHorario, 0);
      tentativaComHorario = setMilliseconds(tentativaComHorario, 0);

      // Verifica se há bloqueios neste horário
      const bloqueios = calendarios.filter(cal =>
        cal.tipo === 'A' &&
        cal.diasDaSemana[diaSemana] &&
        menorHrIni >= cal.hrIni &&
        menorHrIni <= cal.hrFim
      );

      if (bloqueios.length === 0) {
        return tentativaComHorario;
      }
    }

    tentativa = addDays(tentativa, 1);
    tentativas++;
  }

  return null; // Não encontrou em 365 dias
}
