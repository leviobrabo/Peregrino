const {
  getUserRank,
  formatPrayerTime,
  splitMessage,
  getMonthName,
  getSmallSuperscriptNumber,
} = require('../src/utils/helpers');

describe('getUserRank', () => {
  test('retorna Iniciante para 0 dias', () => {
    expect(getUserRank(0)).toBe('Iniciante');
  });

  test('retorna Servo a partir de 7 dias', () => {
    expect(getUserRank(7)).toBe('Servo');
    expect(getUserRank(13)).toBe('Servo');
  });

  test('retorna Fiel a partir de 14 dias', () => {
    expect(getUserRank(14)).toBe('Fiel');
  });

  test('retorna Guerreiro a partir de 30 dias', () => {
    expect(getUserRank(30)).toBe('Guerreiro');
  });

  test('retorna Rei a partir de 90 dias', () => {
    expect(getUserRank(90)).toBe('Rei');
  });

  test('retorna Expositor da Palavra a partir de 500 dias', () => {
    expect(getUserRank(500)).toBe('Expositor da Palavra');
  });

  test('retorna Teológo a partir de 1500 dias', () => {
    expect(getUserRank(1500)).toBe('Teológo');
    expect(getUserRank(9999)).toBe('Teológo');
  });

  test('retorna Iniciante para dias negativos', () => {
    expect(getUserRank(-1)).toBe('Iniciante');
  });
});

describe('formatPrayerTime', () => {
  test('formata minutos com padding', () => {
    expect(formatPrayerTime(8, 5)).toBe('8:05');
    expect(formatPrayerTime(21, 0)).toBe('21:00');
  });

  test('não adiciona padding desnecessário', () => {
    expect(formatPrayerTime(10, 30)).toBe('10:30');
    expect(formatPrayerTime(0, 15)).toBe('0:15');
  });
});

describe('splitMessage', () => {
  test('retorna array com uma string se texto curto', () => {
    const result = splitMessage('Texto curto');
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('Texto curto');
  });

  test('não divide texto exatamente no limite', () => {
    const text = 'a'.repeat(1000);
    const result = splitMessage(text);
    expect(result).toHaveLength(1);
  });

  test('divide texto longo em múltiplos chunks', () => {
    const lines = [];
    for (let i = 0; i < 20; i++) lines.push('a'.repeat(100));
    const text = lines.join('\n');
    const result = splitMessage(text, 1000);
    expect(result.length).toBeGreaterThan(1);
    result.forEach(chunk => expect(chunk.length).toBeLessThanOrEqual(1000));
  });

  test('preserva todo o conteúdo após split', () => {
    const lines = [];
    for (let i = 0; i < 20; i++) lines.push(`Linha ${i}: ${'x'.repeat(80)}`);
    const text = lines.join('\n');
    const result = splitMessage(text, 500);
    const rejoined = result.join('\n');
    expect(rejoined).toBe(text);
  });

  test('respeita limit customizado', () => {
    const text = 'linha1\nlinha2\nlinha3\nlinha4\nlinha5';
    const result = splitMessage(text, 15);
    result.forEach(chunk => expect(chunk.length).toBeLessThanOrEqual(15));
  });
});

describe('getMonthName', () => {
  test('retorna janeiro para mês 1', () => {
    expect(getMonthName(1)).toBe('janeiro');
  });

  test('retorna dezembro para mês 12', () => {
    expect(getMonthName(12)).toBe('dezembro');
  });

  test('retorna todos os meses corretamente', () => {
    const expected = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
    ];
    expected.forEach((name, i) => {
      expect(getMonthName(i + 1)).toBe(name);
    });
  });
});

describe('getSmallSuperscriptNumber', () => {
  test('converte dígito único', () => {
    expect(getSmallSuperscriptNumber(1)).toBe('¹');
    expect(getSmallSuperscriptNumber(0)).toBe('⁰');
    expect(getSmallSuperscriptNumber(9)).toBe('⁹');
  });

  test('converte número com múltiplos dígitos', () => {
    expect(getSmallSuperscriptNumber(12)).toBe('¹²');
    expect(getSmallSuperscriptNumber(100)).toBe('¹⁰⁰');
  });
});
