import { db } from "../../db";
import { Request, Response } from "express";
import { BalanceSheet, IncomeStatement } from "../../types";

export async function getJournalEntries(req: Request, res: Response) {
  const rows = await db.all("SELECT * FROM journal_entry");
  res.json(rows);
}
export async function getAccounts(req: Request, res: Response) {
  const rows = await db.all(`
            SELECT
            account,
            SUM(CASE WHEN entry_type = 'DEBIT' THEN amount ELSE 0 END) AS debit,
            SUM(CASE WHEN entry_type = 'CREDIT' THEN amount ELSE 0 END) AS credit
        FROM
            journal_entry
        GROUP BY
            account
        ORDER BY
            account;
      `);
  res.json(rows);
}

export async function generateIncomeStatement(): Promise<IncomeStatement> {
  const accounts = await db.all(`
      SELECT
        account,
        category,
        SUM(CASE WHEN entry_type = 'DEBIT' THEN amount ELSE -amount END) as balance
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
    if (account.category === "REVENUE") {
      // Revenue accounts normally have credit balance, so negate it
      account.balance = -account.balance;
      incomeStatement.revenues.push(account);
      incomeStatement.totalRevenues += account.balance;
    } else if (account.category === "EXPENSE") {
      incomeStatement.expenses.push(account);
      incomeStatement.totalExpenses += account.balance;
    }
  });

  incomeStatement.netIncome =
    incomeStatement.totalRevenues - incomeStatement.totalExpenses;
  return incomeStatement;
}

export async function getIncomeStatement(req: Request, res: Response) {
  try {
    const statement = await generateIncomeStatement();
    res.json(statement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getBalanceSheet(req: Request, res: Response) {
  try {
    const incomeStatement = await generateIncomeStatement();
    // First get income statement to calculate retained earnings

    // Get all accounts with their balances
    const accounts = await db.all(`
        SELECT
          account,
          category,
          SUM(CASE WHEN entry_type = 'DEBIT' THEN amount ELSE -amount END) as balance
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
      if (account.category === "ASSET") {
        balanceSheet.assets.push(account);
        balanceSheet.totalAssets += account.balance;
      } else if (account.category === "LIABILITY") {
        balanceSheet.liabilities.push(account);
        balanceSheet.totalLiabilities += account.balance;
      } else if (account.category === "EQUITY") {
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
}
