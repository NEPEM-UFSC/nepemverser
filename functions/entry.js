const admin = require('firebase-admin');


if (!admin.apps.length) {
    // const serviceAccount = require('../firebase_key.json');
    const serviceAccount = JSON.parse(process.env.FIREBASE_API_KEY);

    admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

}
  const db = admin.firestore();
  
  exports.handler = async (event) => {
    try {
      // Verifica se é uma requisição POST
      if (event.httpMethod !== 'POST') {
        return {
          statusCode: 405,
          body: JSON.stringify({ error: 'Método não permitido, use POST.' })
        };
      }
          // Verificar se a NEPEM-KEY está presente no cabeçalho
        const nepemKey = event.headers['nepem-key'];
        if (!nepemKey || nepemKey !== process.env.NEPEM_KEY) {
        return {
            statusCode: 401,
            body: JSON.stringify({ error: 'Acesso não autorizado. NEPEM-KEY inválida ou ausente.' })
        };
        }
  
      // Parsear o corpo da requisição para um JSON
      const body = JSON.parse(event.body);
  
      // Verificar se o JSON contém as chaves esperadas
      if (!body.project || !body.latest_version) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'O JSON deve conter as chaves "project" e "latest_version".' })
        };
      }
  
      // Referência ao documento no Firestore
      const docRef = db.collection('projects').doc(body.project);
  
      // Gravação no Firestore
      await docRef.set({
        latest_version: body.latest_version,
        timestamp: new Date().toISOString()
      });
  
      // Retorna sucesso
      return {
        statusCode: 200,
        body: JSON.stringify({ message: `Versão do projeto ${body.project} foi atualizada com sucesso!` })
      };
  
    } catch (error) {
      console.error('Erro ao processar a requisição:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Erro interno ao processar a requisição.' })
      };
    }
  };