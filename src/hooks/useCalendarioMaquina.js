// src/hooks/useCalendarioMaquina.js
import { useEffect, useState } from "react";

const parseCalendario = (item) => ({
  codmaqp: Number(item.CODMQP),
  codcal: Number(item.CODCAL),
  tipo: item.TIPO,
  diasDaSemana: {
    domingo: item.DOMINGO === "S",
    segunda: item.SEGUNDA === "S",
    terca: item.TERCA === "S",
    quarta: item.QUARTA === "S",
    quinta: item.QUINTA === "S",
    sexta: item.SEXTA === "S",
    sabado: item.SABADO === "S",
  },
  hrIni: String(item.HRINI).padStart(4, "0"),
  hrFim: String(item.HRFIM).padStart(4, "0"),
});

export const useCalendarioMaquina = (codmaq) => {
  const [calendario, setCalendario] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (!codmaq) return;

    const buscar = async () => {
      try {
        const query = `
          SELECT
            B.CODMQP, B.NOME, CODCAL, TIPO,
            DOMINGO, SEGUNDA, TERCA, QUARTA, QUINTA, SEXTA, SABADO,
            HRINI, HRFIM, DIAS_DA_SEMANA
          FROM sankhya.AD_TPRMCAL A
          INNER JOIN sankhya.TPRMQP B ON B.CODMQP = A.CODMQP
          WHERE A.CODMQP = ${codmaq}
        `;

        const response = await fetch("http://192.168.2.3:8081/api/crud/select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(query),
        });

        const data = await response.json();
        const formatado = data.map(parseCalendario);
        setCalendario(formatado);
        setErro(null);
      } catch (err) {
        setErro("Erro ao carregar calendário da máquina.");
        setCalendario([]);
      } finally {
        setLoading(false);
      }
    };

    buscar();
  }, [codmaq]);

  return { calendario, loading, erro };
};
