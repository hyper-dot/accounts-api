import express from "express";
import { db } from "../../db";
import { BalanceSheet, IncomeStatement } from "../../types";

const router = express.Router();

router.get("/journal-entries", async (req, res) => {
  const rows = await db.all("SELECT * FROM journal_entry");
  res.json(rows);
});

router.get("/accounts", async (req, res) => {
  const rows = await db.all(`
          SELECT
          account,
          SUM(CASE WHEN type = 'DEBIT' THEN amount ELSE 0 END) AS debit,
          SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE 0 END) AS credit
      FROM
          journal_entry
      GROUP BY
          account
      ORDER BY
          account;
    `);
  res.json(rows);
});

async function getIncomeStatement(): Promise<IncomeStatement> {
  const accounts = await db.all(`
    SELECT
      account,
      SUM(CASE WHEN type = 'DEBIT' THEN amount ELSE -amount END) as balance
    FROM journal_entry
    GROUP BY account
  `);

  const incomeStatement: IncomeStatement = {
    revenues: [],
    expenses: [],
    totalRevenues: 0,
    totalExpenses: 0,
    netIncome: 0,
  };

  accounts.forEach((account) => {
    if (account.account.toLowerCase().includes("sales")) {
      // Revenue accounts normally have credit balance, so negate it
      account.balance = -account.balance;
      incomeStatement.revenues.push(account);
      incomeStatement.totalRevenues += account.balance;
    } else if (account.account.toLowerCase().includes("expense")) {
      incomeStatement.expenses.push(account);
      incomeStatement.totalExpenses += account.balance;
    }
  });

  incomeStatement.netIncome =
    incomeStatement.totalRevenues - incomeStatement.totalExpenses;
  return incomeStatement;
}

router.get("/income-statement", async (req, res) => {
  try {
    const statement = await getIncomeStatement();
    res.json(statement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/balance-sheet", async (req, res) => {
  try {
    const incomeStatement = await getIncomeStatement();
    // First get income statement to calculate retained earnings

    // Get all accounts with their balances
    const accounts = await db.all(`
      SELECT
        account,
        SUM(CASE WHEN type = 'DEBIT' THEN amount ELSE -amount END) as balance
      FROM journal_entry
      GROUP BY account
    `);

    const balanceSheet: BalanceSheet = {
      assets: [],
      liabilities: [],
      equity: [],
      totalAssets: 0,
      totalLiabilities: 0,
      totalEquity: 0,
    };

    // Categorize accounts into assets, liabilities and equity
    accounts.forEach((account) => {
      if (
        account.account.toLowerCase().includes("cash") ||
        account.account.toLowerCase().includes("receivable") ||
        account.account.toLowerCase().includes("equipment")
      ) {
        balanceSheet.assets.push(account);
        balanceSheet.totalAssets += account.balance;
      } else if (
        account.account.toLowerCase().includes("payable") ||
        account.account.toLowerCase().includes("liability")
      ) {
        balanceSheet.liabilities.push(account);
        balanceSheet.totalLiabilities += account.balance;
      } else if (
        account.account.toLowerCase().includes("equity") ||
        account.account.toLowerCase().includes("capital")
      ) {
        // For equity accounts, credit balance is positive so negate the balance
        account.balance = -account.balance;
        balanceSheet.equity.push(account);
        balanceSheet.totalEquity += account.balance;
      }
    });

    // Add retained earnings from income statement
    balanceSheet.equity.push({
      account: "Retained Earnings",
      balance: incomeStatement.netIncome,
    });
    balanceSheet.totalEquity += incomeStatement.netIncome;

    res.json(balanceSheet);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
