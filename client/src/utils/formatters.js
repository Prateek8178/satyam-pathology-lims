import { format, parseISO, isValid } from 'date-fns';

export const formatDate = (date, fmt = 'dd MMM yyyy') => {
  if (!date) return 'N/A';
  try {
    const d = typeof date === 'string' ? parseISO(date) : new Date(date);
    return isValid(d) ? format(d, fmt) : 'N/A';
  } catch { return 'N/A'; }
};

export const formatDateTime = (date) => formatDate(date, 'dd MMM yyyy, hh:mm a');

export const formatCurrency = (amount, currency = 'INR') => {
  if (amount === null || amount === undefined) return '₹0';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount);
};

export const formatAge = (dob, age) => {
  if (age) return `${age} Yrs`;
  if (!dob) return 'N/A';
  const years = Math.floor((Date.now() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000));
  return `${years} Yrs`;
};

export const truncate = (str, n = 40) => str && str.length > n ? str.substring(0, n) + '...' : str;

export const getInitials = (name) => {
  if (!name) return '??';
  return name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase()).join('');
};
