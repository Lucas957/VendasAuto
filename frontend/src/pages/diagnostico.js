import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { getApiUrl, updateApiUrl, resetApiUrl } from '../config';

export default function Diagnostico() {
  const [apiUrl, setApiUrl] = useState('');
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [networkInfo, setNetworkInfo] = useState({
    online: false,
    type: 'desconhecido'
  });
  const [showCopyText, setShowCopyText] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState({
    platform: 'desconhecido',
    isMobile: false,
    browser: 'desconhecido',
    screenSize: 'desconhecido'
  });
  const [newApiUrl, setNewApiUrl] = useState('');
  const [currentApiUrl, setCurrentApiUrl] = useState('');
  const [ipAddress, setIpAddress] = useState('192.168.165.181');
  const [showApiUrlForm, setShowApiUrlForm] = useState(false);

  useEffect(() => {
    // Obter a URL da API usando a função centralizada
    const url = getApiUrl();
    console.log('Diagnóstico usando API em:', url);
    setApiUrl(url);
    setNewApiUrl(url); // Preencher o campo de edição com a URL atual
    
    // Verificar status da rede
    setNetworkInfo({
      online: navigator.onLine,
      type: getConnectionType()
    });

    // Obter informações do dispositivo
    detectDeviceInfo();

    // Adicionar listeners para mudanças no status da rede
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, []);

  const detectDeviceInfo = () => {
    const ua = navigator.userAgent;
    const platform = navigator.platform || 'desconhecido';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    
    let browser = 'desconhecido';
    if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
    else if (ua.indexOf('Safari') > -1) browser = 'Safari';
    else if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
    else if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident') > -1) browser = 'Internet Explorer';
    else if (ua.indexOf('Edge') > -1) browser = 'Edge';
    
    const screenSize = `${window.screen.width}x${window.screen.height}`;
    
    setDeviceInfo({
      platform,
      isMobile,
      browser,
      screenSize
    });
  };

  const getConnectionType = () => {
    // Tenta obter o tipo de conexão se disponível
    if (navigator.connection) {
      return navigator.connection.effectiveType || 'desconhecido';
    }
    return 'não disponível';
  };

  const updateNetworkStatus = () => {
    setNetworkInfo({
      online: navigator.onLine,
      type: getConnectionType()
    });
  };

  const runTests = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    // Teste 1: Verificar se a URL da API está definida
    addTestResult('Verificando configuração da API', 
      apiUrl ? 'Sucesso' : 'Falha', 
      `URL configurada: ${apiUrl || 'não definida'}`
    );

    // Teste 1.1: Verificar se a URL da API está usando IP em vez de localhost
    const isUsingLocalhost = apiUrl.includes('localhost');
    addTestResult('Verificando se a URL usa IP em vez de localhost',
      !isUsingLocalhost ? 'Sucesso' : 'Falha',
      isUsingLocalhost 
        ? 'A URL está usando "localhost" que só funciona no mesmo dispositivo. Use o IP da rede local.'
        : `A URL está usando IP (${apiUrl}) que permite acesso de outros dispositivos.`
    );

    // Teste 2: Verificar conexão com a internet
    addTestResult('Verificando conexão com a internet', 
      networkInfo.online ? 'Sucesso' : 'Falha', 
      `Status: ${networkInfo.online ? 'Online' : 'Offline'}, Tipo: ${networkInfo.type}`
    );

    // Teste 3: Verificar se o dispositivo é compatível
    const compatibilityIssues = [];
    if (deviceInfo.browser === 'Internet Explorer') compatibilityIssues.push('Navegador Internet Explorer não é totalmente compatível');
    if (!window.fetch) compatibilityIssues.push('API Fetch não suportada');
    if (!window.localStorage) compatibilityIssues.push('LocalStorage não suportado');
    
    addTestResult('Verificando compatibilidade do dispositivo',
      compatibilityIssues.length === 0 ? 'Sucesso' : 'Aviso',
      compatibilityIssues.length === 0 
        ? `Dispositivo compatível: ${deviceInfo.browser} em ${deviceInfo.platform}`
        : `Problemas de compatibilidade detectados: ${compatibilityIssues.join(', ')}`
    );

    // Teste 4: Ping na API (endpoint de saúde)
    try {
      const startTime = Date.now();
      const response = await axios.get(`${apiUrl}/api/health`, { timeout: 5000 });
      const endTime = Date.now();
      const pingTime = endTime - startTime;
      
      // Verificar status do WhatsApp
      const whatsappStatus = response.data.whatsapp === 'connected' ? 'Conectado' : 'Desconectado';
      
      addTestResult('Ping na API (endpoint /api/health)', 
        'Sucesso', 
        `Tempo de resposta: ${pingTime}ms, WhatsApp: ${whatsappStatus}`
      );
    } catch (error) {
      addTestResult('Ping na API (endpoint /api/health)', 
        'Falha', 
        `Erro: ${error.message}, Código: ${error.code || 'N/A'}`
      );
      
      // Teste alternativo: tentar o endpoint de clientes
      try {
        const startTime = Date.now();
        await axios.get(`${apiUrl}/api/clients`, { timeout: 5000 });
        const endTime = Date.now();
        addTestResult('Ping na API (endpoint /api/clients)', 
          'Sucesso', 
          `Tempo de resposta: ${endTime - startTime}ms`
        );
      } catch (error) {
        addTestResult('Ping na API (endpoint /api/clients)', 
          'Falha', 
          `Erro: ${error.message}, Código: ${error.code || 'N/A'}`
        );
      }
    }

    // Teste 5: Verificar CORS
    try {
      const response = await fetch(`${apiUrl}/api/clients`, {
        method: 'OPTIONS',
        headers: {
          'Origin': window.location.origin
        }
      });
      const corsHeaders = {
        'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
      };
      addTestResult('Verificando configuração CORS', 
        corsHeaders['Access-Control-Allow-Origin'] ? 'Sucesso' : 'Aviso', 
        `Headers CORS: ${JSON.stringify(corsHeaders)}`
      );
    } catch (error) {
      addTestResult('Verificando configuração CORS', 
        'Falha', 
        `Erro: ${error.message}`
      );
    }

    // Teste 6: Verificar bloqueadores
    try {
      const hasAdBlocker = await detectAdBlocker();
      addTestResult('Verificando bloqueadores de conteúdo',
        hasAdBlocker ? 'Aviso' : 'Sucesso',
        hasAdBlocker 
          ? 'Possível bloqueador de anúncios detectado. Isso pode interferir nas requisições.'
          : 'Nenhum bloqueador de conteúdo detectado.'
      );
    } catch (error) {
      addTestResult('Verificando bloqueadores de conteúdo',
        'Aviso',
        `Não foi possível verificar bloqueadores: ${error.message}`
      );
    }

    // Teste 7: Verificar permissões
    try {
      let permissionsStatus = 'Não verificado';
      
      if (navigator.permissions) {
        try {
          const clipboardRead = await navigator.permissions.query({name: 'clipboard-read'});
          const clipboardWrite = await navigator.permissions.query({name: 'clipboard-write'});
          
          permissionsStatus = `Clipboard: Leitura (${clipboardRead.state}), Escrita (${clipboardWrite.state})`;
        } catch (e) {
          permissionsStatus = `Erro ao verificar permissões: ${e.message}`;
        }
      }
      
      addTestResult('Verificando permissões do navegador',
        'Informativo',
        permissionsStatus
      );
    } catch (error) {
      addTestResult('Verificando permissões do navegador',
        'Informativo',
        `Não foi possível verificar permissões: ${error.message}`
      );
    }

    setIsLoading(false);
  };

  const detectAdBlocker = () => {
    return new Promise((resolve) => {
      // Cria um elemento bait que bloqueadores de anúncios geralmente bloqueiam
      const bait = document.createElement('div');
      bait.setAttribute('class', 'ads ad adsbox doubleclick ad-placement carbon-ads');
      bait.setAttribute('style', 'height: 1px; width: 1px; position: absolute; left: -999px; top: -999px;');
      document.body.appendChild(bait);
      
      // Verifica se o elemento foi bloqueado
      setTimeout(() => {
        const isBlocked = bait.offsetHeight === 0 || 
                         bait.offsetWidth === 0 || 
                         bait.style.display === 'none' ||
                         bait.style.visibility === 'hidden';
        
        document.body.removeChild(bait);
        resolve(isBlocked);
      }, 100);
    });
  };

  const addTestResult = (name, status, details) => {
    setTestResults(prev => [...prev, { name, status, details }]);
  };

  const copyResults = async () => {
    try {
      if (testResults.length === 0) return;
      
      const text = testResults.map(r => 
        `${r.name}: ${r.status}\n${r.details}`
      ).join('\n\n');
      
      // Tentativa 1: usando clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        alert('Resultados copiados para a área de transferência!');
        return;
      }
      
      // Tentativa 2: método alternativo usando elemento temporário
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        alert('Resultados copiados para a área de transferência!');
      } else {
        alert('Não foi possível copiar automaticamente. Por favor, selecione e copie o texto manualmente.');
        // Mostrar texto em uma área que pode ser selecionada manualmente
        setShowCopyText(text);
      }
    } catch (err) {
      console.error('Erro ao copiar:', err);
      alert('Erro ao copiar: ' + err.message);
    }
  };

  const handleUpdateApiUrl = () => {
    if (!newApiUrl) return;
    
    // Verificar se a URL é válida
    try {
      new URL(newApiUrl);
      
      // Usar a função centralizada para atualizar a URL
      updateApiUrl(newApiUrl);
      
      // Atualizar o estado
      setApiUrl(newApiUrl);
      
      // Fechar o formulário
      setShowApiUrlForm(false);
      
      // Mostrar mensagem de sucesso
      alert(`URL da API atualizada para: ${newApiUrl}\nRecarregue a página para aplicar as mudanças.`);
      
      // Recarregar a página para aplicar as mudanças
      window.location.reload();
    } catch (e) {
      alert('URL inválida. Por favor, insira uma URL completa (ex: http://192.168.165.181:3000)');
    }
  };

  const handleResetApiUrl = () => {
    if (confirm('Tem certeza que deseja restaurar a URL da API para o padrão?')) {
      // Usar a função centralizada para resetar a URL
      resetApiUrl();
      
      // Mostrar mensagem de sucesso
      alert('URL da API restaurada para o padrão. A página será recarregada.');
      
      // Recarregar a página para aplicar as mudanças
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Diagnóstico de Conexão</h1>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Informações do Sistema</h2>
          <div className="bg-gray-50 p-4 rounded border">
            <div className="flex justify-between items-center mb-2">
              <p><strong>URL da API:</strong> {apiUrl}</p>
              <div>
                <button 
                  onClick={() => setShowApiUrlForm(!showApiUrlForm)}
                  className="text-blue-500 text-sm underline mr-2"
                >
                  {showApiUrlForm ? 'Cancelar' : 'Alterar URL'}
                </button>
                <button 
                  onClick={handleResetApiUrl}
                  className="text-red-500 text-sm underline"
                >
                  Restaurar Padrão
                </button>
              </div>
            </div>
            
            {showApiUrlForm && (
              <div className="mt-2 mb-4 p-3 border rounded bg-white">
                <p className="text-sm mb-2">Insira o endereço IP do servidor:</p>
                <div className="flex">
                  <input
                    type="text"
                    value={newApiUrl}
                    onChange={(e) => setNewApiUrl(e.target.value)}
                    placeholder="http://192.168.15.6:3000"
                    className="flex-1 p-2 border rounded-l text-sm"
                  />
                  <button
                    onClick={handleUpdateApiUrl}
                    className="bg-blue-500 text-white px-3 py-2 rounded-r text-sm"
                  >
                    Salvar
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Esta configuração será salva no seu navegador.
                </p>
              </div>
            )}
            
            <p><strong>Status da Rede:</strong> {networkInfo.online ? 'Online' : 'Offline'}</p>
            <p><strong>Tipo de Conexão:</strong> {networkInfo.type}</p>
            <p><strong>Dispositivo:</strong> {deviceInfo.platform} ({deviceInfo.isMobile ? 'Mobile' : 'Desktop'})</p>
            <p><strong>Navegador:</strong> {deviceInfo.browser}</p>
            <p><strong>Resolução de Tela:</strong> {deviceInfo.screenSize}</p>
            <p><strong>User Agent:</strong> {navigator.userAgent}</p>
          </div>
        </div>

        <button 
          onClick={runTests}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded mb-6 disabled:opacity-50"
        >
          {isLoading ? 'Executando testes...' : 'Executar Testes de Diagnóstico'}
        </button>

        {testResults.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Resultados dos Testes</h2>
            <div className="border rounded overflow-hidden">
              {testResults.map((result, index) => (
                <div 
                  key={index} 
                  className={`p-3 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b last:border-b-0`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{result.name}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      result.status === 'Sucesso' ? 'bg-green-100 text-green-800' : 
                      result.status === 'Aviso' ? 'bg-yellow-100 text-yellow-800' : 
                      result.status === 'Informativo' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {result.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{result.details}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Solução de Problemas Comuns</h2>
          <div className="bg-blue-50 p-4 rounded border border-blue-200">
            <h3 className="font-medium text-blue-800 mb-2">Erro de Conexão com a API</h3>
            <p className="mb-2">Se você está tendo problemas para conectar à API, verifique:</p>
            <ol className="list-decimal pl-5 mb-3">
              <li className="mb-1">Se o servidor está rodando (verifique no terminal do computador)</li>
              <li className="mb-1">Se você está na mesma rede Wi-Fi que o servidor</li>
              <li className="mb-1">Se o IP configurado no arquivo <code>.env.local</code> está correto</li>
              <li className="mb-1">Se o firewall do computador permite conexões na porta 3000</li>
            </ol>
            
            <h3 className="font-medium text-blue-800 mb-2">Como descobrir o IP correto:</h3>
            <p className="mb-2">No computador onde o servidor está rodando, abra o terminal e digite:</p>
            <div className="bg-gray-800 text-white p-2 rounded mb-3 overflow-x-auto">
              <code>ipconfig</code> (Windows) ou <code>ifconfig</code> (Linux/Mac)
            </div>
            <p>Procure pelo endereço IPv4 da sua rede Wi-Fi (geralmente começa com 192.168.x.x)</p>
            
            <h3 className="font-medium text-blue-800 mt-3 mb-2">Teste rápido de conexão:</h3>
            <p>Abra o navegador do seu celular e tente acessar:</p>
            <div className="bg-gray-800 text-white p-2 rounded mb-2 overflow-x-auto">
              <code>{apiUrl}/api/health</code>
            </div>
            <p>Se aparecer uma resposta JSON, a conexão está funcionando.</p>
          </div>
        </div>

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h2 className="text-xl font-semibold text-yellow-800 mb-4">Solução de Problemas de Conexão</h2>
          <p className="mb-2">Se você estiver tendo problemas para conectar seu dispositivo móvel ao sistema, siga estas etapas:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Certifique-se de que seu dispositivo móvel está na mesma rede Wi-Fi que este computador.</li>
            <li>Verifique se o servidor está rodando corretamente (deve mostrar "Conectado" acima).</li>
            <li>
              Tente acessar o sistema usando o IP da rede local: 
              <span className="font-mono bg-gray-100 px-1 rounded">{ipAddress}:3000</span> no navegador do seu dispositivo móvel.
            </li>
            <li>Se estiver usando o IP correto e ainda não conseguir conectar, verifique as configurações de firewall do Windows.</li>
            <li>
              Você pode tentar atualizar a URL da API usando o formulário abaixo para usar o IP correto: 
              <span className="font-mono bg-gray-100 px-1 rounded">http://{ipAddress}:3000</span>
            </li>
          </ol>
        </div>

        {showCopyText && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Copie o texto abaixo manualmente:</h2>
            <div className="bg-gray-50 p-4 rounded border overflow-auto max-h-60">
              <pre className="whitespace-pre-wrap">{showCopyText}</pre>
            </div>
            <button 
              onClick={() => setShowCopyText(null)}
              className="mt-2 bg-gray-500 text-white px-4 py-2 rounded"
            >
              Fechar
            </button>
          </div>
        )}

        <div className="flex justify-between">
          <Link href="/" className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded">
            Voltar para Página Inicial
          </Link>
          
          <button 
            onClick={copyResults}
            className={`bg-gray-700 hover:bg-gray-800 text-white font-medium py-2 px-4 rounded ${testResults.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={testResults.length === 0}
          >
            Copiar Resultados
          </button>
        </div>
      </div>
    </div>
  );
} 