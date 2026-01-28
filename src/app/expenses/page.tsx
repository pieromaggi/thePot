"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import styles from "./page.module.css";

type Pot = {
  id: string;
  name: string;
};

type ExpenseSplit = {
  participant: { name: string } | null;
  amount: number;
};

type Expense = {
  id: string;
  description: string;
  total_amount: number;
  occurred_at: string | null;
  created_at: string;
  paid_by_participant: { name: string } | null;
  splits: ExpenseSplit[];
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const formatDate = (value: string | null) => {
  if (!value) return "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function ExpensesPage() {
  const [pot, setPot] = useState<Pot | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPotReady, setIsPotReady] = useState(false);

  const loadExpenses = useCallback(async () => {
    if (!pot) return;
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/expenses?pot_id=${pot.id}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load expenses.");
      }

      const data = (await response.json()) as { expenses: Expense[] };
      setExpenses(data.expenses);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setIsLoading(false);
    }
  }, [pot]);

  useEffect(() => {
    const stored = localStorage.getItem("pot");
    if (stored) {
      try {
        setPot(JSON.parse(stored) as Pot);
      } catch {
        localStorage.removeItem("pot");
      }
    }
    setIsPotReady(true);
  }, []);

  useEffect(() => {
    void loadExpenses();
  }, [loadExpenses]);

  const totalSpent = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + expense.total_amount, 0);
  }, [expenses]);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1>Expenses</h1>
            <p>All expenses recorded for this pot.</p>
          </div>
          <div className={styles.headerActions}>
            <a className={styles.link} href="/">
              Back to balances
            </a>
            <a className={styles.primaryLink} href="/expenses/new">
              Record expense
            </a>
          </div>
        </header>

        {error && <div className={styles.error}>{error}</div>}

        {!pot && isPotReady ? (
          <section className={styles.card}>
            <p>Please select a pot before viewing expenses.</p>
            <a className={styles.primaryLink} href="/">
              Choose a pot
            </a>
          </section>
        ) : (
          <>
            <section className={styles.summary}>
              <div>
                <h2>{pot?.name ?? "Pot"}</h2>
                <p className={styles.muted}>Total spent</p>
              </div>
              <div className={styles.total}>
                {currency.format(totalSpent)}
              </div>
            </section>

            <section className={styles.list}>
              {isLoading ? (
                <p>Loading expenses...</p>
              ) : expenses.length === 0 ? (
                <p>No expenses yet.</p>
              ) : (
                expenses.map((expense) => (
                  <article key={expense.id} className={styles.expenseCard}>
                    <header className={styles.expenseHeader}>
                      <div>
                        <h3>{expense.description}</h3>
                        <p className={styles.muted}>
                          {formatDate(expense.occurred_at ?? expense.created_at)} ·
                          Paid by {expense.paid_by_participant?.name ?? "Unknown"}
                        </p>
                      </div>
                      <div className={styles.amountBlock}>
                        <div className={styles.amount}>
                          {currency.format(expense.total_amount)}
                        </div>
                        <a
                          className={styles.editLink}
                          href={`/expenses/${expense.id}/edit`}
                        >
                          Edit
                        </a>
                      </div>
                    </header>

                    <div className={styles.splitList}>
                      <span className={styles.splitLabel}>Split between</span>
                      <ul>
                        {expense.splits.map((split, index) => (
                          <li key={`${expense.id}-split-${index}`}>
                            <span>{split.participant?.name ?? "Unknown"}</span>
                            <span>{currency.format(split.amount)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                ))
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
