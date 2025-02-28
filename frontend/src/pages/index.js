import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Home() {
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [message, setMessage] = useState('');

  // Carregar clientes
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/clients');
        setClients(response.data);
      } catch (error) {
        setMessage('Erro ao carregar clientes: ' + error.message);
      }
    };
    fetchClients();
  }, []);

  // Carregar produtos quando um cliente for selecionado
  useEffect(() => {
    if (selectedClient) {
      const fetchProducts = async () => {
        try {
          const response = await axios.get('http://localhost:3000/api/products');
          setProducts(response.data);
        } catch (error) {
          setMessage('Erro ao carregar produtos: ' + error.message);
        }
      };
      fetchProducts();
    }
  }, [selectedClient]);

  // Selecionar um produto
  const handleProductSelect = (product) => {
    const existingProduct = selectedProducts.find(p => p.id === product.id);
    
    if (existingProduct) {
      setSelectedProducts(selectedProducts.map(p => 
        p.id === product.id 
          ? { ...p, quantity: p.quantity + 1 }
          : p
      ));
    } else {
      setSelectedProducts([...selectedProducts, { ...product, quantity: 1 }]);
    }
  };

  // Remover um produto
  const handleRemoveProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  // Atualizar quantidade
  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    setSelectedProducts(selectedProducts.map(p => 
      p.id === productId ? { ...p, quantity: newQuantity } : p
    ));
  };

  // Calcular total
  const total = selectedProducts.reduce((sum, product) => 
    sum + (product.price * product.quantity), 0
  );

  // Finalizar venda
  const handleFinalizeSale = async () => {
    if (!selectedClient || selectedProducts.length === 0) {
      setMessage('Selecione um cliente e pelo menos um produto');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3000/api/sales', {
        client_id: selectedClient.id,
        value: total,
        products: selectedProducts.map(p => ({
          product_id: p.id,
          quantity: p.quantity,
          price: p.price
        }))
      });

      setMessage('Venda registrada com sucesso!');
      setSelectedProducts([]);
      setSelectedClient(null);
    } catch (error) {
      setMessage('Erro ao registrar venda: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {message && (
          <div className={`p-4 rounded-md mb-4 ${message.includes('Erro') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}

        {/* Lista de Clientes */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Selecione o Cliente</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {clients.map(client => (
              <button
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className={`p-4 rounded-lg border ${
                  selectedClient?.id === client.id 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-gray-200 hover:border-indigo-500'
                }`}
              >
                <h3 className="font-semibold">{client.name}</h3>
                <p className="text-sm text-gray-500">Nível: {client.level}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Produtos */}
        {selectedClient && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Selecione os Produtos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map(product => (
                <button
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  className="p-4 rounded-lg border border-gray-200 hover:border-indigo-500"
                >
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-sm text-gray-500">
                    Preço: R$ {product.price.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Estoque: {product.stock}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Carrinho */}
        {selectedProducts.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Carrinho</h2>
            <div className="space-y-4">
              {selectedProducts.map(product => (
                <div key={product.id} className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-sm text-gray-500">
                      R$ {product.price.toFixed(2)} x {product.quantity}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleQuantityChange(product.id, product.quantity - 1)}
                        className="p-1 rounded-md bg-gray-100 hover:bg-gray-200"
                      >
                        -
                      </button>
                      <span>{product.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(product.id, product.quantity + 1)}
                        className="p-1 rounded-md bg-gray-100 hover:bg-gray-200"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemoveProduct(product.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
              
              <div className="flex items-center justify-between pt-4">
                <div className="text-xl font-bold">
                  Total: R$ {total.toFixed(2)}
                </div>
                <button
                  onClick={handleFinalizeSale}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Finalizar Venda
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 