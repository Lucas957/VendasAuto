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
  padrao: "⭐", // Estrela - Padrão para quem não tem curso
};

// Ícones das armas militares
const armaIcons = {
  infantaria: "🔫", // Arma - Infantaria
  cavalaria: "🐎", // Cavalo - Cavalaria
  artilharia: "💣", // Bomba - Artilharia
  engenharia: "🔧", // Ferramenta - Engenharia
  comunicacoes: "📡", // Antena - Comunicações
  intendencia: "📦", // Caixa - Intendência
  material_belico: "🛠️", // Ferramentas - Material Bélico
  saude: "⚕️", // Símbolo médico - Saúde
  padrao: "🎖️", // Medalha militar - Padrão para quem não tem arma definida
};

// Hierarquia militar conforme definido no schema.prisma
const patentesOptions = [
  { value: "SD", label: "Soldado (SD)" },
  { value: "CB", label: "Cabo (CB)" },
  { value: "SGT", label: "Sargento (SGT)" },
  { value: "STTEN", label: "Subtenente (STTEN)" },
  { value: "TEN", label: "Tenente (TEN)" },
  { value: "CAP", label: "Capitão (CAP)" },
  { value: "MAJ", label: "Major (MAJ)" },
  { value: "CEL", label: "Coronel (CEL)" }
];

