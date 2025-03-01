const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Endpoint de saúde para diagnóstico
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    env: process.env.NODE_ENV
  });
});

// Rota para obter todos os clientes
router.get('/clients', async (req, res) => {
  try {
    console.log('Buscando todos os clientes');
    const clients = await prisma.client.findMany({
      include: {
        bought: true
      }
    });
    console.log(`Encontrados ${clients.length} clientes`);
    res.json(clients);
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({ error: 'Erro ao buscar clientes', details: error.message });
  }
});

// Rota para obter produtos
router.get('/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar produtos', details: error.message });
  }
});

// Rota para registrar vendas
router.post('/sales', async (req, res) => {
  try {
    const { client_id, value, products } = req.body;
    
    // Registra a venda
    const sale = await prisma.sale.create({
      data: {
        client_id,
        value,
        date_sell: new Date(),
        paid: false
      }
    });
    
    // Registra os produtos vendidos
    for (const item of products) {
      await prisma.saleItem.create({
        data: {
          sale_id: sale.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price
        }
      });
      
      // Atualiza o estoque
      await prisma.product.update({
        where: { id: item.product_id },
        data: {
          stock: {
            decrement: item.quantity
          }
        }
      });
    }
    
    res.json({ success: true, sale_id: sale.id });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao registrar venda', details: error.message });
  }
});

// Rota para enviar mensagem de cobrança via WhatsApp
router.post('/send-debt-message', async (req, res) => {
  try {
    const { clientId } = req.body;
    
    // Busca o cliente e suas compras não pagas
    const client = await prisma.client.findUnique({
      where: { id: Number(clientId) },
      include: {
        bought: {
          where: { paid: false }
        }
      }
    });
    
    if (!client) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    // Calcula o total devido
    const totalDebt = client.bought.reduce((sum, sale) => sum + sale.value, 0);
    
    // Aqui você implementaria a lógica para enviar a mensagem via WhatsApp
    // Por enquanto, apenas simulamos o envio
    
    res.json({ 
      success: true, 
      message: `Mensagem enviada para ${client.name} cobrando R$ ${totalDebt.toFixed(2)}` 
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao enviar mensagem', details: error.message });
  }
});

// Rota para zerar débito de um cliente
router.post('/clients/:id/clear-debt', async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);
    
    // Atualiza todas as vendas não pagas para pagas
    await prisma.sale.updateMany({
      where: {
        client_id: clientId,
        paid: false
      },
      data: {
        paid: true,
        date_pay: new Date()
      }
    });
    
    res.json({ success: true, message: 'Débito zerado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao zerar débito', details: error.message });
  }
});

// Exporta o router para ser usado em server.js
module.exports = router; 