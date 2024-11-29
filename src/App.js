import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Header from "./components/common/Header";
import Swap from "./components/sections/Swap";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, createConfig, WagmiProvider  } from 'wagmi'
import { base, linea, zkSync } from 'wagmi/chains'
import { injected, metaMask, safe, walletConnect, coinbaseWallet } from 'wagmi/connectors'

 
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { config } from "./config";

const darkTheme = createTheme({
    palette: {
        mode: "dark",
    },
});

const queryClient = new QueryClient();


function App() {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}> 
                <ThemeProvider theme={darkTheme}>
                    <CssBaseline />
                    <Router>
                        <ToastContainer pauseOnFocusLoss={false} />
                            <Routes>
                            <Route path="/" element={<Swap />} />
                            </Routes>
                        </Router>
                    
                </ThemeProvider>
            </QueryClientProvider> 
        </WagmiProvider>
            
    );
}

export default App;
