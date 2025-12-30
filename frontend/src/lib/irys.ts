import { WebUploader } from "@irys/web-upload";
import WebEthereumViemV2 from "@irys/web-upload-ethereum-viem-v2";
import { getWalletClient } from "@wagmi/core";
import { config } from "../providers";

// WebUploader returns a specific type, but for now we can infer or use 'any' if types are complex factories
// Actually, let's treat it as 'any' for the type annotation to avoid "refers to a value" errors
// or use ReturnType if possible, but simplest is 'any' for rapid dev
let irys: any | null = null;

const nodeUrl = import.meta.env.VITE_IRYS_NODE || "https://devnet.irys.xyz";

async function getWebIrys(): Promise<any> {
    if (irys) return irys;

    const walletClient = await getWalletClient(config);
    if (!walletClient) {
        throw new Error("Wallet not connected");
    }

    // @ts-ignore
    const adapter = new WebEthereumViemV2(walletClient);

    // @ts-ignore
    irys = await WebUploader(WebEthereumViemV2).withProvider(adapter);

    return irys;
}

async function ensureBalance(client: any, price: any) {
    const bal = await client.getLoadedBalance();
    if (bal.gte(price)) return;
    const buffer = price.minus(bal).multipliedBy(1.1);
    await client.fund(buffer);
}


function encodeJson(obj: object): string {
    return JSON.stringify(obj);
}

export async function uploadPreview(previewJson: object): Promise<string> {
    const client = await getWebIrys();
    const payload = encodeJson(previewJson);
    const size = new TextEncoder().encode(payload).length;
    const price = await client.getPrice(size);
    await ensureBalance(client, price);
    const res = await client.upload(payload, { tags: [{ name: "Content-Type", value: "application/json" }] });
    return `https://arweave.net/${res.id}`;
}

export async function uploadEncryptedContent(content: object): Promise<string> {
    const client = await getWebIrys();
    const payload = encodeJson(content);
    const size = new TextEncoder().encode(payload).length;
    const price = await client.getPrice(size);
    await ensureBalance(client, price);
    const res = await client.upload(payload, { tags: [{ name: "Content-Type", value: "application/json" }] });
    return `https://arweave.net/${res.id}`;
}
