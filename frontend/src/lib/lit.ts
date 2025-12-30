import { LitNodeClient } from "@lit-protocol/lit-node-client";
import {
  encryptString,
  decryptToString,
} from "@lit-protocol/encryption";
import { checkAndSignAuthMessage } from "@lit-protocol/lit-node-client";
import { LITUP_CONTRACT_ADDRESS } from "./constants";
import { LitNetwork } from "@lit-protocol/constants";

const litNetwork = (import.meta.env.VITE_LIT_NETWORK as any) || LitNetwork.DatilDev;
const chainName = import.meta.env.VITE_CHAIN_NAME || "baseSepolia";
// Ensure correct mapping for Lit Protocol chain strings if they differ from viem names,
// but usually "base" and "baseSepolia" are standard.
const chain = chainName;

let client: LitNodeClient | null = null;

async function getLitClient() {
  if (client) return client;
  client = new LitNodeClient({
    litNetwork,
    debug: false
  });
  await client.connect();
  return client;
}

function accessControlConditions(postId: number | string) {
  return [
    {
      contractAddress: LITUP_CONTRACT_ADDRESS,
      standardContractType: "ERC1155",
      chain,
      functionName: "balanceOf",
      functionParams: [":userAddress", postId.toString()],
      functionAbi: {
        inputs: [
          { internalType: "address", name: "account", type: "address" },
          { internalType: "uint256", name: "id", type: "uint256" },
        ],
        name: "balanceOf",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
      returnValueTest: {
        comparator: ">",
        value: "0",
      },
    },
    { operator: "or" },
    {
      contractAddress: LITUP_CONTRACT_ADDRESS,
      standardContractType: "Custom",
      chain,
      functionName: "hasAccess",
      functionParams: [":userAddress", postId.toString()],
      functionAbi: {
        inputs: [
          { internalType: "address", name: "user", type: "address" },
          { internalType: "uint256", name: "postId", type: "uint256" },
        ],
        name: "hasAccess",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "view",
        type: "function",
      },
      returnValueTest: {
        comparator: "=",
        value: "true",
      },
    },
  ];
}

export type EncryptedPayload = {
  ciphertext: string; // base64
  dataToEncryptHash: string; // hex string for the hash
};

export async function encryptContent(postId: number, content: string): Promise<EncryptedPayload> {
  const lit = await getLitClient();

  // @ts-ignore
  const { ciphertext, dataToEncryptHash } = await encryptString(
    {
      accessControlConditions: accessControlConditions(postId),
      dataToEncrypt: content,
    },
    lit
  );

  return {
    ciphertext,
    dataToEncryptHash,
  };
}

export async function decryptContent(postId: number, payload: EncryptedPayload): Promise<string> {
  const lit = await getLitClient();

  const authSig = await checkAndSignAuthMessage({
    chain,
    nonce: await lit.getLatestBlockhash(),
  });

  const decryptedString = await decryptToString(
    {
      accessControlConditions: accessControlConditions(postId),
      chain,
      ciphertext: payload.ciphertext,
      dataToEncryptHash: payload.dataToEncryptHash,
      authSig,
    },
    lit
  );

  return decryptedString;
}
