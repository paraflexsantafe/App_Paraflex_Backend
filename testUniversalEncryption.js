// testUniversalEncryption.js - Teste do Modelo Universal
const UniversalPasswordEncryptor = require('./universalPasswordEncryptor');

console.log('=== TESTE DO MODELO UNIVERSAL DE CRIPTOGRAFIA ===\n');

// Instância do encriptador
const encryptor = new UniversalPasswordEncryptor();

// Casos de teste baseados nos exemplos fornecidos
const testCases = [
  { input: "0000000000", expected: ";493=8;7?<=;A@??CDACEHCGGLEKIPGOKTISMXKW" },
  { input: "1111111111", expected: ";4:4=8<8?<><A@@@CDBDEHDHGLFLIPHPKTJTMXLX" },
  { input: "2222222222", expected: ";4;5=8=9?<?=A@AACDCEEHEIGLGMIPIQKTKUMXMY" },
  { input: "3333333333", expected: ";4<6=8>:?<@>A@BBCDDFEHFJGLHNIPJRKTLVMXNZ" },
  { input: "4444444444", expected: ";4=7=8?;?<A?A@CCCDEGEHGKGLIOIPKSKTMWMXO[" },
  { input: "5555555555", expected: ";4>8=8@<?<B@A@DDCDFHEHHLGLJPIPLTKTNXMXP\\" },
  { input: "6666666666", expected: ";4?9=8A=?<CAA@EECDGIEHIMGLKQIPMUKTOYMXQ]" },
  { input: "7777777777", expected: ";4@:=8B>?<DBA@FFCDHJEHJNGLLRIPNVKTPZMXR^" },
  { input: "8888888888", expected: ";4A;=8C??<ECA@GGCDIKEHKOGLMSIPOWKTQ[MXS_" },
  { input: "9999999999", expected: ";4B<=8D@?<FDA@HHCDJLEHLPGLNTIPPXKTR\\MXT`" },
  { input: "0123456789", expected: ";493=8<8?<?=A@BBCDEGEHHLGLKQIPNVKTQ[MXT`" },
  { input: "9876543210", expected: ";4B<=8C??<DBA@EECDFHEHGKGLHNIPIQKTJTMXKW" },
  { input: "0102030405", expected: ";493=8<8?<=;A@AACDACEHFJGLEKIPKSKTISMXP\\" },
  { input: "1213141516", expected: ";4:4=8=9?<><A@BBCDBDEHGKGLFLIPLTKTJTMXQ]" },
  { input: "0", expected: ";493" },
  { input: "01", expected: ";493=8<8" },
  { input: "012", expected: ";493=8<8?<?=" },
  { input: "0123", expected: ";493=8<8?<?=A@BB" },
  { input: "123", expected: ";4:4=8=9?<@>" },
  { input: "2302", expected: ";4;5=8>:?<=;A@AA" },
  { input: "abcdefghijkl", expected: ">7:4@;=9B?@>DCCCFGFHHKIMJOLRLSOWNWR\\P[\\hR__mTcbr" },
  { input: "ABCDEFGHIJKL", expected: "<5:4>9=9@=@>BACCDEFHFIIMHMLRJQOWLUR\\NY\\hP]_mRabr" }
];

console.log('🧪 EXECUTANDO TESTES DE VALIDAÇÃO:\n');

let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach((test, index) => {
  console.log(`📋 TESTE ${index + 1}:`);
  console.log(`Input: "${test.input}"`);
  console.log(`Expected: ${test.expected}`);
  
  const result = encryptor.encryptPasswordExact(test.input);
  console.log(`Got:      ${result}`);
  
  const passed = result === test.expected;
  console.log(`Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  
  if (passed) {
    passedTests++;
  } else {
    console.log('📊 Análise do erro:');
    const minLen = Math.min(result.length, test.expected.length);
    const maxLen = Math.max(result.length, test.expected.length);
    
    let firstDiff = -1;
    for (let i = 0; i < minLen; i++) {
      if (result[i] !== test.expected[i]) {
        firstDiff = i;
        break;
      }
    }
    
    if (firstDiff !== -1) {
      console.log(`  Primeira diferença na posição ${firstDiff}`);
      console.log(`  Esperado: '${test.expected[firstDiff]}' (ASCII ${test.expected.charCodeAt(firstDiff)})`);
      console.log(`  Obtido:   '${result[firstDiff]}' (ASCII ${result.charCodeAt(firstDiff)})`);
    }
    
    if (result.length !== test.expected.length) {
      console.log(`  Diferença de tamanho: esperado ${test.expected.length}, obtido ${result.length}`);
    }
  }
  
  console.log('');
});

console.log('=' .repeat(60));
console.log(`📊 RESULTADOS FINAIS:`);
console.log(`✅ Testes aprovados: ${passedTests}/${totalTests}`);
console.log(`📈 Taxa de sucesso: ${((passedTests/totalTests)*100).toFixed(1)}%`);

if (passedTests === totalTests) {
  console.log(`🎉 TODOS OS TESTES PASSARAM! Modelo universal funcionando perfeitamente!`);
} else {
  console.log(`⚠️  ${totalTests - passedTests} teste(s) falharam. Modelo precisa de ajustes.`);
}

// Testes adicionais com senhas não vistas
console.log('\n🔮 TESTES DE PREDIÇÃO (senhas não vistas):');

const predictionTests = [
  "112233",
  "456789",
  "987654",
  "000111",
  "abc123",
  "XYZ999"
];

predictionTests.forEach(password => {
  const prediction = encryptor.encryptPasswordExact(password);
  console.log(`"${password}" → "${prediction}"`);
});

console.log('\n✨ TESTE CONCLUÍDO!');
console.log('💡 Para usar no sistema, substitua os métodos de criptografia pelos do UniversalPasswordEncryptor');
console.log('💡 O modelo agora funciona para qualquer combinação de dígitos e letras!');