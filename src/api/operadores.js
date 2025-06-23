import { useAuth } from "../context/AuthContext";
import { fetchQuery } from "./queryExecutor";

export async function getOperadores(empresa) {
  const query = `
           SELECT
            USU.CODUSU
            ,USU.NOMEUSU
            ,NUOP
            ,DHINICIO
			,DHFIM
            ,CODATIVIDADE
            ,SERVICO
            ,PRODUTO
            
          FROM sankhya.AD_CADOPERADOR A
          INNER JOIN sankhya.TSIUSU USU ON USU.CODUSU = A.CODUSU
          OUTER APPLY (
          SELECT TOP 1
    B.NUOP,
    B.DHINICIO,
    B.DHFIM,
    B.CODATIVIDADE,
    PRO.DESCRPROD AS SERVICO,
    sankhya.FC_GET_NOME_PRODUTO_FORMULA_CEN(OP1.CODPROD, OP.CODPARC, OP1.IDFOR) AS PRODUTO
  FROM sankhya.AD_CADAPONTPROD B
  INNER JOIN sankhya.AD_CADTIPAPONT C ON C.CODTIPAPONT = B.CODTIPAPONT
  INNER JOIN sankhya.TGFPRO PRO ON PRO.CODPROD = B.CODATIVIDADE
  INNER JOIN sankhya.AD_CONTOP OP ON OP.NUOP = B.NUOP
  INNER JOIN sankhya.AD_CONTOP1 OP1 ON OP1.NUOP = OP.NUOP
  WHERE B.CODOPERADOR = A.CODUSU 
  ORDER BY B.DHINICIO DESC

          ) AS APTO
          WHERE A.ATIVO = 'S' AND USU.CODEMP =  ${empresa}
        `;
  return fetchQuery(query);
}
export async function getOperadoresDetalhe({ codUsu, empresa }) {
  const whereClauses = ["A.ATIVO = 'S'"];

  if (codUsu) {
    whereClauses.push(`USU.CODUSU = '${codUsu}'`);
  }


  whereClauses.push(`USU.CODEMP = '${empresa}'`);


  const whereClause = whereClauses.join(" AND ");
  console.log(whereClause);
  const query = `
    SELECT
       USU.CODUSU
      ,USU.NOMEUSU
      ,NUOP
      ,MIN(DHINICIO) AS DHINICIO
      ,MAX(DHFIM) AS DHFIM
      ,SUM(DATEDIFF(MINUTE, DHINICIO	,DHFIM)) AS TEMPOAPTO
      ,CODATIVIDADE
      ,SERVICO
      ,PRODUTO
      ,APONTAMENTO
      ,GRUPOAPONTAMENTO
	  ,APTO.CODMQP
	  ,APTO.MAQUINA
      ,SUM(QTD) AS QTD
      ,APTO.CODETAPA
      ,APTO.ETAPA
    FROM sankhya.AD_CADOPERADOR A
    INNER JOIN sankhya.TSIUSU USU ON USU.CODUSU = A.CODUSU
    OUTER APPLY (
      SELECT
        B.NUOP,
        B.DHINICIO,
        B.DHFIM,
        B.CODATIVIDADE,
        PRO.DESCRPROD AS SERVICO,
        sankhya.FC_GET_NOME_PRODUTO_FORMULA_CEN(OP1.CODPROD, OP.CODPARC, OP1.IDFOR) AS PRODUTO,
        B.QTD,
        B.OBS,
        C.DESCRICAO AS APONTAMENTO,
        G.DESCRICAO AS GRUPOAPONTAMENTO,
        ETA.CODETAPA,
		    ETA.NOMEETAPA AS ETAPA,
		    MQP.CODMQP,
		    MQP.NOME AS MAQUINA
      FROM sankhya.AD_CADAPONTPROD B
      INNER JOIN sankhya.AD_CADTIPAPONT C ON C.CODTIPAPONT = B.CODTIPAPONT
      INNER JOIN sankhya.AD_CADGRUAPONT G ON G.CODGRUPOAPONT = C.CODGRUPOAPONT
	    LEFT JOIN sankhya.TPRMQP MQP ON MQP.CODMQP = B.CODMQP
      LEFT JOIN sankhya.TGFETA ETA ON ETA.CODETAPA = B.CODETAPA
      LEFT JOIN sankhya.TGFPRO PRO ON PRO.CODPROD = B.CODATIVIDADE
      INNER JOIN sankhya.AD_CONTOP OP ON OP.NUOP = B.NUOP
      INNER JOIN sankhya.AD_CONTOP1 OP1 ON OP1.NUOP = OP.NUOP
      WHERE B.CODOPERADOR = A.CODUSU
    ) AS APTO
    WHERE ${whereClause}
    GROUP BY
      USU.CODUSU,
      USU.NOMEUSU,
      NUOP,
      CODATIVIDADE,
      SERVICO,
      PRODUTO,
      APONTAMENTO,
      GRUPOAPONTAMENTO,
	  APTO.CODMQP,
	  APTO.MAQUINA,
    APTO.CODETAPA,
    APTO.ETAPA

    ORDER BY NUOP
  `;

  return fetchQuery(query);
}
