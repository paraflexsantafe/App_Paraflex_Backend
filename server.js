const express = require('express');
const cors = require('cors');
const Firebird = require('node-firebird');
const UniversalPasswordEncryptor = require('./universalPasswordEncryptor');

const app = express();
const PORT = 3000;

// Adicionar ao server.js - Sistema de Auto-Update

const fs = require('fs');
const path = require('path');

// Configuração de versões
const APP_CONFIG = {
  currentVersion: "1.0.3+2",
  minRequiredVersion: "1.0.0",
  updateRequired: false,
  downloadUrl: "http://192.168.50.2:3000/download/paraflex-latest.apk",
  releaseNotes: "Inclusão de código de barras"
};

// 🏢 CONFIGURAÇÃO DA EMPRESA
const CODIGO_EMPRESA = 1; // 🎯 Empresa padrão para busca de produtos

// Rota para verificar versão
app.get('/api/version', (req, res) => {
  const clientVersion = req.query.version || "0.0.0";
  
  const versionInfo = {
    serverVersion: APP_CONFIG.currentVersion,
    clientVersion: clientVersion,
    updateAvailable: isUpdateAvailable(clientVersion, APP_CONFIG.currentVersion),
    updateRequired: isUpdateRequired(clientVersion, APP_CONFIG.minRequiredVersion),
    downloadUrl: APP_CONFIG.downloadUrl,
    releaseNotes: APP_CONFIG.releaseNotes,
    timestamp: new Date().toISOString()
  };
  
  console.log(`Verificação de versão: Cliente ${clientVersion} vs Servidor ${APP_CONFIG.currentVersion}`);
  
  res.json(versionInfo);
});

// Rota para download do APK
app.get('/download/paraflex-latest.apk', (req, res) => {
  const apkPath = path.join(__dirname, 'releases', 'paraflex-latest.apk');
  
  if (fs.existsSync(apkPath)) {
    console.log('Download de APK solicitado');
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="paraflex-latest.apk"');
    res.download(apkPath);
  } else {
    res.status(404).json({ error: 'APK não encontrado' });
  }
});

// Rota para fazer upload de nova versão (para administradores)
app.post('/api/admin/upload-apk', (req, res) => {
  // Implementar upload de APK e atualização de versão
  // Por segurança, implementar autenticação de admin aqui
  res.json({ message: 'Upload de APK implementar conforme necessário' });
});

// Funções auxiliares
function isUpdateAvailable(clientVersion, serverVersion) {
  return compareVersions(serverVersion, clientVersion) > 0;
}

function isUpdateRequired(clientVersion, minVersion) {
  return compareVersions(minVersion, clientVersion) > 0;
}

function compareVersions(version1, version2) {
  const v1parts = version1.split('.').map(Number);
  const v2parts = version2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
    const v1part = v1parts[i] || 0;
    const v2part = v2parts[i] || 0;
    
    if (v1part > v2part) return 1;
    if (v1part < v2part) return -1;
  }
  
  return 0;
}

// 🔧 FUNÇÃO PARA FORMATAR DATA CORRETAMENTE
function formatarDataPromocao(data) {
  if (!data) return null;
  
  try {
    // Se já é uma string no formato correto, retorna
    if (typeof data === 'string') {
      // Se tem formato brasileiro DD/MM/YYYY, retorna como está
      if (data.match(/^\d{2}\/\d{2}\/\d{4}/)) {
        return data.split(' ')[0]; // Remove horário se houver
      }
      // Se tem formato ISO, converte
      if (data.includes('T') || data.includes('-')) {
        const dataObj = new Date(data);
        return formatarDataBrasileira(dataObj);
      }
      return data;
    }
    
    // Se é Date object
    if (data instanceof Date) {
      return formatarDataBrasileira(data);
    }
    
    // Tenta converter para Date
    const dataObj = new Date(data);
    if (!isNaN(dataObj.getTime())) {
      return formatarDataBrasileira(dataObj);
    }
    
    return data;
  } catch (e) {
    console.error('Erro ao formatar data:', e);
    return data;
  }
}

// 🔧 FUNÇÃO AUXILIAR PARA FORMATAR NO PADRÃO BRASILEIRO
function formatarDataBrasileira(data) {
  if (!data || isNaN(data.getTime())) return null;
  
  // Ajusta para timezone local do Brasil (UTC-3)
  const offset = data.getTimezoneOffset();
  const localDate = new Date(data.getTime() - (offset * 60 * 1000));
  
  const dia = localDate.getDate().toString().padStart(2, '0');
  const mes = (localDate.getMonth() + 1).toString().padStart(2, '0');
  const ano = localDate.getFullYear();
  
  return `${dia}/${mes}/${ano}`;
}

