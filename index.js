import "dotenv/config";
import { ethers } from "ethers";
import axios from "axios";
import * as utils from "./utils.js";
import blessed from "blessed";
import fs from "fs";

// ==== CONFIGURATION ====
const RPC_URL = process.env.RPC_URL;

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

function getLinesFromFile(filename) {
  try {
    return fs.readFileSync(filename, "utf-8").split("\n").map(x => x.trim()).filter(Boolean);
  } catch {
    return [];
  }
}
const proxies = getLinesFromFile("proxy.txt");
const privateKeys = getLinesFromFile("pvkeys.txt");

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
    "type": "function"
  }
];

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
    minAmount: 0.0001
  },
  VANAUSD: {
    stakingAddress: STAKING_ADDRESS_VANAUSD,
    tokenAddress: VANAUSD_ADDRESS,
    tokenName: "VANAUSD",
    minAmount: 0.0001
  },
  VUSD: {
    stakingAddress: STAKING_ADDRESS_VUSD,
    tokenAddress: VUSD_ADDRESS,
    tokenName: "vUSD",
    minAmount: 0.0001
  },
  AUSD: {
    stakingAddress: STAKING_ADDRESS_AUSD,
    tokenAddress: AUSD_ADDRESS,
    tokenName: "AUSD",
    minAmount: 0.0001
  },
  LULUSD: {
    stakingAddress: STAKING_ADDRESS_LULUSD,
    tokenAddress: LULUSD_ADDRESS,
    tokenName: "LULUSD",
    minAmount: 0.0001
  },
  USDE: {
    stakingAddress: STAKING_ADDRESS_USDE,
    tokenAddress: USDE_ADDRESS,
    tokenName: "USDe",
    minAmount: 0.0001
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

// ==== BLESSED UI SETUP ====
const screen = blessed.screen({ smartCSR: true, title: 'ANSH CLI Maitrix Bot' });

// Splash/loading box
const splash = blessed.box({
  top: 'center',
  left: 'center',
  width: '60%',
  height: 7,
  align: 'center',
  valign: 'middle',
  border: { type: 'line' },
  style: { border: { fg: 'yellow' } },
  content: '{yellow-fg}🔔 Checking routing protocols, please wait...{/yellow-fg}',
  tags: true,
  hidden: false
});

// Menu box (left)
const menu = blessed.list({
  parent: screen,
  label: ' Main Menu ',
  width: '25%',
  height: '90%',
  top: 'center',
  left: 0,
  keys: true,
  mouse: true,
  border: { type: 'line' },
  style: {
    selected: { bg: 'green', fg: 'black' },
    item: { fg: 'white', bg: 'black' },
    border: { fg: '#00ff00' }
  },
  items: [
    'Claim Faucets for all accounts',
    'Mint all tokens for all accounts',
    'Stake all tokens for all accounts',
    'Run Full Bot Sequence',
    'Sync Status (config)',
    'Exit'
  ],
  hidden: true
});

// Output log box (main area)
const outputBox = blessed.log({
  parent: screen,
  label: ' Output ',
  width: '50%',
  height: '90%',
  top: 'center',
  left: '25%',
  border: { type: 'line' },
  style: { border: { fg: '#00ff00' } },
  scrollable: true,
  alwaysScroll: true,
  scrollbar: { bg: 'green', ch: ' ' },
  hidden: true,
  tags: true
});

// Wallet status box (right)
const walletBox = blessed.box({
  parent: screen,
  label: ' Wallets ',
  width: '25%',
  height: '90%',
  top: 'center',
  left: '75%',
  border: { type: 'line' },
  style: { border: { fg: '#00ff00' } },
  tags: true,
  hidden: true,
  content: ''
});

// Helper: update wallet status area
function showWalletStatus(currentIdx = 0, address = '', total = null) {
  if (!total) total = privateKeys.length;
  let content = `{bold}Total Wallets:{/bold} ${total}\n`;
  if (address) {
    content += `{bold}Now:{/bold} #${currentIdx + 1} ${address}\n`;
  } else {
    content += `{bold}Now:{/bold} (none)\n`;
  }
  walletBox.setContent(content);
  screen.render();
}

// Logging helper for output box
function logToUI(msg, type = "info") {
  const color = type === "success" ? "green"
    : type === "error" ? "red"
    : type === "warn" ? "yellow"
    : type === "system" ? "cyan"
    : "white";
  outputBox.log(`{${color}-fg}${msg}{/}`);
  outputBox.setScrollPerc(100);
  screen.render();
}

function clearOutput() {
  outputBox.setContent('');
  screen.render();
}

// ==== CORE BOT LOGIC ====

function log(msg, type = "info") {
  logToUI(msg, type);
}

// All bot functions, same as before but logging to outputBox and updating walletBox
async function claimFaucetsForAll() {
  if (!privateKeys.length) {
    log("No private keys found in pvkeys.txt. Please add at least one private key.", "error");
    return;
  }
  for (let i = 0; i < privateKeys.length; ++i) {
    const privKey = privateKeys[i];
    const proxy = proxies[i % proxies.length] || undefined;
    if (proxy) {
      process.env.HTTPS_PROXY = proxy;
      process.env.HTTP_PROXY = proxy;
    } else {
      delete process.env.HTTPS_PROXY;
      delete process.env.HTTP_PROXY;
    }
    let provider = new ethers.JsonRpcProvider(RPC_URL);
    let wallet;
    try {
      wallet = new ethers.Wallet(privKey, provider);
    } catch (e) {
      log(`Invalid private key at line ${i + 1}: ${e.message}`, "error");
      continue;
    }
    showWalletStatus(i, wallet.address, privateKeys.length);
    log(`\n=== [${i + 1}/${privateKeys.length}] Account: ${wallet.address} (Proxy: ${proxy || "none"}) ===`, "system");
    for (const token in FAUCET_APIS) {
      log(`[${i + 1}] Claiming faucet for ${token}...`);
      await claimFaucet(token, wallet);
    }
    log(`[${i + 1}] Faucet claim finished for wallet.`, "system");
  }
  showWalletStatus();
  log("All accounts faucet claim finished.", "system");
}

async function mintAllForAll() {
  if (!privateKeys.length) {
    log("No private keys found in pvkeys.txt. Please add at least one private key.", "error");
    return;
  }
  for (let i = 0; i < privateKeys.length; ++i) {
    const privKey = privateKeys[i];
    const proxy = proxies[i % proxies.length] || undefined;
    if (proxy) {
      process.env.HTTPS_PROXY = proxy;
      process.env.HTTP_PROXY = proxy;
    } else {
      delete process.env.HTTPS_PROXY;
      delete process.env.HTTP_PROXY;
    }
    let provider = new ethers.JsonRpcProvider(RPC_URL);
    let wallet;
    try {
      wallet = new ethers.Wallet(privKey, provider);
    } catch (e) {
      log(`Invalid private key at line ${i + 1}: ${e.message}`, "error");
      continue;
    }
    showWalletStatus(i, wallet.address, privateKeys.length);
    log(`\n=== [${i + 1}/${privateKeys.length}] Account: ${wallet.address} (Proxy: ${proxy || "none"}) ===`, "system");
    for (const token in TOKEN_CONFIG) {
      log(`[${i + 1}] Minting token ${token}...`);
      await mintTokenMax(token, wallet, provider);
    }
    log(`[${i + 1}] Mint finished for wallet.`, "system");
  }
  showWalletStatus();
  log("All accounts mint finished.", "system");
}

async function stakeAllForAll() {
  if (!privateKeys.length) {
    log("No private keys found in pvkeys.txt. Please add at least one private key.", "error");
    return;
  }
  for (let i = 0; i < privateKeys.length; ++i) {
    const privKey = privateKeys[i];
    const proxy = proxies[i % proxies.length] || undefined;
    if (proxy) {
      process.env.HTTPS_PROXY = proxy;
      process.env.HTTP_PROXY = proxy;
    } else {
      delete process.env.HTTPS_PROXY;
      delete process.env.HTTP_PROXY;
    }
    let provider = new ethers.JsonRpcProvider(RPC_URL);
    let wallet;
    try {
      wallet = new ethers.Wallet(privKey, provider);
    } catch (e) {
      log(`Invalid private key at line ${i + 1}: ${e.message}`, "error");
      continue;
    }
    showWalletStatus(i, wallet.address, privateKeys.length);
    log(`\n=== [${i + 1}/${privateKeys.length}] Account: ${wallet.address} (Proxy: ${proxy || "none"}) ===`, "system");
    for (const token in STAKING_CONFIG) {
      log(`[${i + 1}] Staking token ${token}...`);
      await stakeTokenMax(token, wallet, provider);
    }
    log(`[${i + 1}] Stake finished for wallet.`, "system");
  }
  showWalletStatus();
  log("All accounts stake finished.", "system");
}

async function runFullBotForAllAccounts() {
  if (!privateKeys.length) {
    log("No private keys found in pvkeys.txt. Please add at least one private key.", "error");
    return;
  }
  for (let i = 0; i < privateKeys.length; ++i) {
    const privKey = privateKeys[i];
    const proxy = proxies[i % proxies.length] || undefined;
    if (proxy) {
      process.env.HTTPS_PROXY = proxy;
      process.env.HTTP_PROXY = proxy;
    } else {
      delete process.env.HTTPS_PROXY;
      delete process.env.HTTP_PROXY;
    }
    let provider = new ethers.JsonRpcProvider(RPC_URL);
    let wallet;
    try {
      wallet = new ethers.Wallet(privKey, provider);
    } catch (e) {
      log(`Invalid private key at line ${i + 1}: ${e.message}`, "error");
      continue;
    }
    showWalletStatus(i, wallet.address, privateKeys.length);
    log(`\n=== [${i + 1}/${privateKeys.length}] Account: ${wallet.address} (Proxy: ${proxy || "none"}) ===`, "system");
    for (const token in FAUCET_APIS) {
      log(`[${i + 1}] Claiming faucet for ${token}...`);
      await claimFaucet(token, wallet);
    }
    for (const token in TOKEN_CONFIG) {
      log(`[${i + 1}] Minting token ${token}...`);
      await mintTokenMax(token, wallet, provider);
    }
    for (const token in STAKING_CONFIG) {
      log(`[${i + 1}] Staking token ${token}...`);
      await stakeTokenMax(token, wallet, provider);
    }
    log(`[${i + 1}] Finished bot sequence for wallet.`, "system");
  }
  showWalletStatus();
  log("All accounts finished.", "system");
}

async function claimFaucet(token, wallet) {
  const apiUrl = FAUCET_APIS[token];
  if (!apiUrl) { log(`API for token ${token} not found.`, "error"); return; }
  const headers = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0",
    Origin: "https://app.testnet.themaitrix.ai",
  };
  const payload = { address: wallet.address };
  try {
    const response = await axios.post(apiUrl, payload, { headers });
    const { code, message, data } = response.data;
    if (code === 200) {
      log(`Faucet claim success for ${token}: ${data.amount} tokens. TxHash: ${data.txHash}`, "success");
    } else if (code === 202) {
      log(`Faucet claim for ${token} failed: ${message}`, "warn");
    } else {
      log(`Faucet claim for ${token} failed: ${message}`, "error");
    }
  } catch (error) {
    log(`Error claiming faucet for ${token}: ${error.message}`, "error");
  }
}

