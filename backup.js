const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function backup() {
  try {
    console.log('Iniciando backup do banco de dados...');
    
    // Buscar todos os clientes com suas compras
    const clients = await prisma.client.findMany({
      include: {
        bought: true
      }
    });
    console.log(`Encontrados ${clients.length} clientes para backup`);
    
    // Buscar todos os produtos
    const products = await prisma.product.findMany();
    console.log(`Encontrados ${products.length} produtos para backup`);
    
    // Buscar todas as compras com produtos
    const purchases = await prisma.bought.findMany({
      include: {
        products: true
      }
    });
    console.log(`Encontradas ${purchases.length} compras para backup`);
    
    // Criar objeto de backup
    const backupData = {
      clients,
      products,
      purchases
    };
    
    // Salvar em arquivo JSON
    fs.writeFileSync('backup.json', JSON.stringify(backupData, null, 2));
    console.log('Backup concluído com sucesso! Arquivo: backup.json');
    
  } catch (error) {
    console.error('Erro ao fazer backup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

backup(); 