// 🎯 FUNÇÃO PARA VERIFICAR SE PROMOÇÃO ESTÁ ATIVA
function verificarPromocaoAtiva(dataInicio, dataFim, precoPromocao) {
  if (!dataInicio || !dataFim || !precoPromocao) {
    return false;
  }
  
  try {
    const agora = new Date();
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    
    let inicioPromocao, fimPromocao;
    
    // Converte datas de início e fim
    if (typeof dataInicio === 'string') {
      inicioPromocao = new Date(dataInicio);
    } else {
      inicioPromocao = dataInicio;
    }
    
    if (typeof dataFim === 'string') {
      fimPromocao = new Date(dataFim);
    } else {
      fimPromocao = dataFim;
    }
    
    // Ajusta para comparar apenas datas (sem horário)
    const inicioPromocaoData = new Date(inicioPromocao.getFullYear(), inicioPromocao.getMonth(), inicioPromocao.getDate());
    const fimPromocaoData = new Date(fimPromocao.getFullYear(), fimPromocao.getMonth(), fimPromocao.getDate());
    
    const promocaoAtiva = hoje >= inicioPromocaoData && hoje <= fimPromocaoData;
    
    console.log(`📅 Verificação de promoção:`);
    console.log(`   Hoje: ${hoje.toDateString()}`);
    console.log(`   Início: ${inicioPromocaoData.toDateString()}`);
    console.log(`   Fim: ${fimPromocaoData.toDateString()}`);
    console.log(`   Ativa: ${promocaoAtiva}`);
    
    return promocaoAtiva;
  } catch (e) {
    console.error('Erro ao verificar promoção:', e);
    return false;
  }
}

// Criar pasta de releases se não existir
const releasesDir = path.join(__dirname, 'releases');
if (!fs.existsSync(releasesDir)) {
  fs.mkdirSync(releasesDir);
  console.log('📁 Pasta releases criada');
}

// Instância do criptografador universal
const passwordEncryptor = new UniversalPasswordEncryptor();

// Pool de conexões para múltiplos usuários
const pool = Firebird.pool(5, {
  host: 'localhost', // ou IP do seu servidor
  port: 3050,
  //database: 'C://SIGECOM//SIGECOM_TESTE.FDB', // caminho para o banco de teste
  database: 'C://SIGECOM//SIGECOM.FDB', // caminho para o banco em produção
  user: 'SYSDBA',
  password: 'masterkey',
  lowercase_keys: false,
  role: null,
  pageSize: 4096
});

app.use(cors());
app.use(express.json());

// Middleware para logging (útil para debug)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Função para obter conexão do pool
function getConnection() {
  return new Promise((resolve, reject) => {
    pool.get((err, db) => {
      if (err) {
        reject(err);
      } else {
        resolve(db);
      }
    });
  });
}

