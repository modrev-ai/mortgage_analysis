# Amortized Loan Simulator
import warnings
import pandas as pd
import matplotlib.pyplot as plt
from kneed import KneeLocator

warnings.filterwarnings("ignore")
pd.set_option("display.max_rows", None)


class LoanCalc:
    def __init__(self, P, r, n, O=0):
        """Initialize Loan Calculator with constant vars

        Args:
            P (int): initial principal
            r (float): interest per period (e.g., APR/12)
            n (int): total number of payments
            O (int, optional): other monthly expenses. Defaults to 0
        """
        self.P = P
        self.r = r
        self.n = n
        self.O = O

    @staticmethod
    def _calculate_interest(P, r):
        """Calculate simple monthly interest payment"""
        return P * r / 12

    @staticmethod
    def _calculate_snapshot_monthly(P, r, n):
        """Calculate amortized monthly payment

        P (int): initial principal
        r (float): interest per period (e.g., APR/12)
        n (int): total number of payments
        """
        r /= 12  # interest per month
        A = P / ((1 + r) ** n - 1) * (r * (1 + r) ** n)

        return A

    def find_optimal_schedule(
        self, search_range=None, M=None, draw_plot=True, max_rows=None
    ):
        """Creates table to find the optimal overpayment schedule"""

        cols = [
            "Additive Down",
            "Total Payment Schedule",
            "Total Interest Paid",
            "Percent Reduced",
        ]
        df = pd.DataFrame(columns=cols)

        if search_range is None:
            maxval = int(self.P / self.n)
            step = int(maxval * 0.1)
            search_range = range(0, maxval, step)

        for rng in search_range:
            total_schedule, total_interest = self.generate_amortization_table(
                additive=rng, return_range=True
            )

            perc_reduced = ((self.n - total_schedule) / self.n) * 100

            df = pd.concat(
                [
                    df,
                    pd.DataFrame(
                        [rng, total_schedule, total_interest, perc_reduced], index=cols
                    ).T,
                ]
            )

        df.reset_index(drop=True, inplace=True)

        dff = df[["Additive Down", "Percent Reduced"]].to_numpy()
        # param: curve
        # concave detects knees; convex detects elbow
        kl = KneeLocator(
            x=dff[:, 0].tolist(),
            y=dff[:, 1].tolist(),
            S=1,
            curve="concave",
            direction="increasing",
        )

        self.optimal_knee = kl.knee

        # plot schedule
        if draw_plot:
            fig, axs = plt.subplots(2, 1, figsize=(6 * 3, 6 * 2))
            df.plot(
                x="Additive Down", y="Total Payment Schedule", kind="bar", ax=axs[0]
            )
            # ax2 = ax.twinx()
            # axs[1].tick_params(axis="y", labelcolor="red")
            df.plot(x="Additive Down", y="Percent Reduced", kind="line", ax=axs[1])
            axs[1].vlines(kl.knee, 0, 100, linestyles="dashed", colors="red")

        return df[:max_rows]

    def generate_merged_amortization_schedule(
        self, additive=None, optimal_row=None, max_rows=None
    ):
        """Generate merged amortization schedule showing both standard and optimal monthly strategy

        Args:
            additive (float): additional monthly principal payment for optimal strategy. Defaults to None
                (uses optimal_knee from find_optimal_schedule() if provided).
            optimal_row (dict, optional): pre-calculated optimal schedule data. Used when additive=None.
            max_rows (int, optional): limits the number of rows returned. Defaults to None.

        Returns:
            pd.DataFrame: merged amortization table with columns for both strategies side-by-side
        """

        cols_standard = [
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
        ]

        cols_optimal = [
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

        # Generate standard amortization (no additional payments)
        df_standard = self.generate_amortization_table(additive=0, return_range=False)

        # Handle optimal schedule - either use pre-calculated row or generate new one
        if optimal_row is not None:
            # Use pre-calculated optimal row data
            df_optimal_data = [optimal_row]
        elif additive is not None and additive > 0:
            # Generate new optimal amortization
            df_optimal = self.generate_amortization_table(additive=additive, return_range=False)
            df_optimal_data = []
            for idx, row in df_optimal.iterrows():
                optimal_row_dict = {
                    "Beginning Balance": row["Beginning Balance"],
                    "Total Monthly": row["Total Monthly"],
                    "Interest": row["Interest"],
                    "Principal": row["Principal"],
                    "Additive Down": row.get("Additive Down", 
                                          row["Total Monthly"] - row["Interest"]),
                    "Ending Balance": row["Ending Balance"],
                    "Total Principal": row["Total Principal"],
                    "Total Interest": row["Total Interest"],
                    "Percent Paid": row["Percent Paid"],
                }
                df_optimal_data.append(optimal_row_dict)
        else:
            # No optimal schedule to merge with (edge case)
            print("Warning: Neither additive nor optimal_row provided. Returning standard amortization only.")
            return df_standard.iloc[:max_rows] if max_rows else df_standard

        # Create merged DataFrame - each row contains both strategies side-by-side
        n_std = len(df_standard)
        n_opt = len(df_optimal_data)
        n_combined = max(n_std, n_opt)
        
        merged_df = pd.DataFrame(columns=cols_standard + cols_optimal, 
                                 index=range(1, n_combined + 1))

        # Fill standard columns for all rows
        for i in range(n_std):
            row = df_standard.iloc[i]
            std_month = i + 1
            merged_df.loc[std_month - 1, "Month"] = std_month
            merged_df.loc[std_month - 1, "Standard Beginning Balance"] = row["Beginning Balance"]
            merged_df.loc[std_month - 1, "Standard Total Monthly"] = row["Total Monthly"]
            merged_df.loc[std_month - 1, "Standard Interest"] = row["Interest"]
            merged_df.loc[std_month - 1, "Standard Principal"] = row["Principal"]
            merged_df.loc[std_month - 1, "Standard Other"] = row["Other"]
            merged_df.loc[std_month - 1, "Standard Ending Balance"] = row["Ending Balance"]
            merged_df.loc[std_month - 1, "Standard Total Principal"] = row["Total Principal"]
            merged_df.loc[std_month - 1, "Standard Total Interest"] = row["Total Interest"]
            merged_df.loc[std_month - 1, "Standard Percent Paid"] = row["Percent Paid"]

        # Fill optimal columns for all rows
        for i in range(n_opt):
            row = df_optimal_data[i]
            opt_month = i + 1
            merged_df.loc[opt_month - 1, "Optimal Beginning Balance"] = row["Beginning Balance"]
            merged_df.loc[opt_month - 1, "Optimal Total Monthly"] = row["Total Monthly"]
            merged_df.loc[opt_month - 1, "Optimal Interest"] = row["Interest"]
            merged_df.loc[opt_month - 1, "Optimal Principal"] = row["Principal"]
            merged_df.loc[opt_month - 1, "Optimal Additional Principal"] = row.get("Additive Down", 0)
            merged_df.loc[opt_month - 1, "Optimal Ending Balance"] = row["Ending Balance"]
            merged_df.loc[opt_month - 1, "Optimal Total Principal"] = row["Total Principal"]
            merged_df.loc[opt_month - 1, "Optimal Total Interest"] = row["Total Interest"]
            merged_df.loc[opt_month - 1, "Optimal Percent Paid"] = row["Percent Paid"]

        # Reset index for cleaner output
        merged_df = merged_df.reset_index(drop=True)

        if max_rows:
            merged_df = merged_df.iloc[:max_rows]

        return merged_df

    def generate_amortization_table(
        self, additive=0, return_range=False, max_rows=None
    ):
        """Generate complete amortization schedule

        Args:
            additive (int, optional): additional monthly principal payment. Defaults to 0.
            return_range (bool, optional): returns # months of payment and total interests. Defaults to False.

        Returns:
            (int, int): # months of payment, total interests
        """

        cols = [
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

        P = self.P
        r = self.r
        n = self.n
        O = self.O

        df = pd.DataFrame(columns=cols)

        # constant monthly total
        M = self._calculate_snapshot_monthly(P=P, r=r, n=n) + additive + O

        TI = 0  # total interest
        PI = 0  # total principal
        P_initial = P  # initial principal balance

        for i in range(n):
            I = self._calculate_interest(P=P, r=r)
            P_i = P  # initial balance
            pr = M - I - O  # principal

            if P_i < pr:
                pr = P_i
                M = pr + I + O

            P -= pr  # ending balance
            if P < 1e-9:
                P = 0

            TI += I  # total interest
            PI += pr  # total principal
            perc_paid = (PI / P_initial) * 100  # percent principal paid

            tmp = [P_i, M, I, pr, O, P, PI, TI, perc_paid]
            tmp = [round(j, 2) for j in tmp]

            df = pd.concat([df, pd.DataFrame(tmp, index=cols).T])

            if P == 0:  # break cycle if ends early
                break

        df = df.reset_index(drop=True)
        df.index += 1

        if return_range:
            return max(df.index), TI
        else:
            return df[:max_rows]

    def generate_amortization_table_with_lumpsum(
        self, lump_sum, month, max_rows=None
    ):
        """Generate complete amortization schedule with a one-time lump sum payment

        Args:
            lump_sum (float): one-time additional principal payment
            month (int): the month the lump sum payment is made (1-indexed)
            max_rows (int, optional): limits the number of rows returned. Defaults to None.

        Returns:
            pd.DataFrame: amortization table
        """

        cols = [
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

        P = self.P
        r = self.r
        n = self.n
        O = self.O

        df = pd.DataFrame(columns=cols)

        # constant monthly total
        M = self._calculate_snapshot_monthly(P=P, r=r, n=n) + O

        TI = 0  # total interest
        PI = 0  # total principal
        P_initial = P  # initial principal balance

        self.monthly_saving_from_lumpsum = 0
        pr_before_lumpsum = 0

        for i in range(1, n + 1):
            I = self._calculate_interest(P=P, r=r)
            P_i = P  # initial balance
            
            current_lump = lump_sum if i == month else 0
            
            pr = M - I - O + current_lump  # principal
            current_M = M + current_lump

            if P_i < pr:
                pr = P_i
                current_M = pr + I + O

            P -= pr  # ending balance
            if P < 1e-9:
                P = 0

            TI += I  # total interest
            PI += pr  # total principal
            perc_paid = (PI / P_initial) * 100  # percent principal paid

            if i == month - 1:
                pr_before_lumpsum = pr
            elif i == month + 1:
                if pr_before_lumpsum == 0 and month == 1:
                    I_initial = self._calculate_interest(P=P_initial, r=r)
                    pr_before_lumpsum = M - I_initial - O
                self.monthly_saving_from_lumpsum = pr - pr_before_lumpsum
                print(f"Monthly equity gain from lump sum: ${round(self.monthly_saving_from_lumpsum, 2)}")

            tmp = [P_i, current_M, I, pr, O, P, PI, TI, perc_paid]
            tmp = [round(j, 2) for j in tmp]

            df = pd.concat([df, pd.DataFrame(tmp, index=cols).T])

            if P == 0:  # break cycle if ends early
                break

        df = df.reset_index(drop=True)
        df.index += 1

        # Calculate interest savings (base case vs lump sum case)
        df_base = self.generate_amortization_table()
        
        def get_interest_at(dataframe, m):
            if m > len(dataframe):
                return dataframe['Total Interest'].iloc[-1]
            return dataframe.loc[m, 'Total Interest']

        shortened_months_ahead = max(0, len(df) - month)
        final_y = round(shortened_months_ahead / 12, 1)
        if final_y.is_integer():
            final_y = int(final_y)

        base_years = [1, 2, 3, 4, 5, 10, 15, 20]
        years_ahead = [y for y in base_years if y < final_y]
        
        savings_list = []
        
        for y in years_ahead:
            s = get_interest_at(df_base, month + y * 12) - get_interest_at(df, month + y * 12)
            setattr(self, f"saving_{y}y_ahead", s)
            months_ahead = y * 12
            base_s = self.monthly_saving_from_lumpsum * months_ahead
            add_s = s - base_s
            print(f"Total interest saving {y} years ahead: ${round(base_s, 2)} + ${round(add_s, 2)} = ${round(s, 2)}")
            savings_list.append(s)

        self.total_saving_life = get_interest_at(df_base, len(df_base)) - get_interest_at(df, len(df))
        setattr(self, f"saving_{final_y}y_ahead", self.total_saving_life)
        
        base_s_life = self.monthly_saving_from_lumpsum * shortened_months_ahead
        add_s_life = self.total_saving_life - base_s_life
        
        print(f"Total interest saving {final_y} years ahead (Final): ${round(base_s_life, 2)} + ${round(add_s_life, 2)} = ${round(self.total_saving_life, 2)}")
        savings_list.append(self.total_saving_life)

        # Store the updated total years and months for the shortened loan
        self.new_total_months = len(df)
        self.total_years = round(self.new_total_months / 12, 1)
        if self.total_years.is_integer():
            self.total_years = int(self.total_years)

        return df[:max_rows], tuple(savings_list)
