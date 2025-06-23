import { fetchQuery } from './queryExecutor';

export async function getDadosApontamento(codAtividade, codEmp, nuOp) {
    const query = `
      SELECT
         MQP.CODMQP
        ,MQP.NOME
        ,SER.DESCRPROD AS SERVICO
        ,MIN(A.DHINICIO) AS INI
        ,MAX(A.DHFIM) AS FIM
        ,SUM(DATEDIFF(MINUTE, A.DHINICIO, A.DHFIM)) AS MINUTOS
        ,SUM(A.QTD) AS QTD
        ,USU.CODUSU
        ,USU.NOMEUSU
      FROM sankhya.AD_CADAPONTPROD A
      LEFT JOIN sankhya.TSIUSU USU ON USU.CODUSU = A.CODOPERADOR
      LEFT JOIN sankhya.TPRMQP MQP ON MQP.CODMQP = A.CODMQP
      LEFT JOIN sankhya.TGFPRO SER ON SER.CODPROD = A.CODATIVIDADE
      WHERE A.NUOP = ${nuOp}
        AND A.CODATIVIDADE = ${codAtividade}
        AND A.CODMQP = ${codEmp}
      GROUP BY MQP.CODMQP, MQP.NOME, SER.DESCRPROD, USU.CODUSU, USU.NOMEUSU
    `;

    return fetchQuery(query);
}