// Rota de login com criptografia universal
app.post('/api/login', async (req, res) => {
  const { usuario, senha } = req.body;

  // Lista de usuários bloqueados
  const usuariosBloqueados = ['PARAFLEX', 'SISTEMA', 'PARCEIRO'];
  
  // Verificar se o usuário está bloqueado
  if (usuariosBloqueados.includes(usuario.toUpperCase())) {
    return res.status(401).json({ 
      success: false, 
      message: 'Usuário não encontrado ou desativado' 
    });
  }
  
  try {
    const db = await getConnection();
    
    // Primeiro busca o usuário
    const queryUser = `
      SELECT U.CODIGOUSUARIO, U.LOGIN, U.SENHA, U.SENHA_APP, U.DESATIVADO 
      FROM USUARIO U 
      WHERE U.LOGIN = ? AND U.DESATIVADO = 'N'
    `;
    
    db.query(queryUser, [usuario], (err, result) => {
      db.detach();
      
      if (err) {
        console.error('Erro na consulta de login:', err);
        return res.status(500).json({ error: 'Erro na consulta' });
      }
      
      if (result.length > 0) {
        const user = result[0];
        const senhaArmazenada = user.SENHA;
        const senhaAppArmazenada = user.SENHA_APP;
        
        // Criptografa a senha digitada usando modelo universal
        const senhaCriptografada = passwordEncryptor.encryptPasswordExact(senha);
        
        console.log('Debug Login (Modelo Universal):');
        console.log('Usuário:', usuario);
        console.log('Senha digitada:', senha);
        console.log('Senha criptografada:', senhaCriptografada);
        console.log('Senha no banco:', senhaArmazenada);
        console.log('Senha app no banco:', senhaAppArmazenada);
        
        // Verifica se a senha criptografada corresponde à armazenada
        const senhaCorreta = (
          senhaCriptografada === senhaArmazenada || 
          senhaCriptografada === senhaAppArmazenada ||
          senha === senhaArmazenada || // Fallback para senhas não criptografadas
          senha === senhaAppArmazenada
        );
        
        if (senhaCorreta) {
          res.json({ 
            success: true, 
            message: 'Login realizado com sucesso',
            user: {
              codigo: user.CODIGOUSUARIO,
              login: user.LOGIN
            }
          });
        } else {
          console.log('Senha incorreta para usuário:', usuario);
          res.status(401).json({ 
            success: false, 
            message: 'Usuário ou senha incorretos' 
          });
        }
      } else {
        console.log('Usuário não encontrado:', usuario);
        res.status(401).json({ 
          success: false, 
          message: 'Usuário não encontrado ou desativado' 
        });
      }
    });
    
  } catch (error) {
    console.error('Erro de conexão:', error);
    res.status(500).json({ error: 'Erro de conexão com banco' });
  }
});

/**
 * Função para processar termo de busca
 * Substitui espaços por % apenas no backend
 */
function processarTermoBusca(termo) {
  if (!termo || typeof termo !== 'string') {
    return '';
  }
  
  // Remove espaços extras e substitui espaços por %
  return termo.trim().replace(/\s+/g, '%');
}

// 🏢 Rota para buscar produtos (FILTRADA POR EMPRESA)
app.get('/api/produtos/buscar', async (req, res) => {
  const { termo } = req.query;
  
  if (!termo || termo.trim() === '') {
    return res.status(400).json({ error: 'Termo de busca é obrigatório' });
  }
  
  try {
    const db = await getConnection();
    
    // Processa o termo de busca - substitui espaços por %
    const termoProcessado = processarTermoBusca(termo);
    
    console.log(`Busca original: "${termo}" -> Processado: "${termoProcessado}"`);
    
    // Busca otimizada com JOIN nas tabelas corretas
    const query = `
      SELECT FIRST 50
        P.CODIGOPRODUTO,
        P.CODIGOINTERNO,
        P.CODIGOBARRAS,
        PB.NOME,
        M.MARCA,
        PU.NOMEUN as UNIDADE,
        PE.PRECOCUSTO,
        PETP.PRECO_VENDA
      FROM PRODUTO P
      INNER JOIN PRODUTO_BASE PB ON P.CODIGOBASEPRODUTO = PB.CODIGOBASEPRODUTO
      INNER JOIN PRODUTO_ESTOQUE PE ON P.CODIGOPRODUTO = PE.CODIGOPRODUTO
      LEFT JOIN MARCA M ON PB.CODIGOMARCA = M.CODIGOMARCA
      LEFT JOIN PRODUTO_UN PU ON PB.CODIGOUN = PU.CODIGOUN
      LEFT JOIN PRODUTO_ESTOQUE_TABELA_PRECO PETP ON PE.CODIGOMERCADORIA = PETP.CODIGO_MERCADORIA
      WHERE P.DESATIVADO = 'N'
        AND PE.CODIGOEMPRESA = ${CODIGO_EMPRESA}
        AND (
          UPPER(P.CODIGOPRODUTO) LIKE UPPER('%${termoProcessado}%') 
          OR UPPER(P.CODIGOINTERNO) LIKE UPPER('%${termoProcessado}%')
          OR UPPER(PB.NOME) LIKE UPPER('%${termoProcessado}%')
          OR P.CODIGOBARRAS LIKE '%${termoProcessado}%'
        )
      ORDER BY PB.NOME
    `;
    
    db.query(query, [], (err, result) => {
      db.detach();
      
      if (err) {
        console.error('Erro na busca de produtos:', err);
        return res.status(500).json({ error: 'Erro na busca' });
      }
      
      // Formata os resultados
      const produtos = result.map(produto => ({
        CODIGO: produto.CODIGOPRODUTO,
        CODIGO_INTERNO: produto.CODIGOINTERNO,
        NOME: produto.NOME,
        MARCA: produto.MARCA || 'Sem marca',
        UNIDADE: produto.UNIDADE || 'UN',
        VALOR: produto.PRECO_VENDA || produto.PRECOCUSTO || 0,
        CODIGO_BARRAS: produto.CODIGOBARRAS
      }));
      
      console.log(`Encontrados ${produtos.length} produtos para termo: "${termo}"`);
      
      res.json(produtos);
    });
    
  } catch (error) {
    console.error('Erro de conexão:', error);
    res.status(500).json({ error: 'Erro de conexão com banco' });
  }
});

