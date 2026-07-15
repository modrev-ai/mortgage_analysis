/**
 * Mortgage Calculator - Core loan calculation functions
 * Based on examples: loan_payment_schedule_personal_loan.ipynb and loan_payment_schedule_mortgage.ipynb
 */

class MortgageCalculator {
  constructor() {
    this.principal = 0;
    this.rate = 0;
    this.terms = 0; // Default to 0 - must set before calculations
    this.otherPayments = 0;
    this.optimalKnee = null;
    this.lumpSumInfo = null;
    this.amortizationTable = [];
    this.monthlyPayment = 0;
  }

  /**
   * Set loan parameters and calculate monthly payment
   * @param {number} P - Principal (loan amount)
   * @param {number} r - APR (annual interest rate as decimal, e.g., 0.15 for 15%)
   * @param {number} n - Loan term in months
   * @param {number} O - Other monthly payments (property tax, insurance, HOA, PMI)
   */
  setP(P) {
    this.principal = P;
    return this;
  }

  setR(r) {
    this.rate = r;
    return this;
  }

  setN(n) {
    this.terms = n;
    return this;
  }

  setO(O) {
    this.otherPayments = O;
    return this;
  }

  /**
   * Calculate monthly payment for principal and interest only
   * Formula: M = P[r(1+r)^n] / [(1+r)^n - 1]
   */
  setMonthlyPayment() {
    const r = this.rate / 12;
    const n = this.terms || 1;

    if (r === 0) {
      this.monthlyPayment = this.principal / n;
    } else {
      const numerator = this.principal * r * Math.pow(1 + r, n);
      const denominator = Math.pow(1 + r, n) - 1;
      this.monthlyPayment = numerator / denominator;
    }

    return this.monthlyPayment;
  }

  /**
   * Get monthly payment (including other payments like taxes, insurance, etc.)
   * @returns {number} Monthly payment amount (including other payments)
   */
  getMonthlyPayment() {
    if (!this.monthlyPayment || isNaN(this.monthlyPayment)) {
      this.setMonthlyPayment();
    }
    return this.monthlyPayment + this.otherPayments;
  }

  /**
   * Generate standard amortization table spanning the full loan term
   * @param {number} maxRows - Optional maximum number of rows (for early payoff scenarios)
   * @returns {Array} Array of amortization row objects
   */
  generateStandardAmortizationTable(maxRows = null) {
    const r = this.rate / 12;
    const n = this.terms || 0;

    if (n === 0 || r === 0 && this.principal === 0) {
      return [];
    }

    // Calculate monthly payment first
    const baseMonthlyPayment = this.calculateBaseMonthlyPayment();

    let balance = this.principal;
    const table = [];

    // Determine number of rows to generate
    let numRows = n;
    if (maxRows !== null && maxRows < n) {
      numRows = maxRows;
    }

    for (let i = 1; i <= numRows && balance > 0; i++) {
      const interest = balance * r;
      const principalPayment = Math.min(balance, baseMonthlyPayment - interest);
      balance -= principalPayment;

      table.push({
        month: i,
        payment: parseFloat((baseMonthlyPayment + this.otherPayments).toFixed(2)),
        lumpSum: 0,
        interest: parseFloat(interest.toFixed(2)),
        principalPayment: parseFloat(principalPayment.toFixed(2)),
        balance: Math.max(0, balance)
      });
    }

    return table;
  }

  /**
   * Calculate base monthly payment (principal + interest only, for amortization calculation)
   * @returns {number} Base monthly payment amount
   */
  calculateBaseMonthlyPayment() {
    const r = this.rate / 12;
    const n = this.terms || 1;

    if (r === 0) {
      return this.principal / n;
    }

    const numerator = this.principal * r * Math.pow(1 + r, n);
    const denominator = Math.pow(1 + r, n) - 1;
    return numerator / denominator;
  }

