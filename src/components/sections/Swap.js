import React, { useState, Fragment, useEffect } from "react";
import { Icon } from "@iconify/react";
// mui
import Container from "@mui/material/Container";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import InputBase from "@mui/material/InputBase";
import Button from "@mui/material/Button";
import LoadingButton from '@mui/lab/LoadingButton';
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
//
import Header from "../common/Header";
import SelectToken from "./Select-Token";
import ConnectWallet from "./Connect-Wallet";
import SelectNetwork from "./Select-Network";
import {
    useAccount,
    useConnect,
    useDisconnect,
    useEnsAvatar,
    useEnsName,
    useChainId,
    useSwitchChain,
    useBalance,
    // useConnectorClient,
    // useNetwork,
    useClient,
    useWalletClient,
    http
} from 'wagmi'
import { toast } from "react-toastify";
import { networks } from "../../hooks/network";
import { ETHToken } from "../../hooks/token";
import { baseCoins, lineaCoins, zksyncCoins } from "../../hooks/constant";
import { dexAddress, routerAddress } from "../../hooks/contracts";
import routerABI from '../../hooks/json/Router.json';
import dexABI from '../../hooks/json/DEX.json';
import zkDexABi from '../../hooks/json/zkDEX.json';
import { readContract, writeContract, waitForTransactionReceipt, getBalance , getPublicClient , watchClient, getClient  } from "@wagmi/core";
import { parseUnits } from 'viem';
import { wethAddress } from "../../hooks/contracts";
import { zeroAddress } from "../../hooks/contracts";
import wethABI from '../../hooks/json/WETH.json';
    
import erc20ABI from '../../hooks/json/ERC20.json';

import { config } from "../../config";


import { createWalletClient, custom, createPublicClient, parseGwei, parseEther } from "viem";
import { zkSync } from 'viem/chains'
import { eip712WalletActions } from 'viem/zksync'
// ------------------------------------------------------------------------

