import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
// mui
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import { baseCoins } from "../../hooks/constant";
import { Button } from "@mui/material";
import { readContract, writeContract } from "@wagmi/core";
import { toast } from "react-toastify";
import {
    useAccount,
    useConnect,
    useDisconnect,
    useEnsAvatar,
    useEnsName,
    useChainId,
    useSwitchNetwork,
    useBalance,
    useContractRead,
    
} from 'wagmi'
import { maxUint104, multicall3Abi } from "viem";
import erc20ABI from '../../hooks/json/ERC20.json'

// ------------------------------------------------------------------
export default function SelectToken({ open, setOpen, clickFrom, tokenList, setSwapFrom, setSwapTo }) {
    const { address, connector, isConnected } = useAccount();
    const chainId = useChainId();
    const [filteredResult, setFilteredResult] = useState(tokenList);
    const [manualAddr, setManualAddr] = useState("");
    useEffect(() => {
        setFilteredResult(tokenList)
    },[tokenList])
    const setToken = (item) => {
        if (clickFrom == 'from') {
            setSwapFrom(item);
        } else if (clickFrom == 'to') {
            setSwapTo(item);
        }
        setFilteredResult(tokenList);
        setOpen(false);
    }
    const setTokenManually = async ()=>{
        if (!chainId || !address) {
            toast.error("Please connect wallet!");
        }else{
            try {
                const name = await readContract({
                    abi: erc20ABI,
                    address: manualAddr,
                    functionName: 'name',
                    account: address
                });
                const symbol = await readContract({
                    abi: erc20ABI,
                    address: manualAddr,
                    functionName: 'symbol',
                    account: address
                });
                console.log("Name", name);
                console.log("symbol", symbol);
                const manualToken = { address: manualAddr, name, symbol, imgSrc: '/assets/coin/template.png' };
                setToken(manualToken);
            } catch {
                toast.error("There is no token on this network!");
                return;
            }
        }
    }
    const doSearch = (e) => {
        e.preventDefault();
        let filtered = tokenList.filter((item, index) => {
            if (item.address.includes(e.target.value) || item.name.includes(e.target.value) || item.symbol.includes(e.target.value)) return item
        });
        setFilteredResult(filtered);
    }
    return (
        <Dialog
            open={open}
            onClose={() => setOpen(false)}
            fullWidth
            maxWidth="xs"
            sx={{
                backgroundColor: "black",
                "& .MuiDialog-paper": {
                    borderRadius: 5,
                },
            }}
        >
        <Stack alignItems="center" spacing={1} py={5} px={3} sx={{borderRadius: 3,}}>
                <Typography variant="h4">Select Token</Typography>
                <Stack width={1} direction="row">
                <Box flexGrow={1} />
                    <IconButton onClick={() => { setFilteredResult(tokenList); setOpen(false) }}>
                    <Icon icon="carbon:close-outline" />
                </IconButton>
                </Stack>
                <Stack
                sx={{
                    backgroundColor: "#535353",
                    px: 2,
                    py: 1,
                    width: 1,
                    borderRadius: 3,
                }}
                >
                    <InputBase fullWidth placeholder="Search..." onChange={(e)=>doSearch(e)} />
                </Stack>
                <Box width={1} height={180} sx={{ overflowY: "auto" }}>
                <List sx={{ width: 1 }}>
                    {filteredResult.map((item, index) => (
                        <ListItem key={item.address} disablePadding onClick={() => { setToken(item) }}>
                        <ListItemButton>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <img
                                src={item.imgSrc}
                                alt={item.name}
                                width={32}
                                height={32}
                                style={{ borderRadius:'50%' }}        
                            />
                            <Stack>
                            <Typography>{item.symbol}</Typography>
                            <Typography variant="caption">{item.name}</Typography>
                            </Stack>
                        </Stack>
                        </ListItemButton>
                    </ListItem>
                    ))}
                </List>
                </Box>
                <Divider flexItem>or</Divider>
                <Typography variant="h4" pb={3}>
                Input Manually
                </Typography>
                <Stack
                sx={{
                    backgroundColor: "#535353",
                    px: 2,
                    py: 1,
                    width: 1,
                    borderRadius: 3,
                }}
                >
                <InputBase value={manualAddr} fullWidth placeholder="Type..." onChange={(e)=>{setManualAddr(e.target.value)}} />
                </Stack>
                <Stack width={1}>
                    <Button
                    size="large"
                    sx={{
                        mt: 1,
                        textTransform: "none",
                        color: "#fff",
                        borderRadius: 5,
                        py: 2,
                        "&:hover": {
                        backgroundImage:
                            "linear-gradient(to right, #424242, #2a2a2a)",
                        },
                    }}
                      onClick={() => setTokenManually()}
                    >
                    <b>C O N F I R M</b>
                    </Button>
                </Stack>
        </Stack>
        </Dialog>
    );
}
