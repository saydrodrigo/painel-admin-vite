import { fetchQuery } from './queryExecutor';

export async function getMaquinas(codEmp) {
    const query = `
    SELECT TOP 10 codmqp, nome
    FROM sankhya.TPRMQP
    WHERE AD_CODEMP = ${codEmp}
  `;
    return fetchQuery(query);
}
export async function getAtividadesPorMaquina(codMaq, codEmp) {
    const query = `
          SELECT TOP 100
            A.NUOP
            ,sankhya.FC_GET_OPCAO_CAMPO('AD_PCPCEN', 'STATUS', A.STATUS) AS STATUS
            ,A.CODATIVIDADE
            ,SER.DESCRPROD
            ,A.CODETAPA
            ,A.DH_I AS DHINI
            ,A.DH_F AS DHFIM
            ,A.PRODUTOS
            ,A.TEMPOTOTAL
            ,sankhya.FC_HRMOV_HRBR(TEMPOTOTAL) TEMPOTOTALFORMATADO

            ,A.TIRAGEM
            ,ETA.NOMEETAPA AS ETAPA
            ,A.DT_ENTREGA AS DTENTREGA
          FROM sankhya.AD_PCPCEN A
          INNER JOIN sankhya.TGFPRO SER ON SER.CODPROD = A.CODATIVIDADE
          INNER JOIN sankhya.TGFETA ETA ON ETA.CODETAPA = A.CODETAPA
          WHERE A.CODMQP = ${codMaq} AND A.CODEMP = ${codEmp}
          AND A.STATUS NOT IN('F', 'C')
          ORDER BY
            CASE WHEN STATUS = 'AP' AND A.DH_I IS NULL THEN 2 ELSE 1 END ASC,
            A.DH_I ASC     
          
        `;
    return fetchQuery(query);
}
export async function getCalendarioMaquina(codMaq) {
    const query = `
          SELECT
            B.CODMQP
            ,B.NOME
            ,CODCAL
            ,TIPO
            ,DOMINGO
            ,SEGUNDA
            ,TERCA
            ,QUARTA
            ,QUINTA	
            ,SEXTA
            ,SABADO
            ,HRINI
            ,HRFIM
            ,DIAS_DA_SEMANA
            FROM sankhya.AD_TPRMCAL A
            INNER JOIN sankhya.TPRMQP B ON
                B.CODMQP = A.CODMQP
            WHERE
                A.CODMQP = ${codMaq}
          
        `;
    return fetchQuery(query);
}