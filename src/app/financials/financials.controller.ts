import { db } from "../../db";
import { Request, Response } from "express";
import { BalanceSheet, IncomeStatement } from "../../types";
import { isValid, getYear } from "date-fns";
import { ACCOUNT } from "../../types";

export async function getJournalEntries(req: Request, res: Response) {
  const rows = await db.all("SELECT * FROM journal_entry");
  res.json(rows);
}
export async function getAccounts(req: Request, res: Response) {
  const { from, to, account } = req.query;

  // Validate accounts if provided
  if (account) {
    const requestedAccounts = (account as string)
      .split(",")
      .map((a) => a.trim());
    const validAccounts = Object.values(ACCOUNT);

    const invalidAccounts = requestedAccounts.filter(
      (acc) => !validAccounts.includes(acc as ACCOUNT)
    );

    if (invalidAccounts.length > 0) {
      res.status(400).json({
        error: `Invalid accounts: ${invalidAccounts.join(", ")}`,
        validAccounts: validAccounts,
      });
      return;
    }
  }

  // Build base query for account summaries with date and account filters
  let summaryQuery = `
    SELECT
      account,
      SUM(CASE WHEN entry_type = 'DEBIT' THEN amount ELSE 0 END) AS debit,
      SUM(CASE WHEN entry_type = 'CREDIT' THEN amount ELSE 0 END) AS credit
    FROM
      journal_entry
    WHERE 1=1
  `;

  const summaryParams: any[] = [];

  if (account) {
    const accounts = (account as string).split(",").map((a) => a.trim());
    summaryQuery += ` AND account IN (${accounts.map(() => "?").join(",")})`;
    summaryParams.push(...accounts);
  }

  if (from) {
    summaryQuery += ` AND date >= ?`;
    summaryParams.push(from as string);
  }
  if (to) {
    summaryQuery += ` AND date <= ?`;
    summaryParams.push(to as string);
  }

  summaryQuery += `
    GROUP BY
      account
    ORDER BY
      account;
  `;

  // Get account summaries
  const accountSummaries = await db.all(summaryQuery, summaryParams);

  // Build base query for entries with date and account filters
  let entriesQuery = `
    SELECT 
      date,
      description,
      entry_type,
      amount,
      invoice_id
    FROM
      journal_entry
    WHERE
      account = ?
  `;

  const entriesParams: any[] = [];
  if (from) {
    entriesQuery += ` AND date >= ?`;
    entriesParams.push(from as string);
  }
  if (to) {
    entriesQuery += ` AND date <= ?`;
    entriesParams.push(to as string);
  }

  entriesQuery += ` ORDER BY date`;

  // Get entries for each account
  const accountsWithEntries = await Promise.all(
    accountSummaries.map(async (summary) => {
      const params = [summary.account, ...entriesParams];
      const entries = await db.all(entriesQuery, params);

      return {
        ...summary,
        entries,
      };
    })
  );

  res.json(accountsWithEntries);
}

export async function generateIncomeStatement(
  from?: string,
  to?: string
): Promise<IncomeStatement> {
  let query = `
      SELECT
        account,
        category,
        SUM(CASE WHEN entry_type = 'DEBIT' THEN amount ELSE -amount END) as balance
      FROM journal_entry`;

  const params: string[] = [];
  if (from || to) {
    query += ` WHERE 1=1`;
    if (from) {
      query += ` AND date >= ?`;
      params.push(from);
    }
    if (to) {
      query += ` AND date <= ?`;
      params.push(to);
    }
  }

  query += ` GROUP BY account`;

  const accounts = await db.all(query, params);

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
  const { from, to } = req.query;

  if (from && to) {
    const fromDate = new Date(from as string);
    const toDate = new Date(to as string);

    if (!isValid(fromDate) || !isValid(toDate)) {
      res.status(400).json({ error: "Invalid date format" });
      return;
    }

    if (getYear(fromDate) !== getYear(toDate)) {
      res
        .status(400)
        .json({ error: "Date range must be within the same year" });
      return;
    }
  }

  try {
    const statement = await generateIncomeStatement(
      from as string,
      to as string
    );
    res.json(statement);
  } catch (err) {
    res
      .status(500)
      .json({ error: err instanceof Error ? err.message : "Unknown error" });
  }
}

export async function generateBalanceSheet(
  from?: string,
  to?: string
): Promise<BalanceSheet> {
  const incomeStatement = await generateIncomeStatement(from, to);

  // Get all accounts with their balances
  let query = `
      SELECT
        account,
        category,
        SUM(CASE 
          WHEN category IN ('ASSET', 'EXPENSE') AND entry_type = 'DEBIT' THEN amount
          WHEN category IN ('ASSET', 'EXPENSE') AND entry_type = 'CREDIT' THEN -amount
          WHEN category IN ('LIABILITY', 'EQUITY', 'REVENUE') AND entry_type = 'CREDIT' THEN amount 
          WHEN category IN ('LIABILITY', 'EQUITY', 'REVENUE') AND entry_type = 'DEBIT' THEN -amount
        END) as balance
      FROM journal_entry`;

  const params: string[] = [];
  if (from || to) {
    query += ` WHERE 1=1`;
    if (from) {
      query += ` AND date >= ?`;
      params.push(from);
    }
    if (to) {
      query += ` AND date <= ?`;
      params.push(to);
    }
  }

  query += ` GROUP BY account, category`;

  const accounts = await db.all(query, params);
  console.log(accounts);
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

  return balanceSheet;
}

export async function getBalanceSheet(req: Request, res: Response) {
  const { from, to } = req.query;

  if (from && to) {
    const fromDate = new Date(from as string);
    const toDate = new Date(to as string);

    if (!isValid(fromDate) || !isValid(toDate)) {
      res.status(400).json({ error: "Invalid date format" });
      return;
    }
    if (getYear(fromDate) !== getYear(toDate)) {
      res
        .status(400)
        .json({ error: "Date range must be within the same year" });
      return;
    }
  }

  try {
    const balanceSheet = await generateBalanceSheet(
      from as string,
      to as string
    );
    res.json(balanceSheet);
  } catch (err) {
    res
      .status(500)
      .json({ error: err instanceof Error ? err.message : "Unknown error" });
  }
}
