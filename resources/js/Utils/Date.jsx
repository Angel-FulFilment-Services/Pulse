export function getOrdinalSuffix(day) {
  if (day > 3 && day < 21) return 'th'; // covers 11th to 19th
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

function toMidnight(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isValidRange(start, end, min, max) {
  const s = toMidnight(start);
  const e = toMidnight(end);
  const minD = min ? toMidnight(min) : null;
  const maxD = max ? toMidnight(max) : null;

  if (minD && e < minD) return false;
  if (maxD && s > maxD) return false;

  const cs = clampDate(s, minD, maxD);
  const ce = clampDate(e, minD, maxD);
  if (cs > ce) return false;

  return true;
}

function clampDate(date, min, max) {
  const d = toMidnight(date);
  if (min && d < toMidnight(min)) return toMidnight(min);
  if (max && d > toMidnight(max)) return toMidnight(max);
  return d;
}

export function dateSelectorOptions(minDate, maxDate){

  const min = minDate ? toMidnight(new Date(minDate)) : null;
  const max = maxDate ? toMidnight(new Date(maxDate)) : null;
  const today = toMidnight(new Date());
  const yesterday = toMidnight(new Date(today.getTime() - 86400000));
  const weekStart = toMidnight(new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 1));
  const weekEnd = toMidnight(new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 7));
  const lastWeekStart = toMidnight(new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() - 6));
  const lastWeekEnd = toMidnight(new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay()));
  const monthStart = toMidnight(new Date(today.getFullYear(), today.getMonth(), 1));
  const monthEnd = toMidnight(new Date(today.getFullYear(), today.getMonth() + 1, 0));
  const lastMonthStart = toMidnight(new Date(today.getFullYear(), today.getMonth() - 1, 1));
  const lastMonthEnd = toMidnight(new Date(today.getFullYear(), today.getMonth(), 0));
  const past7Start = toMidnight(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6));
  const past30Start = toMidnight(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29));

  // Payroll logic as before
  const payrollStart = (() => {
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    return toMidnight(today.getDate() >= 29
      ? new Date(currentYear, currentMonth, 29)
      : new Date(currentYear, currentMonth - 1, 29));
  })();
  const payrollEnd = (() => {
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    return toMidnight(today.getDate() >= 29
      ? new Date(currentYear, currentMonth + 1, 28)
      : new Date(currentYear, currentMonth, 28));
  })();
  const lastPayrollStart = (() => {
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    return toMidnight(today.getDate() >= 29
      ? new Date(currentYear, currentMonth - 1, 29)
      : new Date(currentYear, currentMonth - 2, 29));
  })();
  const lastPayrollEnd = (() => {
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    return toMidnight(today.getDate() >= 29
      ? new Date(currentYear, currentMonth, 28)
      : new Date(currentYear, currentMonth - 1, 28));
  })();

  // Build shortcuts only if valid
  const shortcuts = {};
  if (isValidRange(today, today, min, max)) {
    shortcuts.today = {
      text: 'Today',
      period: { start: clampDate(today, min, max), end: clampDate(today, min, max) }
    };
  }
  if (isValidRange(yesterday, yesterday, min, max)) {
    shortcuts.yesterday = {
      text: 'Yesterday',
      period: { start: clampDate(yesterday, min, max), end: clampDate(yesterday, min, max) }
    };
  }
  if (isValidRange(weekStart, weekEnd, min, max)) {
    shortcuts.thisWeek = {
      text: "This Week",
      period: { start: clampDate(weekStart, min, max), end: clampDate(weekEnd, min, max) }
    };
  }
  if (isValidRange(lastWeekStart, lastWeekEnd, min, max)) {
    shortcuts.pastWeek = {
      text: "Last Week",
      period: { start: clampDate(lastWeekStart, min, max), end: clampDate(lastWeekEnd, min, max) }
    };
  }
  if (isValidRange(monthStart, monthEnd, min, max)) {
    shortcuts.currentMonth = {
      text: 'This Month',
      period: { start: clampDate(monthStart, min, max), end: clampDate(monthEnd, min, max) }
    };
  }
  if (isValidRange(lastMonthStart, lastMonthEnd, min, max)) {
    shortcuts.pastMonth = {
      text: 'Last Month',
      period: { start: clampDate(lastMonthStart, min, max), end: clampDate(lastMonthEnd, min, max) }
    };
  }
  if (isValidRange(past7Start, today, min, max)) {
    shortcuts.past7days = {
      text: "Last 7 Days",
      period: { start: clampDate(past7Start, min, max), end: clampDate(today, min, max) }
    };
  }
  if (isValidRange(past30Start, today, min, max)) {
    shortcuts.past30days = {
      text: "Last 30 Days",
      period: { start: clampDate(past30Start, min, max), end: clampDate(today, min, max) }
    };
  }
  if (isValidRange(payrollStart, payrollEnd, min, max)) {
    shortcuts.thisPayroll = {
      text: "This Payroll",
      period: { start: clampDate(payrollStart, min, max), end: clampDate(payrollEnd, min, max) }
    };
  }
  if (isValidRange(lastPayrollStart, lastPayrollEnd, min, max)) {
    shortcuts.lastPayroll = {
      text: "Last Payroll",
      period: { start: clampDate(lastPayrollStart, min, max), end: clampDate(lastPayrollEnd, min, max) }
    };
  }

  return shortcuts;
}