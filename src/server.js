// Carrega as variáveis de ambiente
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const routes = require('./routes/index');
const whatsappService = require('./services/whatsapp');

const app = express();

// Configuração do CORS para permitir qualquer origem
app.use(cors());
app.use(express.json());

// Usando as rotas
app.use('/api', routes);

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // Escutar em todas as interfaces de rede

app.listen(PORT, HOST, () => {
  console.log(`Servidor rodando em http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log('==================================');
}); 