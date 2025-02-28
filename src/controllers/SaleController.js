const { PrismaClient } = require('@prisma/client');
const whatsappService = require('../services/whatsapp');

const prisma = new PrismaClient();

class SaleController {
    // Função para formatar o número do WhatsApp
    formatWhatsAppNumber(number) {
        // Remove todos os caracteres não numéricos
        const cleaned = number.replace(/\D/g, '');
        
        // Se começar com 0, remove o 0
        const withoutLeadingZero = cleaned.replace(/^0+/, '');
        
        // Se não começar com 55 (código do Brasil), adiciona
        const withCountryCode = withoutLeadingZero.startsWith('55') 
            ? withoutLeadingZero 
            : `55${withoutLeadingZero}`;
        
        return withCountryCode;
    }

    async create(req, res) {
        try {
            const { client_id, value, products } = req.body;

            // Validar client_id
            if (!client_id) {
                return res.status(400).json({ error: 'ID do cliente é obrigatório' });
            }

            // Calcular data de pagamento (primeiro dia do próximo mês)
            const hoje = new Date();
            const dataPagamento = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);

            // Buscar cliente
            const client = await prisma.client.findUnique({
                where: {
                    id: Number(client_id)
                }
            });

            if (!client) {
                return res.status(404).json({ error: 'Cliente não encontrado' });
            }

            // Criar a venda com os produtos
            const sale = await prisma.bought.create({
                data: {
                    client_id: Number(client_id),
                    value: Number(value),
                    date_pay: dataPagamento,
                    products: {
                        create: products.map(product => ({
                            product: {
                                connect: { id: product.product_id }
                            },
                            quantity: product.quantity,
                            price: product.price
                        }))
                    }
                },
                include: {
                    client: true,
                    products: {
                        include: {
                            product: true
                        }
                    }
                }
            });

            // Atualizar o estoque dos produtos
            for (const item of products) {
                await prisma.product.update({
                    where: { id: item.product_id },
                    data: {
                        stock: {
                            decrement: item.quantity
                        }
                    }
                });
            }

            // Gerar comprovante
            const receipt = this.generateReceipt(sale);

            // Formatar o número e enviar comprovante via WhatsApp
            const formattedNumber = this.formatWhatsAppNumber(client.wpp);
            try {
                await whatsappService.sendMessage(formattedNumber, receipt);
            } catch (whatsappError) {
                console.error('Erro ao enviar WhatsApp:', whatsappError);
                // Não impede a conclusão da venda se o WhatsApp falhar
            }

            return res.status(201).json(sale);
        } catch (error) {
            console.error('Erro ao criar venda:', error);
            return res.status(400).json({ error: error.message });
        }
    }

    generateReceipt(sale) {
        const formattedDate = sale.date_sell.toLocaleDateString('pt-BR');
        const formattedTime = sale.date_sell.toLocaleTimeString('pt-BR');
        const formattedValue = sale.value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
        const formattedPaymentDate = new Date(sale.date_pay).toLocaleDateString('pt-BR');

        let receipt = `🧾 *COMPROVANTE DE VENDA*\n\n`;
        receipt += `📅 Data: ${formattedDate}\n`;
        receipt += `⏰ Hora: ${formattedTime}\n`;
        receipt += `👤 Cliente: ${sale.client.name}\n\n`;
        
        receipt += `📝 *PRODUTOS*\n`;
        sale.products.forEach(item => {
            receipt += `- ${item.product.name}\n`;
            receipt += `  ${item.quantity}x R$ ${item.price.toFixed(2)} = R$ ${(item.quantity * item.price).toFixed(2)}\n`;
        });
        
        receipt += `\n💰 *TOTAL:* ${formattedValue}\n`;
        receipt += `📅 Data de Pagamento: ${formattedPaymentDate}\n`;
        receipt += `🔢 Código da venda: #${sale.id}`;
        
        return receipt;
    }

    async list(req, res) {
        try {
            const sales = await prisma.bought.findMany({
                include: {
                    client: true,
                    products: {
                        include: {
                            product: true
                        }
                    }
                }
            });
            return res.json(sales);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}

module.exports = new SaleController(); 