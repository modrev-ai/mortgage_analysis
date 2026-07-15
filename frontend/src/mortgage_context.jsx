/**
 * Mortgage Context Provider - Manages shared state for mortgage calculator
 */

import React, { createContext, useState, useRef, useCallback } from 'react';
import MortgageCalculator from './mortgageCalc.js';

const MortgageContext = createContext();

export const MortgageProvider = ({ children }) => {
    // Loan parameters from form (default values match App.jsx)
    const [loanAmount, setLoanAmount] = useState(50000);
    const [apr, setApr] = useState(0.1510);
    const [loanTerm, setLoanTerm] = useState(360);
    const [otherPayments, setOtherPayments] = useState(0);

    // Store lumpsum injections per month (for inline editing)
    const [lastEditedLumpSums, setLastEditedLumpSums] = useState({});

    // Ref to hold the mortgage calculator instance
    const mortgageCalcRef = useRef(null);

    // Initialize or recreate calculator when loan params change
    React.useEffect(() => {
        const calc = mortgageCalcRef.current || new MortgageCalculator();

        // Set loan parameters and calculate monthly payment
        calc.setP(loanAmount)
            .setR(apr)
            .setN(loanTerm)
            .setO(otherPayments)
            .setMonthlyPayment();  // Calculate base monthly payment

        if (!mortgageCalcRef.current) {
            mortgageCalcRef.current = calc;
        } else {
            // Update existing calculator instance
            mortgageCalcRef.current.setP(loanAmount)
                .setR(apr)
                .setN(loanTerm)
                .setO(otherPayments)
                .setMonthlyPayment();
        }
    }, [loanAmount, apr, loanTerm, otherPayments]);

    // Get standard table spanning full loan term for display
    const getStandardTable = useCallback(() => {
        return mortgageCalcRef.current?.generateStandardAmortizationTable() || [];
    }, [loanAmount, apr, loanTerm, otherPayments]);

    return (
        <MortgageContext.Provider value={{
            loanAmount,
            setLoanAmount,
            apr,
            setApr,
            loanTerm,
            setLoanTerm,
            otherPayments,
            setOtherPayments,
            lastEditedLumpSums,
            setLastEditedLumpSums,
            mortgageCalcRef,
            getStandardTable
        }}>
            {children}
        </MortgageContext.Provider>
    );
};

export default MortgageContext;