  /**
   * Generate amortization table with extra monthly payment spanning full loan term
   * @param {number} extraPayment - Amount of extra payment each month (0 = none)
   * @returns {Array} Array of amortization row objects
   */
  generateAmortizationTableWithAdditive(extraPayment) {
    const r = this.rate / 12;
    const n = this.terms || 0;

    if (n === 0 || r === 0 && this.principal === 0) {
      return [];
    }

    const baseMonthlyPayment = this.calculateBaseMonthlyPayment();
    let balance = this.principal;
    const table = [];

    // If extra payment is 0, return standard table
    if (extraPayment <= 0) {
      return this.generateStandardAmortizationTable(this.terms);
    }

    let monthCount = 0;

    while (balance > 0 && monthCount < n) {
      monthCount++;
      const interest = balance * r;
      const principalPayment = Math.min(balance, baseMonthlyPayment + extraPayment - interest);
      balance -= principalPayment;

      table.push({
        month: monthCount,
        payment: parseFloat((baseMonthlyPayment + this.otherPayments + extraPayment).toFixed(2)),
        lumpSum: 0,
        interest: parseFloat(interest.toFixed(2)),
        principalPayment: parseFloat(principalPayment.toFixed(2)),
        balance: Math.max(0, balance),
        extraPayment: extraPayment
      });
    }

    return table;
  }

  /**
   * Find optimal knee/elbow point using the elbow detection algorithm
   * Searches for the extra payment amount that provides the best value
   * @param {Array|Range} searchRange - Array of values to test or range specification
   * @returns {object|null} Optimal knee data with extraPayment, interestSaved, etc.
   */
  findOptimalSchedule(searchRange = null) {
    const standardTable = this.generateStandardAmortizationTable();

    if (standardTable.length === 0) {
      return null;
    }

    const results = [];

    // Generate results for each extra payment amount
    if (Array.isArray(searchRange)) {
      for (const extra of searchRange) {
        const extraTable = this.generateAmortizationTableWithAdditive(extra);
        if (!extraTable || extraTable.length === 0) continue;

        const totalInterestStandard = standardTable.reduce((sum, row) =>
          sum + parseFloat(row.interest), 0);
        const totalInterestExtra = extraTable.reduce((sum, row) =>
          sum + parseFloat(row.interest), 0);

        const interestSaved = totalInterestStandard - totalInterestExtra;
        const totalExtraPaid = extra * extraTable.length;

        const valueRatio = extra > 0 ? interestSaved / totalExtraPaid : Infinity;

        results.push({
          extraPayment: extra,
          totalInterestStandard: parseFloat(totalInterestStandard.toFixed(2)),
          totalInterestExtra: parseFloat(totalInterestExtra.toFixed(2)),
          interestSaved: parseFloat(interestSaved.toFixed(2)),
          totalExtraPaid: parseFloat(totalExtraPaid.toFixed(2)),
          valueRatio: valueRatio < Infinity ? valueRatio : 999999,
          reason: extra > 0 && interestSaved > 0 ? `Saves ${interestSaved.toFixed(2)} on ${totalExtraPaid.toFixed(2)} spent` : ''
        });
      }
    } else {
      // Default search range
      const rangeStart = 0;
      const rangeEnd = Math.min(this.principal * 0.6, 5000);
      const step = 100;

      for (let extra = rangeStart; extra <= rangeEnd; extra += step) {
        const extraTable = this.generateAmortizationTableWithAdditive(extra);
        if (!extraTable || extraTable.length === 0) continue;

        const totalInterestStandard = standardTable.reduce((sum, row) =>
          sum + parseFloat(row.interest), 0);
        const totalInterestExtra = extraTable.reduce((sum, row) =>
          sum + parseFloat(row.interest), 0);

        const interestSaved = totalInterestStandard - totalInterestExtra;
        const totalExtraPaid = extra * extraTable.length;
        const valueRatio = extra > 0 ? interestSaved / totalExtraPaid : Infinity;

        results.push({
          extraPayment: extra,
          totalInterestStandard: parseFloat(totalInterestStandard.toFixed(2)),
          totalInterestExtra: parseFloat(totalInterestExtra.toFixed(2)),
          interestSaved: parseFloat(interestSaved.toFixed(2)),
          totalExtraPaid: parseFloat(totalExtraPaid.toFixed(2)),
          valueRatio: valueRatio < Infinity ? valueRatio : 999999,
          reason: extra > 0 && interestSaved > 0 ? `Saves ${interestSaved.toFixed(2)} on ${totalExtraPaid.toFixed(2)} spent` : ''
        });
      }
    }

    // Find elbow point using second derivative
    let bestIndex = 0;
    let maxDrop = -Infinity;

    for (let i = 1; i < results.length - 1; i++) {
      const drop = results[i - 1].valueRatio - results[i].valueRatio;
      if (drop > maxDrop) {
        maxDrop = drop;
        bestIndex = i;
      }
    }

    this.optimalKnee = results[bestIndex] || (results.length > 0 ? results[0] : null);

    return this.optimalKnee;
  }

