import {
  sepolia,
  baseSepolia,
  scrollSepolia,
  optimismSepolia,
  arbitrumSepolia,
  zkSyncSepoliaTestnet,
  polygonMumbai,
  avalancheFuji,
  avalanche,
} from 'viem/chains';
import { cookieStorage, createConfig, createStorage, http } from 'wagmi';

const isDevelopment = process.env.NEXT_PUBLIC_SITE_ENV === 'development';
const activeChain = isDevelopment ? avalancheFuji : avalanche;

export default createConfig({
  chains: [
    activeChain,
    // sepolia,
    // baseSepolia,
    // scrollSepolia,
    // optimismSepolia,
    // arbitrumSepolia,
    // zkSyncSepoliaTestnet,
    // polygonMumbai
  ],
  ssr: true,
  storage: createStorage({
    storage: cookieStorage
  }),
  transports: {
    [avalancheFuji.id]: http(),
    [avalanche.id]: http(),
    // [sepolia.id]: http(),
    // [baseSepolia.id]: http(),
    // [scrollSepolia.id]: http(),
    // [optimismSepolia.id]: http(),
    // [arbitrumSepolia.id]: http(),
    // [zkSyncSepoliaTestnet.id]: http(),
    // [polygonMumbai.id]: http()
  }
});