async function mintTokenMax(token, wallet, provider) {
  try {
    const config = TOKEN_CONFIG[token];
    const inputContract = new ethers.Contract(config.inputTokenAddress, ERC20ABI, provider);
    const inputContractWithSigner = inputContract.connect(wallet);
    const decimals = await inputContract.decimals();
    let rawBalance = await inputContract.balanceOf(wallet.address);
    let buffer = ethers.parseUnits("0.003", decimals);
    if (token === "AUSD" && rawBalance > buffer) rawBalance = rawBalance - buffer;
    if (rawBalance <= 0) {
      log(`No ${config.inputTokenName} available to mint for ${token}.`, "warn");
      return;
    }
    await mintToken(token, ethers.formatUnits(rawBalance, decimals), wallet, provider);
  } catch (e) {
    log(`Error in mintTokenMax for ${token}: ${e.message}`, "error");
  }
}

async function mintToken(token, amount, wallet, provider) {
  try {
    const config = TOKEN_CONFIG[token];
    if (!config) throw new Error(`Token ${token} is not supported for minting.`);
    const { routerAddress, selector, inputTokenAddress, outputTokenAddress, inputTokenName } = config;
    if (!ethers.isAddress(inputTokenAddress) || !ethers.isAddress(outputTokenAddress) || !ethers.isAddress(routerAddress)) {
      throw new Error(`Invalid contract address for Input=${inputTokenAddress}, Output=${outputTokenAddress}, Router=${routerAddress}`);
    }
    const inputContract = new ethers.Contract(inputTokenAddress, ERC20ABI, provider);
    const inputContractWithSigner = inputContract.connect(wallet);
    const decimals = await inputContract.decimals();
    const amountWei = ethers.parseUnits(amount.toString(), decimals);
    const balance = await inputContract.balanceOf(wallet.address);
    if (balance < amountWei) throw new Error(`Not enough ${inputTokenName}: ${ethers.formatUnits(balance, decimals)} available, ${amount} required`);
    const allowance = await inputContract.allowance(wallet.address, routerAddress);
    if (allowance < amountWei) {
      log(`Requesting approval for ${amount} ${inputTokenName}...`, "warn");
      const approveTx = await inputContractWithSigner.approve(routerAddress, amountWei);
      await approveTx.wait();
      log(`Approval successful!`, "success");
    }
    log(`Minting ${token}...`);
    const txData = selector + ethers.zeroPadValue(ethers.toBeHex(amountWei), 32).slice(2);
    const tx = await wallet.sendTransaction({ to: routerAddress, data: txData, gasLimit: 250000 });
    log(`Mint Tx sent. TxHash: ${tx.hash}`);
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      log(`Successfully minted ${token}: ${amount} ${inputTokenName}. TxHash: ${receipt.transactionHash || receipt.hash}`, "success");
    } else {
      throw new Error(`Mint transaction failed: TxHash: ${receipt.transactionHash || receipt.hash}`);
    }
  } catch (error) {
    log(`Failed to mint ${token}: ${error.message}`, "error");
  }
}

