import { Icon } from "@iconify/react";
// mui
import React from "react";
import { useState, Fragment, useEffect } from "react";
import Stack from "@mui/material/Stack";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import { supportNetwork, netOrder } from "../../hooks/network";
import { useConfig, useChainId, useSwitchChain } from "wagmi";
// import { switchChain } from'@wagmi/core';
import { networks } from "../../hooks/network";
import { toast } from "react-toastify";


    // ---------------------------------------------------------------------
export default function SelectNetwork({ open, setOpen }) {
    const chainId = useChainId();
    // console.log("chainId", chainId);
    const { chains, error, isLoading, pendingChainId, switchChain } = useSwitchChain();
    useEffect(() => {
        if (error) {
            toast.error(error.message);
            console.log("error in connect wallet", error);
        }
    }, [error])
    return (
        <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="xs"
        sx={{
            "& .MuiPaper-root": {
            background: "#111",
            },
            backgroundColor: "black",
        }}
        >
        <DialogTitle>Select a Network</DialogTitle>
        <IconButton
            onClick={() => setOpen(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
        >
            <Icon icon="material-symbols:close" />
        </IconButton>
        <Divider />
        <DialogContent>
            <Stack py={2} px={3} spacing={1.5}>
                    {chains.map(function (x, index) {
                    return (
                        <Card
                            key={x.id}
                            sx={{
                                background: "transparent",
                                boxShadow: "none",
                                border: "1px solid #00a2e8",
                                borderRadius: 3,
                            }}
                            disabled
                            onClick={() => { if (x.id === chainId) { setOpen(false); return; } switchChain?.({ chainId: x.id }); setOpen(false);}}
                        >
                            <CardActionArea>
                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    spacing={2}
                                    px={5}
                                    py={2}
                                >
                                    <img
                                        src={networks[x.id].imgSrc}
                                        alt={networks[x.id].name}
                                        width={40}
                                        height={40}
                                    />
                                    <Typography variant="body2">{x.name} {isLoading && pendingChainId === x.id && ' (switching)'}</Typography>
                                </Stack>
                            </CardActionArea>
                        </Card>
                    )
                    
                })}
            </Stack>
        </DialogContent>
        </Dialog>
    );
}
