const fs = require('fs');

const data = {
    message: "bem vindo ao NEPEMVERSER"
};

fs.writeFile('bemvindo.json', JSON.stringify(data, null, 2), (err) => {
    if (err) {
        console.error('Erro ao criar o arquivo JSON:', err);
    } else {
        console.log('Arquivo JSON criado com sucesso!');
    }
});