export default function Swap() {
    const walletClientZk = createWalletClient({ 
        chain: zkSync, 
        transport: custom(window.ethereum), 
    }).extend(eip712WalletActions()) 
    // console.log("Window.ethere", window.ethereum.chainId);
    const [netErr, setNetErr] = useState(false);
    // console.log("Client", window.ethereum);
    const [loading, setLoading] = useState(false);
    const [showSelectToken, setShowSelectToken] = useState(false);
    const [showConnectWallet, setShowConnectWallet] = useState(false);
    const [showSelectNetwork, setShowSelectNetwork] = useState(false);
    const { address, connector, isConnected } = useAccount();
    // const x = useAccount();
    // console.log("x", x);
    // const { data: ensName } = useEnsName({ address })
    // const { data: ensAvatar } = useEnsAvatar({ name: ensName })
    const { connect, connectors, error, isLoading, pendingConnector } = useConnect()
    const { disconnect } = useDisconnect();
    const chainId  = useChainId();
    const { chains, pendingChainId, switchChain, } = useSwitchChain();
    
    const [tokens, setTokens] = useState(baseCoins);

    const [clickFrom, setClickFrom] = useState('from');
    const [ethBalance, setEthBalance] = useState({decimals: 0, formatted: '0', symbol: '', value: 0n});
    const [swapFromBal, setSwapFromBal] = useState({ decimals: 0, formatted: '0', symbol: '', value: 0n });
    const [swapToBal, setSwapToBal] = useState({decimals: 0, formatted: '0', symbol: '', value: 0n});
    const balanceUpdate =async () => {
        if (!chainId || !address|| !swapFrom|| !swapTo) {
            return;
        } else {
            try {
                const balance = await getBalance(config,{ address: address });
                setEthBalance(balance);
            } catch(e) {
                console.log("err", e)
            }
            try {
                const swapFromB = await getBalance(config, { address, token: swapFrom.address });
                setSwapFromBal(swapFromB);
            } catch {
                console.log("come eth error?")   
            }
            try {
                const swapToB = await getBalance(config, { address, token: swapTo.address });
                setSwapToBal(swapToB);
            }
            catch {
                console.log("Come weth error?")
            }
        }
        
    }
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
            if (chainId == 8453) {
                
                setTokens(baseCoins);
            }
            else if (chainId == 59144) {
                setTokens(lineaCoins);
            }
            else if (chainId == 324) {
                setTokens(zksyncCoins);
            }
        } 
        
    }, [chainId, address, window.ethereum?.chainId]);
    useEffect(() => {
        if (chainId) {
            setSwapFrom(tokens[0]);
            setSwapTo(tokens[1]);
        }
    }, [tokens])
    
    const [swapFrom, setSwapFrom] = useState({...tokens[0]});
    const [swapTo, setSwapTo] = useState({...tokens[1]});
    const [swapFromAmt, setSwapFromAmt] = useState(0);
    const [swapToAmt, setSwapToAmt] = useState(0);
    const [inpError, setInpError] = useState({
        fromAmt: "",
        toAmt: ""
    });
    const [isApproved, setIsApproved] = useState(false);
    const [path, setPath] = useState([]);
    const getAllowance = async () => {
        try {
            const result = await readContract(config,{
                abi: erc20ABI,
                address: swapFrom.address,
                functionName: 'allowance',
                args: [address, dexAddress[chainId]],
                account: address
            });
            if (result) {
                setIsApproved(true);
            } else {
                setIsApproved(false);
            }
        } catch (e) {
            console.log("e in getAooll", e)
            return;
        }
        
    }
    const checkAllValidation = () => {
        if (!inpError.fromAmt&&!inpError.toAmt&&swapFromAmt>0 ) {
            return true;
        }
        else {
            toast.error("Please input valid infos!");
            setLoading(false);
            return false;
        }
    }
    const setApprove = async () => {
        setLoading(true);

        try {
            if (!chainId||!address) {
                toast.error("Please connect wallet!");
                setLoading(false);
                return;
            }
            if (swapFrom.address == zeroAddress) {
                setLoading(false);
                return;
            }
            const result = await writeContract(config,{
                abi: erc20ABI,
                address: swapFrom.address,
                functionName: 'approve',
                args: [dexAddress[chainId], parseUnits("1000000000000000000000000000", 18)]
            });
            const data = await waitForTransactionReceipt(config, { hash: result });
            if (data && data.status && data.status == 'success') {
                toast.success("Successed!");
                setIsApproved(true);
                setLoading(false);
            } else {
                toast.error("Failed!");
                setLoading(false);
            }
        }
        catch(e) {
            toast.error(e.message);
            setLoading(false);
        }
        
    }
    const doSwap = async () => {
        setLoading(true);
        try {
                if (!chainId||!address) {
                toast.error("Please connect wallet!");
                setLoading(false);
                return;
            }
            if (!isApproved) {
                toast.error("Please approve token first!");
                setLoading(false);
                return;
            }
            

            const check = checkAllValidation();
            let result; 
            let data;
            if (check) {
                if (path[0] == path[path.length - 1]) {
                    console.log("come to swap twhet?")
                    if (swapFrom.address == zeroAddress && swapTo.address == wethAddress[chainId]) {
                        //swap to WETH
                        result = await writeContract(config,{
                            abi: wethABI,
                            address: wethAddress[chainId],
                            functionName: 'deposit',
                            value: parseUnits(swapFromAmt.toString(), 18)
                        });
                        console.log("result", result)
                        data = await waitForTransactionReceipt(config, { hash: result });
                        console.log("data", data);
                        if (data && data.status && data.status == 'success') {
                            toast.success("Successed!");
                            setLoading(false);
                        } else {
                            toast.error("Failed!");
                            setLoading(false);
                        }
                        await balanceUpdate();
                        return;
                    } else if (swapFrom.address == wethAddress[chainId] && swapTo.address == zeroAddress) {
                        //swap to ETH
                        result = await writeContract(config,{
                            abi: wethABI,
                            address: wethAddress[chainId],
                            functionName: 'withdraw',
                            args: [parseUnits(swapFromAmt.toString(), 18)]
                        });
                        data = await waitForTransactionReceipt(config, { hash: result });
                        if (data && data.status && data.status == 'success') {
                            toast.success("Successed!");
                            setLoading(false);
                        } else {
                            toast.error("Failed!");
                            setLoading(false);
                        }
                        setLoading(false);
                        await balanceUpdate();
                        return;
                    }
                    else {
                        toast.error("Can't swap same tokens!");
                        setLoading(false);
                        return;
                    }
                    
                }
                if (swapFrom.address == zeroAddress) {
                    if ( chainId == 324) {
                        const publicClient = createPublicClient({
                            chain: zkSync,
                            transport: http(),
                        });
                        const gasPrice = await publicClient.getGasPrice();
                        console.log("gasPrice", gasPrice)
                        console.log("come to here zero", chainId)
                        // result = await walletClientZk.writeContract({
                        //     abi: dexABI,
                        //     address: dexAddress[chainId],
                        //     account: address,
                        //     functionName: 'customSwapTokens',
                        //     args: [ swapFrom.address, swapTo.address, parseEther('0.0001'),  path],
                        //     value: parseEther('0.0001'),
                        //     gasPerPubdata: 500000,
                        //     // gas: 2500000,
                        //     gasPrice: '20',
                        //     // maxFeePerGas: gasPrice, // added
                        //     // maxPriorityFeePerGas: gasPrice, // added
                        //     // value: 100000000000000n
                        // });
                        try {
                            result = await walletClientZk.writeContract({
                                abi: zkDexABi,
                                address: dexAddress[chainId],
                                account: address,
                                functionName: 'customSwapTokens',
                                args: [ swapFrom.address, swapTo.address, parseUnits(swapFromAmt.toString(), 18),  path],
                                value: parseUnits(swapFromAmt.toString(), 18),
                                // gasPerPubdata: 500000,
                                gas: 1500000,
                                gasPrice: parseGwei('0.8'),
                                // maxFeePerGas: 2000000000, // added
                                // maxPriorityFeePerGas: 2000000000, // added
                                // value: 100000000000000n
                            });
                        }
                        catch {
                            toast.error("Pancakeswap doesn't have enough liquidity for this swap!");
                        }
                    } else {
                        result = await writeContract(config,{
                            abi: dexABI,
                            address: dexAddress[chainId],
                            functionName: 'customSwapTokens',
                            args: [ swapFrom.address, swapTo.address, parseUnits(swapFromAmt.toString(), 18), path],
                            value: parseUnits(swapFromAmt.toString(), 18)
                            // value: 100000000000000n
                        });
                    }
                    
                    data = await waitForTransactionReceipt(config, { hash: result });
                    if (data && data.status && data.status == 'success') {
                        toast.success("Successed!");
                        setLoading(false);
                    } else {
                        toast.error("Failed!");
                        setLoading(false);
                    }
                } else {
                    if (chainId == 324) {
                        const publicClient = createPublicClient({
                            chain: zkSync,
                            transport: http(),
                        });
                        try {
                            const gasPrice = await publicClient.getGasPrice();
                            result = await walletClientZk.writeContract({
                                abi: zkDexABi,
                                address: dexAddress[chainId],
                                account: address,
                                functionName: 'customSwapTokens',
                                args: [swapFrom.address, swapTo.address, parseUnits(swapFromAmt.toString(), swapFromBal?.decimals), path],
                                // gasPerPubdata: 500000n,
                                // gas: 2500000,
                                // gasPrice: 20000000000,
                                // maxFeePerGas: gasPrice, // added
                                // maxPriorityFeePerGas: gasPrice, // added
                                // value: 100000000000000n
                            });
                        } catch {
                            toast.error("Pancakeswap doesn't have enough liquidity for this swap!");
                        }
                        
                    } else {
                        result = await writeContract(config,{
                            abi: dexABI,
                            address: dexAddress[chainId],
                            functionName: 'customSwapTokens',
                            args: [swapFrom.address, swapTo.address, parseUnits(swapFromAmt.toString(), swapFromBal?.decimals), path],
                        });    
                    }
                    
                    data = await waitForTransactionReceipt(config, { hash: result });
                    if (data && data.status && data.status == 'success') {
                        toast.success("Successed!");
                        setLoading(false);
                    } else {
                        toast.error("Failed!");
                        setLoading(false);
                    }
                }
                await balanceUpdate();
            }
        } catch (e) {
            console.log("zkEror", e);
            toast.error(e.message);
            setLoading(false);
        }
    }
    useEffect(() => {
        let pathIn = [];
        let pathFrom = wethAddress[chainId];
        let pathTo = wethAddress[chainId];
        if (swapFrom.address == zeroAddress || swapFrom.address?.toLowerCase() == pathFrom?.toLowerCase()) {
            pathFrom = wethAddress[chainId];
        } else {
            pathFrom = swapFrom.address;
        }
        if (swapTo.address == zeroAddress || swapTo.address?.toLowerCase() == pathTo?.toLowerCase()) {
            pathTo = wethAddress[chainId];
        } else {
            pathTo = swapTo.address;
        }
        if (pathFrom?.toLowerCase() == wethAddress[chainId]?.toLowerCase() || pathTo?.toLowerCase() == wethAddress[chainId]?.toLowerCase()) {
            pathIn = [pathFrom, pathTo];
        } else {
            pathIn = [pathFrom, wethAddress[chainId], pathTo];
        }
        setPath(pathIn);
        if (swapFrom.address == zeroAddress) {
            setIsApproved(true)
        } else {
            getAllowance();
            
        }
        balanceUpdate();

    }, [swapFrom, swapTo, chainId, address]);
    const onChangeAmount = async (e) => {
        if (!chainId || !address) {
            toast.error("Please connect wallet!");
            return;
        }
        if (netErr) {
            toast.error("Wrong network!");
            return;
        }
        e.preventDefault();
        const inputValue = parseFloat(e.target.value);
        const reg = new RegExp(/^[+-]?\d+(\.\d+)?$/);
        setSwapFromAmt(e.target.value)
        if (e.target.name == 'from') {
            let terror = 0;
            if (!reg.test(inputValue) || inputValue <= 0) {
                terror += 1;
                setInpError({...inpError, fromAmt: "Please Enter Valid Amount!"});
            } else if (swapFrom.name == "ETH") {
                if (inputValue > parseFloat(Number(ethBalance?.formatted))) {
                    setInpError({ ...inpError, fromAmt: "Insufficient Balance!" });
                    terror += 1;
                }
            } else if (swapFrom.name !== "ETH") {
                if (inputValue > parseFloat((Number(swapFromBal?.formatted)))) {
                    setInpError({ ...inpError, fromAmt: "Insufficient Balance!" });
                    terror += 1;
                }
            }
            if (terror == 0) {
                setInpError({ ...inpError, fromAmt: "" });
            }
        }
        else if (e.target.name == 'to') {
            if (!reg.test(inputValue) || parseFloat(inputValue) <= 0) {
                setInpError({...inpError, toAmt: "Please Enter Valid Amount!"});
            }
            else {
                setInpError({ ...inpError, toAmt: "" });
            }
        }
    }
    const setAmountOut = async () => {
        try {
             if (!swapFromAmt) {
                return;
            }
            if (!chainId || !address) {
                toast.error("Please connect wallet!");
                return;
            }
            let swapAmount = 0n;
            let swapFromAddr = wethAddress[chainId];
            if (swapFrom.name == "ETH") {
                if (Number(swapFromAmt) > Number(ethBalance?.formatted)) {
                    setInpError({ ...inpError, fromAmt: "Insufficient Balance!" });
                }
                swapAmount = parseUnits(swapFromAmt.toString(), 18);
            } else {
                if (Number(swapFromAmt) > Number(swapFromBal?.formatted)) {
                    setInpError({ ...inpError, fromAmt: "Insufficient Balance!" });
                }
                swapAmount = parseUnits(swapFromAmt.toString(), swapFromBal?.decimals);
                swapFromAddr = swapFrom.address;
            } 
            let swapToAddr = wethAddress[chainId];
            let swapToDecimals = 18;
            if (swapTo.name !== "ETH") {
                swapToAddr = swapTo.address;
                swapToDecimals = swapToBal?.decimals;
            }
            if (swapFromAddr == swapToAddr) {
                setSwapToAmt(swapFromAmt);
                return;
            }
            // let path = [];
            // if (wethAddress[chain?.id].toLowerCase() == swapFromAddr.toLowerCase() || wethAddress[chain?.id].toLowerCase() == swapToAddr.toLowerCase()) {
            //     path= [swapFromAddr, swapToAddr]
            // }
            // else {
            //     path = [swapFromAddr, wethAddress[chain?.id], swapToAddr];
            // }
            const result = await readContract(config,{
                abi: dexABI,
                address: dexAddress[chainId],
                functionName: 'getOutputTokenAmount',
                args: [swapAmount, path],
                account: address
            });
            let modifiedResult = Number(result) / Number(parseUnits('1',swapToDecimals));
            setSwapToAmt(Number(modifiedResult.toFixed(5)).toString());
        } catch {
            toast.error("Can't estimate getAmountsOut as insufficient pool liquidity!");
        }
        
    }
    const setAmountOutVal = async (value) => {
        try {
                if (!chainId || !address) {
                toast.error("Please connect wallet!");
                return;
            }
            else {
                let swapAmount = 0n;
                let swapFromAddr = wethAddress[chainId];
                if (swapFrom.name == "ETH") {
                    swapAmount = parseUnits(value.toString(), 18) ;
                } else {
                    swapAmount = parseUnits(value.toString(), swapFromBal?.decimals);
                    swapFromAddr = swapFrom.address;
                }
                let swapToAddr = wethAddress[chainId];
                let swapToDecimals = 18;
                if (swapTo.name !== "ETH") {
                    swapToAddr = swapTo.address;
                    swapToDecimals = swapToBal?.formatted          }
                if (swapFromAddr == swapToAddr) {
                    setSwapToAmt(Number(Number(value).toFixed(5)).toString());
                    return;
                }
                // let path = [];
                // if (wethAddress[chain?.id].toLowerCase() == swapFromAddr.toLowerCase() || wethAddress[chain?.id].toLowerCase() == swapToAddr.toLowerCase()) {
                //     path= [swapFromAddr, swapToAddr]
                // }
                // else {
                //     path = [swapFromAddr, wethAddress[chain?.id], swapToAddr];
                // }
                const result = await readContract(config,{
                    abi: dexABI,
                    address: dexAddress[chainId],
                    functionName: 'getOutputTokenAmount',
                    args: [swapAmount, path],
                    account: address
                });
                let modifiedResult = parseFloat(Number(result) / Number(parseUnits('1', swapToDecimals)));
                setSwapToAmt(Number(modifiedResult.toFixed(5)).toString());
            }
        } catch {
            toast.error("Can't estimate getAmountsOut as insufficient pool liquidity!");
        }
        
    }
    const setHalf = async() => {
        if (!chainId || !address) {
            toast.error("Please connect wallet!")
            return;
        } else {
            if (swapFrom.name == "ETH") {
                if (parseFloat(ethBalance?.formatted) == 0) {
                    setInpError({ ...inpError, fromAmt: "Insufficient Balance!" });
                    return;
                }
                
                setSwapFromAmt(parseFloat(ethBalance?.formatted) / 2);
                setInpError({ ...inpError, fromAmt: "" });
                await setAmountOutVal(parseFloat(ethBalance?.formatted) / 2);
            } else {
                if (parseFloat(swapFromBal?.formatted) == 0) {
                    setInpError({ ...inpError, fromAmt: "Insufficient Balance!" });
                    return;
                }
                setSwapFromAmt(parseFloat(swapFromBal?.formatted) / 2);
                setInpError({ ...inpError, fromAmt: "" });
                await setAmountOutVal(parseFloat(swapFromBal?.formatted) / 2);
            }
            
        }
    }
    const max = async () => {
        if (!chainId || !address) {
            toast.error("Please connect wallet!")
            return;
        } else {
            if (swapFrom.name == "ETH") {
                if (parseFloat(ethBalance?.formatted) == 0) {
                    setInpError({ ...inpError, fromAmt: "Insufficient Balance!" });
                    return;
                }
                setSwapFromAmt(parseFloat(ethBalance?.formatted) );
                setInpError({ ...inpError, fromAmt: "" });
                await setAmountOutVal(parseFloat(ethBalance?.formatted));
            } else {
                if (parseFloat(swapFromBal?.formatted) == 0) {
                    setInpError({ ...inpError, fromAmt: "Insufficient Balance!" });
                    return;
                }
                setSwapFromAmt(parseFloat(swapFromBal?.formatted) );
                setInpError({ ...inpError, fromAmt: "" });
                await setAmountOutVal(parseFloat(swapFromBal?.formatted));
            }
        }
        
    }
    const reverseInput = () => {
        setSwapFrom(swapTo);
        setSwapTo(swapFrom)
        setSwapFromAmt(0);
        setSwapToAmt(0);
        setInpError({...inpError, fromAmt: ""})
    }

    useEffect(() => {
        if (error) {
            toast.error(error.message);
            console.log("error in connect wallet", error);
        }
    },[error])
    const renderTop = (
        <Stack alignItems="center">
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                width={1}
            >
                <Stack
                    direction="row"
                    alignItems="center"
                    sx={{ cursor: "pointer" }}
                    onClick={() => { setShowSelectToken(true); setClickFrom('from') }}
                >
                    <img src={swapFrom.imgSrc} width={24} height={24} style={{borderRadius:'50%', minWidth: "24px", objectFit: "cover", display: 'block'}} />
                    <Typography ml={1} mr={2}>
                        {swapFrom.symbol}
                    </Typography>
                    <Icon icon="material-symbols:expand-more-rounded" />
                </Stack>
                {swapFrom.name== "ETH"?(<Typography variant="body2" color="#cbd5e1" mr={1}>
                Balance: {Number(Number(ethBalance?.formatted).toFixed(5)).toString()} {swapFrom.name}
                </Typography>):(<Typography variant="body2" color="#cbd5e1" mr={1}>
                Balance: {Number(Number(swapFromBal?.formatted).toFixed(5)).toString()} {swapFrom.name}
                </Typography>)}
                    
            </Stack>
            <Typography variant="subtitle1">
                <b>Fees</b>
            </Typography>
            <Card sx={{ px: 1, backgroundColor: "#535353", boxShadow: "none" }}>
                1%
            </Card>
            <Stack
                sx={{
                backgroundColor: "#535353",
                px: 2,
                width: 1,
                borderRadius: 3,
                my: 1,
                }}
            >
                <InputBase fullWidth placeholder="0.0" name="from" sx={{ fontSize: 32 }} value={swapFromAmt} onBlur={()=>setAmountOut()} onChange={(e) => { onChangeAmount(e) }} />
                
            </Stack>
            <small className="text-danger">{inpError["fromAmt"]}</small>
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="flex-end"
                spacing={0.5}
                width={1}
                mt={1}
            >
                <Button
                    variant="contained"
                    size="small"
                    sx={{
                        color: "#fff",
                        backgroundColor: "#404040",
                        boxShadow: "none",
                        "&:hover": {
                            backgroundColor: '#404040'
                        }
                    }}
                    onClick={()=>{setHalf()}}
                >
                    50%
                </Button>
                <Button
                    variant="contained"
                    size="small"
                    sx={{
                        color: "#fff",
                        backgroundColor: "#404040",
                        boxShadow: "none",
                        textTransform: "none",
                        "&:hover": {
                            backgroundColor: '#404040'
                        }
                    }}
                    onClick={()=>{max()}}
                >
                Max
                </Button>
            </Stack>
        </Stack>
    );

    const renderBelow = (
        <Stack alignItems="center">
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                width={1}
            >
                <Stack
                direction="row"
                alignItems="center"
                sx={{ cursor: "pointer" }}
                    onClick={() => { setShowSelectToken(true); setClickFrom('to') }}
                >
                    <img src={swapTo.imgSrc} width={24} height={24} style={{borderRadius:'50%', minWidth: "24px", objectFit: "cover", display: 'block'}} />
                    <Typography ml={1} mr={2}>
                        {swapTo.symbol}
                    </Typography>
                    <Icon icon="material-symbols:expand-more-rounded" />
                </Stack>
                {swapTo.name== "ETH"?(<Typography variant="body2" color="#cbd5e1" mr={1}>
                    Balance: {Number(Number(ethBalance?.formatted).toFixed(5)).toString()} {swapTo.symbol}
                </Typography>):(<Typography variant="body2" color="#cbd5e1" mr={1}>
                    Balance: {Number(Number(swapToBal?.formatted).toFixed(5)).toString()} {swapTo.symbol}
                </Typography>)}
                
            </Stack>
            <Stack
                sx={{
                backgroundColor: "#535353",
                px: 2,
                width: 1,
                borderRadius: 3,
                mt: 1,
                }}
            >
                <InputBase fullWidth placeholder="0.0" name= "to" value={swapToAmt} disabled sx={{ fontSize: 32 }} />
            </Stack>
        </Stack>
    );

    return (
        <Fragment>
            <Header
                setShowConnectWallet={setShowConnectWallet}
                setShowSelectNetwork={setShowSelectNetwork}
            />
            <Container
                maxWidth="xl"
                sx={{
                minHeight: "calc(100vh - 120px)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                }}
            >
                <Card
                sx={{
                    backgroundImage: "linear-gradient(to right, #2a2a2a, #424242)",
                    border: "1px solid #535353",
                    borderRadius: 3,
                    color: "#fff",
                    width: 580,
                }}
                >
                <Stack px={3} pb={5} pt={7}>
                    {renderTop}
                    <Stack direction="row" alignItems="center" width={1} my={3}>
                    <Stack flexGrow={1}>
                        <Divider flexItem />
                    </Stack>
                    <IconButton>
                        <Icon icon="vaadin:refresh" onClick={() => { reverseInput()}}/>
                    </IconButton>
                    </Stack>
                        {renderBelow}{netErr && (<Button
                            size="large"
                            sx={{
                                mt: 3,
                                textTransform: "none",
                                color: "#fff",
                                borderRadius: 5,
                                py: 2,
                                "&:hover": {
                                    backgroundImage:
                                        "linear-gradient(to right, #424242, #2a2a2a)",
                                },
                            }}
                            onClick={() => switchChain({ chainId: 8453 })}
                        >
                            <b>Wrong Network</b>
                        </Button>
                                
                    )}{!netErr&&(<React.Fragment>{!isConnected ? (<Button
                                size="large"
                                sx={{
                                    mt: 3,
                                    textTransform: "none",
                                    color: "#fff",
                                    borderRadius: 5,
                                    py: 2,
                                    "&:hover": {
                                        backgroundImage:
                                            "linear-gradient(to right, #424242, #2a2a2a)",
                                    },
                                }}
                            onClick={() => { setShowConnectWallet(true) }}
                            >
                                <b>Connect Wallet</b>
                        </Button>) : (<React.Fragment>{isApproved?(<LoadingButton
                                loading= {loading}
                                size="large"
                                sx={{
                                    mt: 3,
                                    textTransform: "none",
                                    color: "#fff",
                                    borderRadius: 5,
                                    py: 2,
                                    "&:hover": {
                                        backgroundImage:
                                            "linear-gradient(to right, #424242, #2a2a2a)",
                                    },
                                }}
                                    onClick={() => { doSwap() }}
                            >
                                <b>S W A P</b>
                            </LoadingButton>) : (<LoadingButton
                                loading= {loading}
                                size="large"
                                sx={{
                                    mt: 3,
                                    textTransform: "none",
                                    color: "#fff",
                                    borderRadius: 5,
                                    py: 2,
                                    "&:hover": {
                                        backgroundImage:
                                            "linear-gradient(to right, #424242, #2a2a2a)",
                                    },
                                }}
                                    onClick={() => { setApprove() }}
                            >
                                <b>A P P R O V E</b>
                            </LoadingButton>)}</React.Fragment> )}</React.Fragment>)}
                            
                </Stack>
                </Card>
                <SelectToken open={showSelectToken} setOpen={setShowSelectToken} clickFrom={clickFrom} tokenList={tokens} setSwapFrom={setSwapFrom} setSwapTo={setSwapTo} />
                <ConnectWallet
                open={showConnectWallet}
                setOpen={setShowConnectWallet}
                />
                <SelectNetwork
                open={showSelectNetwork}
                setOpen={setShowSelectNetwork}
                />
            </Container>
        </Fragment>
    );
}
