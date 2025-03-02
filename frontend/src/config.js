// Configuração global da aplicação
const getApiUrl = () => {
  // Verificar se há uma URL salva no localStorage
  if (typeof window !== 'undefined') {
    const savedUrl = localStorage.getItem('override_api_url');
    if (savedUrl) return savedUrl;
  }

  // Usar a URL do ambiente ou o IP padrão
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  
  // IP atual da rede
  const currentIp = '192.168.165.181';
  
  // Se a URL do ambiente estiver definida e não contiver o IP antigo ou localhost
  if (envUrl && !envUrl.includes('192.168.15.6') && !envUrl.includes('localhost')) {
    return envUrl;
  }
  
  // Caso contrário, usar o IP atual
  return `http://${currentIp}:3000`;
};

// Função para atualizar a URL da API
const updateApiUrl = (newUrl) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('override_api_url', newUrl);
  }
};

// Função para resetar a URL da API
const resetApiUrl = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('override_api_url');
  }
};

// Exportar as funções
export { getApiUrl, updateApiUrl, resetApiUrl }; 