// 🏢 Rota para buscar produto por código de barras (FILTRADA POR EMPRESA)
app.get('/api/produtos/barcode/:codigo', async (req, res) => {
  const { codigo } = req.params;
  
  try {
    const db = await getConnection();
    
    // 🎯 Query com filtro OBRIGATÓRIO por empresa
    const query = `
      SELECT 
        P.CODIGOPRODUTO,
        P.CODIGOINTERNO,
        P.CODIGOBARRAS,
        PB.NOME,
        M.MARCA,
        PU.NOMEUN as UNIDADE,
        PE.PRECOCUSTO,
        PETP.PRECO_VENDA
      FROM PRODUTO P
      INNER JOIN PRODUTO_BASE PB ON P.CODIGOBASEPRODUTO = PB.CODIGOBASEPRODUTO
      INNER JOIN PRODUTO_ESTOQUE PE ON P.CODIGOPRODUTO = PE.CODIGOPRODUTO
      LEFT JOIN MARCA M ON PB.CODIGOMARCA = M.CODIGOMARCA
      LEFT JOIN PRODUTO_UN PU ON PB.CODIGOUN = PU.CODIGOUN
      LEFT JOIN PRODUTO_ESTOQUE_TABELA_PRECO PETP ON PE.CODIGOMERCADORIA = PETP.CODIGO_MERCADORIA
      WHERE P.CODIGOBARRAS = ? 
        AND P.DESATIVADO = 'N'
        AND PE.CODIGOEMPRESA = ?
    `;
    
    console.log(`🔍 Buscando produto por código de barras "${codigo}" na empresa ${CODIGO_EMPRESA}`);
    
    db.query(query, [codigo, CODIGO_EMPRESA], (err, result) => {
      db.detach();
      
      if (err) {
        console.error('Erro na busca por código de barras:', err);
        return res.status(500).json({ error: 'Erro na busca' });
      }
      
      if (result.length > 0) {
        const produto = result[0];
        const produtoFormatado = {
          CODIGO: produto.CODIGOPRODUTO,
          CODIGO_INTERNO: produto.CODIGOINTERNO,
          NOME: produto.NOME,
          MARCA: produto.MARCA || 'Sem marca',
          UNIDADE: produto.UNIDADE || 'UN',
          VALOR: produto.PRECO_VENDA || produto.PRECOCUSTO || 0,
          CODIGO_BARRAS: produto.CODIGOBARRAS
        };
        console.log(`✅ Produto encontrado na empresa ${CODIGO_EMPRESA}: ${produto.NOME}`);
        res.json(produtoFormatado);
      } else {
        console.log(`❌ Produto com código de barras "${codigo}" não encontrado na empresa ${CODIGO_EMPRESA}`);
        res.status(404).json({ error: 'Produto não encontrado na empresa' });
      }
    });
    
  } catch (error) {
    console.error('Erro de conexão:', error);
    res.status(500).json({ error: 'Erro de conexão com banco' });
  }
});

