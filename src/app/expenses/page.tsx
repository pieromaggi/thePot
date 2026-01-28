"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Link from "next/link";

import AppShell from "../../components/layout/AppShell";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";

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

  const primaryLinkClass =
    "inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500";
  const secondaryLinkClass =
    "inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <AppShell title="Expenses" subtitle="All expenses recorded for this pot.">
      <div className="flex items-center justify-between">
        <Link className={secondaryLinkClass} href="/">
          Back to balances
        </Link>
        <Link className={primaryLinkClass} href="/expenses/new">
          Record expense
        </Link>
      </div>

      {error && (
        <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!pot && isPotReady ? (
        <Card className="mt-6 flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            Please select a pot before viewing expenses.
          </p>
          <Link className={primaryLinkClass} href="/">
            Choose a pot
          </Link>
        </Card>
      ) : (
        <div className="mt-6 space-y-6">
          <Card className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {pot?.name ?? "Pot"}
              </h2>
              <p className="text-sm text-gray-500">Total spent</p>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {currency.format(totalSpent)}
            </div>
          </Card>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Recent expenses
              </h2>
              <p className="text-sm text-gray-500">
                Review and edit itemized expenses.
              </p>
            </div>
            <Badge variant="neutral">{expenses.length} items</Badge>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <p className="text-sm text-gray-500">Loading expenses...</p>
            ) : expenses.length === 0 ? (
              <Card>
                <p className="text-sm text-gray-500">No expenses yet.</p>
              </Card>
            ) : (
              expenses.map((expense) => (
                <Card key={expense.id} className="space-y-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {expense.description}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatDate(expense.occurred_at ?? expense.created_at)} ·
                        Paid by{" "}
                        {expense.paid_by_participant?.name ?? "Unknown"}
                      </p>
                    </div>
                    <div className="flex flex-col items-start gap-2 md:items-end">
                      <span className="text-lg font-semibold text-gray-900">
                        {currency.format(expense.total_amount)}
                      </span>
                      <Link
                        className="text-sm font-semibold text-blue-600"
                        href={`/expenses/${expense.id}/edit`}
                      >
                        Edit
                      </Link>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Split between
                    </span>
                    <ul className="space-y-2 text-sm text-gray-700">
                      {expense.splits.map((split, index) => (
                        <li
                          key={`${expense.id}-split-${index}`}
                          className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-b-0 last:pb-0"
                        >
                          <span>{split.participant?.name ?? "Unknown"}</span>
                          <span className="font-medium text-gray-900">
                            {currency.format(split.amount)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
