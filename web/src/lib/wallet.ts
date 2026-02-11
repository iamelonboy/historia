'use client';

/**
 * Direct interface to window.adena
 * Adena wallet injects itself into window when installed
 */
declare global {
  interface Window {
    adena?: {
      AddEstablish(name: string): Promise<void>;
      GetAccount(): Promise<{ data: { address: string; chainId: string; status: string } }>;
      DoContract(tx: {
        messages: Array<{
          type: string;
          value: {
            caller: string;
            send: string;
            pkg_path: string;
            func: string;
            args: string[];
          };
        }>;
        gasFee: number;
        gasWanted: number;
      }): Promise<{ hash: string; code: number }>;
      AddNetwork(network: {
        chainId: string;
        chainName: string;
        rpcUrl: string;
      }): Promise<void>;
      SwitchNetwork(chainId: string): Promise<void>;
    };
  }
}

function getAdena() {
  if (typeof window === 'undefined' || !window.adena) {
    throw new Error('Adena wallet not found');
  }
  return window.adena;
}

/**
 * Check if Adena wallet is installed
 */
export function isAdenaInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as unknown as { adena?: unknown }).adena;
}

/**
 * Connect to Adena wallet
 */
export async function connectWallet(): Promise<{ address: string; chainId: string }> {
  const adena = getAdena();
  await adena.AddEstablish('HISTORIA');
  const response = await adena.GetAccount();

  return {
    address: response.data.address,
    chainId: response.data.chainId,
  };
}

/**
 * Get current account info
 */
export async function getAccount(): Promise<{ address: string; chainId: string } | null> {
  try {
    const adena = getAdena();
    const response = await adena.GetAccount();

    if (response.data.status !== 'ACTIVE') {
      return null;
    }

    return {
      address: response.data.address,
      chainId: response.data.chainId,
    };
  } catch {
    return null;
  }
}

/**
 * Disconnect wallet (clear local state)
 */
export async function disconnectWallet(): Promise<void> {
  // Adena doesn't have a disconnect method
  // User must disconnect from wallet extension
}

/**
 * Add custom network to Adena
 */
export async function addNetwork(
  chainId: string,
  chainName: string,
  rpcUrl: string
): Promise<void> {
  const adena = getAdena();
  await adena.AddNetwork({
    chainId,
    chainName,
    rpcUrl,
  });
}

/**
 * Switch to a network
 */
export async function switchNetwork(chainId: string): Promise<void> {
  const adena = getAdena();
  await adena.SwitchNetwork(chainId);
}

/**
 * Sign and broadcast a contract call transaction
 */
export async function callContract(
  caller: string,
  pkgPath: string,
  func: string,
  args: string[],
  send: string,
  gasFee: number = 1000000,
  gasWanted: number = 50000000
): Promise<{ hash: string }> {
  const adena = getAdena();

  const messages = [
    {
      type: '/vm.m_call',
      value: {
        caller,
        send,
        pkg_path: pkgPath,
        func,
        args,
      },
    },
  ];

  const response = await adena.DoContract({
    messages,
    gasFee,
    gasWanted,
  });

  if (response.code !== 0) {
    throw new Error(`Transaction failed with code ${response.code}`);
  }

  return {
    hash: response.hash,
  };
}

/**
 * Helper to call HISTORIA realm functions
 */
export async function callHistoria(
  caller: string,
  func: string,
  args: string[],
  send: string = ''
): Promise<{ hash: string }> {
  const pkgPath = process.env.NEXT_PUBLIC_REALM_PATH || 'gno.land/r/historia';
  return callContract(caller, pkgPath, func, args, send);
}
