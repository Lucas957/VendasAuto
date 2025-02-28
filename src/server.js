const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();

// Middleware para processar JSON
app.use(cors());
app.use(express.json());

// Usando as rotas
app.use('/api', routes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
}); 