  /**
   * Generate amortization table with optimal extra payment applied
   * @param {boolean|number} arg1 - If boolean: true uses optimalKnee, false returns standard
   *                                If number: treats as maxRows parameter
   * @param {boolean} showCollapsible - Deprecated, kept for API compatibility
   * @returns {Array} Array of amortization row objects
   */
  generateAmortizationTable(additiveOrMaxRows = null, showCollapsible = false) {
    // Case 1: No arguments or additive is boolean -> use optimal if true
    // Case 2: First arg is a number -> treat as maxRows for early payoff handling
    if (typeof additiveOrMaxRows === 'number' || (!additiveOrMaxRows && showCollapsible !== undefined)) {
      const n = additiveOrMaxRows;
      if (n !== null && n !== undefined && typeof n === 'number') {
        return this.generateStandardAmortizationTable(n);
      }
      return this.generateStandardAmortizationTable();
    }

    // Case 3: First arg is boolean - additive mode
    const useOptimal = additiveOrMaxRows === true;

    if (useOptimal && this.optimalKnee) {
      return this.generateAmortizationTableWithAdditive(this.optimalKnee.extraPayment);
    }

    return this.generateStandardAmortizationTable();
  }

  /**
   * Find the optimal month and amount for a lump sum payment
   * @param {number} searchAmount - Amount range for lump sum calculation (optional)
   * @returns {object|null} Optimal lump sum info with month and amount
   */
  findOptimalLumpSumMonth(searchAmount = null) {
    const r = this.rate / 12;

    if (r === 0 || this.principal <= 0) {
      return null;
    }

    const searchMin = this.principal * 0.1;
    const searchMax = this.principal * 0.9;

    // Try specific amount first if provided and valid
    if (searchAmount && searchAmount > searchMin && searchAmount < searchMax) {
      for (let testMonth = Math.floor(this.terms * 0.3); testMonth <= Math.floor(this.terms * 0.7); testMonth++) {
        const result = this.findBestLumpSumForAmount(searchAmount, testMonth);
        if (result && result.isOptimal) {
          return result;
        }
      }
    }

    // Search for best lump sum across range
    const results = [];

    for (let testMonth = Math.floor(this.terms * 0.25); testMonth <= Math.floor(this.terms * 0.75); testMonth++) {
      for (let testAmount = searchMin; testAmount <= searchMax; testAmount += 1000) {
        const result = this.findBestLumpSumForAmount(testAmount, testMonth);
        if (result && result.isOptimal) {
          results.push(result);
        }
      }
    }

    if (results.length > 0) {
      // Find best interest saved
      const bestIndex = results.reduce((maxIdx, curr, idx, arr) =>
        curr.interestSaved > arr[maxIdx].interestSaved ? idx : maxIdx, 0);

      return { ...results[bestIndex] };
    }

    return null;
  }

  /**
   * Generate amortization table with lump sum payment applied (full term)
   * @param {number} lumpSum - Amount of lump sum payment
   * @param {number} month - Month when to apply lump sum
   * @returns {Array} Array of amortization row objects spanning full loan term
   */
  generateAmortizationTableWithLumpsum(lumpSum, month = null) {
    const standardTable = this.generateStandardAmortizationTable();

    if (standardTable.length === 0) {
      return [];
    }

    // Determine when to apply lump sum
    let applyMonth = month;
    if (!applyMonth || applyMonth <= 0) {
      applyMonth = Math.floor(standardTable.length * 0.5);
    }
    applyMonth = Math.min(Math.max(1, applyMonth), standardTable.length);

    // Check if balance at apply month is greater than lump sum
    const balanceAtApplyMonth = standardTable[applyMonth - 1]?.balance;

    if (balanceAtApplyMonth && balanceAtApplyMonth <= lumpSum) {
      return standardTable;
    }

    // Generate new table with reduced balance after lump sum
    const r = this.rate / 12;
    const baseMonthlyPayment = this.calculateBaseMonthlyPayment();

    // Copy first (applyMonth - 1) rows unchanged
    let result = standardTable.slice(0, applyMonth - 1);

    // Apply reduced balance at the lump sum month
    let newBalance = balanceAtApplyMonth - lumpSum;
    const newRow = {
      month: applyMonth,
      payment: parseFloat((baseMonthlyPayment + this.otherPayments).toFixed(2)),
      lumpSum: parseFloat(lumpSum.toFixed(2)),
      interest: parseFloat((newBalance * r).toFixed(2)),
      principalPayment: parseFloat((newBalance - newBalance * r).toFixed(2)),
      balance: Math.max(0, newBalance)
    };
    result.push(newRow);

    // Generate remaining payments
    for (let i = applyMonth + 1; i <= standardTable.length && newBalance > 0; i++) {
      const interest = newBalance * r;
      let principalPayment = Math.min(newBalance, baseMonthlyPayment - interest);
      newBalance -= principalPayment;

      result.push({
        month: i,
        payment: parseFloat((baseMonthlyPayment + this.otherPayments).toFixed(2)),
        lumpSum: 0,
        interest: parseFloat(interest.toFixed(2)),
        principalPayment: parseFloat(principalPayment.toFixed(2)),
        balance: Math.max(0, newBalance)
      });

      if (newBalance <= 0) {
        break;
      }
    }

    return result;
  }

