// Base L2 Chain ID
const BASE_CHAIN_ID = 8453; // Hex: 0x2105
const BASE_CHAIN_ID_HEX = '0x2105';

// Encoded Builder String for bc_sjkexp2o
const BUILDER_STRING = '0x62635f736a6b657870326f0b00802180218021802180218021802180218021';
const BUILDER_STRING_NO_PREFIX = BUILDER_STRING.substring(2);

// Optionally, user can supply a Smart Contract address.
// If empty, the app falls back to sending a self-transaction to record data.
let CONTRACT_ADDRESS = ""; 

// Keccak256 selectors for our custom contract (CandyCrushBase.sol)
// checkIn() -> 0x183ff085
// submitScore(uint256) -> 0x2e0618b0
const SELECTOR_CHECKIN = '0x183ff085';
const SELECTOR_SUBMITSCORE = '0x2e0618b0';

let provider;
let signer;
let userAddress = null;
let username = "";

// UI Elements
const connectWalletBtn = document.getElementById('connect-wallet-btn');
const startGameBtn = document.getElementById('start-game-btn');
const walletAddressDisplay = document.getElementById('wallet-address-display');

const onboardingScreen = document.getElementById('onboarding-screen');
const gameScreen = document.getElementById('game-screen');

const networkWarning = document.getElementById('network-warning');
const switchNetworkBtn = document.getElementById('switch-network-btn');

const checkInBtn = document.getElementById('check-in-btn');
const submitScoreBtn = document.getElementById('submit-score-btn');

const txModal = document.getElementById('transaction-modal');
const txTitle = document.getElementById('tx-title');
const txMessage = document.getElementById('tx-message');
const txSpinner = document.getElementById('tx-spinner');
const txCloseBtn = document.getElementById('tx-close-btn');

// --- Initialization ---
let eip6963Providers = [];
window.addEventListener("eip6963:announceProvider", (event) => {
    eip6963Providers.push(event.detail);
});
window.dispatchEvent(new Event("eip6963:requestProvider"));

function getTrueProvider() {
    // 1. Bulletproof method: EIP-6963 standard
    const mm6963 = eip6963Providers.find(p => 
        p.info.rdns === 'io.metamask' || p.info.name.toLowerCase().includes('metamask')
    );
    if (mm6963) {
        return mm6963.provider;
    }

    // 2. Legacy fallback
    let ethProvider = window.ethereum;
    if (window.ethereum && window.ethereum.providers?.length) {
        const trueMetaMask = window.ethereum.providers.find(p => 
            p.isMetaMask && !p.isOkxWallet && !p.isBitKeep && !p.isPhantom && !p.isBraveWallet && !p.isCoinbaseWallet
        );
        ethProvider = trueMetaMask || window.ethereum.providers.find(p => p.isMetaMask) || window.ethereum.providers[0];
    }
    return ethProvider;
}

async function initWeb3() {
    if (typeof window.ethereum !== 'undefined') {
        if (typeof ethers === 'undefined') {
            alert("Ethers.js library failed to load. Please check your internet connection or disable Brave Shields/adblockers for this site.");
            return;
        }

        let ethProvider = getTrueProvider();
        provider = new ethers.BrowserProvider(ethProvider);
        
        try {
            // Check if already connected
            const accounts = await provider.listAccounts();
            if (accounts.length > 0) {
                handleAccountsChanged(accounts);
            }
        } catch(e) {}

        ethProvider.on('accountsChanged', handleAccountsChanged);
        ethProvider.on('chainChanged', (chainId) => {
            window.location.reload();
        });
    }
}

// Give extensions a moment to inject window.ethereum
window.addEventListener('load', () => {
    setTimeout(initWeb3, 100);
});

connectWalletBtn.addEventListener('click', async () => {
    try {
        if (typeof window.ethereum === 'undefined') {
            if (window.location.protocol === 'file:') {
                alert("MetaMask and Web3 wallets do NOT work when opening HTML files directly (file://). Please use a local server like the 'Live Server' extension in VS Code.");
            } else {
                alert("Please install MetaMask or a Base-compatible EVM wallet. If you have it installed, try refreshing the page.");
            }
            return;
        }

        if (!provider) {
            await initWeb3();
        }

        if (!provider) {
            return; // initWeb3 handles the error alert
        }

        let ethProvider = getTrueProvider();

        const accounts = await ethProvider.request({ method: 'eth_requestAccounts' });
        handleAccountsChanged(accounts);
        await checkNetwork();
    } catch (error) {
        console.error("Connection failed", error);
        
        if (error.code === -32002) {
            alert("A connection request is already pending! Please click the MetaMask extension icon in the top right of your browser to approve it.");
        } else {
            alert("Wallet connection failed: " + (error.message || "Unknown error"));
        }
    }
});

async function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        userAddress = null;
        walletAddressDisplay.innerText = "";
        startGameBtn.classList.add('hidden');
    } else {
        userAddress = accounts[0];
        signer = await provider.getSigner();
        walletAddressDisplay.innerText = `Connected: ${userAddress.substring(0,6)}...${userAddress.substring(userAddress.length-4)}`;
        checkFormReady();
    }
}

// Removed username input listener

