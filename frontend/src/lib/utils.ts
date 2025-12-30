import { formatUnits, parseEther } from "viem";

export function formatPrice(raw: string) {
  return `${formatUnits(BigInt(raw || "0"), 18)} ETH`;
}

export function toPriceUnits(amount: string): bigint {
  return parseEther(amount || "0");
}
