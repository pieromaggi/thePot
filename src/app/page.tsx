"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import styles from "./page.module.css";

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
  const searchParams = useSearchParams();

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
        setError("Invalid invite code.");
        return;
      }

      const data = (await response.json()) as { pot: Pot };
      setPot(data.pot);
      localStorage.setItem("pot", JSON.stringify(data.pot));
      window.history.replaceState({}, "", "/");
    };
    void joinWithInvite();
  }, [searchParams]);

  const balancesById = useMemo(() => {
    return new Map(balances.map((balance) => [balance.participant_id, balance]));
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

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1>Pot Tracker</h1>
            <p>Track group contributions, shared expenses, and balances.</p>
          </div>
          {pot && (
            <div className={styles.headerActions}>
              <a className={styles.expenseLink} href="/expenses/new">
                Record an expense
              </a>
              <a className={styles.secondaryLink} href="/expenses">
                View expenses
              </a>
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={handleLeavePot}
              >
                Switch pot
              </button>
            </div>
          )}
        </header>

        {error && <div className={styles.error}>{error}</div>}

        {!pot && isPotReady && (
          <section className={styles.section}>
            <h2>Create or join a pot</h2>
            <div className={styles.sectionGrid}>
              <form className={styles.card} onSubmit={handleCreatePot}>
                <h3>Create a pot</h3>
                <label className={styles.label}>
                  Pot name
                  <input
                    className={styles.input}
                    value={potNameInput}
                    onChange={(event) => setPotNameInput(event.target.value)}
                    placeholder="Weekend Trip"
                  />
                </label>
                <button className={styles.button} type="submit">
                  Create pot
                </button>
              </form>

              <form className={styles.card} onSubmit={handleJoinPot}>
                <h3>Join a pot</h3>
                <label className={styles.label}>
                  Invite code
                  <input
                    className={styles.input}
                    value={inviteInput}
                    onChange={(event) => setInviteInput(event.target.value)}
                    placeholder="AB12CD34"
                  />
                </label>
                <button className={styles.button} type="submit">
                  Join pot
                </button>
              </form>
            </div>
          </section>
        )}

        {pot && (
          <>
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2>{pot.name}</h2>
                  <p className={styles.mutedText}>
                    Invite code: <strong>{pot.invite_code}</strong>
                  </p>
                </div>
                <div className={styles.shareBox}>
                  <span>Share link</span>
                  <input className={styles.input} value={shareLink} readOnly />
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <h2>Balances</h2>
              {isLoading ? (
                <p>Loading balances...</p>
              ) : (
                <div className={styles.table}>
                  <div className={styles.tableRow}>
                    <div className={styles.tableHeader}>Participant</div>
                    <div className={styles.tableHeader}>Contributed</div>
                    <div className={styles.tableHeader}>Owed</div>
                    <div className={styles.tableHeader}>Balance</div>
                  </div>
                  {balances.map((balance) => (
                    <div key={balance.participant_id} className={styles.tableRow}>
                      <div className={styles.tableCell}>{balance.name}</div>
                      <div className={styles.tableCell}>
                        {currency.format(balance.contributed)}
                      </div>
                      <div className={styles.tableCell}>
                        {currency.format(balance.owed)}
                      </div>
                      <div
                        className={`${styles.tableCell} ${
                          balance.balance >= 0 ? styles.positive : styles.negative
                        }`}
                      >
                        {currency.format(balance.balance)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className={styles.sectionGrid}>
              <form className={styles.card} onSubmit={handleAddParticipant}>
                <h3>Add participant</h3>
                <label className={styles.label}>
                  Name
                  <input
                    className={styles.input}
                    value={newParticipantName}
                    onChange={(event) => setNewParticipantName(event.target.value)}
                    placeholder="Jordan"
                  />
                </label>
                <button className={styles.button} type="submit">
                  Add participant
                </button>
              </form>

              <form className={styles.card} onSubmit={handleAddContribution}>
                <h3>Add contribution</h3>
                <label className={styles.label}>
                  Participant
                  <select
                    className={styles.input}
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
                </label>
                <label className={styles.label}>
                  Amount
                  <input
                    className={styles.input}
                    type="number"
                    min="0"
                    step="0.01"
                    value={contributionAmount}
                    onChange={(event) => setContributionAmount(event.target.value)}
                    placeholder="25.00"
                  />
                </label>
                <label className={styles.label}>
                  Note
                  <input
                    className={styles.input}
                    value={contributionNote}
                    onChange={(event) => setContributionNote(event.target.value)}
                    placeholder="Monthly top-up"
                  />
                </label>
                <button className={styles.button} type="submit">
                  Record contribution
                </button>
              </form>

              <div className={styles.card}>
                <h3>Participants</h3>
                <ul className={styles.list}>
                  {participants.map((participant) => {
                    const balance = balancesById.get(participant.id);
                    return (
                      <li key={participant.id}>
                        <span>{participant.name}</span>
                        <span>
                          {balance ? currency.format(balance.balance) : "--"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
