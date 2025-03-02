const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

// Função para converter o nível militar
function convertLevel(level) {
  const levelMap = {
    'SD': 'SD',
    'CB': 'CB',
    'SGT': 'SGT',
    'STTEN': 'STTEN',
    'TEN': 'TEN',
    'CAP': 'CAP',
    'MAJ': 'MAJ',
    'CEL': 'CEL'
  };
  return levelMap[level] || 'SD';
}

// Mapeamento de cursos para clientes específicos
const clientCourses = {
  1: 'inteligente', // Isaac - Inteligente
  5: 'comandos',    // Arlen - Comandos
  7: 'comandos',    // Balieiro - Comandos
  8: 'precursor',   // Jean - Precursor
  9: 'mergulhador', // Luz - Mergulhador
  10: 'paraquedista', // Ribeiro - Paraquedista
  11: 'caatinga',   // Santos - Caatinga
  12: 'montanha',   // Tetenge - Montanha
};

async function restore() {
  try {
    console.log('Iniciando restauração do banco de dados...');
    
    // Ler o arquivo de backup
    const backupData = JSON.parse(fs.readFileSync('backup.json', 'utf8'));
    
    // Restaurar clientes
    console.log(`Restaurando ${backupData.clients.length} clientes...`);
    for (const client of backupData.clients) {
      await prisma.client.upsert({
        where: { id: client.id },
        update: {
          name: client.name,
          level: client.level,
          course: client.course,
          arma: client.arma || null, // Novo campo
          debit: client.debit,
          credit: client.credit,
          wpp: client.wpp
        },
        create: {
          id: client.id,
          name: client.name,
          level: client.level,
          course: client.course,
          arma: client.arma || null, // Novo campo
          debit: client.debit,
          credit: client.credit,
          wpp: client.wpp
        }
      });
    }
    
    // Restaurar produtos
    console.log(`Restaurando ${backupData.products.length} produtos...`);
    for (const product of backupData.products) {
      await prisma.product.upsert({
        where: { id: product.id },
        update: {
          name: product.name,
          price: product.price,
          description: product.description,
          stock: product.stock,
          created_at: new Date(product.created_at),
          updated_at: new Date(product.updated_at)
        },
        create: {
          id: product.id,
          name: product.name,
          price: product.price,
          description: product.description,
          stock: product.stock,
          created_at: new Date(product.created_at),
          updated_at: new Date(product.updated_at)
        }
      });
    }
    
    // Restaurar compras
    console.log(`Restaurando ${backupData.purchases.length} compras...`);
    for (const purchase of backupData.purchases) {
      // Primeiro criar a compra
      await prisma.bought.upsert({
        where: { id: purchase.id },
        update: {
          date_sell: new Date(purchase.date_sell),
          date_pay: new Date(purchase.date_pay),
          client_id: purchase.client_id,
          paid: purchase.paid,
          value: purchase.value
        },
        create: {
          id: purchase.id,
          date_sell: new Date(purchase.date_sell),
          date_pay: new Date(purchase.date_pay),
          client_id: purchase.client_id,
          paid: purchase.paid,
          value: purchase.value
        }
      });
      
      // Depois restaurar os produtos da compra
      for (const saleProduct of purchase.products) {
        await prisma.saleProduct.upsert({
          where: { id: saleProduct.id },
          update: {
            sale_id: saleProduct.sale_id,
            product_id: saleProduct.product_id,
            quantity: saleProduct.quantity,
            price: saleProduct.price
          },
          create: {
            id: saleProduct.id,
            sale_id: saleProduct.sale_id,
            product_id: saleProduct.product_id,
            quantity: saleProduct.quantity,
            price: saleProduct.price
          }
        });
      }
    }
    
    console.log('Restauração concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao restaurar dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restore(); 