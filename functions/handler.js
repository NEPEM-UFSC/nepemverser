// Importando a biblioteca Firebase Admin
const admin = require('firebase-admin');

// Inicializando o Firebase Admin SDK, se ainda não estiver inicializado
if (!admin.apps.length) {
  /**
   * Converte a chave de API do Firebase, armazenada na variável de ambiente `FIREBASE_API_KEY`,
   * para um objeto JSON e a atribui à constante `serviceAccount`.
   * 
   * A chave de API deve estar no formato JSON.
   *
   * @constant {Object} serviceAccount - A chave de API do Firebase convertida.
   */
  try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_API_KEY);

  // Inicializa o app Firebase com a credencial de conta de serviço
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log('Firebase Admin SDK initialized');
    } catch (error) {
      console.error('Error initializing Firebase Admin SDK:', error, '\n', 'Check if the FIREBASE_API_KEY environment variable is set correctly');
      throw new Error('Firebase Admin SDK initialization failed');
    }
}

// Obtém a referência ao Firestore
const db = admin.firestore();

/**
 * Função handler para lidar com a requisição HTTP (eventos Lambda ou serverless).
 * 
 * @param {Object} event - O objeto do evento, que contém informações sobre a requisição.
 * @param {Object} context - O contexto de execução.
 * @returns {Object} - O objeto de resposta HTTP com statusCode e body.
 */
exports.handler = async (event, context) => {
  try {
    // Parsear o corpo da requisição se for POST, ou usar queryStringParameters se for GET
    const body = event.body ? JSON.parse(event.body) : {};

    /**
     * Extrai a propriedade `project` do objeto `body` se existir,
     * ou dos parâmetros da query string (`event.queryStringParameters`).
     *
     * @param {Object} body - O corpo da requisição contendo os dados do projeto.
     * @param {Object} event - O objeto do evento contendo os parâmetros da query string.
     * @param {Object} [body.project] - Os dados do projeto dentro do corpo da requisição.
     * @param {Object} event.queryStringParameters - Os parâmetros da query string do evento.
     * @returns {string} project - O nome do projeto extraído.
     */
    let { project } = body.project ? body : event.queryStringParameters;

    // Verificar se o parâmetro `project` foi fornecido
    if (!project) {
        console.warn("Missing project parameter.");
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Project parameter is required' }),
        };
    }

    // Verificar se o parâmetro `stamp` foi fornecido
    let isStamp = project.endsWith('-stamp');
    console.log(isStamp)
    if (isStamp) {
      project = project.replace('-stamp', '');
    }
    // Referência ao documento no Firestore para o projeto especificado
    const docRef = db.collection('projects').doc(project);

    // Buscar o documento do projeto no Firestore
    const doc = await docRef.get();

    // Se o documento não for encontrado, retorna erro 404
    if (!doc.exists) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Project not found' }),
      };
    }

    // Verificar se o projeto tem o sufixo '-stamp' para resposta personalizada (Shields.io)
    const data = doc.data();

    // Se o sufixo for '#stamp', retornar resposta no formato específico para Shields.io
    if (isStamp) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          schemaVersion: 1,
          label: 'Project Version',
          message: data.latest_version,
          color: 'orange',
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      };
    }

    // Verificar se os dados da versão estão disponíveis
    if (!data.latest_version) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Version not found' }),
      };
    }

    // Verificar se a data de lançamento está disponível
    if (!data.timestamp) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Release date not found' }),
      };
    }

    // Retornar a versão do projeto
    if (!isStamp) {
      console.log(isStamp)
      console.log('Project:', project, 'Version:', data.latest_version, 'Timestamp:', data.timestamp);
      return {
      statusCode: 200,
      body: JSON.stringify({ latest_version: data.latest_version }),
      };
    }

  } catch (error) {
    console.error('Error retrieving project:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