// 🔧 ROTA CORRIGIDA PARA DETALHES DO PRODUTO COM FORMATAÇÃO DE DATA
app.get('/api/produtos/:codigo', async (req, res) => {
  const { codigo } = req.params;
  
  try {
    const db = await getConnection();
    
    // Query com dados de promoção
    const query = `
      SELECT 
        P.CODIGOPRODUTO,
        P.CODIGOINTERNO,
        P.CODIGOBARRAS,
        P.PESO,
        P.LOCAL,
        PB.NOME,
        PB.REFERENCIA,
        PB.DESCRICAO,
        M.MARCA,
        PU.NOMEUN as UNIDADE,
        PE.PRECOCUSTO,
        PE.DATA_INICIO_PROMOCAO,
        PE.DATA_FIM_PROMOCAO,
        PE.PRECO_VENDA_PROMOCAO,
        PETP.PRECO_VENDA,
        PE.ESTOQUE
      FROM PRODUTO P
      INNER JOIN PRODUTO_BASE PB ON P.CODIGOBASEPRODUTO = PB.CODIGOBASEPRODUTO
      INNER JOIN PRODUTO_ESTOQUE PE ON P.CODIGOPRODUTO = PE.CODIGOPRODUTO
      LEFT JOIN MARCA M ON PB.CODIGOMARCA = M.CODIGOMARCA
      LEFT JOIN PRODUTO_UN PU ON PB.CODIGOUN = PU.CODIGOUN
      LEFT JOIN PRODUTO_ESTOQUE_TABELA_PRECO PETP ON PE.CODIGOMERCADORIA = PETP.CODIGO_MERCADORIA
      WHERE P.CODIGOPRODUTO = ? 
        AND P.DESATIVADO = 'N'
        AND PE.CODIGOEMPRESA = ?
    `;
    
    console.log(`🔍 Buscando detalhes do produto código "${codigo}" na empresa ${CODIGO_EMPRESA}`);
    
    db.query(query, [codigo, CODIGO_EMPRESA], (err, result) => {
      db.detach();
      
      if (err) {
        console.error('Erro na busca de produto:', err);
        return res.status(500).json({ error: 'Erro na busca' });
      }
      
      if (result.length > 0) {
        const produto = result[0];
        const precoVenda = produto.PRECO_VENDA || produto.PRECOCUSTO || 0;
        
        // 🎯 VERIFICAÇÃO DE PROMOÇÃO ATIVA COM CORREÇÃO DE DATA
        const promocaoAtiva = verificarPromocaoAtiva(
          produto.DATA_INICIO_PROMOCAO,
          produto.DATA_FIM_PROMOCAO,
          produto.PRECO_VENDA_PROMOCAO
        );
        
        // Define preços baseado na promoção
        const precoAtual = promocaoAtiva ? produto.PRECO_VENDA_PROMOCAO : precoVenda;
        
        const produtoCompleto = {
          CODIGO: produto.CODIGOPRODUTO,
          CODIGO_INTERNO: produto.CODIGOINTERNO,
          NOME: produto.NOME,
          REFERENCIA: produto.REFERENCIA,
          DESCRICAO: produto.DESCRICAO,
          MARCA: produto.MARCA || 'Sem marca',
          UNIDADE: produto.UNIDADE || 'UN',
          VALOR: precoAtual,
          VALOR_VISTA: (precoAtual * 0.9).toFixed(2), // 10% desconto
          CODIGO_BARRAS: produto.CODIGOBARRAS,
          PESO: produto.PESO,
          LOCAL: produto.LOCAL,
          ESTOQUE: produto.ESTOQUE || 0,
          
          // 🔧 DADOS DE PROMOÇÃO FORMATADOS CORRETAMENTE
          PROMOCAO_ATIVA: promocaoAtiva,
          DATA_INICIO_PROMOCAO: formatarDataPromocao(produto.DATA_INICIO_PROMOCAO),
          DATA_FIM_PROMOCAO: formatarDataPromocao(produto.DATA_FIM_PROMOCAO),
          PRECO_PROMOCIONAL: promocaoAtiva ? produto.PRECO_VENDA_PROMOCAO : null,
          PRECO_NORMAL: precoVenda,
          
          // Campos de compatibilidade (mantidos para não quebrar frontend existente)
          EM_PROMOCAO: promocaoAtiva,
          VALOR_ORIGINAL: precoVenda,
          VALOR_VISTA_ORIGINAL: (precoVenda * 0.9).toFixed(2),
          PRECO_VENDA_PROMOCAO: produto.PRECO_VENDA_PROMOCAO
        };
        
        console.log(`✅ Detalhes do produto encontrados na empresa ${CODIGO_EMPRESA}: ${produto.NOME}`);
        console.log(`📅 Promoção: ${promocaoAtiva ? 'ATIVA' : 'INATIVA'} - Fim: ${formatarDataPromocao(produto.DATA_FIM_PROMOCAO)}`);
        
        res.json(produtoCompleto);
      } else {
        console.log(`❌ Produto código "${codigo}" não encontrado na empresa ${CODIGO_EMPRESA}`);
        res.status(404).json({ error: 'Produto não encontrado na empresa' });
      }
    });
    
  } catch (error) {
    console.error('Erro de conexão:', error);
    res.status(500).json({ error: 'Erro de conexão com banco' });
  }
});

