const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function backup() {
  try {
    // Buscar todos os dados
    const clients = await prisma.client.findMany();
    const products = await prisma.product.findMany();
    const sales = await prisma.bought.findMany({
      include: {
        products: true
      }
    });

    // Criar objeto com todos os dados
    const backupData = {
      clients,
      products,
      sales
    };

    // Salvar em um arquivo JSON
    fs.writeFileSync('backup.json', JSON.stringify(backupData, null, 2));
    console.log('Backup realizado com sucesso!');

  } catch (error) {
    console.error('Erro ao fazer backup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

backup(); 