async function stakeTokenMax(token, wallet, provider) {
  try {
    const config = STAKING_CONFIG[token];
    const tokenContract = new ethers.Contract(config.tokenAddress, ERC20ABI, provider);
    const tokenContractWithSigner = tokenContract.connect(wallet);
    const decimals = await tokenContract.decimals();
    let rawBalance = await tokenContract.balanceOf(wallet.address);
    const buffer = ethers.parseUnits("0.00005", decimals);
    if (rawBalance > buffer) rawBalance = rawBalance - buffer;
    if (rawBalance <= 0) {
      log(`No ${config.tokenName} available to stake for ${token}.`, "warn");
      return;
    }
    await stakeToken(token, ethers.formatUnits(rawBalance, decimals), wallet, provider);
  } catch (e) {
    log(`Error in stakeTokenMax for ${token}: ${e.message}`, "error");
  }
}

async function stakeToken(token, amount, wallet, provider) {
  try {
    const config = STAKING_CONFIG[token];
    if (!config) throw new Error(`Token ${token} is not supported for staking.`);
    const { stakingAddress, tokenAddress, tokenName } = config;
    if (!ethers.isAddress(tokenAddress) || !ethers.isAddress(stakingAddress)) {
      throw new Error(`Invalid contract address for Token=${tokenAddress}, Staking=${stakingAddress}`);
    }
    const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, provider);
    const tokenContractWithSigner = tokenContract.connect(wallet);
    const stakingContract = new ethers.Contract(stakingAddress, STAKING_ABI, provider);
    const stakingContractWithSigner = stakingContract.connect(wallet);
    const decimals = await tokenContract.decimals();
    const amountWei = ethers.parseUnits(amount.toString(), decimals);
    const balance = await tokenContract.balanceOf(wallet.address);
    if (balance < amountWei) throw new Error(`Not enough ${tokenName}: ${ethers.formatUnits(balance, decimals)} available, ${amount} required`);
    const allowance = await tokenContract.allowance(wallet.address, stakingAddress);
    if (allowance < amountWei) {
      log(`Requesting approval for ${amount} ${tokenName}...`, "warn");
      const approveTx = await tokenContractWithSigner.approve(stakingAddress, amountWei, { gasLimit: 100000 });
      await approveTx.wait();
      log(`Approval successful!`, "success");
    }
    log(`Staking ${token}...`);
    const tx = await stakingContractWithSigner.stake(amountWei, { gasLimit: 300000 });
    log(`Stake Tx sent. TxHash: ${tx.hash}`);
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      log(`Successfully staked ${amount} ${tokenName}. TxHash: ${receipt.transactionHash || receipt.hash}`, "success");
    } else {
      throw new Error(`Stake transaction failed: TxHash: ${receipt.transactionHash || receipt.hash}`);
    }
  } catch (error) {
    log(`Failed to stake ${token}: ${error.message}`, "error");
  }
}