// Opções de cursos militares conforme definido no schema.prisma
const cursosOptions = [
  { value: "", label: "Nenhum" },
  { value: "comandos", label: "Comandos 💀" },
  { value: "precursor", label: "Precursor 🎯" },
  { value: "mergulhador", label: "Mergulhador 🌊" },
  { value: "paraquedista", label: "Paraquedista 🪂" },
  { value: "caatinga", label: "Caatinga 🌵" },
  { value: "montanha", label: "Montanha ⛰️" }
];

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
  // Novos estados para o filtro de período
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [clientPurchases, setClientPurchases] = useState([]);
  const [totalPurchaseValue, setTotalPurchaseValue] = useState(0);
  const [showPurchasesModal, setShowPurchasesModal] = useState(false);
  const [isLoadingPurchases, setIsLoadingPurchases] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  // Novos estados para o pagamento parcial
  const [showPartialPaymentModal, setShowPartialPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedPurchases, setSelectedPurchases] = useState([]);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  // Novos estados para adicionar cliente
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClientData, setNewClientData] = useState({
    name: '',
    phone: '',
    level: 'SD', // Valor padrão alterado para SD em maiúsculas
    course: '', // Valor padrão vazio (sem curso)
    arma: 'infantaria', // Valor padrão para arma
    debit: 0,
    credit: 0
  });
  const [isAddingClient, setIsAddingClient] = useState(false);
  // Novo estado para controlar a exclusão de cliente
  const [isDeletingClient, setIsDeletingClient] = useState(false);

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

  // Nova função para excluir cliente
  const deleteClient = async (client) => {
    try {
      setIsDeletingClient(true);
      await axios.delete(`${API_URL}/api/clients/${client.id}`);
      setMessage('Cliente excluído com sucesso!');
      setSelectedClient(null);
      loadClients(); // Recarregar a lista após excluir o cliente
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      setError(error);
      setMessage('Erro ao excluir cliente');
    } finally {
      setIsDeletingClient(false);
    }
  };

  const updateClient = async (updatedClient) => {
    try {
      // Formatar o número de WhatsApp para o padrão aceito pela biblioteca whatsapp-web.js
      let formattedPhone = '';
      if (updatedClient.phone) {
        // Remover todos os caracteres não numéricos
        const phoneDigits = updatedClient.phone.replace(/\D/g, '');
        
        // Verificar se o número tem pelo menos 10 dígitos (DDD + número)
        if (phoneDigits.length < 10) {
          alert('O número de telefone deve ter pelo menos 10 dígitos (DDD + número).');
          return;
        }
        
        // Formatar como 55DDNNNNNNNNN (formato para o Brasil)
        // Se o número já começar com 55, não adicionar novamente
        if (phoneDigits.startsWith('55') && phoneDigits.length >= 12) {
          formattedPhone = phoneDigits;
        } else {
          // Adicionar o código do país (55 para Brasil)
          formattedPhone = `55${phoneDigits}`;
        }
      }

      // Atualizar o cliente com o telefone formatado
      const clientToUpdate = {
        ...updatedClient,
        wpp: formattedPhone
      };

      await axios.put(`${API_URL}/api/clients/${updatedClient.id}`, clientToUpdate);
      loadClients(); // Recarregar a lista após atualizar o cliente
      setShowEditModal(false);
      setEditingClient(null);
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      setError(error);
    }
  };

  // Nova função para buscar compras por período
  const fetchClientPurchases = async (clientId) => {
    setIsLoadingPurchases(true);
    try {
      // Formatar as datas para a API
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      
      const response = await axios.get(
        `${API_URL}/api/clients/${clientId}/purchases?${queryParams.toString()}`
      );
      
      setClientPurchases(response.data.purchases);
      setTotalPurchaseValue(response.data.totalValue);
      setShowPurchasesModal(true);
    } catch (error) {
      console.error('Erro ao buscar compras:', error);
      alert('Erro ao buscar compras do cliente');
    } finally {
      setIsLoadingPurchases(false);
    }
  };

  // Nova função para processar pagamento parcial
  const processPartialPayment = async () => {
    if (!selectedClient) return;
    
    setIsProcessingPayment(true);
    try {
      // Verificar se temos um valor ou compras selecionadas
      if (!paymentAmount && selectedPurchases.length === 0) {
        alert('Por favor, informe um valor de pagamento ou selecione compras específicas.');
        setIsProcessingPayment(false);
        return;
      }
      
      const response = await axios.post(
        `${API_URL}/api/clients/${selectedClient.id}/partial-payment`,
        {
          amount: paymentAmount ? parseFloat(paymentAmount) : undefined,
          purchaseIds: selectedPurchases.length > 0 ? selectedPurchases : undefined
        }
      );
      
      // Atualizar a lista de clientes
      loadClients();
      
      // Fechar o modal e limpar os campos
      setShowPartialPaymentModal(false);
      setPaymentAmount('');
      setSelectedPurchases([]);
      
      // Mostrar mensagem de sucesso
      alert(`Pagamento de R$ ${response.data.paidAmount.toFixed(2)} processado com sucesso!`);
    } catch (error) {
      console.error('Erro ao processar pagamento parcial:', error);
      alert(`Erro ao processar pagamento: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Nova função para adicionar um cliente
  const addClient = async () => {
    setIsAddingClient(true);
    try {
      // Validar dados do cliente
      if (!newClientData.name.trim()) {
        alert('Por favor, informe o nome do cliente.');
        setIsAddingClient(false);
        return;
      }

      // Formatar o número de WhatsApp para o padrão aceito pela biblioteca whatsapp-web.js
      let formattedPhone = '';
      if (newClientData.phone) {
        // Remover todos os caracteres não numéricos
        const phoneDigits = newClientData.phone.replace(/\D/g, '');
        
        // Verificar se o número tem pelo menos 10 dígitos (DDD + número)
        if (phoneDigits.length < 10) {
          alert('O número de telefone deve ter pelo menos 10 dígitos (DDD + número).');
          setIsAddingClient(false);
          return;
        }
        
        // Formatar como 55DDNNNNNNNNN (formato para o Brasil)
        // Se o número já começar com 55, não adicionar novamente
        if (phoneDigits.startsWith('55') && phoneDigits.length >= 12) {
          formattedPhone = phoneDigits;
        } else {
          // Adicionar o código do país (55 para Brasil)
          formattedPhone = `55${phoneDigits}`;
        }
      }

      // Preparar dados para envio
      const clientData = {
        name: newClientData.name.trim(),
        wpp: formattedPhone,
        level: newClientData.level,
        course: newClientData.course || null, // Enviar null se não tiver curso selecionado
        arma: newClientData.arma || 'padrao', // Enviar a arma selecionada
        debit: parseFloat(newClientData.debit) || 0,
        credit: parseFloat(newClientData.credit) || 0
      };

      // Enviar requisição para a API
      const response = await axios.post(`${API_URL}/api/clients`, clientData);
      
      // Atualizar a lista de clientes
      loadClients();
      
      // Fechar o modal e limpar os campos
      setShowAddClientModal(false);
      setNewClientData({
        name: '',
        phone: '',
        level: 'SD',
        course: '',
        arma: 'infantaria',
        debit: 0,
        credit: 0
      });
      
      // Mostrar mensagem de sucesso
      alert(`Cliente ${response.data.name} adicionado com sucesso!`);
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error);
      alert(`Erro ao adicionar cliente: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsAddingClient(false);
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
          <div className="flex space-x-2">
            <button
              onClick={() => setShowAddClientModal(true)}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center"
            >
              <span className="mr-1">➕</span> Adicionar Cliente
            </button>
            <a
              href="/"
              onClick={() => localStorage.removeItem('isAuthenticated')}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Voltar
            </a>
          </div>
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
                  level: e.target.level.value,
                  course: e.target.course.value,
                  arma: e.target.arma.value
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patente</label>
                  <select 
                    name="level" 
                    defaultValue={editingClient.level}
                    className="w-full p-2 border rounded"
                  >
                    {patentesOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Curso</label>
                  <select 
                    name="course" 
                    defaultValue={editingClient.course || ''}
                    className="w-full p-2 border rounded"
                  >
                    {cursosOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Arma</label>
                  <select 
                    name="arma" 
                    defaultValue={editingClient.arma || 'padrao'}
                    className="w-full p-2 border rounded"
                  >
                    <option value="infantaria">Infantaria 🔫</option>
                    <option value="cavalaria">Cavalaria 🐎</option>
                    <option value="artilharia">Artilharia 💣</option>
                    <option value="engenharia">Engenharia 🔧</option>
                    <option value="comunicacoes">Comunicações 📡</option>
                    <option value="intendencia">Intendência 📦</option>
                    <option value="material_belico">Material Bélico 🛠️</option>
                    <option value="saude">Saúde ⚕️</option>
                    <option value="padrao">Não definida 🎖️</option>
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
                <span className="text-2xl block mb-1">
                  {client.course && client.course !== '' ? courseIcons[client.course] || courseIcons.padrao : armaIcons[client.arma] || armaIcons.padrao}
                </span>
                <span className="font-medium block">{client.name}</span>
                <span className="text-sm text-gray-600 block">
                  {patentesOptions.find(p => p.value === client.level)?.label || 'Não definido'}
                </span>
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      fetchClientPurchases(client.id);
                    }}
                    className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 text-sm flex items-center"
                  >
                    <span className="mr-1">📊</span> Ver Compras
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPartialPaymentModal(true);
                    }}
                    className="bg-teal-500 text-white px-3 py-1 rounded hover:bg-teal-600 text-sm flex items-center"
                  >
                    <span className="mr-1">💰</span> Pagamento Parcial
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('ATENÇÃO: Esta ação excluirá permanentemente o cliente e todas as suas compras. Deseja continuar?')) {
                        deleteClient(client);
                      }
                    }}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm flex items-center"
                    disabled={isDeletingClient}
                  >
                    <span className="mr-1">❌</span> {isDeletingClient ? 'Excluindo...' : 'Excluir Cliente'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Compras por Período */}
      {showPurchasesModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-auto" css={scrollbarStyle}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Compras de {selectedClient.name}</h2>
              <button 
                onClick={() => setShowPurchasesModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4 flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="p-2 border rounded"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => fetchClientPurchases(selectedClient.id)}
                  disabled={isLoadingPurchases}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
                >
                  {isLoadingPurchases ? 'Carregando...' : 'Filtrar'}
                </button>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="font-bold text-lg">Total no período: R$ {totalPurchaseValue.toFixed(2)}</p>
            </div>
            
            {clientPurchases.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-4 border text-left">Data</th>
                      <th className="py-2 px-4 border text-left">Valor</th>
                      <th className="py-2 px-4 border text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientPurchases.map((purchase) => (
                      <tr key={purchase.id} className="hover:bg-gray-50">
                        <td className="py-2 px-4 border">
                          {new Date(purchase.date_sell).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-2 px-4 border">
                          R$ {purchase.value.toFixed(2)}
                        </td>
                        <td className="py-2 px-4 border">
                          {purchase.paid ? (
                            <span className="text-green-500 font-medium">Pago</span>
                          ) : (
                            <span className="text-red-500 font-medium">Pendente</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500 my-4">
                {isLoadingPurchases ? 'Carregando compras...' : 'Nenhuma compra encontrada no período selecionado.'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Modal de Pagamento Parcial */}
      {showPartialPaymentModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-auto" css={scrollbarStyle}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Pagamento Parcial - {selectedClient.name}</h2>
              <button 
                onClick={() => {
                  setShowPartialPaymentModal(false);
                  setPaymentAmount('');
                  setSelectedPurchases([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor do Pagamento (R$)</label>
              <input 
                type="number" 
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="p-2 border rounded w-full"
              />
              <p className="text-sm text-gray-500 mt-1">
                Informe um valor para pagar as compras mais antigas primeiro, ou selecione compras específicas abaixo.
              </p>
            </div>
            
            <div className="mb-6">
              <h3 className="font-medium mb-2">Ou selecione compras específicas:</h3>
              <div className="max-h-60 overflow-y-auto border rounded p-2" css={scrollbarStyle}>
                {selectedClient.bought
                  .filter(purchase => !purchase.paid)
                  .sort((a, b) => new Date(a.date_sell) - new Date(b.date_sell))
                  .map(purchase => (
                    <div key={purchase.id} className="flex items-center mb-2 p-2 hover:bg-gray-50 rounded">
                      <input 
                        type="checkbox"
                        id={`purchase-${purchase.id}`}
                        checked={selectedPurchases.includes(purchase.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPurchases([...selectedPurchases, purchase.id]);
                          } else {
                            setSelectedPurchases(selectedPurchases.filter(id => id !== purchase.id));
                          }
                        }}
                        className="mr-2"
                      />
                      <label htmlFor={`purchase-${purchase.id}`} className="flex-1 cursor-pointer">
                        <span className="block">
                          Data: {new Date(purchase.date_sell).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="block font-medium">
                          Valor: R$ {purchase.value.toFixed(2)}
                        </span>
                      </label>
                    </div>
                  ))
                }
                {selectedClient.bought.filter(purchase => !purchase.paid).length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    Este cliente não possui compras pendentes.
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => {
                  setShowPartialPaymentModal(false);
                  setPaymentAmount('');
                  setSelectedPurchases([]);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button 
                onClick={processPartialPayment}
                disabled={isProcessingPayment || (!paymentAmount && selectedPurchases.length === 0)}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-300"
              >
                {isProcessingPayment ? 'Processando...' : 'Confirmar Pagamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Adição de Cliente */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Adicionar Novo Cliente</h2>
              <button 
                onClick={() => {
                  setShowAddClientModal(false);
                  setNewClientData({
                    name: '',
                    phone: '',
                    level: 'SD',
                    course: '',
                    arma: 'infantaria',
                    debit: 0,
                    credit: 0
                  });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              addClient();
            }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input 
                  type="text" 
                  value={newClientData.name}
                  onChange={(e) => setNewClientData({...newClientData, name: e.target.value})}
                  placeholder="Nome completo"
                  className="p-2 border rounded w-full"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone (WhatsApp)</label>
                <input 
                  type="text" 
                  value={newClientData.phone}
                  onChange={(e) => setNewClientData({...newClientData, phone: e.target.value})}
                  placeholder="(00) 00000-0000"
                  className="p-2 border rounded w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formato: (DDD) NNNNN-NNNN - O código do país (55) será adicionado automaticamente.
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Patente</label>
                <select 
                  value={newClientData.level}
                  onChange={(e) => setNewClientData({...newClientData, level: e.target.value})}
                  className="p-2 border rounded w-full"
                >
                  {patentesOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Curso</label>
                <select 
                  value={newClientData.course}
                  onChange={(e) => setNewClientData({...newClientData, course: e.target.value})}
                  className="p-2 border rounded w-full"
                >
                  {cursosOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Arma</label>
                <select 
                  value={newClientData.arma}
                  onChange={(e) => setNewClientData({...newClientData, arma: e.target.value})}
                  className="p-2 border rounded w-full"
                >
                  <option value="infantaria">Infantaria 🔫</option>
                  <option value="cavalaria">Cavalaria 🐎</option>
                  <option value="artilharia">Artilharia 💣</option>
                  <option value="engenharia">Engenharia 🔧</option>
                  <option value="comunicacoes">Comunicações 📡</option>
                  <option value="intendencia">Intendência 📦</option>
                  <option value="material_belico">Material Bélico 🛠️</option>
                  <option value="saude">Saúde ⚕️</option>
                  <option value="padrao">Não definida 🎖️</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Débito Inicial (R$)</label>
                  <input 
                    type="number" 
                    value={newClientData.debit}
                    onChange={(e) => setNewClientData({...newClientData, debit: e.target.value})}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="p-2 border rounded w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Crédito Inicial (R$)</label>
                  <input 
                    type="number" 
                    value={newClientData.credit}
                    onChange={(e) => setNewClientData({...newClientData, credit: e.target.value})}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="p-2 border rounded w-full"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button 
                  type="button"
                  onClick={() => {
                    setShowAddClientModal(false);
                    setNewClientData({
                      name: '',
                      phone: '',
                      level: 'SD',
                      course: '',
                      arma: 'infantaria',
                      debit: 0,
                      credit: 0
                    });
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isAddingClient || !newClientData.name.trim()}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-300"
                >
                  {isAddingClient ? 'Adicionando...' : 'Adicionar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 