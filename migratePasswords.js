// migratePasswords.js - Script para migrar senhas existentes
const Firebird = require('node-firebird');
const PasswordEncryptor = require('./passwordEncryptor');

// Configuração do banco (ajuste conforme necessário)
const dbConfig = {
  host: 'localhost',
  port: 3050,
  database: 'SIGECOM_TESTE.FDB', // Ajuste o caminho
  user: 'SYSDBA',
  password: 'masterkey',
  lowercase_keys: false,
  role: null,
  pageSize: 4096
};

const encryptor = new PasswordEncryptor();

// Função para conectar ao banco
function connectDB() {
  return new Promise((resolve, reject) => {
    Firebird.attach(dbConfig, (err, db) => {
      if (err) {
        reject(err);
      } else {
        resolve(db);
      }
    });
  });
}

// Função para buscar todos os usuários
function buscarUsuarios(db) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT CODIGOUSUARIO, LOGIN, SENHA, SENHA_APP 
      FROM USUARIO 
      WHERE DESATIVADO = 'N'
      ORDER BY LOGIN
    `;
    
    db.query(query, [], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

// Função para atualizar senha de um usuário
function atualizarSenha(db, codigoUsuario, senhaCriptografada, senhaAppCriptografada) {
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE USUARIO 
      SET SENHA = ?, SENHA_APP = ? 
      WHERE CODIGOUSUARIO = ?
    `;
    
    db.query(query, [senhaCriptografada, senhaAppCriptografada, codigoUsuario], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

// Função para verificar se uma senha já está criptografada
function jaCriptografada(senha) {
  // Se a senha contém apenas caracteres que podem ser resultado da criptografia
  const caracteresEspeciais = ['Q','W','E','R','T','A','S','D','F','G','Z','X','C','V','B',
                               'Y','U','I','O','P','H','J','K','L','Ç','N','M','!','@','#',
                               '$','%','¨','&','*','(',')','_','+','=','{','}','[',']','?',
                               '/',':',';','>','<'];
  
  // Se todos os caracteres estão na lista de possíveis criptografias, pode já estar criptografada
  return senha && senha.split('').every(char => 
    caracteresEspeciais.includes(char) || !/\d/.test(char)
  );
}

// Função principal de migração
async function migrarSenhas() {
  console.log('=== Script de Migração de Senhas ===\n');
  
  let db;
  try {
    // Conectar ao banco
    console.log('Conectando ao banco de dados...');
    db = await connectDB();
    console.log('✅ Conectado com sucesso!\n');
    
    // Buscar usuários
    console.log('Buscando usuários...');
    const usuarios = await buscarUsuarios(db);
    console.log(`✅ Encontrados ${usuarios.length} usuários\n`);
    
    let migrados = 0;
    let jaMigrados = 0;
    let erros = 0;
    
    // Processar cada usuário
    for (const usuario of usuarios) {
      console.log(`Processando usuário: ${usuario.LOGIN} (ID: ${usuario.CODIGOUSUARIO})`);
      
      try {
        let senhaAtualizada = false;
        let novaSenh = usuario.SENHA;
        let novaSenhaApp = usuario.SENHA_APP;
        
        // Verificar e criptografar SENHA principal
        if (usuario.SENHA && !jaCriptografada(usuario.SENHA)) {
          novaSenh = encryptor.encryptPassword(usuario.SENHA);
          senhaAtualizada = true;
          console.log(`  SENHA: ${usuario.SENHA} -> ${novaSenh}`);
        } else if (usuario.SENHA) {
          console.log(`  SENHA: já criptografada (${usuario.SENHA})`);
        }
        
        // Verificar e criptografar SENHA_APP
        if (usuario.SENHA_APP && !jaCriptografada(usuario.SENHA_APP)) {
          novaSenhaApp = encryptor.encryptPassword(usuario.SENHA_APP);
          senhaAtualizada = true;
          console.log(`  SENHA_APP: ${usuario.SENHA_APP} -> ${novaSenhaApp}`);
        } else if (usuario.SENHA_APP) {
          console.log(`  SENHA_APP: já criptografada (${usuario.SENHA_APP})`);
        }
        
        // Atualizar no banco se necessário
        if (senhaAtualizada) {
          await atualizarSenha(db, usuario.CODIGOUSUARIO, novaSenh, novaSenhaApp);
          console.log(`  ✅ Atualizado no banco`);
          migrados++;
        } else {
          console.log(`  ⏭️  Nenhuma alteração necessária`);
          jaMigrados++;
        }
        
      } catch (error) {
        console.log(`  ❌ Erro: ${error.message}`);
        erros++;
      }
      
      console.log(''); // Linha em branco
    }
    
    // Relatório final
    console.log('=== Relatório Final ===');
    console.log(`Total de usuários: ${usuarios.length}`);
    console.log(`Migrados: ${migrados}`);
    console.log(`Já migrados: ${jaMigrados}`);
    console.log(`Erros: ${erros}`);
    console.log('✅ Migração concluída!');
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
  } finally {
    if (db) {
      db.detach();
      console.log('Conexão fechada.');
    }
  }
}

// Função para modo de teste (não altera o banco)
async function testarMigracao() {
  console.log('=== Modo de Teste - Simulação de Migração ===\n');
  
  let db;
  try {
    db = await connectDB();
    console.log('✅ Conectado com sucesso!\n');
    
    const usuarios = await buscarUsuarios(db);
    console.log(`✅ Encontrados ${usuarios.length} usuários\n`);
    
    for (const usuario of usuarios) {
      console.log(`Usuário: ${usuario.LOGIN}`);
      
      if (usuario.SENHA) {
        if (jaCriptografada(usuario.SENHA)) {
          console.log(`  SENHA: ${usuario.SENHA} (já criptografada)`);
        } else {
          const nova = encryptor.encryptPassword(usuario.SENHA);
          console.log(`  SENHA: ${usuario.SENHA} -> ${nova} (seria atualizada)`);
        }
      }
      
      if (usuario.SENHA_APP) {
        if (jaCriptografada(usuario.SENHA_APP)) {
          console.log(`  SENHA_APP: ${usuario.SENHA_APP} (já criptografada)`);
        } else {
          const nova = encryptor.encryptPassword(usuario.SENHA_APP);
          console.log(`  SENHA_APP: ${usuario.SENHA_APP} -> ${nova} (seria atualizada)`);
        }
      }
      
      console.log('');
    }
    
    console.log('✅ Teste concluído! (Nenhuma alteração foi feita no banco)');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    if (db) {
      db.detach();
    }
  }
}

// Verificar argumentos da linha de comando
const args = process.argv.slice(2);

if (args.includes('--test')) {
  testarMigracao();
} else if (args.includes('--migrate')) {
  migrarSenhas();
} else {
  console.log('=== Script de Migração de Senhas ===');
  console.log('');
  console.log('Uso:');
  console.log('  node migratePasswords.js --test     # Simula a migração (não altera o banco)');
  console.log('  node migratePasswords.js --migrate  # Executa a migração real');
  console.log('');
  console.log('⚠️  IMPORTANTE: Faça backup do banco antes de executar --migrate');
}