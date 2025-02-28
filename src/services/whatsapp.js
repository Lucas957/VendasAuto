const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

class WhatsAppService {
    constructor() {
        // Configuração mais robusta do cliente
        this.client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            }
        });
        this.initialize();
    }

    initialize() {
        // Gerar QR Code para autenticação
        this.client.on('qr', (qr) => {
            console.log('\n\n==================================');
            console.log('Por favor, escaneie o QR Code abaixo:');
            console.log('==================================\n\n');
            qrcode.generate(qr, { small: true });
        });

        // Evento quando o cliente está pronto
        this.client.on('ready', () => {
            console.log('\n==================================');
            console.log('Cliente WhatsApp está conectado! ✅');
            console.log('==================================\n');
        });

        // Tratamento de erros
        this.client.on('auth_failure', () => {
            console.error('❌ Falha na autenticação do WhatsApp');
        });

        this.client.on('disconnected', (reason) => {
            console.log('❌ Cliente WhatsApp foi desconectado:', reason);
        });

        // Iniciar o cliente
        this.client.initialize().catch(err => {
            console.error('Erro ao inicializar o cliente WhatsApp:', err);
        });
    }

    async sendMessage(to, message) {
        try {
            // Formatar número para padrão internacional
            const formattedNumber = to.startsWith('55') ? to : `55${to}`;
            const finalNumber = `${formattedNumber}@c.us`;

            // Verificar se o cliente está pronto
            if (!this.client.pupPage) {
                throw new Error('Cliente WhatsApp não está pronto');
            }

            // Enviar mensagem
            const response = await this.client.sendMessage(finalNumber, message);
            console.log(`✅ Mensagem enviada com sucesso para ${to}`);
            return true;
        } catch (error) {
            console.error('❌ Erro ao enviar mensagem:', error);
            return false;
        }
    }
}

// Criar uma única instância do serviço
const whatsappService = new WhatsAppService();

module.exports = whatsappService; 