// Rota para atualizar código de barras do produto
app.put('/api/produtos/:codigo/codigo-barras', async (req, res) => {
  const { codigo } = req.params;
  const { codigoBarras } = req.body;
  
  if (!codigoBarras || codigoBarras.trim() === '') {
    return res.status(400).json({ error: 'Código de barras é obrigatório' });
  }
  
  try {
    const db = await getConnection();
    
    // Primeiro verifica se o produto existe
    const checkQuery = `
      SELECT CODIGOPRODUTO 
      FROM PRODUTO 
      WHERE CODIGOPRODUTO = ? AND DESATIVADO = 'N'
    `;
    
    db.query(checkQuery, [codigo], (err, checkResult) => {
      if (err) {
        db.detach();
        console.error('Erro ao verificar produto:', err);
        return res.status(500).json({ error: 'Erro ao verificar produto' });
      }
      
      if (checkResult.length === 0) {
        db.detach();
        return res.status(404).json({ error: 'Produto não encontrado' });
      }
      
      // Verifica se o código de barras já existe em outro produto
      const duplicateQuery = `
        SELECT CODIGOPRODUTO 
        FROM PRODUTO 
        WHERE CODIGOBARRAS = ? AND CODIGOPRODUTO != ? AND DESATIVADO = 'N'
      `;
      
      db.query(duplicateQuery, [codigoBarras.trim(), codigo], (err, duplicateResult) => {
        if (err) {
          db.detach();
          console.error('Erro ao verificar duplicata:', err);
          return res.status(500).json({ error: 'Erro ao verificar código de barras' });
        }
        
        if (duplicateResult.length > 0) {
          db.detach();
          return res.status(409).json({ 
            error: 'Este código de barras já está sendo usado por outro produto' 
          });
        }
        
        // Atualiza o código de barras
        const updateQuery = `
          UPDATE PRODUTO 
          SET CODIGOBARRAS = ? 
          WHERE CODIGOPRODUTO = ?
        `;
        
        db.query(updateQuery, [codigoBarras.trim(), codigo], (err, updateResult) => {
          db.detach();
          
          if (err) {
            console.error('Erro ao atualizar código de barras:', err);
            return res.status(500).json({ error: 'Erro ao atualizar código de barras' });
          }
          
          console.log(`Código de barras atualizado: Produto ${codigo} -> ${codigoBarras}`);
          
          res.json({
            success: true,
            message: 'Código de barras atualizado com sucesso',
            codigoProduto: codigo,
            codigoBarras: codigoBarras.trim()
          });
        });
      });
    });
    
  } catch (error) {
    console.error('Erro de conexão:', error);
    res.status(500).json({ error: 'Erro de conexão com banco' });
  }
});

// Rota de teste para verificar se a API está funcionando
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'API Paraflex funcionando!', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    encryption: 'Universal Model Active',
    empresa_filtro: CODIGO_EMPRESA // 🏢 Mostra qual empresa está sendo filtrada
  });
});

// Rota de teste para criptografia
app.post('/api/test-encryption', (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }
  
  try {
    const encrypted = passwordEncryptor.encryptPasswordExact(password);
    res.json({
      original: password,
      encrypted: encrypted,
      model: 'Universal'
    });
  } catch (error) {
    res.status(500).json({ error: 'Encryption error' });
  }
});

// Tratamento de erro para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Tratamento global de erros
app.use((err, req, res, next) => {
  console.error('Erro interno:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor Paraflex rodando na porta ${PORT}`);
  console.log(`📊 Teste a API em: http://localhost:${PORT}/api/status`);
  console.log(`🔍 Pool de conexões configurado para múltiplos usuários`);
  console.log(`🔐 Modelo Universal de Criptografia ativo`);
  console.log(`🏢 Filtro de empresa ativo: CODIGOEMPRESA = ${CODIGO_EMPRESA}`); // 🎯 Log do filtro
  console.log(`🔧 Sistema de formatação de data corrigido`); // 🎯 Novo log
  
  // Teste da criptografia na inicialização
  //console.log('\n=== TESTE DE CRIPTOGRAFIA ===');
  //passwordEncryptor.verifyImplementation();
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔴 Encerrando servidor...');
  pool.destroy();
  process.exit(0);
});

module.exports = app;