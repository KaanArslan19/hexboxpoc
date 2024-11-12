"use client";
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import React, { useEffect, useMemo } from 'react';
import { clusterApiUrl } from '@solana/web3.js';
import { ConnectionProvider, useWallet, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';

require('@solana/wallet-adapter-react-ui/styles.css');

const Wallet = ({
    children,
  }: {
    children: React.ReactNode;
  }) => {

    const network: WalletAdapterNetwork = WalletAdapterNetwork.Devnet;
    const endpoint: string = clusterApiUrl(network);
    const wallets = useMemo(() => [], [network]);

  return (
    <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
                {children}  
            </WalletModalProvider>
        </WalletProvider>
    </ConnectionProvider>
  )
}

export default Wallet