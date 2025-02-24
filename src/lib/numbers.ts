export function convertNumberToWords(num: number, lang: 'sr' | 'en' = 'sr'): string {
  if (lang === 'en') {
    // Implement English conversion logic
  }

  // Enhanced Serbian conversion
  const ones = ['', 'jedan', 'dva', 'tri', 'četiri', 'pet', 'šest', 'sedam', 'osam', 'devet'];
  const teens = ['deset', 'jedanaest', 'dvanaest', 'trinaest', 'četrnaest', 'petnaest', 'šesnaest', 'sedamnaest', 'osamnaest', 'devetnaest'];
  const tens = ['', 'deset', 'dvadeset', 'trideset', 'četrdeset', 'pedeset', 'šezdeset', 'sedamdeset', 'osamdeset', 'devedeset'];
  const hundreds = ['', 'sto', 'dvesta', 'trista', 'četiristo', 'petsto', 'šesto', 'sedamsto', 'osamsto', 'devetsto'];

  if (num === 0) return 'nula evra';

  let result = '';

  // Thousands
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    result += (thousands === 1 ? 'hiljadu' : `${convertNumberToWords(thousands)} hiljada`);
    num %= 1000;
    if (num > 0) result += ' ';
  }

  // Hundreds
  result += hundreds[Math.floor(num / 100)];
  num %= 100;

  // Tens and ones
  if (num > 0) {
    if (result.length > 0) result += ' ';
    if (num >= 10 && num <= 19) {
      result += teens[num - 10];
    } else {
      result += tens[Math.floor(num / 10)];
      if (num % 10 > 0) {
        result += ' ' + ones[num % 10];
      }
    }
  }

  return result + ' evra';
}
