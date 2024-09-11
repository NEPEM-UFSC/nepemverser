const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  const { project } = event.queryStringParameters || {};
  
  if (!project) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Projeto não especificado.' })
    };
  }

  const isStampRequest = project.endsWith('-stamp');
  const baseVersionDir = path.resolve(__dirname, '../..', 'versions');
  const sanitizedProject = isStampRequest ? project.replace('-stamp', '') : project;
  const versionFilePath = path.join(baseVersionDir, `${sanitizedProject}.txt`);
  
  console.log(`Base Version Directory: ${baseVersionDir}`);
  console.log(`Sanitized Project: ${sanitizedProject}`);
  console.log(`Version File Path: ${versionFilePath}`);


  try {
    const data = fs.readFileSync(versionFilePath, 'utf8');
    const version = data.trim();

    if (isStampRequest) {
      const shieldIoJson = {
        schemaVersion: 1,
        label: "NEPEMVERSER",
        message: version,
        color: "orange"
      };
      return {
        statusCode: 200,
        body: JSON.stringify(shieldIoJson)
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ latest_version: version })
    };
  } catch (err) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Projeto não encontrado ou erro ao ler o arquivo de versão' })
    };
  }
};
