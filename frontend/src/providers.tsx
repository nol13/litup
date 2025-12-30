import { ReactNode, useMemo } from "react";
import { createConfig, http, WagmiProvider } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { coinbaseWallet, injected } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { createPublicClient } from "viem";

const rpcUrl = import.meta.env.VITE_RPC_URL as string | undefined;

// Dynamic chain selection: defaults to baseSepolia if not specified as 'base'
const chainName = import.meta.env.VITE_CHAIN_NAME || "baseSepolia";
const activeChain = chainName === "base" ? base : baseSepolia;

export const config = createConfig({
  chains: [activeChain],
  multiInjectedProviderDiscovery: true,
  transports: {
    [activeChain.id]: http(rpcUrl),
  } as any,
  connectors: [
    injected(),
    coinbaseWallet({ appName: "LitUp", preference: "all" }),
  ],
});

const defaultPublicClients = {
  [activeChain.id]: createPublicClient({ chain: activeChain, transport: http(rpcUrl) }),
};

const queryClient = new QueryClient();

export function AppProviders({ children }: { children: ReactNode }) {
  const apiKey = useMemo(() => import.meta.env.VITE_ONCHAINKIT_API_KEY as string | undefined, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider apiKey={apiKey} chain={activeChain} rpcUrl={rpcUrl} defaultPublicClients={defaultPublicClients as any}>
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
