"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Link from "next/link";

import AppShell from "../../../components/layout/AppShell";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";

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

  const selectClassName =
    "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500";
  const chipClass = (active: boolean) =>
    active
      ? "rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white"
      : "rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50";
  const primaryLinkClass =
    "inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500";
  const secondaryLinkClass =
    "inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <AppShell
      title="Record an expense"
      subtitle="Share the cost across selected participants."
    >
      <div className="flex items-center justify-between">
        <Link className={secondaryLinkClass} href="/">
          Back to balances
        </Link>
        <Link className={primaryLinkClass} href="/expenses">
          View expenses
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
            You need to select a pot before recording an expense.
          </p>
          <Link className={primaryLinkClass} href="/">
            Choose a pot
          </Link>
        </Card>
      ) : (
        <Card className="mt-6">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block text-sm font-medium text-gray-700">
                Description
                <Input
                  className="mt-2"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Groceries"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Total amount
                <Input
                  className="mt-2"
                  type="number"
                  min="0"
                  step="0.01"
                  value={totalAmount}
                  onChange={(event) => setTotalAmount(event.target.value)}
                  placeholder="120.00"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Paid by
                <select
                  className={`${selectClassName} mt-2`}
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
              <div className="flex items-end gap-2">
                <Badge variant="info">Split mode</Badge>
                <button
                  type="button"
                  className={chipClass(splitMode === "equal")}
                  onClick={() => setSplitMode("equal")}
                >
                  Equal split
                </button>
                <button
                  type="button"
                  className={chipClass(splitMode === "custom")}
                  onClick={() => setSplitMode("custom")}
                >
                  Custom split
                </button>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  Participants
                </h3>
                <span className="text-xs text-gray-500">
                  Select who shares this expense.
                </span>
              </div>
              <div className="space-y-3">
                {participants.map((participant) => (
                  <label
                    key={participant.id}
                    className="flex flex-col gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-700 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedSet.has(participant.id)}
                        onChange={() => handleToggleParticipant(participant.id)}
                      />
                      <span>{participant.name}</span>
                    </div>
                    {splitMode === "custom" &&
                      selectedSet.has(participant.id) && (
                        <Input
                          className="w-full md:w-32"
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

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Saving..." : "Save expense"}
            </Button>
          </form>
        </Card>
      )}
    </AppShell>
  );
}
