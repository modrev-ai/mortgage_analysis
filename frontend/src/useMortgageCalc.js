/**
 * Custom hook for shared mortgage calculator state
 * Provides loan details, ref, and settings to components
 */

import { useContext } from 'react';
import MortgageContext from './mortgage_context.jsx';

const useMortgageCalc = () => {
    const context = useContext(MortgageContext);

    if (!context) {
        throw new Error('useMortgageCalc must be used within a MortgageProvider');
    }

    return {
        loanAmount: context.loanAmount,
        apr: context.apr,
        loanTerm: context.loanTerm,
        otherPayments: context.otherPayments,
        mortgageCalcRef: context.mortgageCalcRef,
        lastEditedLumpSums: context.lastEditedLumpSums,
        setLastEditedLumpSums: context.setLastEditedLumpSums,
        getStandardTable: context.getStandardTable,
        setLoanAmount: context.setLoanAmount,
        setApr: context.setApr,
        setLoanTerm: context.setLoanTerm,
        setOtherPayments: context.setOtherPayments
    };
};

export { useMortgageCalc };
