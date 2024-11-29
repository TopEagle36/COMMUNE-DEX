import { http, createConfig  } from 'wagmi'
import { base, linea, zkSync } from 'wagmi/chains'
import { metaMask, walletConnect, coinbaseWallet } from 'wagmi/connectors'

const config = createConfig({
    chains: [base, linea, zkSync],
    // autoConnect: true,
    connectors: [
        metaMask(),
        coinbaseWallet({ appName: "my coinbase" }),
        walletConnect({ projectId: 'e163def497d4ac886a3b3423c66e9a66' }),
        // // injected(),
    ],
    transports: {
        [base.id]: http(),
        [linea.id]: http(),
        [zkSync.id]: http(),
    }
});
export {config}