function checkFormReady() {
    const checkInBtn = document.getElementById('check-in-btn');
    if (userAddress) {
        startGameBtn.classList.remove('hidden');
        if(checkInBtn) checkInBtn.classList.remove('hidden');
    } else {
        startGameBtn.classList.add('hidden');
        if(checkInBtn) checkInBtn.classList.add('hidden');
    }
}

// --- Network Management ---
async function checkNetwork() {
    const network = await provider.getNetwork();
    if (Number(network.chainId) !== BASE_CHAIN_ID) {
        networkWarning.classList.remove('hidden');
    } else {
        networkWarning.classList.add('hidden');
    }
}

switchNetworkBtn.addEventListener('click', async () => {
    const ethProvider = getTrueProvider();
    try {
        await ethProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: BASE_CHAIN_ID_HEX }],
        });
        networkWarning.classList.add('hidden');
        // Refresh provider network info
        provider = new ethers.BrowserProvider(ethProvider);
        await checkNetwork();
    } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
            try {
                await ethProvider.request({
                    method: 'wallet_addEthereumChain',
                    params: [
                        {
                            chainId: BASE_CHAIN_ID_HEX,
                            chainName: 'Base',
                            rpcUrls: ['https://mainnet.base.org'],
                            nativeCurrency: {
                                name: 'Ether',
                                symbol: 'ETH',
                                decimals: 18
                            },
                            blockExplorerUrls: ['https://basescan.org']
                        },
                    ],
                });
                networkWarning.classList.add('hidden');
                // Refresh provider network info
                provider = new ethers.BrowserProvider(ethProvider);
                await checkNetwork();
            } catch (addError) {
                console.error(addError);
            }
        }
    }
});

// --- Start Game ---
startGameBtn.addEventListener('click', async () => {
    username = "0xAasim";
    
    onboardingScreen.classList.remove('active');
    onboardingScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    gameScreen.classList.add('active');
    
    // Call function from game.js
    if(window.startGameLoop) window.startGameLoop();
});

// --- Onchain Interactions ---

function showTxModal(title, message) {
    txModal.classList.remove('hidden');
    txTitle.innerText = title;
    txMessage.innerText = message;
    txSpinner.classList.remove('hidden');
    txCloseBtn.classList.add('hidden');
}

function updateTxModal(title, message, isSuccess) {
    txTitle.innerText = title;
    txMessage.innerText = message;
    txSpinner.classList.add('hidden');
    txCloseBtn.classList.remove('hidden');
}

txCloseBtn.addEventListener('click', () => {
    txModal.classList.add('hidden');
});

// Daily Check-In
checkInBtn.addEventListener('click', async () => {
    await sendAttributedTransaction(SELECTOR_CHECKIN, "Daily Check-in");
});

// Submit Score
submitScoreBtn.addEventListener('click', async () => {
    // abi encode uint256
    let scoreHex = window.score.toString(16);
    // pad to 64 hex characters (32 bytes)
    scoreHex = scoreHex.padStart(64, '0');
    
    const calldata = SELECTOR_SUBMITSCORE + scoreHex;
    await sendAttributedTransaction(calldata, "Score Submission");
});

async function sendAttributedTransaction(baseDataHex, actionName) {
    try {
        await checkNetwork();
        const network = await provider.getNetwork();
        if (Number(network.chainId) !== BASE_CHAIN_ID) {
            alert("Network error. Please switch to Base L2.");
            return;
        }

        showTxModal(`Processing ${actionName}`, "Please confirm the transaction in your wallet.");

        // If CONTRACT_ADDRESS is set, we send to the contract.
        // Otherwise, we send to the Base WETH9 contract as a safe fallback to record activity.
        // Many wallets block data payloads to EOAs (userAddress), but WETH9 accepts 0 ETH with data safely.
        const WETH9_ADDRESS = '0x4200000000000000000000000000000000000006';
        const toAddress = CONTRACT_ADDRESS ? CONTRACT_ADDRESS : WETH9_ADDRESS;
        
        // Determine the prefix for our action (either contract call or just hex string marker)
        let dataPrefix = baseDataHex;
        
        // If not a contract call, just pad the action name to hex (e.g., "CHECKIN")
        if(!CONTRACT_ADDRESS) {
            // Encode "CHECKIN" or "SCORE:123" to hex for fallback mode
            let text = actionName === "Daily Check-in" ? "CHECKIN" : `SCORE:${window.score}`;
            dataPrefix = "0x" + Array.from(text).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
        }

        // APPEND BUILDER STRING!
        const finalData = dataPrefix + BUILDER_STRING_NO_PREFIX;

        const tx = {
            to: toAddress,
            value: 0,
            data: finalData
        };

        const txResponse = await signer.sendTransaction(tx);
        
        txTitle.innerText = "Transaction Sent";
        txMessage.innerText = "Waiting for confirmation...";
        
        await txResponse.wait();
        
        updateTxModal("Success!", `${actionName} recorded onchain.`, true);
        
        if (actionName === "Score Submission") {
            submitScoreBtn.classList.add('hidden'); // hide after submit
        }

    } catch (error) {
        console.error(error);
        updateTxModal("Transaction Failed", error.reason || error.message || "An error occurred.", false);
    }
}
