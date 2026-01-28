"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import AppShell from "../components/layout/AppShell";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import StatCard from "../components/ui/StatCard";
import Table from "../components/ui/Table";

type Participant = {
  id: string;
  name: string;
};

type Balance = {
  participant_id: string;
  name: string;
  contributed: number;
  owed: number;
  balance: number;
};

type Pot = {
  id: string;
  name: string;
  invite_code: string;
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function Home() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newParticipantName, setNewParticipantName] = useState("");
  const [contributionParticipantId, setContributionParticipantId] =
    useState("");
  const [contributionAmount, setContributionAmount] = useState("");
  const [contributionNote, setContributionNote] = useState("");
  const [pot, setPot] = useState<Pot | null>(null);
  const [potNameInput, setPotNameInput] = useState("");
  const [inviteInput, setInviteInput] = useState("");
  const [isPotReady, setIsPotReady] = useState(false);
  const loadData = useCallback(async () => {
    try {
      if (!pot) return;
      setIsLoading(true);
      setError(null);
      const [participantsRes, balancesRes] = await Promise.all([
        fetch(`/api/participants?pot_id=${pot.id}`, { cache: "no-store" }),
        fetch(`/api/balances?pot_id=${pot.id}`, { cache: "no-store" }),
      ]);

      if (!participantsRes.ok || !balancesRes.ok) {
        throw new Error("Failed to load balances.");
      }

      const participantsJson = (await participantsRes.json()) as {
        participants: Participant[];
      };
      const balancesJson = (await balancesRes.json()) as {
        balances: Balance[];
      };

      setParticipants(participantsJson.participants);
      setBalances(balancesJson.balances);

      if (!contributionParticipantId && participantsJson.participants.length) {
        setContributionParticipantId(participantsJson.participants[0].id);
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Unknown error.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [contributionParticipantId, pot]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

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

  const handleInviteJoin = useCallback(
    (joinedPot: Pot) => {
      setPot(joinedPot);
      localStorage.setItem("pot", JSON.stringify(joinedPot));
      window.history.replaceState({}, "", "/");
    },
    [setPot],
  );

  const handleInviteError = useCallback(
    (message: string) => {
      setError(message);
    },
    [setError],
  );

  const balancesById = useMemo(() => {
    return new Map(balances.map((balance) => [balance.participant_id, balance]));
  }, [balances]);

  const totalContributed = useMemo(() => {
    return balances.reduce((sum, balance) => sum + balance.contributed, 0);
  }, [balances]);

  const totalOwed = useMemo(() => {
    return balances.reduce((sum, balance) => sum + balance.owed, 0);
  }, [balances]);

  const netBalance = useMemo(() => {
    return balances.reduce((sum, balance) => sum + balance.balance, 0);
  }, [balances]);

  const handleAddParticipant = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newParticipantName.trim() || !pot) return;

    const response = await fetch("/api/participants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newParticipantName.trim(), pot_id: pot.id }),
    });

    if (!response.ok) {
      setError("Failed to add participant.");
      return;
    }

    setNewParticipantName("");
    await loadData();
  };

  const handleAddContribution = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!pot) return;
    const amount = Number.parseFloat(contributionAmount);
    if (!contributionParticipantId || !amount || amount <= 0) return;

    const response = await fetch("/api/contributions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participant_id: contributionParticipantId,
        pot_id: pot.id,
        amount,
        note: contributionNote.trim() || undefined,
      }),
    });

    if (!response.ok) {
      setError("Failed to add contribution.");
      return;
    }

    setContributionAmount("");
    setContributionNote("");
    await loadData();
  };

  const handleCreatePot = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = potNameInput.trim();
    if (!name) return;

    const response = await fetch("/api/pots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      setError("Failed to create pot.");
      return;
    }

    const data = (await response.json()) as { pot: Pot };
    setPot(data.pot);
    localStorage.setItem("pot", JSON.stringify(data.pot));
    setPotNameInput("");
  };

  const handleJoinPot = async (event: React.FormEvent) => {
    event.preventDefault();
    const inviteCode = inviteInput.trim();
    if (!inviteCode) return;

    const response = await fetch("/api/pots/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invite_code: inviteCode }),
    });

    if (!response.ok) {
      setError("Invalid invite code.");
      return;
    }

    const data = (await response.json()) as { pot: Pot };
    setPot(data.pot);
    localStorage.setItem("pot", JSON.stringify(data.pot));
    setInviteInput("");
  };

  const handleLeavePot = () => {
    setPot(null);
    setParticipants([]);
    setBalances([]);
    localStorage.removeItem("pot");
  };

  const shareLink = pot
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/?invite=${
        pot.invite_code
      }`
    : "";

  const selectClassName =
    "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500";
  const primaryLinkClass =
    "inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500";
  const secondaryLinkClass =
    "inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <AppShell
      title="Pot Tracker"
      subtitle="Track group contributions, shared expenses, and balances."
    >
      <Suspense fallback={null}>
        <InviteJoiner onJoined={handleInviteJoin} onError={handleInviteError} />
      </Suspense>
      <div className="flex items-center justify-between">
        {pot ? (
          <div className="flex items-center gap-3">
            <Link className={primaryLinkClass} href="/expenses/new">
              Record expense
            </Link>
            <Link className={secondaryLinkClass} href="/expenses">
              View expenses
            </Link>
          </div>
        ) : (
          <div />
        )}
        {pot ? (
          <Button variant="ghost" onClick={handleLeavePot}>
            Switch pot
          </Button>
        ) : null}
      </div>

      {error && (
        <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!pot && isPotReady && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Create a pot</h2>
                <p className="text-sm text-gray-500">
                  Start a new shared pot for your group.
                </p>
              </div>
              <Badge variant="info">New</Badge>
            </div>
            <form className="mt-6 space-y-4" onSubmit={handleCreatePot}>
              <label className="block text-sm font-medium text-gray-700">
                Pot name
              </label>
              <Input
                value={potNameInput}
                onChange={(event) => setPotNameInput(event.target.value)}
                placeholder="Weekend Trip"
              />
              <Button type="submit" className="w-full">
                Create pot
              </Button>
            </form>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Join a pot</h2>
                <p className="text-sm text-gray-500">
                  Use an invite code to join an existing pot.
                </p>
              </div>
              <Badge variant="neutral">Invite</Badge>
            </div>
            <form className="mt-6 space-y-4" onSubmit={handleJoinPot}>
              <label className="block text-sm font-medium text-gray-700">
                Invite code
              </label>
              <Input
                value={inviteInput}
                onChange={(event) => setInviteInput(event.target.value)}
                placeholder="AB12CD34"
              />
              <Button type="submit" className="w-full">
                Join pot
              </Button>
            </form>
          </Card>
        </div>
      )}

      {pot && (
        <div className="mt-6 space-y-6">
          <Card className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{pot.name}</h2>
              <p className="text-sm text-gray-500">
                Invite code:{" "}
                <span className="font-semibold text-gray-900">
                  {pot.invite_code}
                </span>
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 md:max-w-xs">
              <span className="text-xs uppercase tracking-wide text-gray-400">
                Share link
              </span>
              <Input value={shareLink} readOnly />
            </div>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Participants"
              value={String(participants.length)}
            />
            <StatCard
              label="Total contributed"
              value={currency.format(totalContributed)}
            />
            <StatCard label="Total owed" value={currency.format(totalOwed)} />
            <StatCard label="Net balance" value={currency.format(netBalance)} />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900">Balances</h2>
            <p className="text-sm text-gray-500">
              See who has contributed and who is owed.
            </p>
          </div>
          {isLoading ? (
            <p className="text-sm text-gray-500">Loading balances...</p>
          ) : (
            <Table
              headers={["Participant", "Contributed", "Owed", "Balance"]}
              rows={balances.map((balance) => ({
                key: balance.participant_id,
                cells: [
                  <span key="name">{balance.name}</span>,
                  <span key="contributed">
                    {currency.format(balance.contributed)}
                  </span>,
                  <span key="owed">{currency.format(balance.owed)}</span>,
                  <span
                    key="balance"
                    className={`font-semibold ${
                      balance.balance >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {currency.format(balance.balance)}
                  </span>,
                ],
              }))}
            />
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <h3 className="text-lg font-semibold text-gray-900">
                Add participant
              </h3>
              <form className="mt-4 space-y-4" onSubmit={handleAddParticipant}>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <Input
                  value={newParticipantName}
                  onChange={(event) => setNewParticipantName(event.target.value)}
                  placeholder="Jordan"
                />
                <Button type="submit" className="w-full">
                  Add participant
                </Button>
              </form>
            </Card>

            <Card className="lg:col-span-1">
              <h3 className="text-lg font-semibold text-gray-900">
                Add contribution
              </h3>
              <form className="mt-4 space-y-4" onSubmit={handleAddContribution}>
                <label className="block text-sm font-medium text-gray-700">
                  Participant
                </label>
                <select
                  className={selectClassName}
                  value={contributionParticipantId}
                  onChange={(event) =>
                    setContributionParticipantId(event.target.value)
                  }
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
                <label className="block text-sm font-medium text-gray-700">
                  Amount
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={contributionAmount}
                  onChange={(event) => setContributionAmount(event.target.value)}
                  placeholder="25.00"
                />
                <label className="block text-sm font-medium text-gray-700">
                  Note
                </label>
                <Input
                  value={contributionNote}
                  onChange={(event) => setContributionNote(event.target.value)}
                  placeholder="Monthly top-up"
                />
                <Button type="submit" className="w-full">
                  Record contribution
                </Button>
              </form>
            </Card>

            <Card className="lg:col-span-1">
              <h3 className="text-lg font-semibold text-gray-900">
                Participants
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-gray-600">
                {participants.map((participant) => {
                  const balance = balancesById.get(participant.id);
                  return (
                    <li
                      key={participant.id}
                      className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-b-0 last:pb-0"
                    >
                      <span>{participant.name}</span>
                      <span className="font-medium text-gray-900">
                        {balance ? currency.format(balance.balance) : "--"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  );
}

type InviteJoinerProps = {
  onJoined: (pot: Pot) => void;
  onError: (message: string) => void;
};

function InviteJoiner({ onJoined, onError }: InviteJoinerProps) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const inviteCode = searchParams.get("invite");
    if (!inviteCode) return;

    const joinWithInvite = async () => {
      const response = await fetch("/api/pots/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_code: inviteCode }),
      });

      if (!response.ok) {
        onError("Invalid invite code.");
        return;
      }

      const data = (await response.json()) as { pot: Pot };
      onJoined(data.pot);
    };

    void joinWithInvite();
  }, [searchParams, onJoined, onError]);

  return null;
}