// ==== MENU HANDLING ====
menu.on('select', async (item, idx) => {
  clearOutput();
  showWalletStatus();
  logToUI(`Selected: ${item.content}`, "system");
  switch (idx) {
    case 0:
      await claimFaucetsForAll();
      break;
    case 1:
      await mintAllForAll();
      break;
    case 2:
      await stakeAllForAll();
      break;
    case 3:
      await runFullBotForAllAccounts();
      break;
    case 4:
      logToUI("Syncing status/config...");
      utils.syncStatus("Manual sync triggered from UI.");
      logToUI("Status sync complete.", "success");
      break;
    default:
      logToUI("Bye!", "system");
      setTimeout(() => process.exit(0), 1000);
      return;
  }
  // After action, redisplay menu
  setTimeout(() => { clearOutput(); showWalletStatus(); menu.focus(); }, 1200);
});

// ==== INITIAL ROUTING PROTOCOL SPLASH ====
screen.append(splash);
screen.render();
utils.syncStatus("Initial routing protocol check-in");

setTimeout(() => {
  splash.hide();
  menu.show();
  outputBox.show();
  walletBox.show();
  clearOutput();
  showWalletStatus();
  menu.focus();
  screen.render();
}, 1800);

screen.key(['escape', 'q', 'C-c'], () => process.exit(0));
