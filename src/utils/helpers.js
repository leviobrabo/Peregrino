function getUserRank(daysActive) {
  const ranks = [
    { rank: 'Iniciante', days: 0 },
    { rank: 'Servo', days: 7 },
    { rank: 'Fiel', days: 14 },
    { rank: 'Líder', days: 21 },
    { rank: 'Guerreiro', days: 30 },
    { rank: 'Levita', days: 60 },
    { rank: 'Rei', days: 90 },
    { rank: 'Pastor', days: 100 },
    { rank: 'Discípulo', days: 120 },
    { rank: 'Patriarca', days: 150 },
    { rank: 'Sacerdote', days: 180 },
    { rank: 'Evangelista', days: 210 },
    { rank: 'Bíblico', days: 240 },
    { rank: 'Peregrino', days: 270 },
    { rank: 'Missionário', days: 300 },
    { rank: 'Embaixador de Cristo', days: 400 },
    { rank: 'Expositor da Palavra', days: 500 },
    { rank: 'Conhecedor da Verdade', days: 800 },
    { rank: 'Remido de Deus', days: 900 },
    { rank: 'Vaso de Honra', days: 1000 },
    { rank: 'Teológo', days: 1500 },
  ];
  for (let i = ranks.length - 1; i >= 0; i--) {
    if (daysActive >= ranks[i].days) return ranks[i].rank;
  }
  return 'Iniciante';
}

function formatPrayerTime(hour, minute) {
  const paddedMinute = String(minute).padStart(2, '0');
  return `${hour}:${paddedMinute}`;
}

function splitMessage(text, limit = 1000) {
  if (text.length <= limit) return [text];
  const lines = text.split('\n');
  const chunks = [];
  let current = '';
  for (const line of lines) {
    if ((current.length + line.length + 1) <= limit) {
      current += (current ? '\n' : '') + line;
    } else {
      if (current) chunks.push(current);
      current = line;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function getMonthName(month) {
  const monthNames = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
  ];
  return monthNames[month - 1];
}

function getSmallSuperscriptNumber(number) {
  const superscriptDigits = [
    '⁰', '¹', '²', '³', '⁴',
    '⁵', '⁶', '⁷', '⁸', '⁹',
  ];
  return number.toString().split('').map(d => superscriptDigits[parseInt(d)]).join('');
}

module.exports = { getUserRank, formatPrayerTime, splitMessage, getMonthName, getSmallSuperscriptNumber };
