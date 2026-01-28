"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import styles from "./page.module.css";

type Participant = {
  id: string;
  name: string;
};

type ExpenseSplit = {
  participant_id: string;
  amount: number;
  participant?: { name: string } | null;
};

type Expense = {
  id: string;
  description: string;
  total_amount: number;
  occurred_at: string | null;
  created_at: string;
  paid_by_participant_id: string | null;
  splits: ExpenseSplit[];
};

type Pot = {
  id: string;
  name: string;
};

type SplitMode = "equal" | "custom";

const toCents = (value: number) => Math.round(value * 100);

const distributeEvenly = (total: number, ids: string[]) => {
  const totalCents = toCents(total);
  const count = ids.length;
  if (!count || totalCents <= 0) return [];

  const base = Math.floor(totalCents / count);
  let remainder = totalCents % count;

  return ids.map((id) => {
    const cents = base + (remainder > 0 ? 1 : 0);
    remainder = Math.max(0, remainder - 1);
    return { participant_id: id, amount: cents / 100 };
  });
};

const formatDateInput = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

export default function ExpenseEditPage() {
  const params = useParams<{ id: string }>();
  const expenseId = params?.id;
  const [pot, setPot] = useState<Pot | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [expense, setExpense] = useState<Expense | null>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    [],
  );
  const [splitMode, setSplitMode] = useState<SplitMode>("equal");
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [occurredAt, setOccurredAt] = useState("");
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPotReady, setIsPotReady] = useState(false);

  const loadData = useCallback(async () => {
    if (!pot || !expenseId) return;
    try {
      setIsLoading(true);
      setError(null);

      const [participantsRes, expenseRes] = await Promise.all([
        fetch(`/api/participants?pot_id=${pot.id}`, { cache: "no-store" }),
        fetch(`/api/expenses/${expenseId}?pot_id=${pot.id}`, {
          cache: "no-store",
        }),
      ]);

      if (!participantsRes.ok || !expenseRes.ok) {
        throw new Error("Failed to load expense data.");
      }

      const participantsJson = (await participantsRes.json()) as {
        participants: Participant[];
      };
      const expenseJson = (await expenseRes.json()) as { expense: Expense };

      setParticipants(participantsJson.participants);
      setExpense(expenseJson.expense);
      setDescription(expenseJson.expense.description);
      setTotalAmount(String(expenseJson.expense.total_amount));
      setPaidBy(expenseJson.expense.paid_by_participant_id ?? "");
      setOccurredAt(formatDateInput(expenseJson.expense.occurred_at));
      setSelectedParticipants(
        expenseJson.expense.splits.map((split) => split.participant_id),
      );

      const customSplitMap: Record<string, string> = {};
      for (const split of expenseJson.expense.splits) {
        customSplitMap[split.participant_id] = String(split.amount);
      }
      setCustomSplits(customSplitMap);
      setSplitMode("custom");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setIsLoading(false);
    }
  }, [expenseId, pot]);

  useEffect(() => {
    const stored = localStorage.getItem("pot");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<Pot>;
        if (parsed?.id && parsed?.name) {
          setPot({ id: parsed.id, name: parsed.name });
        } else {
          localStorage.removeItem("pot");
        }
      } catch {
        localStorage.removeItem("pot");
      }
    }
    setIsPotReady(true);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const selectedSet = useMemo(
    () => new Set(selectedParticipants),
    [selectedParticipants],
  );

  const handleToggleParticipant = (id: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleCustomSplitChange = (id: string, value: string) => {
    setCustomSplits((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!pot) return;
    setError(null);

    if (!description.trim()) {
      setError("Description is required.");
      return;
    }

    const totalNumber = Number.parseFloat(totalAmount);
    if (!totalNumber || totalNumber <= 0) {
      setError("Total amount must be positive.");
      return;
    }

    if (selectedParticipants.length === 0) {
      setError("Select at least one participant to split the expense.");
      return;
    }

    const splits =
      splitMode === "equal"
        ? distributeEvenly(totalNumber, selectedParticipants)
        : selectedParticipants.map((id) => ({
            participant_id: id,
            amount: Number.parseFloat(customSplits[id] || "0"),
          }));

    if (splitMode === "custom") {
      const totalSplits = splits.reduce((sum, split) => sum + split.amount, 0);
      if (toCents(totalSplits) !== toCents(totalNumber)) {
        setError("Custom splits must add up to the total amount.");
        return;
      }
    }

    setIsSubmitting(true);
    const response = await fetch(`/api/expenses/${expenseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: description.trim(),
        total_amount: totalNumber,
        paid_by_participant_id: paidBy || null,
        occurred_at: occurredAt ? new Date(occurredAt).toISOString() : null,
        splits,
        pot_id: pot.id,
      }),
    });
    setIsSubmitting(false);

    if (!response.ok) {
      setError("Failed to update expense.");
      return;
    }

    await loadData();
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1>Edit expense</h1>
            <p>Update the description, payer, date, and split participants.</p>
          </div>
          <div className={styles.headerLinks}>
            <a className={styles.backLink} href="/expenses">
              Back to expenses
            </a>
            <a className={styles.secondaryLink} href="/">
              Back to balances
            </a>
          </div>
        </header>

        {error && <div className={styles.error}>{error}</div>}

        {!pot && isPotReady ? (
          <div className={styles.form}>
            <p>Please select a pot before editing an expense.</p>
            <a className={styles.backLink} href="/">
              Choose a pot
            </a>
          </div>
        ) : !expenseId ? (
          <div className={styles.form}>
            <p>Missing expense id.</p>
          </div>
        ) : isLoading ? (
          <div className={styles.form}>
            <p>Loading expense...</p>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.label}>
              Description
              <input
                className={styles.input}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Groceries"
              />
            </label>

            <label className={styles.label}>
              Total amount
              <input
                className={styles.input}
                type="number"
                min="0"
                step="0.01"
                value={totalAmount}
                onChange={(event) => setTotalAmount(event.target.value)}
                placeholder="120.00"
              />
            </label>

            <label className={styles.label}>
              Paid by
              <select
                className={styles.input}
                value={paidBy}
                onChange={(event) => setPaidBy(event.target.value)}
              >
                <option value="" disabled>
                  Select a participant
                </option>
                {participants.map((participant) => (
                  <option key={participant.id} value={participant.id}>
                    {participant.name}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.label}>
              Date
              <input
                className={styles.input}
                type="date"
                value={occurredAt}
                onChange={(event) => setOccurredAt(event.target.value)}
              />
            </label>

            <div className={styles.splitMode}>
              <span>Split mode</span>
              <button
                type="button"
                className={
                  splitMode === "equal" ? styles.modeActive : styles.modeButton
                }
                onClick={() => setSplitMode("equal")}
              >
                Equal split
              </button>
              <button
                type="button"
                className={
                  splitMode === "custom" ? styles.modeActive : styles.modeButton
                }
                onClick={() => setSplitMode("custom")}
              >
                Custom split
              </button>
            </div>

            <div className={styles.participants}>
              <h3>Participants</h3>
              <div className={styles.participantList}>
                {participants.map((participant) => (
                  <label key={participant.id} className={styles.participantItem}>
                    <input
                      type="checkbox"
                      checked={selectedSet.has(participant.id)}
                      onChange={() => handleToggleParticipant(participant.id)}
                    />
                    <span>{participant.name}</span>
                    {splitMode === "custom" &&
                      selectedSet.has(participant.id) && (
                        <input
                          className={styles.splitInput}
                          type="number"
                          min="0"
                          step="0.01"
                          value={customSplits[participant.id] || ""}
                          onChange={(event) =>
                            handleCustomSplitChange(
                              participant.id,
                              event.target.value,
                            )
                          }
                          placeholder="0.00"
                        />
                      )}
                  </label>
                ))}
              </div>
            </div>

            <button
              className={styles.button}
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save changes"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
