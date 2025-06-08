import { addMinutes, addDays, setHours, setMinutes, setSeconds, setMilliseconds } from "date-fns";

/**
 * Verifica se o dia da semana está disponível no calendário (com base no tipo 'P').
 *
 * @param {Date} data - Data a ser verificada.
 * @param {Array} calendario - Lista de objetos com diasDaSemana e tipo 'P' ou 'A'.
 * @returns {boolean} - True se o dia estiver disponível para produção.
 */
function diaPermitidoNoCalendario(data, calendario) {
  const diaSemanaIndex = data.getDay(); // 0 = domingo, ..., 6 = sábado
  const dias = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  const nomeDia = dias[diaSemanaIndex];

  const periodosProdutivos = calendario.filter(item => item.tipo === "P");

  return periodosProdutivos.some(item => item.diasDaSemana[nomeDia]);
}

/**
 * Encontra o próximo horário válido no calendário da máquina (valida apenas o dia).
 *
 * @param {Date} tentativaInicial - Data/hora de início sugerida.
 * @param {number} duracaoMinutos - Duração da OP em minutos.
 * @param {Function} validarDisponibilidade - Função que valida um intervalo.
 * @param {Array} calendario - Array de objetos de calendário (com diasDaSemana e tipo).
 * @returns {Date} - Data de início válida.
 */
export function encontrarHorarioValidoParaOP(tentativaInicial, duracaoMinutos, validarDisponibilidade, calendario) {
  let tentativa = new Date(tentativaInicial);

  const maxTentativas = 288;
  let count = 0;

  while (true) {
    if (!diaPermitidoNoCalendario(tentativa, calendario)) {
      // Dia inválido -> ir para o próximo dia às 00:00
      tentativa = setHours(setMinutes(setSeconds(setMilliseconds(tentativa, 0), 0), 0), 0);
      tentativa = addDays(tentativa, 1);
      count++;
      if (count > maxTentativas) {
        throw new Error("Nenhum dia válido encontrado nos próximos 24 ciclos.");
      }
      continue;
    }

    // Validação apenas do dia — não verifica hora ainda
    return tentativa;
  }
}
