import express from "express";
import { db } from "../../db";
import { BalanceSheet, IncomeStatement } from "../../types";
import { getJournalEntries } from "./financials.controller";

const router = express.Router();

router.get("/journal-entries", getJournalEntries);

router.get("/accounts", getAccounts);

router.get("/income-statement", getIncomeStatement);

router.get("/balance-sheet", getBalanceSheet);

export default router;
