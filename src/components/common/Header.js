// mui
import React, { useEffect, useState } from 'react'
import AppBar from "@mui/material/AppBar";
import Container from "@mui/material/Container";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import {
    useAccount,
    useConnect,
    useDisconnect,
    useEnsAvatar,
    useEnsName,
    useChainId,
    useSwitchChain
} from 'wagmi'
import {getConnectorClient  } from "@wagmi/core";

import { showFirstLastCh } from "../../hooks/helper";
import { networks } from "../../hooks/network";
import { Stack } from '@mui/material';
import { config } from '../../config';

const menus = [
  {
    title: "COMMUNE SWAP",
    url: "#",
  },
];


// -----------------------------------------------------------------------

export default function Header({ setShowConnectWallet, setShowSelectNetwork }) {
    const { address, connector, isConnected } = useAccount()
    const { data: ensName } = useEnsName({ address })
    const { data: ensAvatar } = useEnsAvatar({ name: ensName })
    // const { connect, connectors, error, isLoading, pendingConnector } = useConnect()
    const { disconnect } = useDisconnect()
    const chainId = useChainId();
    const { chains, error, isLoading, pendingChainId, switchChain } = useSwitchChain();
    const [netErr, setNetErr] = useState(false);
    useEffect(() => {
        if (chainId) {
            if (window.ethereum?.chainId) {
                if (window.ethereum.chainId == "0x2105" || window.ethereum.chainId == "0x708" || window.ethereum.chainId == "0x144") {
                    setNetErr(false);
                } else {
                    setNetErr(true);
                }
            }else {
                setNetErr(true);
            }
        } 
        
    }, [chainId, address, window.ethereum?.chainId]);
    // try {
    //     const client = getConnectorClient(config).then((response) => {
    //         if (!response.chain) {
    //             setNetErr(true);
    //         } else {
    //             setNetErr(false)
    //         }
    //     }, (error) => {
            
    //     })
        
    // } catch {
        
    // }
  return (
    <AppBar
      position="static"
      sx={{ boxShadow: "none", background: "transparent" }}
    >
      <Container maxWidth="xl">
        <Toolbar>
            <Box
                p={3}
                sx={{ cursor: "pointer" }}
                onClick={() => setShowSelectNetwork(true)}
            >
                <img
                src="/assets/network/heartbeat.png"
                alt="logo"
                width={40}
                height={40}
                />
                </Box>
                {chainId&&!netErr?(<Box
                    p={1}
                    sx={{ cursor: "pointer" }}
                    // onClick={() => setShowSelectNetwork(true)}
                ><Stack direction='row' justifyContent='center' alignItems='center' spacing={0.5}><img
                    src={networks[chainId]?.imgSrc}
                    alt="logo"
                    width={30}
                    height={30}
                      /><Typography>{networks[chainId].name}</Typography></Stack>
                    
                </Box>):(<React.Fragment></React.Fragment>)}
            
            <Box flexGrow={1} />
            {menus.map((item, i) => (
                <Link
                key={i}
                    href={item.url}
                    target="_blank"
                underline="none"
                variant="body2"
                sx={{ color: "#FFF", mr: 3 }}
                >
                {item.title}
                </Link>
            ))}
            {netErr && (
              <Box
                onClick={() => switchChain({ chainId: 8453 })}
                sx={{ cursor: "pointer" }}
            ><Stack direction='row' justifyContent='center' alignItems='center'>
                <img
                src="/assets/network/heartbeat.png"
                alt="logo"
                width={20}
                height={20}
                /><Typography variant="body2">Wrong Network</Typography></Stack>
            </Box>
            )}
            {!netErr&&(<React.Fragment>{!isConnected ? (<Box
            onClick={() => setShowConnectWallet(true)}
            sx={{ cursor: "pointer" }}
            >
                <Typography variant="body2">Connect Wallet</Typography>
            </Box>) : (<Box
                onClick={disconnect}
                sx={{ cursor: "pointer" }}
            >
                <Typography variant="body2">{showFirstLastCh(address, 6, 3)}</Typography>
                  </Box>)}</React.Fragment>)
            }
            
        </Toolbar>
      </Container>
    </AppBar>
  );
}
