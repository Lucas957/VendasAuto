const { PrismaClient } = require('@prisma/client');
const whatsappService = require('../services/whatsapp');

const prisma = new PrismaClient();

class SaleController {
    async create(req, res) {
        try {
            const { client_id, value } = req.body;

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

            // Criar a venda
            const sale = await prisma.bought.create({
                data: {
                    client_id,
                    value,
                    date_pay: dataPagamento,
                },
                include: {
                    client: true
                }
            });

            // Gerar comprovante
            const receipt = this.generateReceipt(sale);

            // Enviar comprovante via WhatsApp
            await whatsappService.sendMessage(client.wpp, receipt);

            return res.json(sale);
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

        return `🧾 *COMPROVANTE DE VENDA*
        
📅 Data: ${formattedDate}
⏰ Hora: ${formattedTime}
👤 Cliente: ${sale.client.name}
💰 Valor: ${formattedValue}
📅 Data de Pagamento: ${formattedPaymentDate}
🆔 Código da Venda: ${sale.id}

Agradecemos a preferência! 🙏`;
    }
}

module.exports = new SaleController(); 