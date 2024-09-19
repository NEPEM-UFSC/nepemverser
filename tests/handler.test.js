const fs = require('fs');
const path = require('path');
const { handler } = require('../netlify/functions/handler'); // Caminho para o handler.js

jest.mock('fs');

describe('handler function', () => {
  const versionFilePath = path.resolve(__dirname, '../netlify/functions/versions.json');
  const versions = {
    "teste": "1.2.3",
    "version": "1.0.0"
  };

  beforeEach(() => {
    fs.readFileSync.mockClear();
  });

/**
   * Executes an asynchronous function to test an API handler for missing project specification.
   * @example
   * functionName()
   * undefined
   * @returns {Promise<void>} A promise that resolves when the function completes its operations.
   * @description
   *   - Mocks an event with empty query string parameters.
   *   - Invokes the handler function with the mocked event.
   *   - Asserts the status code and response body of the handler.
   */
  test('deve retornar erro 400 quando o parâmetro project não é fornecido', async () => {
    const event = { queryStringParameters: {} };
    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(result.body).toBe(JSON.stringify({ error: 'Projeto não especificado.' }));
  });

  test('deve retornar erro 404 quando o projeto não é encontrado no arquivo de versões', async () => {
    const event = { queryStringParameters: { project: 'projeto-inexistente' } };
    fs.readFileSync.mockReturnValue(JSON.stringify(versions));

    const result = await handler(event);

    expect(result.statusCode).toBe(404);
    expect(result.body).toBe(JSON.stringify({ error: 'Projeto não encontrado no arquivo de versões' }));
    expect(fs.readFileSync).toHaveBeenCalledWith(versionFilePath, 'utf8');
  });

  test('deve retornar a versão do projeto corretamente', async () => {
    const event = { queryStringParameters: { project: 'teste' } };
    fs.readFileSync.mockReturnValue(JSON.stringify(versions));

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify({ latest_version: '1.2.3' }));
    expect(fs.readFileSync).toHaveBeenCalledWith(versionFilePath, 'utf8');
  });

  test('deve retornar o shield JSON para o pedido de "stamp"', async () => {
    const event = { queryStringParameters: { project: 'teste-stamp' } };
    fs.readFileSync.mockReturnValue(JSON.stringify(versions));

    const result = await handler(event);

    const expectedShieldJson = {
      schemaVersion: 1,
      label: "NEPEMVERSER",
      message: '1.2.3',
      color: "orange"
    };

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify(expectedShieldJson));
    expect(fs.readFileSync).toHaveBeenCalledWith(versionFilePath, 'utf8');
  });

  test('deve retornar erro 500 quando ocorre um erro ao ler o arquivo de versões', async () => {
    const event = { queryStringParameters: { project: 'teste' } };
    fs.readFileSync.mockImplementation(() => { throw new Error('Erro ao ler o arquivo'); });

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    expect(result.body).toBe(JSON.stringify({ error: 'Erro ao acessar o arquivo de versões' }));
    expect(fs.readFileSync).toHaveBeenCalledWith(versionFilePath, 'utf8');
  });
});