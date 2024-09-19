const admin = require('firebase-admin');


if (!admin.apps.length) {
    /**
     * Parses the Firebase API key from the environment variable and assigns it to the serviceAccount constant.
     * The API key is expected to be in JSON format.
     *
     * @constant {Object} serviceAccount - The parsed Firebase API key.
     */
    const serviceAccount = JSON.parse(process.env.FIREBASE_API_KEY);

    admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

}
  const db = admin.firestore();

exports.handler = async (event, context) => {
  try {
    // Parsear o corpo da requisição (POST) ou usar queryStringParameters (GET)
    const body = event.body ? JSON.parse(event.body) : {};
    /**
     * Extracts the `project` property from the `body` object if it exists,
     * otherwise extracts it from `event.queryStringParameters`.
     *
     * @param {Object} body - The body object containing the project data.
     * @param {Object} event - The event object containing query string parameters.
     * @param {Object} [body.project] - The project data within the body object.
     * @param {Object} event.queryStringParameters - The query string parameters from the event.
     * @returns {Object} project - The extracted project data.
     */
    const { project } = body.project ? body : event.queryStringParameters;
    
    // Verificar se o projeto foi fornecido
    if (!project) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Project parameter is required' }),
      };
    }

    // Referência ao documento no Firestore
    const docRef = db.collection('projects').doc(project);

    // Tentar buscar o documento
    const doc = await docRef.get();
    if (!doc.exists) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Project not found' }),
      };
    }

    // Se o sufixo -stamp estiver presente, retornar formato especial para Shields.io
    const isStamp = project.endsWith('-stamp');
    const data = doc.data();

    if (isStamp) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          schemaVersion: 1,
          label: 'Project Version',
          message: data.latest_version,
          color: 'orange',
        }),
      };
    }

    // Retornar a versão normalmente
    if (!data.latest_version) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Version not found' }),
      };
    }
    if (!data.timestamp) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Release date not found' }),
      };
    } else {
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