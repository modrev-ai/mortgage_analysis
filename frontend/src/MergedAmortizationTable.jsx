import { useState, useMemo } from 'react';

/**
 * Merged Amortization Table Component
 * Displays both Standard and Optimal Monthly Strategy amortization schedules side-by-side
 * for comparison of different payment strategies with inline editable lump sum injection
 */

const MergedAmortizationTable = ({ mortgageCalcRef, additiveValue }) => {
    // State for editable lump sums - allows users to add one-time principal payments
    const [editedLumpSums, setEditedLumpSums] = useState({});

    // Memoize the merged data to avoid recalculation on every render
    const mergedData = useMemo(() => {
        if (!mortgageCalcRef || !mortgageCalcRef.generateMergedAmortizationSchedule) {
            return null;
        }

        const result = mortgageCalcRef.generateMergedAmortizationSchedule(additiveValue);
        return result;
    }, [mortgageCalcRef, additiveValue]);

    if (!mergedData || !mergedData.mergedData) {
        return <p style={{ color: 'var(--text-muted)' }}>No merged schedule data available. Please calculate optimal monthly payment first.</p>;
    }

    const { standardTable, optimalTable, mergedData: comparisonData } = mergedData;

    // Calculate totals for display - including lump sum totals
    const getStandardTotals = () => {
        return comparisonData.reduce((acc, row) => ({
            principalPaid: acc.principalPaid + parseFloat(row.standardPrincipal || 0),
            interestPaid: acc.interestPaid + parseFloat(row.standardInterest || 0),
            monthsRemaining: acc.monthsRemaining - 1,
            lumpSumTotal: acc.lumpSumTotal + parseFloat(row.editedLumpSum || 0)
        }), { principalPaid: 0, interestPaid: 0, monthsRemaining: standardTable.length, lumpSumTotal: 0 });
    };

    const getOptimalTotals = () => {
        return comparisonData.reduce((acc, row) => ({
            principalPaid: acc.principalPaid + parseFloat(row.optimalPrincipal || 0),
            interestPaid: acc.interestPaid + parseFloat(row.optimalInterest || 0),
            monthsRemaining: acc.monthsRemaining - 1
        }), { principalPaid: 0, interestPaid: 0, monthsRemaining: optimalTable.length });
    };

    const standardTotals = getStandardTotals();
    const optimalTotals = getOptimalTotals();

    // Calculate overall interest savings
    const totalInterestSaved = standardTotals.interestPaid - optimalTotals.interestPaid;
    const totalTimeSaved = standardTotals.monthsRemaining - optimalTotals.monthsRemaining;
    const totalLumpSums = Math.abs(standardTotals.lumpSumTotal);
    const totalAdditionalPaymentsOptimal = comparisonData.reduce((acc, row) =>
        acc + parseFloat(row.optimalAdditionalPrincipal || 0), 0
    );

    return (
        <div>
            {/* Summary Stats for Merged View */}
            <div className="summary-grid" style={{ marginBottom: '1rem' }}>
                <div className="stat-card">
                    <span className="stat-title">Standard Total Interest</span>
                    <span className="stat-value">${Math.round(standardTotals.interestPaid)}</span>
                    <span className="stat-sub"></span>
                </div>

                <div className="stat-card">
                    <span className="stat-title">Optimal Total Interest</span>
                    <span className="stat-value highlight">${Math.round(optimalTotals.interestPaid)}</span>
                    <span className="stat-sub"></span>
                </div>

                <div className="stat-card">
                    <span className="stat-title">Interest Saved</span>
                    <span className="stat-value highlight" style={{ color: '#27ae60' }}>
                        -${Math.round(totalInterestSaved)}
                    </span>
                    <span className="stat-sub"></span>
                </div>

                <div className="stat-card">
                    <span className="stat-title">Time Saved</span>
                    <span className="stat-value">{totalTimeSaved > 0 ? totalTimeSaved + ' months' : 'Full term'}</span>
                    <span className="stat-sub"></span>
                </div>

                <div className="stat-card">
                    <span className="stat-title">Total Extra Monthly Payments</span>
                    <span className="stat-value">${Math.round(totalAdditionalPaymentsOptimal)}</span>
                    <span className="stat-sub">For optimal schedule</span>
                </div>

                <div className="stat-card">
                    <span className="stat-title">Your Lump Sum Injections</span>
                    <span className="stat-value" style={{ color: '#3b82f6' }}>${totalLumpSums.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span className="stat-sub">Enter in table below to reduce loan faster</span>
                </div>
            </div>

            {/* Comparison Table */}
            <div className="table-container" style={{ overflowX: 'auto' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ width: '60px', fontWeight: 'bold' }}>Month</th>

                            {/* Standard Strategy Columns */}
                            <th style={{ borderBottom: '2px solid var(--border-color)' }}>Standard Strategy</th>
                            <th style={{ borderBottom: '2px solid var(--border-color)' }}>Optimal Strategy</th>

                            {/* Lump Sum Column */}
                            <th style={{ borderBottom: '2px solid var(--border-color)', color: '#3b82f6' }}>Lump Sum Injection</th>

                            {/* Difference Columns */}
                            <th style={{ borderBottom: '2px solid var(--border-color)', color: '#e74c3c' }}>Difference (St - Opt)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {comparisonData.map((row) => (
                            <tr key={row.month} style={editedLumpSums[row.month] && parseFloat(editedLumpSums[row.month]) > 0 ? { backgroundColor: '#f0fdf4', borderLeft: '4px solid #3b82f6' } : {}}>
                                <td style={{ fontWeight: row.month === 1 ? 'bold' : 'normal', textAlign: 'center' }}>
                                    {row.month}
                                </td>

                                {/* Standard Strategy */}
                                <td style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <div style={{ fontSize: '0.85rem' }}>
                                        <div style={{ fontWeight: 'bold' }}>Balance:</div>
                                        ${parseFloat(row.standardBeginningBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </div>
                                </td>

                                {/* Optimal Strategy */}
                                <td style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <div style={{ fontSize: '0.85rem' }}>
                                        <div style={{ fontWeight: 'bold' }}>Balance:</div>
                                        ${parseFloat(row.optimalBeginningBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        {row.optimalAdditionalPrincipal && (
                                            <div style={{ fontSize: '0.75rem', color: '#3498db' }}>
                                                +${parseFloat(row.optimalAdditionalPrincipal).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                            </div>
                                        )}
                                    </div>
                                </td>

                                {/* Lump Sum Injection - INLINE EDITABLE */}
                                <td style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'right', padding: row.month === 1 ? '8px 4px' : '4px 4px' }}>
                                    {editedLumpSums[row.month] && parseFloat(editedLumpSums[row.month]) > 0 ? (
                                        <div className="input-wrapper" style={{ width: '100%' }}>
                                            <span className="input-prefix" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)' }}>$</span>
                                            <input
                                                type="number"
                                                placeholder="-"
                                                value={editedLumpSums[row.month] || ''}
                                                onChange={(e) => {
                                                    const newValue = e.target.value === '' ? '' : parseFloat(e.target.value);
                                                    setEditedLumpSums(prev => ({
                                                        ...prev,
                                                        [row.month]: isNaN(newValue) || newValue < 0 ? '' : newValue
                                                    }));
                                                }}
                                                style={{
                                                    width: '100%',
                                                    padding: '6px 8px',
                                                    paddingLeft: '24px',
                                                    border: '1px solid var(--border-color)',
                                                    borderRadius: '6px',
                                                    fontSize: '0.9rem',
                                                    textAlign: 'right',
                                                    backgroundColor: row.month === 1 ? 'var(--bg-tertiary)' : 'white',
                                                    outline: 'none',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            />
                                        </div>
                                    ) : '-'}
                                </td>

                                {/* Difference */}
                                <td style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'right', fontSize: '0.85rem' }}>
                                    {row.month % 2 === 0 || row.month % 3 === 0 ? (
                                        <span style={{
                                            color: parseFloat(row.standardInterest || 0) - parseFloat(row.optimalInterest || 0) > 0
                                                ? '#27ae60' : 'var(--text-muted)'
                                        }}>
                                            ${(parseFloat(row.standardInterest || 0) - parseFloat(row.optimalInterest || 0)).toFixed(2)}
                                        </span>
                                    ) : (
                                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                                    )}
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
                            <td>
                                <div style={{ fontSize: '0.85rem' }}>
                                    <div>Total Principal: ${parseFloat(standardTotals.principalPaid).toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
                                    <div style={{ color: '#e74c3c', fontWeight: 'bold' }}>Total Interest: ${parseFloat(standardTotals.interestPaid).toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
                                </div>
                            </td>
                            <td>
                                <div style={{ fontSize: '0.85rem' }}>
                                    <div>Total Principal: ${parseFloat(optimalTotals.principalPaid).toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
                                    <div style={{ color: '#27ae60', fontWeight: 'bold' }}>Total Interest: ${parseFloat(optimalTotals.interestPaid).toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
                                </div>
                            </td>
                            <td style={{ color: '#3b82f6', textAlign: 'right' }}>
                                ${totalLumpSums.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                            </td>
                            <td>
                                <div style={{ fontSize: '0.85rem', textAlign: 'right' }}>
                                    <span style={{ color: '#e74c3c' }}>Interest Saved: ${Math.round(totalInterestSaved)}</span>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div style={{
                display: 'flex',
                gap: '1.5rem',
                marginTop: '1rem',
                justifyContent: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '12px', height: '12px', backgroundColor: '#95a7a6', borderRadius: '4px' }}></span>
                    <span className="text-muted">Standard Strategy</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '12px', height: '12px', backgroundColor: '#3498db', borderRadius: '4px' }}></span>
                    <span className="text-muted">Optimal Strategy (Extra Monthly)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '12px', height: '12px', backgroundColor: '#3b82f6', borderRadius: '4px' }}></span>
                    <span className="text-muted">Lump Sum Injection (Editable)</span>
                </div>
            </div>

            {/* Info Box */}
            <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
            }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>How to Use This View</h4>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: '1.6' }}>
                    <li><strong>Standard Strategy:</strong> Regular monthly payments as per original loan agreement</li>
                    <li><strong>Optimal Strategy:</strong> Same payments PLUS an additional ${additiveValue?.toFixed(2) || 0} each month (calculated to save maximum interest)</li>
                    <li><strong>Lump Sum Injection Column:</strong> Click any cell to enter a one-time extra principal payment. This reduces your loan balance faster and saves on future interest</li>
                    <li><strong>Difference Column:</strong> Shows monthly interest savings at each payment (green = you save money)</li>
                    <li style={{ color: '#27ae60', marginTop: '0.5rem' }}>Total Interest Saved: <strong>${Math.round(totalInterestSaved)}</strong></li>
                </ul>
            </div>
        </div>
    );
};

export default MergedAmortizationTable;