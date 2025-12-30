import { ConnectWallet } from "@coinbase/onchainkit/wallet";
import { base } from "viem/chains";
import { useAccount, useChainId, useSwitchChain } from "wagmi";

export default function ConnectSection() {
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();
  const { isConnected } = useAccount();
  const wrongNetwork = chainId !== 0 && chainId !== base.id;

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <div className="section-title">Wallet</div>
          <div>{wrongNetwork ? "Switch to Base" : isConnected ? "Connected" : "Not connected"}</div>
        </div>
        <ConnectWallet />
      </div>
      {wrongNetwork && (
        <div style={{ marginTop: 12 }}>
          <button
            disabled={isPending}
            onClick={() => switchChain({ chainId: base.id })}
            className="input"
            style={{ cursor: "pointer" }}
          >
            {isPending ? "Switching..." : "Switch to Base"}
          </button>
        </div>
      )}
    </div>
  );
}