  /**
   * Find best lump sum for a specific amount and month
   * @param {number} lumpSum - Amount to pay as lump sum
   * @param {number} month - Month when to make payment
   * @returns {object|null} Result object with interest saved and new balance
   */
  findBestLumpSumForAmount(lumpSum, month = null) {
    const standardTable = this.generateStandardAmortizationTable();

    if (standardTable.length === 0) {
      return null;
    }

    // Determine when to apply lump sum
    let applyMonth = month;
    if (!applyMonth || applyMonth <= 0) {
      applyMonth = Math.floor(standardTable.length * 0.5);
    }
    applyMonth = Math.min(Math.max(1, applyMonth), standardTable.length);

    // Check if balance at apply month is greater than lump sum
    const balanceAtApplyMonth = standardTable[applyMonth - 1]?.balance;

    if (!balanceAtApplyMonth || balanceAtApplyMonth <= lumpSum) {
      return null;
    }

    // Generate a custom amortization with the lump sum to calculate interest saved
    const testTable = this.generateAmortizationTableWithLumpsum(lumpSum, applyMonth);

    if (testTable.length === 0) {
      return null;
    }

    const totalInterestStandard = standardTable.reduce((sum, row) =>
      sum + parseFloat(row.interest), 0);
    const totalInterestWithLumpSum = testTable.reduce((sum, row) =>
      sum + parseFloat(row.interest), 0);

    const interestSaved = totalInterestStandard - totalInterestWithLumpSum;
    const timeSavedMonths = Math.max(0, standardTable.length - testTable.length);

    return {
      month: applyMonth,
      lumpSum: parseFloat(lumpSum.toFixed(2)),
      totalInterestStandard: parseFloat(totalInterestStandard.toFixed(2)),
      totalInterestWithLumpSum: parseFloat(totalInterestWithLumpSum.toFixed(2)),
      interestSaved: parseFloat(interestSaved.toFixed(2)),
      timeSavedMonths,
      newBalance: testTable[testTable.length - 1]?.balance || 0,
      originalBalance: balanceAtApplyMonth,
      isOptimal: true
    };
  }

  /**
   * Get lump sum amortization data for display in UI
   * @param {number} month - Month when lump sum is applied
   * @param {number} lumpSum - Amount of lump sum payment
   * @returns {object|null} Lump sum data or null if not applicable
   */
  getLumpSumAmortization(month, lumpSum) {
    const applyMonth = Math.min(month || this.terms || this.principal, this.terms);

    // Generate standard table to find balance at apply month
    const standardTable = this.generateStandardAmortizationTable();

    if (standardTable.length === 0) {
      return null;
    }

    // Find the row corresponding to the apply month (1-indexed)
    let cumulativePrincipal = 0;
    let balanceAtApplyMonth = standardTable[applyMonth - 1]?.balance || 0;

    if (balanceAtApplyMonth <= lumpSum) {
      return null;
    }

    const newBalance = Math.max(0, balanceAtApplyMonth - lumpSum);

    return {
      month: applyMonth,
      lumpSum: parseFloat(lumpSum.toFixed(2)),
      newBalance: parseFloat(newBalance.toFixed(2))
    };
  }

