import { isAddress } from "viem";

const EVM_NETWORKS = new Set([
  "ethereum",
  "polygon",
  "bsc",
  "arbitrum",
  "optimism",
  "avalanche",
  "base",
  "linea",
  "cronos",
  "fantom",
  "gnosis",
  "moonbeam",
  "zksync",
  "scroll",
  "mantle",
  "blast",
  "unichain",
  "worldchain",
  "immutable",
  "ronin",
]);

export function isEvmNetwork(network: string) {
  return EVM_NETWORKS.has(network.trim().toLowerCase());
}

export function validateEvmAddress(address: string) {
  return isAddress(address.trim());
}

export type WalletCheck =
  | { ok: true; method: "viem" | "transak" }
  | { ok: false; reason: string };

export async function validateDestinationWallet(input: {
  address: string;
  network: string;
  cryptoCurrency: string;
  verifyWithTransak?: (address: string) => Promise<boolean>;
}): Promise<WalletCheck> {
  const address = input.address.trim();
  if (!address) return { ok: false, reason: "Enter a destination wallet address." };

  if (isEvmNetwork(input.network)) {
    if (!validateEvmAddress(address)) {
      return { ok: false, reason: "Enter a valid EVM wallet address for this network." };
    }
    if (input.verifyWithTransak) {
      const allowed = await input.verifyWithTransak(address);
      if (!allowed) {
        return { ok: false, reason: "Transak did not accept this wallet address for the selected asset." };
      }
      return { ok: true, method: "transak" };
    }
    return { ok: true, method: "viem" };
  }

  if (!input.verifyWithTransak) {
    return {
      ok: false,
      reason: "Non-EVM wallet addresses are checked with Transak. Configure the partner API key to verify this address.",
    };
  }

  const allowed = await input.verifyWithTransak(address);
  if (!allowed) {
    return { ok: false, reason: "Transak did not accept this wallet address for the selected asset." };
  }
  return { ok: true, method: "transak" };
}
