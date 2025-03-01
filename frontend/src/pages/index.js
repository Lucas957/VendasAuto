import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';

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
console.log('Frontend usando API em:', API_URL);

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
  cigs: "🌳", // Árvore - CIGS (Selva)
  cipe: "��", // Alvo - CIPE
  precursor: "🎯", // Alvo - Precursor
  mergulhador: "🌊", // Onda - Mergulhador
  paraquedista: "🪂", // Paraquedas
  caatinga: "🌵", // Cacto - Caatinga
  montanha: "⛰️", // Montanha
  inteligente: "🧠", // Cérebro - Inteligentes
  padrao: "⭐", // Estrela - Padrão para quem não tem curso
};

export default function Home() {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [message, setMessage] = useState('');
  const [messageVisible, setMessageVisible] = useState(false);
  const [messageOpacity, setMessageOpacity] = useState(1);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const levels = [
    { id: 'SD', name: 'Soldado' },
    { id: 'CB', name: 'Cabo' },
    { id: 'SGT', name: 'Sargento' },
    { id: 'STTEN', name: 'Subtenente' },
    { id: 'TEN', name: 'Tenente' },
    { id: 'CAP', name: 'Capitão' },
    { id: 'MAJ', name: 'Major' },
    { id: 'CEL', name: 'Coronel' }
  ];

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
    loadClients();
  }, []);

  useEffect(() => {
    if (message) {
      setMessageVisible(true);
      setMessageOpacity(1);
      
      // Inicia o fade out após 3 segundos
      const fadeTimeout = setTimeout(() => {
        setMessageOpacity(0);
      }, 3000);

      // Remove a mensagem após a animação de fade
      const removeTimeout = setTimeout(() => {
        setMessageVisible(false);
        setMessage('');
      }, 3300); // 3s + 300ms da animação

      return () => {
        clearTimeout(fadeTimeout);
        clearTimeout(removeTimeout);
      };
    }
  }, [message]);

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

  const filterClientsByLevel = (level) => {
    setSelectedLevel(level);
    if (level) {
      const filtered = clients
        .filter(client => client.level === level)
        .sort((a, b) => a.name.localeCompare(b.name));
      setFilteredClients(filtered);
    } else {
      setFilteredClients([...clients].sort((a, b) => a.name.localeCompare(b.name)));
    }
    setSelectedClient(null);
  };

  const selectClient = async (client) => {
    setSelectedClient(client);
    try {
      const response = await axios.get(`${API_URL}/api/products`);
      setProducts(response.data);
    } catch (error) {
      setMessage('Erro ao carregar produtos: ' + error.message);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    // Não permite quantidade menor que 1
    if (newQuantity < 1) return;

    // Atualiza a quantidade
    setCart(cart.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const finalizeSale = async () => {
    if (!selectedClient || cart.length === 0) {
      setMessage('Selecione um cliente e adicione produtos ao carrinho');
      return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const saleData = {
      client_id: selectedClient.id,
      value: total,
      products: cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }))
    };

    try {
      await axios.post(`${API_URL}/api/sales`, saleData);
      setMessage('Venda realizada com sucesso!');
      setCart([]);
      setSelectedClient(null);
    } catch (error) {
      setMessage('Erro ao finalizar venda: ' + error.message);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === '159432687') {
      setPasswordError(false);
      setShowPasswordModal(false);
      localStorage.setItem('isAuthenticated', 'true');
      window.location.href = '/gerenciar';
    } else {
      setPasswordError(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-4">
        {/* Cabeçalho com título e botão */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Sistema de Vendas</h1>
          <div className="flex space-x-2">
            <Link href="/diagnostico" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
              Diagnóstico
            </Link>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Gerenciar Clientes
            </button>
          </div>
        </div>

        {/* Modal de Senha */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
              <h2 className="text-xl font-bold mb-4">Acesso Restrito</h2>
              <form onSubmit={handlePasswordSubmit}>
                <input
                  type="password"
                  placeholder="Digite a senha"
                  className={`w-full p-2 border rounded mb-4 ${
                    passwordError ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError(false);
                  }}
                />
                {passwordError && (
                  <p className="text-red-500 text-sm mb-4">Senha incorreta</p>
                )}
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPassword('');
                      setPasswordError(false);
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Acessar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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

        {/* Tela de Seleção de Clientes */}
        <div className={`fixed inset-0 transition-transform duration-300 ease-in-out ${selectedClient ? '-translate-x-full' : 'translate-x-0'}`}>
          <div className="container mx-auto p-4 h-screen flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">Sistema de Vendas</h1>
              <button 
                onClick={() => setShowPasswordModal(true)}
                className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors"
              >
                Gerenciar Clientes
              </button>
            </div>
            
            {/* Botões de Nível */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Filtrar por Nível</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => filterClientsByLevel(null)}
                  className={`px-4 py-2 rounded ${!selectedLevel ? 'bg-emerald-600 text-white' : 'bg-gray-200'}`}
                >
                  Todos
                </button>
                {levels.map(level => (
                  <button
                    key={level.id}
                    onClick={() => filterClientsByLevel(level.id)}
                    className={`px-4 py-2 rounded ${selectedLevel === level.id ? 'bg-emerald-600 text-white' : 'bg-gray-200'}`}
                  >
                    {level.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de Clientes com Rolagem */}
            <div className={`flex-1 overflow-y-auto ${scrollbarStyle}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                {filteredClients.map(client => (
                  <div
                    key={client.id}
                    onClick={() => selectClient(client)}
                    className="p-4 border rounded cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-colors bg-white shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl" title={client.course || 'Sem curso'}>
                        {courseIcons[client.course] || courseIcons.padrao}
                      </span>
                      <div>
                        <h3 className="font-semibold text-emerald-900">{client.name}</h3>
                        <p className="text-sm text-emerald-600">Nível: {client.level}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tela de Produtos e Carrinho */}
        <div className={`fixed inset-0 bg-gray-50 transition-transform duration-300 ease-in-out ${selectedClient ? 'translate-x-0' : 'translate-x-full'}`}>
          {selectedClient && (
            <div className="container mx-auto p-4">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Venda para {selectedClient.name}</h1>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Voltar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Lista de Produtos */}
                <div className={`h-[calc(100vh-12rem)] overflow-y-auto ${scrollbarStyle}`}>
                  <h2 className="text-xl font-semibold mb-4 text-emerald-900">Produtos Disponíveis</h2>
                  <div className="grid gap-4">
                    {products.map(product => (
                      <div key={product.id} className="p-4 border rounded bg-white shadow-sm hover:border-emerald-500 transition-colors">
                        <h3 className="font-semibold text-emerald-900">{product.name}</h3>
                        <p className="text-sm text-emerald-600">
                          Preço: R$ {product.price.toFixed(2)} - Estoque: {product.stock}
                        </p>
                        <button
                          onClick={() => addToCart(product)}
                          className="mt-2 px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors"
                        >
                          Adicionar ao Carrinho
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Carrinho */}
                <div className="h-[calc(100vh-12rem)] flex flex-col">
                  <h2 className="text-xl font-semibold mb-4 text-emerald-900">Carrinho</h2>
                  <div className={`flex-1 border rounded p-4 bg-white shadow-sm overflow-y-auto ${scrollbarStyle}`}>
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center gap-4 mb-4 p-2 border-b">
                        <span className="flex-1 text-emerald-900">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center bg-emerald-100 text-emerald-600 rounded-full hover:bg-emerald-200 transition-colors"
                          >
                            -
                          </button>
                          <span className="w-10 text-center font-medium text-emerald-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center bg-emerald-100 text-emerald-600 rounded-full hover:bg-emerald-200 transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <span className="w-24 text-right text-emerald-900">R$ {(item.price * item.quantity).toFixed(2)}</span>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                    
                    {cart.length === 0 && (
                      <p className="text-emerald-500 text-center py-4">
                        Carrinho vazio
                      </p>
                    )}

                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xl font-semibold mb-4 text-emerald-900">
                        Total: R$ {cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                      </p>
                      <button
                        onClick={finalizeSale}
                        className="w-full px-4 py-3 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors disabled:opacity-50"
                        disabled={cart.length === 0}
                      >
                        Finalizar Venda
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mensagens */}
        {messageVisible && (
          <div 
            className="fixed top-4 right-4 p-4 bg-blue-100 text-blue-700 rounded shadow-lg transition-opacity duration-300 z-50"
            style={{ opacity: messageOpacity }}
          >
            {message}
          </div>
        )}

        {/* Rodapé com link para diagnóstico */}
        <div className="fixed bottom-2 right-2">
          <Link href="/diagnostico" className="text-xs text-gray-500 hover:text-gray-700 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Diagnóstico
          </Link>
        </div>
      </div>
    </div>
  );
} 