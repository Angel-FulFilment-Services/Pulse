import { eachDayOfInterval, parseISO, isAfter, differenceInYears } from 'date-fns';

// Example minimum wage bands (update as needed)
const MINIMUM_WAGE_BANDS = [
  {
    effectiveFrom: '2025-04-01',
    rates: {
      0: 7.55,    // up to 18
      18: 10.00,  // 18 to 20
      21: 12.21,  // 21+
    },
  },
  {
    effectiveFrom: '2024-04-01',
    rates: {
      0: 7.49,    // up to 18
      18: 8.60,   // 18 to 20
      21: 11.44,  // 21+
    },
  },
  {
    effectiveFrom: '2023-04-01',
    rates: {
      0: 7.49,    // up to 21
      21: 10.18,  // 21 to 22
      23: 10.42,  // 23+
    },
  },
  {
    effectiveFrom: '2022-04-01',
    rates: {
      0: 6.83,    // up to 21
      21: 9.18,   // 21 to 22
      23: 9.50,   // 23+
    },
  },
  {
    effectiveFrom: '2021-04-01',
    rates: {
      0: 6.56,    // up to 21
      21: 8.36,   // 21 to 22
      23: 8.91,   // 23+
    },
  },
];

// Helper to get the correct rate for a given age and date
export function getRateForDate(age, date) {
  // Sort bands by effectiveFrom descending
  const sortedBands = [...MINIMUM_WAGE_BANDS].sort(
    (a, b) => new Date(b.effectiveFrom) - new Date(a.effectiveFrom)
  );
  for (const band of sortedBands) {
    if (isAfter(date, parseISO(band.effectiveFrom)) || +date === +parseISO(band.effectiveFrom)) {
      // Find the highest rate not exceeding the age
      const ages = Object.keys(band.rates)
        .map(Number)
        .sort((a, b) => b - a);
      for (const bandAge of ages) {
        if (age >= bandAge) return band.rates[bandAge];
      }
    }
  }
  return null; // No rate found
}

function toDateSafe(val) {
  return val instanceof Date ? val : parseISO(val);
}

// Main util: returns an array of { date, rate } for each day in the range, or a single rate if constant
export function getMinimumWageForPeriod(age, startDate, endDate) {
  const days = eachDayOfInterval({ start: toDateSafe(startDate), end: toDateSafe(endDate) });
  const rates = days.map(date => ({
    date: date,
    rate: getRateForDate(age, date),
  }));

  // If all rates are the same, return just the rate
  const uniqueRates = Array.from(new Set(rates.map(r => r.rate)));
  if (uniqueRates.length === 1) {
    return uniqueRates[0];
  }
  return rates; // Otherwise, return the array of daily rates
}

// Main util (by DOB): returns an array of { date, rate } for each day in the range, or a single rate if constant
export function getMinimumWageForPeriodByDOB(dob, startDate, endDate) {
  const dobDate = toDateSafe(dob);
  const days = eachDayOfInterval({ start: toDateSafe(startDate), end: toDateSafe(endDate) });
  const rates = days.map(date => {
    const age = differenceInYears(date, dobDate);
    return {
      date: date,
      rate: getRateForDate(age, date),
    };
  });

  // If all rates are the same, return just the rate
  const uniqueRates = Array.from(new Set(rates.map(r => r.rate)));
  if (uniqueRates.length === 1) {
    return uniqueRates[0];
  }
  return rates; // Otherwise, return the array of daily rates
}