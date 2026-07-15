import { useMortgageCalc } from './useMortgageCalc.js';
import MortgageCalculator from './mortgageCalc.js';

const SummaryStats = () => {
    const { loanAmount, apr, loanTerm, mortgageCalcRef, otherPayments } = useMortgageCalc();

    // Initialize and recreate calculator when loan params change
    React.useEffect(() => {
        let calc = mortgageCalcRef.current;

        if (calc) {
            calc.setP(loanAmount)
                .setR(apr)
                .setN(loanTerm)
                .setO(otherPayments);
        } else {
            calc = new MortgageCalculator();
            calc.setP(loanAmount)
                .setR(apr)
                .setN(loanTerm)
                .setO(otherPayments);
            mortgageCalcRef.current = calc;
        }
    }, [loanAmount, apr, loanTerm, otherPayments]);

    // Calculate principal and interest portions (excluding other payments)
    const getPIPayment = () => {
        if (!mortgageCalcRef.current) return 0;
        const fullPayment = mortgageCalcRef.current.getMonthlyPayment();
        return fullPayment - parseFloat(otherPayments);
    };

    return (
        <div>
            {/* Basic loan info */}
            <section className="summary-grid">
                <div className="glass-panel stat-card">
                    <span className="stat-title">Monthly Payment</span>
                    <span className="stat-value">{getPIPayment().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span className="stat-sub">Per month (excluding other payments)</span>
                </div>

                <div className="glass-panel stat-card">
                    <span className="stat-title">Interest Rate</span>
                    <span className="stat-value highlight">{(apr * 100).toFixed(2)}%</span>
                </div>

                <div className="glass-panel stat-card">
                    <span className="stat-title">Loan Term</span>
                    <span className="stat-value">{loanTerm}</span>
                    <span className="stat-sub">months</span>
                </div>

                <div className="glass-panel stat-card">
                    <span className="stat-title">Loan Amount</span>
                    <span className="stat-value">${Math.round(mortgageCalcRef.current?.principal || 0)}</span>
                </div>

                <div className="glass-panel stat-card">
                    <span className="stat-title">Total Interest (Standard)</span>
                    <span className="stat-value">${Math.round(mortgageCalcRef.current?.totalInterest || 0)}</span>
                </div>

                <div className="glass-panel stat-card">
                    <span className="stat-title">Total Principal</span>
                    <span className="stat-value">${Math.round(mortgageCalcRef.current?.principal || 0)}</span>
                </div>
            </section>
        </div>
    );
};

export default SummaryStats;
