import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

// Função para obter a URL da API (do localStorage ou das variáveis de ambiente)
const getApiUrl = () => {
  // Verificar se estamos no navegador
  if (typeof window !== 'undefined') {
    // Tentar obter do localStorage primeiro (se o usuário definiu manualmente)
    const savedUrl = localStorage.getItem('override_api_url');
    if (savedUrl) {
      console.log('Usando URL da API do localStorage:', savedUrl);
      return savedUrl;
    }
  }
  
  // Caso contrário, usar a variável de ambiente ou o fallback
  const envUrl = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.15.6:3000';
  
  // Não permitir localhost (substituir por IP)
  if (envUrl.includes('localhost')) {
    console.log('Substituindo localhost por IP da rede local');
    return 'http://192.168.15.6:3000';
  }
  
  console.log('Usando URL da API do .env:', envUrl);
  return envUrl;
};

// Configuração da API usando variável de ambiente ou localStorage
const API_URL = getApiUrl();
console.log('Gerenciador usando API em:', API_URL);

// Estilo global para scrollbar
const scrollbarStyle = `
  [&::-webkit-scrollbar] {
    width: 8px;
    height: 8px;
  }
  [&::-webkit-scrollbar-track] {
    background: #f1f1f1;
    border-radius: 4px;
  }
  [&::-webkit-scrollbar-thumb] {
    background: #c1c1c1;
    border-radius: 4px;
  }
  [&::-webkit-scrollbar-thumb:hover] {
    background: #a1a1a1;
  }
`;

// Ícones dos cursos militares
const courseIcons = {
  comandos: "💀", // Caveira - Comandos
  precursor: "🎯", // Alvo - Precursor
  mergulhador: "🌊", // Onda - Mergulhador
  paraquedista: "🪂", // Paraquedas
  caatinga: "🌵", // Cacto - Caatinga
  montanha: "⛰️", // Montanha
  inteligente: "🧠", // Cérebro - Inteligentes
  padrao: "⭐", // Estrela - Padrão para quem não tem curso
};

export default function Gerenciar() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [message, setMessage] = useState('');
  const [messageVisible, setMessageVisible] = useState(false);
  const [messageOpacity, setMessageOpacity] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar se a URL da API está usando localhost e corrigir
  useEffect(() => {
    // Verificar se a URL atual está usando localhost
    const currentApiUrl = localStorage.getItem('override_api_url');
    if (currentApiUrl && currentApiUrl.includes('localhost')) {
      console.log('Detectado localhost na URL da API, corrigindo...');
      localStorage.setItem('override_api_url', 'http://192.168.15.6:3000');
      // Recarregar a página para aplicar a nova URL
      window.location.reload();
    }
  }, []);

  useEffect(() => {
    // Verifica autenticação ao carregar a página
    const auth = localStorage.getItem('isAuthenticated');
    if (!auth) {
      window.location.href = '/';
    } else {
      setIsAuthenticated(true);
      loadClients();
    }

    // Limpa a autenticação quando o componente é desmontado
    return () => {
      localStorage.removeItem('isAuthenticated');
    };
  }, []);

  useEffect(() => {
    if (message) {
      setMessageVisible(true);
      setMessageOpacity(1);
      
      const fadeTimeout = setTimeout(() => {
        setMessageOpacity(0);
      }, 3000);

      const removeTimeout = setTimeout(() => {
        setMessageVisible(false);
        setMessage('');
      }, 3300);

      return () => {
        clearTimeout(fadeTimeout);
        clearTimeout(removeTimeout);
      };
    }
  }, [message]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = clients.filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredClients(filtered);
    } else {
      setFilteredClients(clients);
    }
  }, [searchTerm, clients]);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Tentando carregar clientes de:', `${API_URL}/api/clients`);
      const response = await axios.get(`${API_URL}/api/clients`);
      console.log('Resposta recebida:', response.data);
      const sortedClients = response.data.sort((a, b) => a.name.localeCompare(b.name));
      setClients(sortedClients);
      setFilteredClients(sortedClients);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
      setLoading(false);
      setError({
        message: err.message,
        code: err.code,
        stack: err.stack,
        config: err.config ? {
          url: err.config.url,
          method: err.config.method,
          headers: err.config.headers
        } : 'Sem config'
      });
    }
  };

  const handleClientClick = (client) => {
    setSelectedClient(selectedClient?.id === client.id ? null : client);
  };

  const sendWhatsAppMessage = async (client) => {
    try {
      await axios.post(`${API_URL}/api/send-debt-message`, {
        clientId: client.id
      });
      alert('Mensagem enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem');
    }
  };

  const clearClientDebt = async (client) => {
    try {
      const response = await axios.post(`${API_URL}/api/clients/${client.id}/clear-debt`);
      console.log('Resposta ao zerar débito:', response.data);
      alert('Débito zerado com sucesso!');
      await loadClients();
    } catch (error) {
      console.error('Erro detalhado ao zerar débito:', error.response?.data || error);
      const errorMessage = error.response?.data?.error || error.response?.data?.details || 'Erro ao zerar débito';
      alert(`Erro: ${errorMessage}`);
    }
  };

  // Renderização condicional baseada na autenticação
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Carregando...</h1>
          <p className="text-center text-gray-600 mb-4">Verificando autenticação...</p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600 transition duration-200"
          >
            Voltar para a Página Inicial
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Área de erro - agora como um modal flutuante */}
      {error && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-w-md">
            <h2 className="text-xl font-bold mb-4 text-red-600">Erro de Conexão</h2>
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              <p><strong>Mensagem:</strong> {error.message}</p>
              <p><strong>Código:</strong> {error.code}</p>
              <p><strong>URL:</strong> {error.config?.url || 'N/A'}</p>
              <p><strong>API configurada:</strong> {API_URL}</p>
            </div>
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => setError(null)} 
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Fechar
              </button>
              <button 
                onClick={() => {
                  setError(null);
                  loadClients();
                }} 
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Indicador de carregamento */}
      {loading && (
        <div className="text-center py-4">
          <p className="text-gray-600">Carregando clientes...</p>
        </div>
      )}
      
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Gerenciar Clientes</h1>
          <a
            href="/"
            onClick={() => localStorage.removeItem('isAuthenticated')}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Voltar
          </a>
        </div>
        
        <input
          type="text"
          placeholder="Buscar cliente..."
          className="w-full p-2 mb-4 border rounded"
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="bg-white rounded-lg shadow">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className={`p-4 border-b flex justify-between items-center cursor-pointer ${
                selectedClient?.id === client.id ? 'bg-blue-50' : ''
              }`}
              onClick={() => handleClientClick(client)}
            >
              <div>
                <span className="font-medium">{courseIcons[client.level]} {client.name}</span>
                <p className="text-sm text-gray-600">Total devido: R$ {
                  client.bought
                    .filter(purchase => !purchase.paid)
                    .reduce((total, purchase) => total + purchase.value, 0)
                    .toFixed(2)
                }</p>
              </div>
              
              {selectedClient?.id === client.id && (
                <div className="space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      sendWhatsAppMessage(client);
                    }}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Enviar Cobrança via WhatsApp
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Tem certeza que deseja zerar o débito deste cliente?')) {
                        clearClientDebt(client);
                      }
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Zerar Débito
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 