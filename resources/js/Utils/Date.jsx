export function getOrdinalSuffix(day) {
  if (day > 3 && day < 21) return 'th'; // covers 11th to 19th
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}