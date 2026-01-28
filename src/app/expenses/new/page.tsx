"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import styles from "./page.module.css";

type Participant = {
  id: string;
  name: string;
};

type SplitMode = "equal" | "custom";

type Pot = {
  id: string;
  name: string;
  invite_code: string;
};

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

export default function NewExpensePage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    [],
  );
  const [splitMode, setSplitMode] = useState<SplitMode>("equal");
  const [totalAmount, setTotalAmount] = useState("");
  const [description, setDescription] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pot, setPot] = useState<Pot | null>(null);
  const [isPotReady, setIsPotReady] = useState(false);

  const loadParticipants = useCallback(async () => {
    if (!pot) return;
    const response = await fetch(`/api/participants?pot_id=${pot.id}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      setError("Failed to load participants.");
      return;
    }
    const data = (await response.json()) as { participants: Participant[] };
    setParticipants(data.participants);
    if (!paidBy && data.participants.length) {
      setPaidBy(data.participants[0].id);
    }
  }, [paidBy, pot]);

  useEffect(() => {
    void loadParticipants();
  }, [loadParticipants]);

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

  const totalNumber = Number.parseFloat(totalAmount);
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
    setError(null);

    if (!description.trim()) {
      setError("Description is required.");
      return;
    }

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
    const response = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: description.trim(),
        pot_id: pot?.id,
        total_amount: totalNumber,
        paid_by_participant_id: paidBy || undefined,
        splits,
      }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      setError("Failed to record expense.");
      return;
    }

    setDescription("");
    setTotalAmount("");
    setSelectedParticipants([]);
    setCustomSplits({});
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1>Record an expense</h1>
            <p>Share the cost across selected participants.</p>
          </div>
          <div className={styles.headerLinks}>
            <a className={styles.backLink} href="/">
              Back to balances
            </a>
            <a className={styles.secondaryLink} href="/expenses">
              View expenses
            </a>
          </div>
        </header>

        {error && <div className={styles.error}>{error}</div>}

        {!pot && isPotReady ? (
          <div className={styles.form}>
            <p>You need to select a pot before recording an expense.</p>
            <a className={styles.backLink} href="/">
              Choose a pot
            </a>
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
                  {splitMode === "custom" && selectedSet.has(participant.id) && (
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
              {isSubmitting ? "Saving..." : "Save expense"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
