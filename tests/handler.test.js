const fs = require('fs');
const path = require('path');
const { handler } = require('../netlify/functions/handler'); // Caminho para o handler.js

// Mock para o fs.readFileSync
jest.mock('fs');

describe('handler function', () => {
  const baseVersionDir = path.resolve(__dirname, '../versions');
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('deve retornar erro 400 quando o parâmetro project não é fornecido', async () => {
    const event = { queryStringParameters: {} };
    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(result.body).toBe(JSON.stringify({ error: 'Projeto não especificado.' }));
  });

  test('deve retornar a versão do projeto corretamente', async () => {
    const event = { queryStringParameters: { project: 'teste' } };
    const versionFilePath = path.join(baseVersionDir, 'teste.txt');
    
    fs.readFileSync.mockReturnValue('1.2.3');

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify({ latest_version: '1.2.3' }));
    expect(fs.readFileSync).toHaveBeenCalledWith(versionFilePath, 'utf8');
  });

  test('deve retornar erro 404 quando o arquivo de versão não é encontrado', async () => {
    const event = { queryStringParameters: { project: 'projeto-inexistente' } };
    const versionFilePath = path.join(baseVersionDir, 'projeto-inexistente.txt');
    
    fs.readFileSync.mockImplementation(() => { throw new Error('file not found'); });

    const result = await handler(event);

    expect(result.statusCode).toBe(404);
    expect(result.body).toBe(JSON.stringify({ error: 'Projeto não encontrado ou erro ao ler o arquivo de versão' }));
    expect(fs.readFileSync).toHaveBeenCalledWith(versionFilePath, 'utf8');
  });

  test('deve retornar o shield JSON para o pedido de "stamp"', async () => {
    const event = { queryStringParameters: { project: 'teste-stamp' } };
    const versionFilePath = path.join(baseVersionDir, 'teste.txt');
    
    fs.readFileSync.mockReturnValue('1.2.3');

    const result = await handler(event);

    const expectedShieldJson = {
      schemaVersion: 1,
      label: "NEPEMVERSE",
      message: '1.2.3',
      color: "orange"
    };

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify(expectedShieldJson));
    expect(fs.readFileSync).toHaveBeenCalledWith(versionFilePath, 'utf8');
  });

  test('deve remover "-stamp" do nome do projeto ao procurar pelo arquivo de versão', async () => {
    const event = { queryStringParameters: { project: 'teste-stamp' } };
    const versionFilePath = path.join(baseVersionDir, 'teste.txt');
    
    fs.readFileSync.mockReturnValue('1.2.3');

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(result.body).toContain('1.2.3');
    expect(fs.readFileSync).toHaveBeenCalledWith(versionFilePath, 'utf8');
  });
});
