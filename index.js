import "dotenv/config";
import blessed from "blessed";
import figlet from "figlet";
import { ethers } from "ethers";
import axios from "axios";

// ==== CONFIGURATION ====
const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const ATH_ADDRESS = process.env.ATH_ADDRESS;
const AI16Z_ADDRESS = process.env.AI16Z_ADDRESS;
const USDE_ADDRESS = process.env.USDE_ADDRESS;
const VANA_ADDRESS = process.env.VANA_ADDRESS;
const VIRTUAL_ADDRESS = process.env.VIRTUAL_ADDRESS;
const LULUSD_ADDRESS = process.env.LULUSD_ADDRESS;
const AZUSD_ADDRESS = process.env.AZUSD_ADDRESS;
const VANAUSD_ADDRESS = process.env.VANAUSD_ADDRESS;
const AUSD_ADDRESS = process.env.AUSD_ADDRESS;
const VUSD_ADDRESS = process.env.VUSD_ADDRESS;

const ROUTER_ADDRESS_AUSD = "0x2cFDeE1d5f04dD235AEA47E1aD2fB66e3A61C13e";
const ROUTER_ADDRESS_VUSD = "0x3dCACa90A714498624067948C092Dd0373f08265";
const ROUTER_ADDRESS_AZUSD = "0xB0b53d8B4ef06F9Bbe5db624113C6A5D35bB7522";
const ROUTER_ADDRESS_VANAUSD = "0xEfbAE3A68b17a61f21C7809Edfa8Aa3CA7B2546f";
const STAKING_ADDRESS_AZUSD = "0xf45Fde3F484C44CC35Bdc2A7fCA3DDDe0C8f252E";
const STAKING_ADDRESS_VANAUSD = "0x2608A88219BFB34519f635Dd9Ca2Ae971539ca60";
const STAKING_ADDRESS_VUSD = "0x5bb9Fa02a3DCCDB4E9099b48e8Ba5841D2e59d51";
const STAKING_ADDRESS_AUSD = "0x054de909723ECda2d119E31583D40a52a332f85c";
const STAKING_ADDRESS_LULUSD = "0x5De3fBd40D4c3892914c3b67b5B529D776A1483A";
const STAKING_ADDRESS_USDE = "0x3988053b7c748023a1aE19a8ED4c1Bf217932bDB";
const NETWORK_NAME = "Arbitrum Sepolia";
const DEBUG_MODE = false;

const ERC20ABI = [
  "function decimals() view returns (uint8)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transferFrom(address sender, address recipient, uint256 amount) external returns (bool)",
];

