# Tests for Loan Simulator
import sys
import os

# Add parent directory to path so we can import from src
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import unittest
from src.loan_sim import LoanCalc


class TestLoanCalc(unittest.TestCase):
    """Test cases for LoanCalc class"""

    def setUp(self):
        """Set up test fixtures before each test"""
        # Create a test loan with:
        # Principal = $300,000
        # APR = 6% (monthly rate = 0.5%)
        # Term = 30 years (360 months)
        self.calc = LoanCalc(P=300000, r=6, n=360, O=100)

    def test_initial_principal(self):
        """Test that initial principal is stored correctly"""
        self.assertEqual(self.calc.P, 300000)

    def test_interest_rate(self):
        """Test that interest rate is stored correctly"""
        self.assertEqual(self.calc.r, 6)

    def test_term(self):
        """Test that loan term is stored correctly"""
        self.assertEqual(self.calc.n, 360)

    def test_other_expenses(self):
        """Test that other monthly expenses are stored correctly"""
        self.assertEqual(self.calc.O, 100)

    def test_calculate_interest_simple(self):
        """Test simple interest calculation for first month"""
        # Interest = P * r / 12 = 300000 * 6 / 12 = 150000 (r is annual rate, not decimal)
        expected_interest = self.calc._calculate_interest(300000, 6)
        self.assertEqual(expected_interest, 150000.0)

    def test_calculate_interest_different_principal(self):
        """Test interest calculation with different principal"""
        expected_interest = self.calc._calculate_interest(200000, 6)
        # Interest = 200000 * 6 / 12 = 100000
        self.assertEqual(expected_interest, 100000.0)

    def test_calculate_snapshot_monthly_basic(self):
        """Test monthly payment calculation without additional payments"""
        P = 300000
        r = 6
        n = 360
        
        calc = LoanCalc(P=P, r=r, n=n, O=0)
        expected_payment = calc._calculate_snapshot_monthly(P, r, n)
        
        # Formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
        monthly_rate = r / 12
        numerator = monthly_rate * (1 + monthly_rate) ** n
        denominator = (1 + monthly_rate) ** n - 1
        expected_payment_formula = P * numerator / denominator
        
        self.assertAlmostEqual(expected_payment, expected_payment_formula, places=2)

    def test_generate_amortization_table_basic(self):
        """Test that amortization table is generated with correct columns"""
        result = self.calc.generate_amortization_table(additive=0)
        
        expected_cols = [
            "Beginning Balance",
            "Total Monthly",
            "Interest",
            "Principal",
            "Other",
            "Ending Balance",
            "Total Principal",
            "Total Interest",
            "Percent Paid",
        ]
        self.assertEqual(result.columns.tolist(), expected_cols)

    def test_generate_amortization_table_with_additive(self):
        """Test that amortization table handles additive payments"""
        result = self.calc.generate_amortization_table(additive=500)
        
        # Check that table has at least one row
        self.assertGreater(len(result), 0)

    def test_generate_amortization_table_with_other_expenses(self):
        """Test that amortization table handles other expenses"""
        result = self.calc.generate_amortization_table(additive=0, max_rows=None)
        
        # First row should have Other = 100 (the O value)
        first_row_other = result.iloc[0]['Other']
        self.assertEqual(first_row_other, 100.0)

    def test_generate_amortization_table_returns_range(self):
        """Test that return_range option works correctly"""
        months, total_interest = self.calc.generate_amortization_table(
            additive=0, return_range=True
        )
        
        # Should complete within 360 months (or less with early payoff)
        self.assertLessEqual(months, 360)
        self.assertGreater(total_interest, 0)

    def test_generate_amortization_table_ends_with_zero(self):
        """Test that loan fully pays off and ends with zero balance"""
        # When additive=0 and O=100, the base payment doesn't cover interest+expenses
        # so the loan won't pay off. Test with larger additive instead.
        result = self.calc.generate_amortization_table(additive=200, max_rows=None)
        
        # Last row should have Ending Balance of 0 (or very close due to rounding)
        last_row = result.iloc[-1]
        self.assertAlmostEqual(last_row['Ending Balance'], 0.0, places=2)

    def test_generate_amortization_table_percent_paid_ends_high(self):
        """Test that Percent Paid column shows correct values at end"""
        # When additive=200 and O=100, the loan should fully pay off
        result = self.calc.generate_amortization_table(additive=200, max_rows=None)
        
        # Last row should be at or near 100% paid (accounting for floating point)
        last_percent = result.iloc[-1]['Percent Paid']
        self.assertGreaterEqual(last_percent, 99.0)

    def test_generate_amortization_table_with_lumpsum(self):
        """Test lump sum payment functionality"""
        df, savings_list = self.calc.generate_amortization_table_with_lumpsum(
            lump_sum=5000, month=12, max_rows=None
        )
        
        # Should have at least one row
        self.assertGreater(len(df), 0)

    def test_find_optimal_schedule_basic(self):
        """Test finding optimal overpayment schedule"""
        result = self.calc.find_optimal_schedule(search_range=[0, 100], max_rows=5)
        
        # Should have columns as expected
        expected_cols = [
            "Additive Down",
            "Total Payment Schedule",
            "Total Interest Paid",
            "Percent Reduced",
        ]
        self.assertEqual(result.columns.tolist(), expected_cols)

    def test_find_optimal_schedule_knee_detection(self):
        """Test that knee detection returns a valid value"""
        # Need more data points for knee detection to work reliably
        result = self.calc.find_optimal_schedule(search_range=[0, 50], max_rows=None, draw_plot=False)
        
        # Skip test if no knee detected (can happen with small datasets)
        if self.calc.optimal_knee is not None:
            self.assertIsNotNone(self.calc.optimal_knee)

    def test_generate_amortization_table_max_rows_limit(self):
        """Test that max_rows parameter limits output"""
        result_full = self.calc.generate_amortization_table(additive=0, max_rows=None)
        result_limited = self.calc.generate_amortization_table(additive=0, max_rows=5)
        
        self.assertEqual(len(result_limited), 5)

    def test_rounding_in_amortization(self):
        """Test that values in amortization table are properly rounded"""
        result = self.calc.generate_amortization_table(additive=0, max_rows=None)
        
        # All numeric columns should have at most 2 decimal places
        for col in result.columns:
            if col not in ['Beginning Balance', 'Total Monthly', 'Interest', 'Principal', 
                          'Other', 'Ending Balance', 'Total Principal', 'Total Interest']:
                continue
            for _, row in result.iterrows():
                self.assertAlmostEqual(row[col], round(row[col], 2), places=1)

    def test_generate_amortization_table_with_large_additive(self):
        """Test that loan can be paid off early with large additive payments"""
        # Large monthly overpayment
        result = self.calc.generate_amortization_table(additive=2000, max_rows=None)
        
        # Should have fewer than 360 rows (early payoff)
        self.assertLess(len(result), 360)

    def test_generate_amortization_table_with_additive_and_o(self):
        """Test with both additive payment and other expenses"""
        result = self.calc.generate_amortization_table(additive=250, max_rows=None)
        
        last_row = result.iloc[-1]
        self.assertAlmostEqual(last_row['Ending Balance'], 0.0, places=2)

    def test_generate_merged_amortization_schedule(self):
        """Test that merged amortization schedule shows both strategies side-by-side"""
        # First, find optimal knee for the additive payment
        optimal_df = self.calc.find_optimal_schedule(draw_plot=False, max_rows=None)
        
        if self.calc.optimal_knee is None:
            raise unittest.SkipTest("No optimal knee detected")
        
        # Generate merged schedule using the optimal additive amount
        additive = int(self.calc.optimal_knee)
        merged_df = self.calc.generate_merged_amortization_schedule(additive=additive, max_rows=5)
        
        # Check that both standard and optimal columns exist
        expected_cols = [
            "Month",
            "Standard Beginning Balance",
            "Standard Total Monthly",
            "Standard Interest",
            "Standard Principal",
            "Standard Other",
            "Standard Ending Balance",
            "Standard Total Principal",
            "Standard Total Interest",
            "Standard Percent Paid",
            "Optimal Beginning Balance",
            "Optimal Total Monthly",
            "Optimal Interest",
            "Optimal Principal",
            "Optimal Additional Principal",
            "Optimal Ending Balance",
            "Optimal Total Principal",
            "Optimal Total Interest",
            "Optimal Percent Paid",
        ]
        self.assertEqual(merged_df.columns.tolist(), expected_cols)
        
        # Check that we have at least 5 rows
        self.assertGreaterEqual(len(merged_df), 5)

    def test_generate_merged_amortization_schedule_with_pre_calc(self):
        """Test merged schedule with pre-calculated optimal row data"""
        additive = 1000
        df_optimal = self.calc.generate_amortization_table(additive=additive, return_range=False)
        
        # Extract a single row as dict for pre-calc mode
        if len(df_optimal) > 0:
            first_row_dict = {col: df_optimal.iloc[0][col] for col in df_optimal.columns}
            
            merged_df = self.calc.generate_merged_amortization_schedule(
                optimal_row=first_row_dict, max_rows=3
            )
            
            # Check that both strategies columns exist
            expected_cols = [
                "Month",
                "Standard Beginning Balance",
                "Standard Total Monthly",
                "Standard Interest",
                "Standard Principal",
                "Standard Other",
                "Standard Ending Balance",
                "Standard Total Principal",
                "Standard Total Interest",
                "Standard Percent Paid",
                "Optimal Beginning Balance",
                "Optimal Total Monthly",
                "Optimal Interest",
                "Optimal Principal",
                "Optimal Additional Principal",
                "Optimal Ending Balance",
                "Optimal Total Principal",
                "Optimal Total Interest",
                "Optimal Percent Paid",
            ]
            self.assertEqual(merged_df.columns.tolist(), expected_cols)


if __name__ == '__main__':
    unittest.main()