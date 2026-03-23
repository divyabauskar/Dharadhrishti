/**
 * Utility functions for safe numeric operations and sanitization.
 * Prevents negative values, NaN, and other numeric errors.
 */

/**
 * Ensures a value is a valid, non-negative number.
 * @param {any} val - The value to sanitize.
 * @param {number} defaultValue - The fallback value if sanitization fails (default: 0).
 * @returns {number} - A non-negative number.
 */
export const sanitizeNumber = (val, defaultValue = 0) => {
  const parsed = parseFloat(val);
  if (isNaN(parsed)) return defaultValue;
  return Math.max(0, parsed);
};

/**
 * Calculates total fertilizer required based on acreage and growth stage (DAS).
 * @param {number} acres - Farm size in acres.
 * @param {number} das - Days After Sowing.
 * @returns {number} - Total fertilizer in kg.
 */
export const calculateTotalFertilizer = (acres, das) => {
  const safeAcres = sanitizeNumber(acres);
  let amountPerAcre = 0;

  if (das <= 20) {
    amountPerAcre = 20; // Early Stage
  } else if (das <= 50) {
    amountPerAcre = 30; // Mid Stage
  } else {
    amountPerAcre = 25; // Late Stage
  }

  return parseFloat((safeAcres * amountPerAcre).toFixed(1));
};

/**
 * Calculates total water volume required based on acreage.
 * @param {number} acres - Farm size in acres.
 * @returns {number} - Total water in liters.
 */
export const calculateRequiredWater = (acres) => {
  const safeAcres = sanitizeNumber(acres);
  return Math.round(safeAcres * 100);
};

/**
 * Formats a currency value with non-negative guard.
 * @param {number} amount - The amount in currency.
 * @returns {string} - Formatted currency string.
 */
export const formatCurrency = (amount) => {
  const safeAmount = sanitizeNumber(amount);
  return `₹${safeAmount.toLocaleString('en-IN')}`;
};