  /**
   * Generate merged amortization schedule showing both standard and optimal monthly strategy side-by-side
   * @param {number} additive - Additional monthly principal payment for optimal strategy (optional)
   * @returns {object|null} Merged schedule data with standard and optimal columns
   */
  generateMergedAmortizationSchedule(additive = null) {
    const standardTable = this.generateStandardAmortizationTable();

    if (standardTable.length === 0) {
      return null;
    }

    // Handle optimal schedule - use additive or optimalKnee
    let optimalTable = [];
    let additiveValue = additive;

    if (additive !== null && typeof additive === 'number' && additive > 0) {
      // Generate new optimal amortization with specified additive amount
      optimalTable = this.generateAmortizationTableWithAdditive(additive);
      additiveValue = additive;
    } else if (this.optimalKnee && (additive === null || additive === undefined)) {
      // Use pre-calculated optimal knee from findOptimalSchedule()
      optimalTable = this.generateAmortizationTableWithAdditive(this.optimalKnee.extraPayment);
      additiveValue = this.optimalKnee.extraPayment;
    } else {
      // No optimal schedule to merge with
      return null;
    }

    // Create merged data structure - each row contains both strategies side-by-side
    const standardLength = standardTable.length;
    const optimalLength = optimalTable.length;
    const maxLength = Math.max(standardLength, optimalLength);

    const mergedData = [];

    for (let i = 0; i < maxLength; i++) {
      // Standard row data (month + 1 for 1-indexing)
      const stdMonth = i + 1;
      const stdRow = standardTable[i] || { balance: 0 };

      // Optimal row data
      const optRow = optimalTable[i] || { balance: 0 };

      mergedData.push({
        month: stdMonth,
        // Standard strategy columns
        standardBeginningBalance: parseFloat(stdRow.balance.toFixed(2)),
        standardTotalMonthly: parseFloat((this.calculateBaseMonthlyPayment() + this.otherPayments).toFixed(2)),
        standardInterest: parseFloat(stdRow.interest?.toFixed(2) || '0'),
        standardPrincipal: parseFloat(stdRow.principalPayment?.toFixed(2) || '0'),
        standardOther: parseFloat(this.otherPayments.toFixed(2)),
        standardEndingBalance: parseFloat(Math.max(0, stdRow.balance).toFixed(2)),
        standardTotalPrincipal: 0, // Would need cumulative tracking
        standardTotalInterest: 0,  // Would need cumulative tracking
        standardPercentPaid: 0,    // Would need cumulative tracking

        // Optimal strategy columns
        optimalBeginningBalance: parseFloat(optRow.balance.toFixed(2)),
        optimalTotalMonthly: parseFloat((this.calculateBaseMonthlyPayment() + this.otherPayments + additiveValue).toFixed(2)),
        optimalInterest: parseFloat(optRow.interest?.toFixed(2) || '0'),
        optimalPrincipal: parseFloat(optRow.principalPayment?.toFixed(2) || '0'),
        optimalAdditionalPrincipal: parseFloat(additiveValue.toFixed(2)),
        optimalEndingBalance: parseFloat(Math.max(0, optRow.balance).toFixed(2)),
        optimalTotalPrincipal: 0, // Would need cumulative tracking
        optimalTotalInterest: 0,  // Would need cumulative tracking
        optimalPercentPaid: 0     // Would need cumulative tracking
      });
    }

    return {
      standardTable,
      optimalTable,
      mergedData
    };
  }

  /**
   * Generate collapsible rows for amortization table (every 20 rows = one group)
   * @param {Array} table - Array of amortization row objects
   * @returns {object|null} Collapsible table data with groups or null if not applicable
   */
  generateCollapsibleTable(table = this.generateStandardAmortizationTable()) {
    const ROWS_PER_GROUP = 20;

    if (table.length === 0) {
      return null;
    }

    const groups = [];
    let currentGroupIndex = 0;

    for (let i = 0; i < table.length; i++) {
      if ((i + 1) % ROWS_PER_GROUP === 0) {
        groups.push({
          groupIndex: ++currentGroupIndex,
          startIndex: i - ROWS_PER_GROUP + 1,
          rows: table.slice(i - ROWS_PER_GROUP + 1, i + 1),
          isOpen: true
        });
      } else if (i === table.length - 1) {
        groups.push({
          groupIndex: ++currentGroupIndex,
          startIndex: i - ROWS_PER_GROUP + 2,
          rows: table.slice(i - ROWS_PER_GROUP + 2),
          isOpen: true
        });
      }
    }

    return {
      groups,
      rowCount: table.length,
      rowsPerGroup: ROWS_PER_GROUP,
      totalGroups: currentGroupIndex
    };
  }
}

export default MortgageCalculator;
