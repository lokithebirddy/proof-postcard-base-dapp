import type { Address } from "viem";

export const MAX_TITLE_LENGTH = 36;
export const MAX_PLACE_LENGTH = 40;
export const MAX_STAMP_LENGTH = 16;
export const MAX_NOTE_LENGTH = 180;

export const proofPostcardAbi = [
  {
    type: "function",
    name: "sendPostcard",
    stateMutability: "nonpayable",
    inputs: [
      { name: "title", type: "string" },
      { name: "place", type: "string" },
      { name: "stamp", type: "string" },
      { name: "note", type: "string" },
    ],
    outputs: [{ name: "postcardId", type: "uint256" }],
  },
  {
    type: "function",
    name: "getPostcard",
    stateMutability: "view",
    inputs: [{ name: "postcardId", type: "uint256" }],
    outputs: [
      { name: "sender", type: "address" },
      { name: "title", type: "string" },
      { name: "place", type: "string" },
      { name: "stamp", type: "string" },
      { name: "note", type: "string" },
      { name: "createdAt", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "nextPostcardId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

function isAddressLike(value?: string) {
  return Boolean(value && /^0x[a-fA-F0-9]{40}$/.test(value));
}

const configuredProofPostcardContractAddress =
  process.env.NEXT_PUBLIC_PROOF_POSTCARD_CONTRACT_ADDRESS?.trim();

export const proofPostcardContractAddress = isAddressLike(
  configuredProofPostcardContractAddress,
)
  ? (configuredProofPostcardContractAddress as Address)
  : undefined;
