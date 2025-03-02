import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { getApiUrl } from '../config';

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
  const [editingClient, setEditingClient] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

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
      await axios.post(`${API_URL}/api/clients/${client.id}/clear-debt`);
      loadClients(); // Recarregar a lista após limpar o débito
    } catch (error) {
      console.error('Erro ao limpar débito:', error);
      setError(error);
    }
  };

  const updateClient = async (updatedClient) => {
    try {
      await axios.put(`${API_URL}/api/clients/${updatedClient.id}`, updatedClient);
      loadClients(); // Recarregar a lista após atualizar o cliente
      setShowEditModal(false);
      setEditingClient(null);
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      setError(error);
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
        
        {/* Modal de Edição */}
        {showEditModal && editingClient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-w-md">
              <h2 className="text-xl font-bold mb-4">Editar Cliente</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                // Implementar a lógica de atualização do cliente
                const updatedClient = {
                  ...editingClient,
                  name: e.target.name.value,
                  phone: e.target.phone.value,
                  level: e.target.level.value
                };
                
                // Chamar a função de atualização
                updateClient(updatedClient);
              }}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <input 
                    type="text" 
                    name="name" 
                    defaultValue={editingClient.name}
                    className="w-full p-2 border rounded" 
                    required 
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input 
                    type="text" 
                    name="phone" 
                    defaultValue={editingClient.phone || ''}
                    className="w-full p-2 border rounded" 
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nível</label>
                  <select 
                    name="level" 
                    defaultValue={editingClient.level}
                    className="w-full p-2 border rounded"
                  >
                    <option value="Básico">Básico</option>
                    <option value="Intermediário">Intermediário</option>
                    <option value="Avançado">Avançado</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingClient(null);
                    }} 
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
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
              className={`p-4 border-b flex flex-col items-center text-center cursor-pointer ${
                selectedClient?.id === client.id ? 'bg-blue-50' : ''
              }`}
              onClick={() => handleClientClick(client)}
            >
              <div className="mb-2">
                <span className="text-2xl block mb-1">{courseIcons[client.level]}</span>
                <span className="font-medium block">{client.name}</span>
                <p className="text-sm text-gray-600">Total devido: R$ {
                  client.bought
                    .filter(purchase => !purchase.paid)
                    .reduce((total, purchase) => total + purchase.value, 0)
                    .toFixed(2)
                }</p>
              </div>
              
              {selectedClient?.id === client.id && (
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      sendWhatsAppMessage(client);
                    }}
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm flex items-center"
                  >
                    <span className="mr-1">📱</span> Enviar WhatsApp
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingClient(client);
                      setShowEditModal(true);
                    }}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 text-sm flex items-center"
                  >
                    <span className="mr-1">✏️</span> Editar
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Tem certeza que deseja zerar o débito deste cliente?')) {
                        clearClientDebt(client);
                      }
                    }}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm flex items-center"
                  >
                    <span className="mr-1">🗑️</span> Zerar Débito
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