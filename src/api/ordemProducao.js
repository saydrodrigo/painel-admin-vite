import { fetchQuery } from "./queryExecutor";

export async function getOrdensProducao(codEmp) {
  const query = `
    SELECT
      OP.NUOP,
      OP.DTENTREGA,
      sankhya.FC_GET_NOME_PRODUTO_FORMULA_CEN(OP1.CODPROD, OP.CODPARC, OP1.IDFOR) AS PRODUTO,
      PAR.CODPARC,
      PAR.NOMEPARC AS PARCEIRO,
      ROUND(OP1.QTDPRODUCAO, 2) AS QTDPRODUCAO,
      sankhya.FC_GET_OPCAO_CAMPO('AD_CONTOP', 'STATUS', OP.STATUS) STATUS
    FROM sankhya.AD_CONTOP OP
    INNER JOIN sankhya.TGFPAR PAR ON PAR.CODPARC = OP.CODPARC
    INNER JOIN sankhya.AD_CONTOP1 OP1 ON OP1.NUOP = OP.NUOP
    WHERE OP.STATUS NOT IN('F', 'C')
      AND OP.TIPO NOT IN('CGDE')
      AND OP.CODEMP = ${codEmp}
  `;

  return fetchQuery(query);
}
export async function getEtapasOrcadasOrdemProducao(nuOP) {
  const query = `SELECT
                    A.CODATIVIDADE
                    ,PRO.DESCRPROD AS SERVICO
                    ,A.TIRAGEM
                    ,A.TEMPOTOTAL
                    FROM sankhya.AD_CONTOP3B A
                    INNER JOIN sankhya.TGFPRO PRO ON
                        PRO.CODPROD = A.CODATIVIDADE
                    WHERE
                        A.NUOP = ${nuOP}`;

  return fetchQuery(query);
}
export async function getEtapasRealizadasOrdemProducao(nuOP) {
  const query = `SELECT
                    A.CODATIVIDADE
                    ,PRO.DESCRPROD AS SERVICO
                    ,SUM(A.QTD) AS TIRAGEM
                    ,SUM(DATEDIFF(MINUTE, A.DHINICIO, A.DHFIM)) AS TEMPOTOTAL
                    FROM sankhya.AD_CADAPONTPROD A
                    INNER JOIN sankhya.TGFPRO PRO ON
                        PRO.CODPROD = A.CODATIVIDADE
                    WHERE
                        A.NUOP = ${nuOP}
                    AND A.CODTIPAPONT = 8
                    GROUP BY
                        A.CODATIVIDADE
                    ,PRO.DESCRPROD `;

  return fetchQuery(query);
}
