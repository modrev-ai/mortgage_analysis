import { useContext } from 'react';
import MortgageContext from './mortgage_context.jsx';
import StandardAmortizationTable from './StandardAmortizationTable.jsx';

function AppContent() {
  const {
    loanAmount,
    setLoanAmount,
    apr,
    setApr,
    loanTerm,
    setLoanTerm,
    lastEditedLumpSums,
    setLastEditedLumpSums,
    mortgageCalcRef,
  } = useContext(MortgageContext);

  // APR is stored as a fraction (e.g., 0.1510 = 15.10%)
  // Display it as a percentage in the input
  const aprPercentage = apr * 100;

  return (
    <div className="main-container">
      <div className="glass-panel main-content">
        <header className="header">
          <h1>Standard Amortization Table</h1>
          <p>
            View your monthly payment schedule, track principal and interest breakdown,
            and add lump sum payments to reduce your loan faster.
          </p>
        </header>

        {/* Loan Details Form */}
        <section className="summary-grid">
          {/* Loan Amount */}
          <div className="form-group">
            <label htmlFor="loanAmount">Loan Amount (USD)</label>
            <div className="input-wrapper has-prefix">
              <span className="input-prefix">$</span>
              <input
                type="number"
                id="loanAmount"
                value={loanAmount}
                onChange={(e) => setLoanAmount(parseInt(e.target.value) || 0)}
                min="1000"
                step="1000"
                className="prefixed-input"
              />
            </div>
            <input
              type="range"
              min={1000}
              max={2000000}
              step={1000}
              value={loanAmount}
              onChange={(e) => setLoanAmount(parseInt(e.target.value))}
              className="slider"
            />
            <div className="slider-labels">
              <span>$1,000</span>
              <span>${(loanAmount / 1000).toFixed(0)}K</span>
              <span>$2,000,000</span>
            </div>
          </div>

          {/* Loan Term */}
          <div className="form-group">
            <label htmlFor="loanTerm">Loan Term (months)</label>
            <input
              type="number"
              id="loanTerm"
              value={loanTerm}
              onChange={(e) => setLoanTerm(parseInt(e.target.value) || 0)}
              min="12"
              max="600"
            />
            <input
              type="range"
              min={12}
              max={600}
              step={12}
              value={loanTerm}
              onChange={(e) => setLoanTerm(parseInt(e.target.value))}
              className="slider"
            />
            <div className="slider-labels">
              <span>12 mo (1 yr)</span>
              <span>{(loanTerm / 12).toFixed(1)} yr</span>
              <span>600 mo (50 yr)</span>
            </div>
          </div>

          {/* APR - displayed as percentage */}
          <div className="form-group">
            <label htmlFor="apr">APR Interest Rate (%)</label>
            <div className="input-wrapper has-suffix">
              <input
                type="number"
                id="apr"
                value={parseFloat(aprPercentage.toFixed(2))}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setApr(val / 100);
                }}
                min="0"
                max="30"
                step="0.01"
                className="suffix-input"
              />
              <span className="input-suffix">%</span>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              step={0.01}
              value={aprPercentage}
              onChange={(e) => setApr(parseFloat(e.target.value) / 100)}
              className="slider"
            />
            <div className="slider-labels">
              <span>0%</span>
              <span>{aprPercentage.toFixed(2)}%</span>
              <span>30%</span>
            </div>
          </div>
        </section>

        {/* Amortization Table Display */}
        <StandardAmortizationTable
          mortgageCalcRef={mortgageCalcRef.current}
          loanAmount={loanAmount}
          apr={apr}
          loanTerm={loanTerm}
          otherPayments={0}
          lastEditedLumpSums={lastEditedLumpSums}
          setLastEditedLumpSums={setLastEditedLumpSums}
        />

        <footer className="footer">
          <p>Mortgage Analyzer - Built with React</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Based on amortization schedule examples from mortgage_analysis project
          </p>
        </footer>
      </div>
    </div>
  );
}

function App() {
  // MortgageProvider is already provided in main.jsx
  return <AppContent />;
}

export default App;
