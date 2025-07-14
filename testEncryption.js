// testEncryption.js - Teste de Criptografia (PADRÃO CORRETO)
const PasswordEncryptor = require('./passwordEncryptor');

// Instância do encriptador
const encryptor = new PasswordEncryptor();

console.log('=== Teste de Criptografia de Senhas (Padrão 4 chars) ===\n');

// Teste com o exemplo conhecido
console.log('🔍 TESTE COM EXEMPLO CONHECIDO:');
const knownPassword = "012345678901";
const knownEncrypted = ";493=8<8?<?=A@BBCDEGEHHLGLKQIPNVKTQ[MXT`O\\M[Q`P`";

console.log(`Senha original: ${knownPassword}`);
console.log(`Criptografada esperada: ${knownEncrypted}`);

const testEncrypted = encryptor.encryptPassword(knownPassword);
console.log(`Criptografada gerada:   ${testEncrypted}`);
console.log(`✅ Resultado: ${testEncrypted === knownEncrypted ? 'CORRETO' : 'INCORRETO'}`);

if (testEncrypted !== knownEncrypted) {
  console.log('\n📚 APRENDENDO DO EXEMPLO:');
  encryptor.learnFromExample(knownPassword, knownEncrypted);
}

console.log('\n' + '='.repeat(60) + '\n');

// Testes com senhas menores
const testPasswords = [
  '123456',
  '0000',
  '1111',
  '01234',
  'admin123',
  '987654321'
];

testPasswords.forEach(password => {
  const encrypted = encryptor.encryptPassword(password);
  
  console.log(`Senha Original: ${password}`);
  console.log(`Criptografada:  ${encrypted}`);
  console.log(`Tamanho: ${password.length} → ${encrypted.length} chars`);
  console.log(`Verificação: ${encryptor.verifyPassword(password, encrypted) ? 'OK' : 'ERRO'}`);
  
  // Análise da senha criptografada
  const analysis = encryptor.analyzeEncryptedPassword(encrypted);
  console.log(`Análise: ${analysis.estimatedDigits} dígitos estimados`);
  
  if (analysis.chunks.length > 0) {
    console.log('Chunks identificados:');
    analysis.chunks.forEach(chunk => {
      console.log(`  Posição ${chunk.position}: '${chunk.chunk}' (dígito ${chunk.possibleDigit})`);
    });
  }
  
  console.log('---\n');
});

// Teste específico de variação por posição
console.log('=== Teste de Variação por Posição ===\n');
const repeatingDigits = ['0000', '1111', '2222'];

repeatingDigits.forEach(password => {
  const encrypted = encryptor.encryptPassword(password);
  console.log(`Senha: ${password} → ${encrypted}`);
  
  // Mostra como cada posição do mesmo dígito gera chunks diferentes
  for (let i = 0; i < password.length; i++) {
    const digit = password[i];
    const startPos = i * 4;
    const chunk = encrypted.substr(startPos, 4);
    console.log(`  Posição ${i}: '${digit}' → '${chunk}'`);
  }
  console.log('');
});

// Função para testar uma senha específica
function testSpecificPassword(password, expectedEncrypted = null) {
  console.log(`\n=== Teste Específico: "${password}" ===`);
  const encrypted = encryptor.encryptPassword(password);
  console.log(`Original:     ${password}`);
  console.log(`Criptografada: ${encrypted}`);
  
  if (expectedEncrypted) {
    console.log(`Esperada:     ${expectedEncrypted}`);
    console.log(`Correto:      ${encrypted === expectedEncrypted ? 'SIM' : 'NÃO'}`);
  }
  
  console.log(`Verificação:   ${encryptor.verifyPassword(password, encrypted) ? 'OK' : 'ERRO'}`);
  return encrypted;
}

// Testes específicos
testSpecificPassword('012345678901', ';493=8<8?<?=A@BBCDEGEHHLGLKQIPNVKTQ[MXT`O\\M[Q`P`');
testSpecificPassword('123456');
testSpecificPassword('000000');

console.log('\n=== Teste Concluído ===');
console.log('📌 Lembre-se: Cada dígito gera exatamente 4 caracteres');
console.log('📌 O mesmo dígito pode gerar chunks diferentes dependendo da posição');
console.log('📌 Caracteres não numéricos permanecem inalterados');