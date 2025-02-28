const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const SaleController = require('../controllers/SaleController');

const prisma = new PrismaClient();

// Rota de teste
router.get('/', (req, res) => {
  res.json({ message: 'API está funcionando!' });
});

// Rotas de clientes
router.post('/clients', async (req, res) => {
  try {
    const { name, level, wpp, credit = 0, debit = 0 } = req.body;
    const client = await prisma.client.create({
      data: {
        name,
        level,
        wpp,
        credit,
        debit
      },
    });
    res.json(client);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/clients', async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      include: {
        bought: true
      }
    });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rotas de vendas
router.post('/sales', SaleController.create.bind(SaleController));

// Rotas de compras
router.get('/bought', async (req, res) => {
  try {
    const bought = await prisma.bought.findMany({
      include: {
        client: true
      }
    });
    res.json(bought);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar status de pagamento
router.patch('/bought/:id/pay', async (req, res) => {
  try {
    const { id } = req.params;
    const bought = await prisma.bought.update({
      where: { id: parseInt(id) },
      data: { paid: true },
      include: { client: true }
    });
    res.json(bought);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 