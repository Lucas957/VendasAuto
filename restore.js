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
    // Ler o arquivo de backup
    const backupData = JSON.parse(fs.readFileSync('backup.json', 'utf8'));

    // Restaurar clientes
    for (const client of backupData.clients) {
      await prisma.client.upsert({
        where: { id: client.id },
        update: {
          name: client.name,
          level: client.level,
          course: clientCourses[client.id] || client.course,
          debit: client.debit,
          credit: client.credit,
          wpp: client.wpp
        },
        create: {
          id: client.id,
          name: client.name,
          level: client.level,
          course: clientCourses[client.id] || client.course,
          debit: client.debit,
          credit: client.credit,
          wpp: client.wpp
        }
      });
    }

    // Restaurar produtos
    for (const product of backupData.products) {
      await prisma.product.upsert({
        where: { id: product.id },
        update: {
          name: product.name,
          price: product.price,
          description: product.description,
          stock: product.stock
        },
        create: {
          id: product.id,
          name: product.name,
          price: product.price,
          description: product.description,
          stock: product.stock
        }
      });
    }

    // Restaurar vendas
    for (const sale of backupData.sales) {
      await prisma.bought.upsert({
        where: { id: sale.id },
        update: {
          date_sell: sale.date_sell,
          date_pay: sale.date_pay,
          client_id: sale.client_id,
          paid: sale.paid,
          value: sale.value
        },
        create: {
          id: sale.id,
          date_sell: sale.date_sell,
          date_pay: sale.date_pay,
          client_id: sale.client_id,
          paid: sale.paid,
          value: sale.value
        }
      });

      // Restaurar produtos da venda
      for (const product of sale.products) {
        await prisma.saleProduct.upsert({
          where: { id: product.id },
          update: {
            sale_id: product.sale_id,
            product_id: product.product_id,
            quantity: product.quantity,
            price: product.price
          },
          create: {
            id: product.id,
            sale_id: product.sale_id,
            product_id: product.product_id,
            quantity: product.quantity,
            price: product.price
          }
        });
      }
    }

    console.log('Dados restaurados com sucesso!');
  } catch (error) {
    console.error('Erro ao restaurar dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restore(); 