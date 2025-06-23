// src/utils/formatters.js

export const formatarNumeroBR = (valor) => {
  if (typeof valor !== "number") return "0,00";
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatarMinutosParaHHMM = (minutos) => {
  if (typeof minutos !== "number" || isNaN(minutos)) return "00:00";

  const horas = Math.floor(minutos / 60);
  const mins = Math.floor(minutos % 60);

  return `${String(horas).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};
