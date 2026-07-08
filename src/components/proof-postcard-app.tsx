"use client";

import {
  Loader2,
  MapPin,
  Search,
  Send,
  Stamp,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Address } from "viem";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { base } from "wagmi/chains";
import {
  MAX_NOTE_LENGTH,
  MAX_PLACE_LENGTH,
  MAX_STAMP_LENGTH,
  MAX_TITLE_LENGTH,
  proofPostcardAbi,
  proofPostcardContractAddress,
} from "@/lib/proof-postcard";

const STAMPS = ["ARRIVED", "SHIPPED", "ATTENDED", "BUILT", "SIGNED"] as const;

function shortAddress(address?: Address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDate(createdAt?: bigint) {
  if (!createdAt) return "--";
  return new Date(Number(createdAt) * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function PostcardPreview({
  title,
  place,
  stamp,
  note,
  sender,
  date,
}: {
  title: string;
  place: string;
  stamp: string;
  note: string;
  sender?: Address;
  date?: bigint;
}) {
  return (
    <div className="border-2 border-[#24201a] bg-[#fff8e6] p-5 shadow-[10px_10px_0_#24201a]">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_230px]">
        <section className="min-h-[420px] border-2 border-dashed border-[#8d7358] bg-[#f9edcf] p-5">
          <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#8d7358]">
            Proof Postcard
          </p>
          <h2 className="mt-4 text-5xl font-black leading-none text-[#24201a]">
            {title}
          </h2>
          <div className="mt-5 inline-flex items-center gap-2 border-2 border-[#24201a] bg-[#dff3ff] px-3 py-2 font-black">
            <MapPin className="h-4 w-4" />
            {place}
          </div>
          <p className="mt-6 max-w-xl text-lg font-semibold leading-8 text-[#4f463a]">
            {note}
          </p>
        </section>

        <aside className="border-l-2 border-dashed border-[#8d7358] pl-5">
          <div className="grid aspect-square place-items-center border-2 border-[#24201a] bg-[#ffd6d6] p-4 text-center">
            <div className="rotate-[-8deg] border-4 border-[#b42318] px-4 py-6 font-mono text-2xl font-black uppercase text-[#b42318]">
              {stamp}
            </div>
          </div>
          <div className="mt-5 space-y-4 font-mono text-xs font-black uppercase tracking-[0.14em] text-[#655846]">
            <div className="border-b-2 border-[#8d7358] pb-3">
              <p>Sender</p>
              <p className="mt-2 text-[#24201a]">{sender ? shortAddress(sender) : "--"}</p>
            </div>
            <div className="border-b-2 border-[#8d7358] pb-3">
              <p>Date</p>
              <p className="mt-2 text-[#24201a]">{formatDate(date)}</p>
            </div>
            <div>
              <p>Network</p>
              <p className="mt-2 text-[#24201a]">Base</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function ProofPostcardApp() {
  const [postcardIdInput, setPostcardIdInput] = useState("1");
  const [title, setTitle] = useState("Demo Day Proof");
  const [place, setPlace] = useState("Base Builder Space");
  const [stamp, setStamp] = useState<(typeof STAMPS)[number]>("ATTENDED");
  const [note, setNote] = useState(
    "A simple postcard proof for a place, launch, event, or milestone worth remembering on Base.",
  );
  const [status, setStatus] = useState(
    "Create one postcard proof with place, stamp, and note.",
  );

  const { address, chainId, connector, isConnected } = useAccount();
  const { connectors, connectAsync, isPending: connecting } = useConnect();
  const { disconnectAsync } = useDisconnect();
  async function disconnectWallet() {
    try {
      if (connector) {
        await disconnectAsync({ connector });
      } else {
        await disconnectAsync();
      }
    } catch {}
  }
  const { switchChain, isPending: switching } = useSwitchChain();
  const {
    data: hash,
    writeContract,
    isPending: writing,
    error: writeError,
  } = useWriteContract();
  const { isLoading: confirming, isSuccess: confirmed } =
    useWaitForTransactionReceipt({ hash });

  const selectedConnector =
    connectors.find((connector) => connector.id === "injected") ??
    connectors.find((connector) => connector.id === "baseAccount") ??
    connectors[0];
  const parsedPostcardId = BigInt(Math.max(1, Number(postcardIdInput || "1")));

  const postcardQuery = useReadContract({
    abi: proofPostcardAbi,
    address: proofPostcardContractAddress,
    functionName: "getPostcard",
    args: [parsedPostcardId],
    query: {
      enabled: Boolean(proofPostcardContractAddress),
      refetchInterval: 12000,
    },
  });

  const totalQuery = useReadContract({
    abi: proofPostcardAbi,
    address: proofPostcardContractAddress,
    functionName: "nextPostcardId",
    query: {
      enabled: Boolean(proofPostcardContractAddress),
      refetchInterval: 12000,
    },
  });

  const tuple = postcardQuery.data as
    | readonly [Address, string, string, string, string, bigint]
    | undefined;

  const livePostcard = useMemo(
    () =>
      tuple
        ? {
            sender: tuple[0],
            title: tuple[1],
            place: tuple[2],
            stamp: tuple[3],
            note: tuple[4],
            createdAt: tuple[5],
          }
        : undefined,
    [tuple],
  );

  const totalPostcards = totalQuery.data ? Math.max(Number(totalQuery.data) - 1, 0) : 0;
  const displayTitle = livePostcard?.title ?? title;
  const displayPlace = livePostcard?.place ?? place;
  const displayStamp = livePostcard?.stamp ?? stamp;
  const displayNote = livePostcard?.note ?? note;

  const canSend =
    Boolean(proofPostcardContractAddress) &&
    isConnected &&
    chainId === base.id &&
    title.trim().length > 0 &&
    title.trim().length <= MAX_TITLE_LENGTH &&
    place.trim().length > 0 &&
    place.trim().length <= MAX_PLACE_LENGTH &&
    stamp.trim().length > 0 &&
    stamp.trim().length <= MAX_STAMP_LENGTH &&
    note.trim().length > 0 &&
    note.trim().length <= MAX_NOTE_LENGTH;

  const statusText = confirmed
    ? "Postcard proof saved on Base."
    : writeError
      ? writeError.message
      : status;

  const sendBlocker = !proofPostcardContractAddress
    ? "Contract not deployed yet. Run npm run deploy:contract, then add NEXT_PUBLIC_PROOF_POSTCARD_CONTRACT_ADDRESS."
    : !isConnected
      ? "Connect wallet first."
      : chainId !== base.id
        ? "Switch to Base before saving."
        : title.trim().length === 0
          ? "Add a title."
          : place.trim().length === 0
            ? "Add a place."
            : note.trim().length === 0
              ? "Add a proof note."
              : "";

  async function connectWallet() {
    const connectorQueue = [
      connectors.find((connector) => connector.id === "injected"),
      connectors.find((connector) => connector.id === "baseAccount"),
      selectedConnector,
    ]
      .filter((connector): connector is NonNullable<typeof selectedConnector> =>
        Boolean(connector),
      )
      .filter(
        (connector, index, queue) =>
          queue.findIndex((item) => item.id === connector.id) === index,
      );

    if (connectorQueue.length === 0) {
      setStatus("No wallet connector found. Open this app inside Base App or a wallet browser.");
      return;
    }

    let lastError: unknown;
    setStatus("Opening wallet connection...");

    for (const connector of connectorQueue) {
      try {
        await connectAsync({ connector });
        setStatus("Wallet connected. Save your postcard when ready.");
        return;
      } catch (error) {
        lastError = error;
      }
    }

    const message =
      lastError instanceof Error ? lastError.message : "Wallet connection was cancelled.";
    setStatus(
      message.includes("wallet_connect")
        ? "This browser does not support that wallet method. Refresh once, then open inside Base App or a wallet browser."
        : message,
    );
  }

  function sendPostcard() {
    const contractAddress = proofPostcardContractAddress;

    if (!canSend) {
      setStatus(sendBlocker || "Check wallet, network, and postcard fields before saving.");
      return;
    }

    if (!contractAddress) {
      setStatus("Contract not deployed yet. Run npm run deploy:contract first.");
      return;
    }

    setStatus("Confirm the proof postcard in your wallet.");
    writeContract({
      address: contractAddress,
      abi: proofPostcardAbi,
      functionName: "sendPostcard",
      args: [title.trim(), place.trim(), stamp.trim(), note.trim()],
      chainId: base.id,
    });
  }

  return (
    <main className="min-h-screen bg-[#efe0be] text-[#24201a]">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[380px_minmax(0,1fr)] lg:px-6">
        <aside className="border-2 border-[#24201a] bg-[#fff8e6] p-4 shadow-[8px_8px_0_#24201a]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#8d7358]">
                Proof Postcard
              </p>
              <h1 className="mt-2 text-4xl font-black leading-none">
                Mail a proof to Base.
              </h1>
            </div>
            <div className="grid h-12 w-12 shrink-0 place-items-center border-2 border-[#24201a] bg-[#dff3ff]">
              <Stamp className="h-6 w-6" />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="border-2 border-[#24201a] bg-[#f9edcf] p-3">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#8d7358]">
                Cards
              </p>
              <p className="mt-2 text-3xl font-black">{totalPostcards}</p>
            </div>
            <div className="border-2 border-[#24201a] bg-[#f9edcf] p-3">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#8d7358]">
                Chain
              </p>
              <p className="mt-2 text-xl font-black">Base</p>
            </div>
          </div>

          <section className="mt-4 border-2 border-[#24201a] bg-[#f9edcf] p-4">
            <h2 className="text-xl font-black">Write postcard</h2>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#8d7358]">
                  Title
                </span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={MAX_TITLE_LENGTH}
                  className="mt-1 w-full border-2 border-[#24201a] bg-white px-3 py-3 font-black outline-none"
                />
              </label>

              <label className="block">
                <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#8d7358]">
                  Place
                </span>
                <input
                  value={place}
                  onChange={(event) => setPlace(event.target.value)}
                  maxLength={MAX_PLACE_LENGTH}
                  className="mt-1 w-full border-2 border-[#24201a] bg-white px-3 py-3 font-black outline-none"
                />
              </label>

              <div>
                <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#8d7358]">
                  Stamp
                </span>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {STAMPS.map((value) => (
                    <button
                      key={value}
                      className={`border-2 border-[#24201a] px-3 py-2 text-xs font-black ${
                        value === stamp ? "bg-[#ffd6d6] text-[#b42318]" : "bg-white"
                      }`}
                      onClick={() => setStamp(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#8d7358]">
                  Proof note
                </span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={MAX_NOTE_LENGTH}
                  rows={4}
                  className="mt-1 w-full border-2 border-[#24201a] bg-white px-3 py-3 text-sm font-bold leading-6 outline-none"
                />
              </label>
            </div>
          </section>

          <div className="mt-4 space-y-3">
            {isConnected && chainId !== base.id ? (
              <button
                className="inline-flex w-full items-center justify-center gap-2 border-2 border-[#24201a] bg-[#dff3ff] px-4 py-3 font-black shadow-[4px_4px_0_#24201a] disabled:opacity-60"
                disabled={switching}
                onClick={() => switchChain({ chainId: base.id })}
              >
                {switching ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Switch to Base
              </button>
            ) : (
              <button
                className="inline-flex w-full items-center justify-center gap-2 border-2 border-[#24201a] bg-[#ffd166] px-4 py-3 font-black shadow-[4px_4px_0_#24201a] disabled:opacity-60"
                disabled={!canSend || writing || confirming}
                onClick={sendPostcard}
              >
                {writing || confirming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Save on Base
              </button>
            )}

            {isConnected ? (
              <button
                className="inline-flex w-full items-center justify-center gap-2 border-2 border-[#24201a] bg-white px-4 py-3 font-black"
                onClick={disconnectWallet}
              >
                {shortAddress(address)}
              </button>
            ) : (
              <button
                className="inline-flex w-full items-center justify-center gap-2 border-2 border-[#24201a] bg-[#24201a] px-4 py-3 font-black text-white disabled:opacity-60"
                disabled={!selectedConnector || connecting}
                onClick={connectWallet}
              >
                {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                Connect wallet
              </button>
            )}

            <p className="border-2 border-[#24201a] bg-white px-3 py-3 text-sm font-bold leading-6">
              {statusText}
            </p>
            {sendBlocker && isConnected ? (
              <p className="border-2 border-[#24201a] bg-[#f9edcf] px-3 py-3 text-xs font-bold leading-5 text-[#4f463a]">
                {sendBlocker}
              </p>
            ) : null}
          </div>
        </aside>

        <section className="grid gap-4">
          <PostcardPreview
            title={displayTitle}
            place={displayPlace}
            stamp={displayStamp}
            note={displayNote}
            sender={livePostcard?.sender}
            date={livePostcard?.createdAt}
          />

          <div className="grid gap-4 xl:grid-cols-[330px_minmax(0,1fr)]">
            <div className="border-2 border-[#24201a] bg-[#fff8e6] p-4">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                <h2 className="text-2xl font-black">Load postcard</h2>
              </div>
              <label className="mt-4 block">
                <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#8d7358]">
                  Postcard ID
                </span>
                <input
                  value={postcardIdInput}
                  onChange={(event) =>
                    setPostcardIdInput(event.target.value.replace(/\D/g, ""))
                  }
                  className="mt-1 w-full border-2 border-[#24201a] bg-white px-3 py-3 text-2xl font-black outline-none"
                />
              </label>
            </div>

            <div className="border-2 border-[#24201a] bg-[#fff8e6] p-4">
              <p className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#8d7358]">
                What it does
              </p>
              <p className="mt-3 max-w-xl text-sm font-bold leading-6 text-[#4f463a]">
                Proof Postcard stores a compact title, place, stamp, note, sender,
                and timestamp on Base so a small milestone can be loaded again by ID.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
