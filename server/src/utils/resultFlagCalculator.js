const { RESULT_FLAG } = require('../config/constants');

const calculateFlag = (parameter, numericValue, gender = 'Male', age = 30) => {
  if (parameter.resultType !== 'numeric' || numericValue === null || numericValue === undefined) {
    return RESULT_FLAG.NORMAL;
  }

  const val = parseFloat(numericValue);
  if (isNaN(val)) return RESULT_FLAG.NORMAL;

  // Critical range takes priority
  if (parameter.criticalLow !== undefined && parameter.criticalLow !== null && val < parameter.criticalLow) return RESULT_FLAG.CRITICAL;
  if (parameter.criticalHigh !== undefined && parameter.criticalHigh !== null && val > parameter.criticalHigh) return RESULT_FLAG.CRITICAL;

  // Select range based on age/gender
  let range;
  if (age < 18) {
    range = parameter.childRange;
  } else if (gender === 'Female') {
    range = parameter.femaleRange || parameter.maleRange;
  } else {
    range = parameter.maleRange;
  }

  if (!range || (range.low === undefined && range.high === undefined)) return RESULT_FLAG.NORMAL;

  if (range.low !== undefined && range.low !== null && val < range.low) return RESULT_FLAG.LOW;
  if (range.high !== undefined && range.high !== null && val > range.high) return RESULT_FLAG.HIGH;

  return RESULT_FLAG.NORMAL;
};

const formatReferenceRange = (parameter, gender, age) => {
  let range;
  if (age < 18) range = parameter.childRange;
  else if (gender === 'Female') range = parameter.femaleRange || parameter.maleRange;
  else range = parameter.maleRange;
  
  if (!range || (!range.low && !range.high)) return 'N/A';
  const unit = parameter.unit ? ` ${parameter.unit}` : '';
  if (range.low !== undefined && range.high !== undefined) return `${range.low} - ${range.high}${unit}`;
  if (range.low !== undefined) return `> ${range.low}${unit}`;
  if (range.high !== undefined) return `< ${range.high}${unit}`;
  return 'N/A';
};

module.exports = { calculateFlag, formatReferenceRange };
