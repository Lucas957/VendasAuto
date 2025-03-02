const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const SaleController = require('../controllers/SaleController');
const ProductController = require('../controllers/ProductController');
const whatsappService = require('../services/whatsapp');

const prisma = new PrismaClient();

// Endpoint de saúde para diagnóstico
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    env: process.env.NODE_ENV,
    whatsapp: whatsappService.client.pupPage ? 'connected' : 'disconnected'
  });
});

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

// Nova rota para enviar mensagem de cobrança
router.post('/send-debt-message', async (req, res) => {
  try {
    const { clientId } = req.body;
    
    // Buscar cliente e suas compras
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

    // Calcular total devido
    const totalDebt = client.bought.reduce((total, sale) => total + sale.value, 0);

    // Gerar mensagem de cobrança simplificada
    let message = `*COBRANÇA*\n\n`;
    message += `👤 Cliente: ${client.name}\n`;
    message += `💰 Total devido: R$ ${totalDebt.toFixed(2)}\n\n`;
    message += `💳 *PIX para pagamento:*\n\n`;

    // Enviar mensagem via WhatsApp
    await whatsappService.sendMessage(client.wpp, message);
    
    // Enviar chave PIX em uma mensagem separada para facilitar cópia
    await whatsappService.sendMessage(client.wpp, `d7dab4ae-267f-486c-b4c2-a0137068fe47`);

    res.json({ message: 'Mensagem enviada com sucesso' });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rotas de vendas
router.post('/sales', SaleController.create.bind(SaleController));
router.get('/sales', SaleController.list);

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

// Zerar débito do cliente
router.post('/clients/:id/clear-debt', async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = parseInt(id);

    // Usar transação para garantir que todas as operações sejam feitas juntas
    const result = await prisma.$transaction(async (prisma) => {
      // Verificar se o cliente existe
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: { bought: true }
      });

      if (!client) {
        throw new Error('Cliente não encontrado');
      }

      // Marcar todas as compras do cliente como pagas
      await prisma.bought.updateMany({
        where: {
          client_id: clientId,
          paid: false
        },
        data: {
          paid: true
        }
      });

      // Atualizar o cliente
      const updatedClient = await prisma.client.update({
        where: {
          id: clientId
        },
        data: {
          debit: 0
        },
        include: {
          bought: true
        }
      });

      return updatedClient;
    });

    res.json(result);
  } catch (error) {
    console.error('Erro detalhado ao zerar débito:', error);
    if (error.message === 'Cliente não encontrado') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ 
        error: 'Erro ao zerar débito do cliente',
        details: error.message 
      });
    }
  }
});

// Zerar parcialmente o débito do cliente
router.post('/clients/:id/partial-payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, purchaseIds } = req.body;
    const clientId = parseInt(id);
    
    if (!amount && !purchaseIds) {
      return res.status(400).json({ error: 'É necessário fornecer o valor do pagamento ou os IDs das compras a serem pagas' });
    }

    // Usar transação para garantir que todas as operações sejam feitas juntas
    const result = await prisma.$transaction(async (prisma) => {
      // Verificar se o cliente existe
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: { 
          bought: {
            where: { paid: false },
            orderBy: { date_sell: 'asc' }
          }
        }
      });

      if (!client) {
        throw new Error('Cliente não encontrado');
      }

      // Se foram fornecidos IDs específicos de compras
      if (purchaseIds && purchaseIds.length > 0) {
        // Marcar as compras específicas como pagas
        await prisma.bought.updateMany({
          where: {
            id: { in: purchaseIds.map(id => parseInt(id)) },
            client_id: clientId,
            paid: false
          },
          data: {
            paid: true
          }
        });
        
        // Calcular o valor total das compras pagas
        const paidPurchases = await prisma.bought.findMany({
          where: {
            id: { in: purchaseIds.map(id => parseInt(id)) },
            client_id: clientId
          }
        });
        
        const paidAmount = paidPurchases.reduce((total, purchase) => total + purchase.value, 0);
        
        // Atualizar o débito do cliente
        const updatedClient = await prisma.client.update({
          where: { id: clientId },
          data: {
            debit: {
              decrement: paidAmount
            }
          },
          include: {
            bought: true
          }
        });
        
        return {
          client: updatedClient,
          paidAmount,
          paidPurchases
        };
      } 
      // Se foi fornecido um valor de pagamento
      else if (amount) {
        const amountValue = parseFloat(amount);
        let remainingAmount = amountValue;
        const paidPurchaseIds = [];
        
        // Pagar compras do cliente até atingir o valor fornecido
        for (const purchase of client.bought) {
          if (remainingAmount <= 0) break;
          
          if (purchase.value <= remainingAmount) {
            // Pode pagar esta compra completamente
            await prisma.bought.update({
              where: { id: purchase.id },
              data: { paid: true }
            });
            
            paidPurchaseIds.push(purchase.id);
            remainingAmount -= purchase.value;
          } else {
            // Não pode pagar esta compra completamente
            // Neste caso, não marcamos como paga, apenas reduzimos o débito
            break;
          }
        }
        
        // Atualizar o débito do cliente
        const updatedClient = await prisma.client.update({
          where: { id: clientId },
          data: {
            debit: {
              decrement: amountValue
            }
          },
          include: {
            bought: true
          }
        });
        
        return {
          client: updatedClient,
          paidAmount: amountValue,
          paidPurchaseIds
        };
      }
    });

    res.json(result);
  } catch (error) {
    console.error('Erro detalhado ao processar pagamento parcial:', error);
    if (error.message === 'Cliente não encontrado') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ 
        error: 'Erro ao processar pagamento parcial',
        details: error.message 
      });
    }
  }
});

// Rotas de produtos
router.post('/products', ProductController.create);
router.get('/products', ProductController.list);
router.get('/products/:id', ProductController.getById);
router.put('/products/:id', ProductController.update);
router.delete('/products/:id', ProductController.delete);

// Nova rota para buscar compras de um cliente por período
router.get('/clients/:id/purchases', async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, paid } = req.query;
    
    // Converter strings de data para objetos Date
    const start = startDate ? new Date(startDate) : new Date(0); // Se não fornecido, usa data mínima
    const end = endDate ? new Date(endDate) : new Date(); // Se não fornecido, usa data atual
    
    // Garantir que end seja o final do dia
    end.setHours(23, 59, 59, 999);
    
    // Construir o filtro de consulta
    const whereClause = {
      client_id: Number(id),
      date_sell: {
        gte: start,
        lte: end
      }
    };
    
    // Adicionar filtro de status de pagamento se fornecido
    if (paid !== undefined) {
      whereClause.paid = paid === 'true';
    }
    
    // Buscar compras do cliente no período especificado
    const purchases = await prisma.bought.findMany({
      where: whereClause,
      orderBy: {
        date_sell: 'desc'
      },
      include: {
        client: true
      }
    });
    
    // Calcular o valor total das compras
    const totalValue = purchases.reduce((sum, purchase) => sum + purchase.value, 0);
    
    res.json({
      purchases,
      totalValue,
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      }
    });
  } catch (error) {
    console.error('Erro ao buscar compras por período:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 