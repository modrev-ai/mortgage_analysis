import React, { useMemo, useState } from 'react';

/**
 * Standard Amortization Table Component
 * Displays P&I (principal and interest) payment schedule with optional early payoff via lump sums
 */

const StandardAmortizationTable = ({
    loanAmount,
    apr,
    loanTerm,
    otherPayments,
    lastEditedLumpSums,
    setLastEditedLumpSums
}) => {
    const lumpSums = lastEditedLumpSums || {};

    // Tab state - show first tab active
    const [activeTab, setActiveTab] = useState(0);
    const GROUP_SIZE = 100;

    // Memoize the standard table - reactive to all loan parameter changes
    const standardTable = useMemo(() => {
        if (!loanAmount || !apr || !loanTerm) {
            return [];
        }

        let balance = loanAmount;
        const r = apr / 12;
        const monthlyPayment = ((loanAmount * r * Math.pow(1 + r, loanTerm)) / (Math.pow(1 + r, loanTerm) - 1));

        // Build full table with P&I payment each month, including lump sum injections
        const table = [];
        for (let i = 1; i <= loanTerm; i++) {
            // Interest on current balance
            const interest = balance * r;

            // Monthly payment is always P&I (base fixed payment)
            const monthlyPIPayment = monthlyPayment;

            // Lump sum injected this month (extra principal payment)
            const lumpSumVal = parseFloat(lumpSums[i] || 0);

            // Total principal paid = base principal + lump sum
            const basePrincipalPayment = monthlyPIPayment - interest;
            let totalPrincipalPayment = basePrincipalPayment + lumpSumVal;

            // Cap principal payment at current balance
            if (totalPrincipalPayment > balance) {
                totalPrincipalPayment = balance;
            }

            // New balance after this payment
            balance -= totalPrincipalPayment;

            table.push({
                month: i,
                beginningBalance: parseFloat(balance.toFixed(2)),
                monthlyPayment: monthlyPIPayment,
                lumpSum: lumpSumVal,
                interest: parseFloat(interest.toFixed(2)),
                principalPayment: parseFloat(totalPrincipalPayment.toFixed(2)),
                balance: Math.max(0, balance)
            });
        }

        return table;
    }, [loanAmount, apr, loanTerm, otherPayments, lumpSums]);

    // Filter to only show rows with payments (exclude fully paid early scenarios)
    const displayRows = standardTable.filter(row => row.month <= standardTable.length);

    // Check if loan was fully paid early (balance reached 0 before final term)
    const isFullyPaidEarly = standardTable.some(row => row.balance === 0 && row.month < standardTable.length);

    // Group rows into chunks of GROUP_SIZE for tabs
    const groupedRows = useMemo(() => {
        const groups = [];
        for (let i = 0; i < displayRows.length; i += GROUP_SIZE) {
            groups.push(displayRows.slice(i, i + GROUP_SIZE));
        }
        return groups.length > 0 ? groups : [displayRows];
    }, [displayRows]);

    // Calculate base total interest WITHOUT any lump sums for comparison
    const baseTotalInterest = useMemo(() => {
        if (!loanAmount || !apr || !loanTerm) return 0;
        let balance = loanAmount;
        const r = apr / 12;
        const monthlyPayment = ((loanAmount * r * Math.pow(1 + r, loanTerm)) / (Math.pow(1 + r, loanTerm) - 1));
        let totalInterest = 0;
        for (let i = 0; i < loanTerm; i++) {
            const interest = balance * r;
            totalInterest += interest;
            balance -= (monthlyPayment - interest);
            if (balance <= 0) break;
        }
        return totalInterest;
    }, [loanAmount, apr, loanTerm]);

    // Calculate totals for display
    const getTotals = () => {
        let totalPayments = 0;
        let totalInterest = 0;
        let totalPrincipal = 0;
        let lumpsumTotal = 0;

        for (const row of displayRows) {
            if (!row.monthlyPayment) continue;
            totalPayments += parseFloat(row.monthlyPayment?.toFixed(2) || 0);
            totalInterest += parseFloat(row.interest || 0);
            totalPrincipal += parseFloat(row.principalPayment?.toFixed(2) || 0);
            lumpsumTotal += parseFloat(row.lumpSum || 0);
        }

        return {
            totalPayments: parseFloat(totalPayments.toFixed(2)),
            totalInterest: parseFloat(totalInterest.toFixed(2)),
            totalPrincipal: parseFloat(totalPrincipal.toFixed(2)),
            lumpsumTotal: parseFloat(lumpsumTotal.toFixed(2))
        };
    };

    const totals = getTotals();

    const lastRow = displayRows[displayRows.length - 1] || { balance: 0 };
    const isFullyPaid = lastRow.balance === 0;
    const remainingBalance = isFullyPaid ? 0 : parseFloat(lastRow.balance || 0);

    // Calculate reduced months count if early payoff occurred
    const reducedMonths = standardTable.length - displayRows.length;

    // Calculate interest saved due to lump sums
    const interestSaved = Math.max(0, baseTotalInterest - totals.totalInterest);

    return (
        <div>
            {/* Summary Stats */}
            <div className="summary-grid" style={{ marginBottom: '1rem' }}>
                <div className="stat-card">
                    <span className="stat-title">Loan Amount</span>
                    <span className="stat-value">${parseFloat(loanAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="stat-card">
                    <span className="stat-title">APR</span>
                    <span className="stat-value">{(apr * 100).toFixed(2)}%</span>
                </div>

                <div className="stat-card">
                    <span className="stat-title">Term</span>
                    <span className="stat-value">{loanTerm} months</span>
                </div>

                <div className="stat-card">
                    <span className="stat-title">Total Principal</span>
                    <span className="stat-value">${totals.totalPrincipal?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                <div className="stat-card">
                    <span className="stat-title">Total Interest</span>
                    <span className="stat-value highlight">${totals.totalInterest?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                <div className="stat-card">
                    <span className="stat-title">Lump Sum Injections</span>
                    <span className="stat-value highlight" style={{ color: '#3b82f6' }}>${totals.lumpsumTotal?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                {isFullyPaidEarly && (
                    <div className="stat-card" style={{ backgroundColor: '#fef0f0', fontSize: '0.85rem' }}>
                        <span className="stat-title" style={{ fontSize: '0.75rem' }}>Early Payoff Notice</span>
                        <span className="stat-value highlight" style={{ fontSize: '0.85rem' }}>
                            Loan paid off {reducedMonths > 0 ? `in ${displayRows.length} months` : 'early'} with {reducedMonths} month(s) saved. Interest saved: ${interestSaved.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                )}
            </div>

            {/* Tabs */}
            {groupedRows.length > 1 && (
                <div style={{
                    display: 'flex',
                    gap: '4px',
                    marginBottom: '0.5rem',
                    flexWrap: 'wrap'
                }}>
                    {groupedRows.map((group, groupIndex) => {
                        const startMonth = group[0]?.month || 1;
                        const endMonth = group[group.length - 1]?.month || GROUP_SIZE;
                        const isActive = activeTab === groupIndex;
                        return (
                            <button
                                key={`tab-${groupIndex}`}
                                onClick={() => setActiveTab(groupIndex)}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: isActive ? '#3b82f6' : 'var(--bg-secondary)',
                                    color: isActive ? 'white' : 'var(--text-primary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px 6px 0 0',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: isActive ? 'bold' : 'normal',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                Months {startMonth}-{endMonth}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Amortization Table */}
            <div className="table-container" style={{ overflowX: 'auto' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ width: '60px', fontWeight: 'bold' }}>Month</th>
                            <th style={{ borderBottom: '2px solid var(--border-color)' }}>Beginning Balance</th>
                            <th style={{ borderBottom: '2px solid var(--border-color)', color: '#e74c3c' }}>Interest</th>
                            <th style={{ borderBottom: '2px solid var(--border-color)', color: '#27ae60' }}>Principal Paid</th>
                            <th style={{ borderBottom: '2px solid var(--border-color)' }}>Lump Sum Injection</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groupedRows[activeTab]?.map((row) => (
                            <tr key={row.month} style={row.lumpSum > 0 ? { backgroundColor: '#f0fdf4', borderLeft: '4px solid #3b82f6' } : {}}>
                                <td style={{ fontWeight: row.month === 1 ? 'bold' : 'normal', textAlign: 'center' }}>
                                    {row.month}
                                </td>

                                <td style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    ${parseFloat(row.beginningBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </td>

                                <td style={{
                                    borderBottom: '1px solid var(--border-color)',
                                    textAlign: 'right',
                                    color: '#e74c3c'
                                }}>
                                    ${parseFloat(row.interest || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </td>

                                <td style={{
                                    borderBottom: '1px solid var(--border-color)',
                                    textAlign: 'right',
                                    color: '#27ae60'
                                }}>
                                    ${parseFloat(row.principalPayment?.toFixed(2) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </td>

                                <td style={{
                                    borderBottom: '1px solid var(--border-color)',
                                    textAlign: 'center',
                                    padding: '6px 8px'
                                }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                        <input
                                            type="range"
                                            min="0"
                                            max="10000"
                                            step="100"
                                            value={lumpSums[row.month] || 0}
                                            onChange={(e) => {
                                                const newValue = parseInt(e.target.value);
                                                setLastEditedLumpSums(prev => ({
                                                    ...prev,
                                                    [row.month]: newValue === 0 ? '' : newValue
                                                }));
                                            }}
                                            style={{
                                                width: '100%',
                                                height: '6px',
                                                borderRadius: '3px',
                                                appearance: 'none',
                                                backgroundColor: '#e2e8f0',
                                                outline: 'none',
                                                cursor: 'pointer'
                                            }}
                                        />
                                        <span style={{
                                            fontSize: '0.8rem',
                                            fontWeight: lumpSums[row.month] ? 'bold' : 'normal',
                                            color: lumpSums[row.month] ? '#3b82f6' : '#94a3b8',
                                            minWidth: '60px',
                                            textAlign: 'right'
                                        }}>
                                            {lumpSums[row.month] ? `$${parseFloat(lumpSums[row.month]).toLocaleString('en-US')}` : '-'}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {/* Footer row with totals */}
                        <tr className="table-footer" style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            borderTop: '2px solid var(--border-color)',
                            fontWeight: 'bold'
                        }}>
                            <td></td>
                            <td style={{ color: '#e74c3c' }}>
                                ${totals.totalInterest?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ color: '#27ae60' }}>
                                ${totals.totalPrincipal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ color: totals.lumpsumTotal > 0 ? '#3b82f6' : '', fontWeight: totals.lumpsumTotal > 0 ? 'bold' : 'normal' }}>
                                ${totals.lumpsumTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Info Box */}
            <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
            }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>About the Standard Amortization Schedule</h4>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: '1.6' }}>
                    <li><strong>Interest Portion:</strong> Decreases each month as the balance is paid down</li>
                    <li><strong>Principal Portion:</strong> Increases each month as more of your payment goes toward reducing the loan</li>
                    <li><strong>Total Interest:</strong> Total interest paid over the life of the loan (reduced with lump sums)</li>
                    <li><strong>Lump Sum Injection:</strong> Enter extra principal in any month to reduce future interest and shorten term</li>
                    <li><strong>Early Payoff Notice:</strong> Shows months saved if you use lump sums to pay off early</li>
                </ul>
            </div>

        </div>
    );
};

export default StandardAmortizationTable;