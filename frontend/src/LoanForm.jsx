import { useState } from 'react';

const LoanForm = ({ loanAmount, setLoanAmount, loanTerm, setLoanTerm, apr, setApr, otherPayments, setOtherPayments }) => {
    return (
        <section className="glass-panel">
            <h2>Loan Details</h2>

            <div className="summary-grid">
                <div className="form-group">
                    <label htmlFor="loanAmount">Loan Amount (USD)</label>
                    <div className="input-wrapper has-prefix">
                        <span className="input-prefix">$</span>
                        <input
                            type="number"
                            id="loanAmount"
                            value={loanAmount}
                            onChange={(e) => setLoanAmount(Number(e.target.value))}
                            min="1000"
                            step="1000"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="loanTerm">Loan Term (months)</label>
                    <input
                        type="number"
                        id="loanTerm"
                        value={loanTerm}
                        onChange={(e) => setLoanTerm(Number(e.target.value))}
                        min="12"
                        max="600"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="apr">APR Interest Rate</label>
                    <input
                        type="number"
                        id="apr"
                        value={apr}
                        onChange={(e) => setApr(Number(e.target.value))}
                        min="0"
                        max="1"
                        step="0.001"
                        style={{ textAlign: 'right' }}
                    />
                    <span style={{ marginLeft: '8px', color: 'var(--text-muted)' }}>%</span>
                </div>

                <div className="form-group">
                    <label htmlFor="otherPayments">Other Monthly Payments (T, H, PMI)</label>
                    <input
                        type="number"
                        id="otherPayments"
                        value={otherPayments}
                        onChange={(e) => setOtherPayments(Number(e.target.value))}
                        min="0"
                        step="50"
                    />
                    <span style={{ marginLeft: '8px', color: 'var(--text-muted)' }}>USD</span>
                </div>
            </div>
        </section>
    );
};

export default LoanForm;