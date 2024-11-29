import { Icon } from "@iconify/react";
// mui
import Stack from "@mui/material/Stack";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import { useConnect } from 'wagmi';
import { wallets } from "../../hooks/wallets";



// ---------------------------------------------------------------------
export default function ConnectWallet({ open, setOpen }) {
    let { connect, connectors, error, isLoading, pendingConnector } = useConnect();
    connectors = [connectors[0], connectors[1], connectors[2]];
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
            <DialogTitle>Connect to a Wallet</DialogTitle>
            <IconButton
                onClick={() => setOpen(false)}
                sx={{ position: "absolute", right: 8, top: 8 }}
            >
                <Icon icon="material-symbols:close" />
            </IconButton>
            <Divider />
            <DialogContent>
                <Stack py={2} px={3} spacing={1.5}>
                {connectors.map((connector, index) => (
                    <Card
                        key={connector.id}
                        sx={{
                            background: "transparent",
                            boxShadow: "none",
                            border: "1px solid #00a2e8",
                            borderRadius: 3,
                        }}
                        onClick={() => { connect({ connector }); setOpen(false) }}
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
                            src={wallets[index].imgSrc}
                            alt={wallets[index].name}
                            width={40}
                            height={40}
                        />
                        <Typography variant="body2">{wallets[index].name}
                            {isLoading && connector.id === pendingConnector?.id && ' (connecting)'}
                        </Typography>
                        </Stack>
                    </CardActionArea>
                    </Card>
                ))}
                </Stack>
            </DialogContent>
        </Dialog>
    );
}
