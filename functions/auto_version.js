const crypto = require('crypto');
const admin = require('firebase-admin');

if (!admin.apps.length) {
    // const serviceAccount = require('../firebase_key.json');
    const serviceAccount = JSON.parse(process.env.FIREBASE_API_KEY);
    
        admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
});    
}

const db = admin.firestore();

// Funçeo para validar o webhook do GitHub com o secret
function validateGithubWebhook(eventBody, signature, secret) {
    const computedSignature = 'sha256=' + crypto.createHmac('sha256', secret).update(eventBody).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computedSignature));
  }
  
  exports.handler = async (event) => {
    try {
        // Verificar se o metodo da requisiçeo e POST
        if (event.httpMethod !== 'POST') {
            return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Metodo nao permitido. Use POST.' })
            };
        }
  
        // Recuperar o secret enviado pelo GitHub e o corpo da requisiçeo
        const githubSignature = event.headers['x-hub-signature-256'];
        const secret = process.env.NEPEM_KEY;

          // Verificar se o corpo da requisiçeo este presente
        if (!event.body) {
            return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Data is null.' })
            };
        }
  
      // Validar a assinatura do GitHub Webhook
      if (!validateGithubWebhook(event.body, githubSignature, secret)) {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: 'Acesso nao autorizado.' })
        };
      }
  
      // Tentar parsear o corpo da requisiçãoo como JSON
      let body;
      try {
        body = JSON.parse(event.body);
      } catch (e) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Corpo da requisicao deve ser um JSON valido.' })
        };
      }
  
      // Verificar se e um evento de release
      if (!body || body.action !== 'released' || !body.release || !body.repository) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Payload invalido. Nao e um evento de release.' })
        };
      }
  
      // Coletar dados do JSON de release do GitHub
      const repoName = body.repository.name;
      const version = body.release.tag_name;
      const releaseDate = body.release.published_at;
      const releaseNotes = body.release.body || '';
  
      // Referencia ao documento no Firestore
      const docRef = db.collection('projects').doc(repoName);
  
      // Gravar ou atualizar os dados no Firestore
      await docRef.set({
        version: version,
        releaseDate: releaseDate,
        releaseNotes: releaseNotes,
        timestamp: new Date().toISOString()
      });
  
      // Retornar sucesso
      return {
        statusCode: 200,
        body: JSON.stringify({ message: `Versao ${version} do projeto ${repoName} foi armazenada com sucesso.` })
      };
  
    } catch (error) {
      console.error('Erro ao processar a requisicao:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Erro interno ao processar a requisicao.' })
      };
    }
  };