const ROUTER_ABI_MINT = [
  {
    "inputs": [{ "type": "uint256", "name": "amount" }],
    "name": "customMint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const STAKING_ABI = [
  {
    "inputs": [{ "type": "uint256", "name": "amount" }],
    "name": "stake",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function",
    "selector": "0xa694fc3a"
  },
  {
    "inputs": [],
    "name": "vault",
    "outputs": [{ "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "ausd",
    "outputs": [{ "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "token",
    "outputs": [{ "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// --- TOKEN CONFIG ---
const TOKEN_CONFIG = {
  AUSD: {
    routerAddress: ROUTER_ADDRESS_AUSD,
    selector: "0x1bf6318b",
    inputTokenAddress: ATH_ADDRESS,
    outputTokenAddress: AUSD_ADDRESS,
    inputTokenName: "ATH",
    minAmount: 50
  },
  VUSD: {
    routerAddress: ROUTER_ADDRESS_VUSD,
    selector: "0xa6d67510",
    inputTokenAddress: VIRTUAL_ADDRESS,
    outputTokenAddress: VUSD_ADDRESS,
    inputTokenName: "Virtual",
    minAmount: 2
  },
  AZUSD: {
    routerAddress: ROUTER_ADDRESS_AZUSD,
    selector: "0xa6d67510",
    inputTokenAddress: AI16Z_ADDRESS,
    outputTokenAddress: AZUSD_ADDRESS,
    inputTokenName: "Ai16Z",
    minAmount: 5
  },
  VANAUSD: {
    routerAddress: ROUTER_ADDRESS_VANAUSD,
    selector: "0xa6d67510",
    inputTokenAddress: VANA_ADDRESS,
    outputTokenAddress: VANAUSD_ADDRESS,
    inputTokenName: "VANA",
    minAmount: 0.2
  }
};

const STAKING_CONFIG = {
  AZUSD: {
    stakingAddress: STAKING_ADDRESS_AZUSD,
    tokenAddress: AZUSD_ADDRESS,
    tokenName: "azUSD",
    minAmount: 0.0001,
    requiresTransferFeeCheck: true,
    requiresTokenFunction: true
  },
  VANAUSD: {
    stakingAddress: STAKING_ADDRESS_VANAUSD,
    tokenAddress: VANAUSD_ADDRESS,
    tokenName: "VANAUSD",
    minAmount: 0.0001,
    requiresTransferFeeCheck: true,
    requiresTokenFunction: true
  },
  VUSD: {
    stakingAddress: STAKING_ADDRESS_VUSD,
    tokenAddress: VUSD_ADDRESS,
    tokenName: "vUSD",
    minAmount: 0.0001,
    requiresTransferFeeCheck: true,
    requiresTokenFunction: true
  },
  AUSD: {
    stakingAddress: STAKING_ADDRESS_AUSD,
    tokenAddress: AUSD_ADDRESS,
    tokenName: "AUSD",
    minAmount: 0.0001,
    requiresTransferFeeCheck: false,
    requiresTokenFunction: false
  },
  LULUSD: {
    stakingAddress: STAKING_ADDRESS_LULUSD,
    tokenAddress: LULUSD_ADDRESS,
    tokenName: "LULUSD",
    minAmount: 0.0001,
    requiresTransferFeeCheck: true,
    requiresTokenFunction: true
  },
  USDE: {
    stakingAddress: STAKING_ADDRESS_USDE,
    tokenAddress: USDE_ADDRESS,
    tokenName: "USDe",
    minAmount: 0.0001,
    requiresTransferFeeCheck: true,
    requiresTokenFunction: true
  }
};

const FAUCET_APIS = {
  ATH: "https://app.x-network.io/maitrix-faucet/faucet",
  USDe: "https://app.x-network.io/maitrix-usde/faucet",
  LULUSD: "https://app.x-network.io/maitrix-lvl/faucet",
  Ai16Z: "https://app.x-network.io/maitrix-ai16z/faucet",
  Virtual: "https://app.x-network.io/maitrix-virtual/faucet",
  Vana: "https://app.x-network.io/maitrix-vana/faucet",
};

// ===== WALLET STATE & LOGIC =====
let walletInfo = {
  address: "",
  balanceEth: "0.00",
  balanceAth: "0.00",
  balanceAi16z: "0.00",
  balanceUsde: "0.00",
  balanceVana: "0.00",
  balanceVirtual: "0.00",
  balanceLulusd: "0.00",
  balanceAzusd: "0.00",
  balanceVanausd: "0.00",
  balanceAusd: "0.00",
  balanceVusd: "0.00",
  network: NETWORK_NAME,
  status: "Initializing",
};

let transactionLogs = [];
let actionRunning = false;
let actionCancelled = false;
let globalWallet = null;
let provider = null;

function getShortAddress(address) {
  return address ? address.slice(0, 6) + "..." + address.slice(-4) : "N/A";
}

function addLog(message, type) {
  if (type === "debug" && !DEBUG_MODE) return;
  const timestamp = new Date().toLocaleTimeString();
  let coloredMessage = message;
  if (type === "system") coloredMessage = `{bright-white-fg}${message}{/bright-white-fg}`;
  else if (type === "error") coloredMessage = `{bright-red-fg}${message}{/bright-red-fg}`;
  else if (type === "success") coloredMessage = `{bright-green-fg}${message}{/bright-green-fg}`;
  else if (type === "warning") coloredMessage = `{bright-yellow-fg}${message}{/bright-yellow-fg}`;
  else if (type === "debug") coloredMessage = `{bright-magenta-fg}${message}{/bright-magenta-fg}`;
  transactionLogs.push(`{bright-cyan-fg}[{/bright-cyan-fg} {bold}{grey-fg}${timestamp}{/grey-fg}{/bold} {bright-cyan-fg}]{/bright-cyan-fg} {bold}${coloredMessage}{/bold}`);
  updateLogs();
}

function updateLogs() {
  logsBox.setContent(transactionLogs.join("\n"));
  logsBox.setScrollPerc(100);
  safeRender();
}

function clearTransactionLogs() {
  transactionLogs = [];
  logsBox.setContent("");
  logsBox.setScroll(0);
  updateLogs();
  safeRender();
  addLog("Transaction logs have been cleared.", "system");
}

// ===== UI LAYOUT =====
const screen = blessed.screen({
  smartCSR: true,
  title: "Maitrix Auto Bot",
  fullUnicode: true,
  mouse: true,
});

let renderTimeout;
function safeRender() {
  if (renderTimeout) clearTimeout(renderTimeout);
  renderTimeout = setTimeout(() => {
    screen.render();
  }, 50);
}

const headerBox = blessed.box({
  top: 0,
  left: "center",
  width: "100%",
  tags: true,
  style: { fg: "white", bg: "default" },
});

figlet.text("NT EXHAUST".toUpperCase(), { font: "ANSI Shadow" }, (err, data) => {
  if (err) headerBox.setContent("{center}{bold}NT Exhaust{/bold}{/center}");
  else headerBox.setContent(`{center}{bold}{bright-cyan-fg}${data}{/bright-cyan-fg}{/bold}{/center}`);
  safeRender();
});

const descriptionBox = blessed.box({
  left: "center",
  width: "100%",
  content: "{center}{bold}{bright-yellow-fg}✦ ✦ MAITRIX AUTO BOT ✦ ✦{/bright-yellow-fg}{/bold}{/center}",
  tags: true,
  style: { fg: "white", bg: "default" },
});

const logsBox = blessed.box({
  label: " Transaction Logs ",
  left: 0,
  border: { type: "line" },
  scrollable: true,
  alwaysScroll: true,
  mouse: true,
  keys: true,
  vi: true,
  tags: true,
  style: { border: { fg: "red" }, fg: "white" },
  scrollbar: { ch: " ", inverse: true, style: { bg: "blue" } },
  content: "",
});

const walletBox = blessed.box({
  label: " Wallet Information ",
  border: { type: "line" },
  tags: true,
  style: { border: { fg: "magenta" }, fg: "white", bg: "default" },
  content: "Loading wallet data...",
});

function updateWallet() {
  const shortAddress = walletInfo.address ? getShortAddress(walletInfo.address) : "N/A";
  const eth = walletInfo.balanceEth ? Number(walletInfo.balanceEth).toFixed(4) : "0.0000";
  const ath = walletInfo.balanceAth ? Number(walletInfo.balanceAth).toFixed(4) : "0.0000";
  const ai16z = walletInfo.balanceAi16z ? Number(walletInfo.balanceAi16z).toFixed(4) : "0.0000";
  const usde = walletInfo.balanceUsde ? Number(walletInfo.balanceUsde).toFixed(4) : "0.0000";
  const vana = walletInfo.balanceVana ? Number(walletInfo.balanceVana).toFixed(4) : "0.0000";
  const virtual = walletInfo.balanceVirtual ? Number(walletInfo.balanceVirtual).toFixed(4) : "0.0000";
  const lulusd = walletInfo.balanceLulusd ? Number(walletInfo.balanceLulusd).toFixed(4) : "0.0000";
  const azusd = walletInfo.balanceAzusd ? Number(walletInfo.balanceAzusd).toFixed(4) : "0.0000";
  const vanausd = walletInfo.balanceVanausd ? Number(walletInfo.balanceVanausd).toFixed(4) : "0.0000";
  const ausd = walletInfo.balanceAusd ? Number(walletInfo.balanceAusd).toFixed(4) : "0.0000";
  const vusd = walletInfo.balanceVusd ? Number(walletInfo.balanceVusd).toFixed(4) : "0.0000";
  const content = ` Address: {bright-yellow-fg}${shortAddress}{/bright-yellow-fg}
 ETH    : {bright-green-fg}${eth.padStart(8)}{/bright-green-fg} | azUSD  : {bright-green-fg}${azusd.padStart(8)}{/bright-green-fg}
 ATH    : {bright-green-fg}${ath.padStart(8)}{/bright-green-fg} | VANAUSD: {bright-green-fg}${vanausd.padStart(8)}{/bright-green-fg}
 Ai16Z  : {bright-green-fg}${ai16z.padStart(8)}{/bright-green-fg} | aUSD   : {bright-green-fg}${ausd.padStart(8)}{/bright-green-fg}
 USDE   : {bright-green-fg}${usde.padStart(8)}{/bright-green-fg} | vUSD   : {bright-green-fg}${vusd.padStart(8)}{/bright-green-fg}
 Vana   : {bright-green-fg}${vana.padStart(8)}{/bright-green-fg} | LULUSD : {bright-green-fg}${lulusd.padStart(8)}{/bright-green-fg}
 Virtual: {bright-green-fg}${virtual.padStart(8)}{/bright-green-fg} | Network: {bright-cyan-fg}${NETWORK_NAME}{/bright-cyan-fg}`;
  walletBox.setContent(content);
  safeRender();
}

function getMainMenuItems() {
  let items = [];
  if (actionRunning) items.push("Stop Transaction");
  items = items.concat([
    "Mint Token",
    "Claim Faucet",
    "Stake Token",
    "Clear Transaction Logs",
    "Refresh",
    "Exit"
  ]);
  return items;
}

function getMintMenuItems() {
  let items = [];
  if (actionRunning) items.push("Stop Transaction");
  items = items.concat([
    "Mint All Tokens (Max)", "Mint AUSD", "Mint vUSD", "Mint VANAUSD", "Mint azUSD",
    "Back to Main Menu"
  ]);
  return items;
}

function getFaucetMenuItems() {
  let items = [];
  if (actionRunning) items.push("Stop Transaction");
  items = items.concat([
    "Claim All Faucets", "Back to Main Menu"
  ]);
  return items;
}

function getStakeMenuItems() {
  let items = [];
  if (actionRunning) items.push("Stop Transaction");
  items = items.concat([
    "Stake All Tokens (Max)", "Stake azUSD", "Stake AUSD", "Stake VANAUSD", "Stake vUSD", "Stake USDe", "Stake LULUSD",
    "Back to Main Menu"
  ]);
  return items;
}

const mainMenu = blessed.list({
  label: " Main Menu ",
  left: "60%",
  keys: true,
  vi: true,
  mouse: true,
  border: { type: "line" },
  style: { fg: "white", bg: "default", border: { fg: "red" }, selected: { bg: "green", fg: "black" } },
  items: getMainMenuItems(),
});

const mintMenu = blessed.list({
  label: " Mint Menu ",
  left: "60%",
  keys: true,
  vi: true,
  mouse: true,
  tags: true,
  border: { type: "line" },
  style: { fg: "white", bg: "default", border: { fg: "red" }, selected: { bg: "cyan", fg: "black" } },
  items: getMintMenuItems(),
});
mintMenu.hide();

const faucetMenu = blessed.list({
  label: " Faucet Menu ",
  left: "60%",
  keys: true,
  vi: true,
  mouse: true,
  tags: true,
  border: { type: "line" },
  style: { fg: "white", bg: "default", border: { fg: "red" }, selected: { bg: "cyan", fg: "black" } },
  items: getFaucetMenuItems(),
});
faucetMenu.hide();

const stakeMenu = blessed.list({
  label: " Stake Menu ",
  left: "60%",
  keys: true,
  vi: true,
  mouse: true,
  tags: true,
  border: { type: "line" },
  style: { fg: "white", bg: "default", border: { fg: "red" }, selected: { bg: "cyan", fg: "black" } },
  items: getStakeMenuItems(),
});
stakeMenu.hide();

const promptBox = blessed.prompt({
  parent: screen,
  border: "line",
  height: 5,
  width: "60%",
  top: "center",
  left: "center",
  label: "{bright-blue-fg}Prompt{/bright-blue-fg}",
  tags: true,
  keys: true,
  vi: true,
  mouse: true,
  style: { fg: "bright-red", bg: "default", border: { fg: "red" } },
});

screen.append(headerBox);
screen.append(descriptionBox);
screen.append(logsBox);
screen.append(walletBox);
screen.append(mainMenu);
screen.append(mintMenu);
screen.append(faucetMenu);
screen.append(stakeMenu);

function adjustLayout() {
  const screenHeight = screen.height;
  const screenWidth = screen.width;
  const headerHeight = Math.max(8, Math.floor(screenHeight * 0.15));
  headerBox.top = 0;
  headerBox.height = headerHeight;
  headerBox.width = "100%";
  descriptionBox.top = "22%";
  descriptionBox.height = Math.floor(screenHeight * 0.05);
  logsBox.top = headerHeight + descriptionBox.height;
  logsBox.left = 0;
  logsBox.width = Math.floor(screenWidth * 0.6);
  logsBox.height = screenHeight - (headerHeight + descriptionBox.height);
  walletBox.top = headerHeight + descriptionBox.height;
  walletBox.left = Math.floor(screenWidth * 0.6);
  walletBox.width = Math.floor(screenWidth * 0.4);
  walletBox.height = Math.floor(screenHeight * 0.35);
  mainMenu.top = headerHeight + descriptionBox.height + walletBox.height;
  mainMenu.left = Math.floor(screenWidth * 0.6);
  mainMenu.width = Math.floor(screenWidth * 0.4);
  mainMenu.height = screenHeight - (headerHeight + descriptionBox.height + walletBox.height);
  mintMenu.top = mainMenu.top;
  mintMenu.left = mainMenu.left;
  mintMenu.width = mainMenu.width;
  mintMenu.height = mainMenu.height;
  faucetMenu.top = mainMenu.top;
  faucetMenu.left = mainMenu.left;
  faucetMenu.width = mainMenu.width;
  faucetMenu.height = mainMenu.height;
  stakeMenu.top = mainMenu.top;
  stakeMenu.left = mainMenu.left;
  stakeMenu.width = mainMenu.width;
  stakeMenu.height = mainMenu.height;
  safeRender();
}

screen.on("resize", adjustLayout);
adjustLayout();

// ===== WALLET DATA =====
async function getTokenBalance(tokenAddress) {
  try {
    const contract = new ethers.Contract(tokenAddress, ERC20ABI, provider);
    const balance = await contract.balanceOf(globalWallet.address);
    const decimals = await contract.decimals();
    return ethers.formatUnits(balance, decimals);
  } catch (error) {
    addLog(`Failed to get balance for token ${tokenAddress}: ${error.message}`, "error");
    return "0";
  }
}

async function getTokenRawBalance(tokenAddress) {
  try {
    const contract = new ethers.Contract(tokenAddress, ERC20ABI, provider);
    return await contract.balanceOf(globalWallet.address);
  } catch (error) {
    addLog(`Failed to get raw balance for token ${tokenAddress}: ${error.message}`, "error");
    return ethers.BigNumber.from(0);
  }
}

async function updateWalletData() {
  try {
    provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    globalWallet = wallet;
    walletInfo.address = wallet.address;

    const ethBalance = await provider.getBalance(wallet.address);
    walletInfo.balanceEth = ethers.formatEther(ethBalance);
    walletInfo.balanceAth = await getTokenBalance(ATH_ADDRESS);
    walletInfo.balanceAi16z = await getTokenBalance(AI16Z_ADDRESS);
    walletInfo.balanceUsde = await getTokenBalance(USDE_ADDRESS);
    walletInfo.balanceVana = await getTokenBalance(VANA_ADDRESS);
    walletInfo.balanceVirtual = await getTokenBalance(VIRTUAL_ADDRESS);
    walletInfo.balanceLulusd = await getTokenBalance(LULUSD_ADDRESS);
    walletInfo.balanceAzusd = await getTokenBalance(AZUSD_ADDRESS);
    walletInfo.balanceVanausd = await getTokenBalance(VANAUSD_ADDRESS);
    walletInfo.balanceAusd = await getTokenBalance(AUSD_ADDRESS);
    walletInfo.balanceVusd = await getTokenBalance(VUSD_ADDRESS);

    updateWallet();
    addLog("Wallet information updated.", "system");
  } catch (error) {
    addLog("Failed to update wallet data: " + error.message, "system");
  }
}

// ======= MINT, STAKE, FAUCET LOGIC (ENGLISH LOGS) =======
async function claimFaucet(token) {
  const apiUrl = FAUCET_APIS[token];
  if (!apiUrl) throw new Error(`API for token ${token} not found.`);
  const headers = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
    Origin: "https://app.testnet.themaitrix.ai",
  };
  const payload = { address: globalWallet.address };
  try {
    const response = await axios.post(apiUrl, payload, { headers });
    const { code, message, data } = response.data;
    if (code === 200) {
      addLog(`Successfully claimed faucet for ${token}: ${data.amount} tokens. TxHash: ${data.txHash}`, "success");
      return { receipt: { status: 1 }, txHash: data.txHash };
    } else if (code === 202) {
      addLog(`Faucet claim for ${token} failed: ${message}`, "warning");
      return { receipt: { status: 0 } };
    } else {
      addLog(`Faucet claim for ${token} failed: ${message}`, "error");
      return { receipt: { status: 0 } };
    }
  } catch (error) {
    addLog(`Error claiming faucet for ${token}: ${error.message}. Continuing to next token.`, "error");
    return { receipt: { status: 0 } };
  }
}

async function mintToken(token, amount) {
  try {
    const config = TOKEN_CONFIG[token];
    if (!config) throw new Error(`Token ${token} is not supported for minting.`);
    const { routerAddress, selector, inputTokenAddress, outputTokenAddress, inputTokenName } = config;
    if (!ethers.isAddress(inputTokenAddress) || !ethers.isAddress(outputTokenAddress) || !ethers.isAddress(routerAddress)) {
      throw new Error(`Invalid contract address for Input=${inputTokenAddress}, Output=${outputTokenAddress}, Router=${routerAddress}`);
    }
    const inputContract = new ethers.Contract(inputTokenAddress, ERC20ABI, globalWallet);
    const routerContract = new ethers.Contract(routerAddress, ROUTER_ABI_MINT, globalWallet);
    let decimals = await inputContract.decimals();
    const amountWei = ethers.parseUnits(amount.toString(), decimals);
    const balance = await inputContract.balanceOf(globalWallet.address);
    if (balance < amountWei) throw new Error(`Not enough ${inputTokenName}: ${ethers.formatUnits(balance, decimals)} available, ${amount} required`);
    const allowance = await inputContract.allowance(globalWallet.address, routerAddress);
    if (allowance < amountWei) {
      addLog(`Requesting approval for ${amount} ${inputTokenName}...`, "warning");
      const approveTx = await inputContract.approve(routerAddress, amountWei);
      await approveTx.wait();
      addLog(`Approval successful!`, "success");
    }
    const paddedAmount = ethers.zeroPadValue(ethers.toBeHex(amountWei), 32);
    const txData = selector + paddedAmount.slice(2);
    try {
      addLog(`Simulating mint transaction with selector ${selector}`, "debug");
      await provider.call({ to: routerAddress, data: txData, from: globalWallet.address });
      addLog(`Simulation successful`, "debug");
    } catch (error) {
      let revertReason = error.data ? (routerContract.interface.parseError(error.data)?.name || error.data) : "Revert reason unknown";
      addLog(`Simulation failed: ${revertReason}`, "warning");
      if (token !== "AUSD") throw new Error(`Simulation failed: ${revertReason}`);
    }
    addLog(`Sending mint transaction with selector ${selector}`, "debug");
    const tx = await globalWallet.sendTransaction({ to: routerAddress, data: txData, gasLimit: 250000 });
    addLog(`Transaction sent. TxHash: ${tx.hash}`, "warning");
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      addLog(`Successfully minted ${token}: ${amount} ${inputTokenName}. TxHash: ${receipt.transactionHash || receipt.hash}`, "success");
      return receipt.transactionHash || receipt.hash;
    } else {
      throw new Error(`Mint transaction failed: TxHash: ${receipt.transactionHash || receipt.hash}`);
    }
  } catch (error) {
    throw new Error(`Failed to mint ${token}: ${error.message}`);
  }
}

async function mintTokenMax(token) {
  const config = TOKEN_CONFIG[token];
  const inputContract = new ethers.Contract(config.inputTokenAddress, ERC20ABI, globalWallet);
  const decimals = await inputContract.decimals();
  let rawBalance = await inputContract.balanceOf(globalWallet.address);
  // For AUSD, leave a buffer to cover gas (ATH is used for gas)
  let buffer = ethers.parseUnits("0.003", decimals);
  if (token === "AUSD" && rawBalance > buffer) rawBalance = rawBalance - buffer;
  // Don't mint if nothing available
  if (rawBalance <= 0) {
    addLog(`No ${config.inputTokenName} available to mint.`, "warning");
    return;
  }
  await mintToken(token, ethers.formatUnits(rawBalance, decimals));
}

async function stakeToken(token, amount) {
  try {
    const config = STAKING_CONFIG[token];
    if (!config) throw new Error(`Token ${token} is not supported for staking.`);
    const { stakingAddress, tokenAddress, tokenName } = config;
    if (!ethers.isAddress(tokenAddress) || !ethers.isAddress(stakingAddress)) {
      throw new Error(`Invalid contract address for Token=${tokenAddress}, Staking=${stakingAddress}`);
    }
    const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, globalWallet);
    const stakingContract = new ethers.Contract(stakingAddress, STAKING_ABI, globalWallet);
    let decimals = await tokenContract.decimals();
    const amountWei = ethers.parseUnits(amount.toString(), decimals);
    const balance = await tokenContract.balanceOf(globalWallet.address);
    if (balance < amountWei) throw new Error(`Not enough ${tokenName}: ${ethers.formatUnits(balance, decimals)} available, ${amount} required`);
    const allowance = await tokenContract.allowance(globalWallet.address, stakingAddress);
    if (allowance < amountWei) {
      addLog(`Requesting approval for ${amount} ${tokenName}...`, "warning");
      const approveTx = await tokenContract.approve(stakingAddress, amountWei, { gasLimit: 100000 });
      await approveTx.wait();
      addLog(`Approval successful!`, "success");
    }
    try {
      await provider.call({
        to: stakingAddress,
        data: stakingContract.interface.encodeFunctionData("stake", [amountWei]),
        from: globalWallet.address,
      });
    } catch (error) {
      let revertReason = error.data ? ethers.AbiCoder.defaultAbiCoder().decode(["string"], "0x" + error.data.slice(10))[0] : "Revert reason unknown";
      throw new Error(`Simulation failed: ${revertReason}`);
    }
    addLog(`Sending stake transaction`, "debug");
    const tx = await stakingContract.stake(amountWei, { gasLimit: 300000 });
    addLog(`Transaction sent. TxHash: ${tx.hash}`, "warning");
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      addLog(`Successfully staked ${amount} ${tokenName}. TxHash: ${receipt.transactionHash || receipt.hash}`, "success");
      return receipt.transactionHash || receipt.hash;
    } else {
      throw new Error(`Stake transaction failed: TxHash: ${receipt.transactionHash || receipt.hash}`);
    }
  } catch (error) {
    throw new Error(`Failed to stake ${token}: ${error.message}`);
  }
}

async function stakeTokenMax(token) {
  const config = STAKING_CONFIG[token];
  const tokenContract = new ethers.Contract(config.tokenAddress, ERC20ABI, globalWallet);
  const decimals = await tokenContract.decimals();
  let rawBalance = await tokenContract.balanceOf(globalWallet.address);
  // Leave a dust buffer to avoid rounding issues
  const buffer = ethers.parseUnits("0.00005", decimals);
  if (rawBalance > buffer) rawBalance = rawBalance - buffer;
  if (rawBalance <= 0) {
    addLog(`No ${config.tokenName} available to stake.`, "warning");
    return;
  }
  await stakeToken(token, ethers.formatUnits(rawBalance, decimals));
}

async function runMint(token) {
  promptBox.setFront();
  const config = TOKEN_CONFIG[token];
  if (!config) {
    addLog(`Token ${token} is not supported for minting.`, "error");
    return;
  }
  const { inputTokenName, minAmount } = config;
  promptBox.readInput(`Enter mint amount for ${token} (or type 'max' for maximum, minimum ${minAmount} ${inputTokenName}):`, "", async (err, value) => {
    promptBox.hide();
    safeRender();
    if (err || !value) {
      addLog(`Mint ${token}: Invalid input or cancelled.`, "system");
      return;
    }
    if (value.trim().toLowerCase() === "max") {
      await mintTokenMax(token);
      await updateWalletData();
      return;
    }
    const amount = parseFloat(value);
    if (isNaN(amount) || amount < minAmount) {
      addLog(`Mint ${token}: Minimum amount is ${minAmount} ${inputTokenName}.`, "warning");
      return;
    }
    await mintToken(token, amount).then(() => updateWalletData()).catch(e => addLog(e.message, "error"));
  });
}

async function runMintAll() {
  for (const token in TOKEN_CONFIG) {
    addLog(`Minting maximum for ${token}...`, "system");
    try {
      await mintTokenMax(token);
      await updateWalletData();
    } catch (e) {
      addLog(e.message, "error");
    }
  }
}

async function runStake(token) {
  promptBox.setFront();
  const config = STAKING_CONFIG[token];
  if (!config) {
    addLog(`Token ${token} is not supported for staking.`, "error");
    return;
  }
  const { tokenName, minAmount } = config;
  promptBox.readInput(`Enter stake amount for ${token} (or type 'max' for maximum, minimum ${minAmount} ${tokenName}):`, "", async (err, value) => {
    promptBox.hide();
    safeRender();
    if (err || !value) {
      addLog(`Stake ${token}: Invalid input or cancelled.`, "system");
      return;
    }
    if (value.trim().toLowerCase() === "max") {
      await stakeTokenMax(token);
      await updateWalletData();
      return;
    }
    const amount = parseFloat(value);
    if (isNaN(amount) || amount < minAmount) {
      addLog(`Stake ${token}: Minimum amount is ${minAmount} ${tokenName}.`, "warning");
      return;
    }
    await stakeToken(token, amount).then(() => updateWalletData()).catch(e => addLog(e.message, "error"));
  });
}

async function runStakeAll() {
  for (const token in STAKING_CONFIG) {
    addLog(`Staking maximum for ${token}...`, "system");
    try {
      await stakeTokenMax(token);
      await updateWalletData();
    } catch (e) {
      addLog(e.message, "error");
    }
  }
}

async function runFaucetAll() {
  for (const token in FAUCET_APIS) {
    addLog(`Claiming faucet for ${token}...`, "system");
    try {
      await claimFaucet(token);
      await updateWalletData();
    } catch (e) {
      addLog(e.message, "error");
    }
  }
}

// ====== MENU HANDLERS ======
mainMenu.on("select", (item) => {
  const selected = item.getText();
  if (selected === "Mint Token") {
    mintMenu.show();
    mintMenu.focus();
    safeRender();
  } else if (selected === "Claim Faucet") {
    faucetMenu.show();
    faucetMenu.focus();
    safeRender();
  } else if (selected === "Stake Token") {
    stakeMenu.show();
    stakeMenu.focus();
    safeRender();
  } else if (selected === "Stop Transaction") {
    actionCancelled = true;
    addLog("Stop Transaction: Current operation will be stopped.", "system");
  } else if (selected === "Clear Transaction Logs") {
    clearTransactionLogs();
  } else if (selected === "Refresh") {
    updateWalletData();
    safeRender();
    addLog("Refreshed", "system");
  } else if (selected === "Exit") {
    process.exit(0);
  }
});

mintMenu.on("select", (item) => {
  const selected = item.getText();
  if (selected === "Mint All Tokens (Max)") runMintAll();
  else if (selected.startsWith("Mint ")) runMint(selected.replace("Mint ", ""));
  else if (selected === "Stop Transaction") {
    actionCancelled = true; addLog("Stop Transaction: Current operation will be stopped.", "system");
  } else if (selected === "Back to Main Menu") {
    mintMenu.hide(); mainMenu.show(); mainMenu.focus(); safeRender();
  }
});

faucetMenu.on("select", (item) => {
  const selected = item.getText();
  if (selected === "Claim All Faucets") runFaucetAll();
  else if (selected === "Stop Transaction") {
    actionCancelled = true; addLog("Stop Transaction: Current operation will be stopped.", "system");
  } else if (selected === "Back to Main Menu") {
    faucetMenu.hide(); mainMenu.show(); mainMenu.focus(); safeRender();
  }
});

stakeMenu.on("select", (item) => {
  const selected = item.getText();
  if (selected === "Stake All Tokens (Max)") runStakeAll();
  else if (selected.startsWith("Stake ")) runStake(selected.replace("Stake ", ""));
  else if (selected === "Stop Transaction") {
    actionCancelled = true; addLog("Stop Transaction: Current operation will be stopped.", "system");
  } else if (selected === "Back to Main Menu") {
    stakeMenu.hide(); mainMenu.show(); mainMenu.focus(); safeRender();
  }
});

// KEY BINDINGS
screen.key(["escape", "q", "C-c"], () => process.exit(0));
screen.key(["C-up"], () => { logsBox.scroll(-1); safeRender(); });
screen.key(["C-down"], () => { logsBox.scroll(1); safeRender(); });

// BOOTSTRAP
safeRender();
mainMenu.focus();
addLog("Don't forget to subscribe to YT and Telegram @NTExhaust!!", "system");
updateWalletData();