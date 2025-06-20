import "dotenv/config";
import { ethers } from "ethers";
import axios from "axios";
import fs from "fs";
import readline from "readline";

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
const OG_ADDRESS = process.env.OG_ADDRESS || "0xFBBDAb7684A4Da0CFAE67C5c13fA73402008953e";
const OUSD_ADDRESS = process.env.OUSD_ADDRESS || "0xD23016Fd7154d9A6F2830Bfb4eA3F3106AAE0E88";
const USD1_ADDRESS = process.env.USD1_ADDRESS || "0x16a8A3624465224198d216b33E825BcC3B80abf7";

const ROUTER_ADDRESS_AUSD = "0x2cFDeE1d5f04dD235AEA47E1aD2fB66e3A61C13e";
const ROUTER_ADDRESS_VUSD = "0x3dCACa90A714498624067948C092Dd0373f08265";
const ROUTER_ADDRESS_AZUSD = "0xB0b53d8B4ef06F9Bbe5db624113C6A5D35bB7522";
const ROUTER_ADDRESS_VANAUSD = "0xEfbAE3A68b17a61f21C7809Edfa8Aa3CA7B2546f";
const ROUTER_ADDRESS_OUSD = "0x0b4301877A981e7808A8F4B6E277C376960C7641";

const STAKING_ADDRESS_AZUSD = "0xf45Fde3F484C44CC35Bdc2A7fCA3DDDe0C8f252E";
const STAKING_ADDRESS_VANAUSD = "0x2608A88219BFB34519f635Dd9Ca2Ae971539ca60";
const STAKING_ADDRESS_VUSD = "0x5bb9Fa02a3DCCDB4E9099b48e8Ba5841D2e59d51";
const STAKING_ADDRESS_AUSD = "0x054de909723ECda2d119E31583D40a52a332f85c";
const STAKING_ADDRESS_LULUSD = "0x5De3fBd40D4c3892914c3b67b5B529D776A1483A";
const STAKING_ADDRESS_USDE = "0x3988053b7c748023a1aE19a8ED4c1Bf217932bDB";
const STAKING_ADDRESS_OUSD = "0xF8F951DA83dAC732A2dCF207B644E493484047eB";
const STAKING_ADDRESS_USD1 = "0x7799841734Ac448b8634F1c1d7522Bc8887A7bB9";

// ==== FILE HELPERS ====
function getLinesFromFile(filename) {
  try {
    return fs.readFileSync(filename, "utf-8").split("\n").map(x => x.trim()).filter(Boolean);
  } catch {
    return [];
  }
}
const proxies = getLinesFromFile("proxy.txt");
const privateKeys = getLinesFromFile("data.txt");

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
  },
  OUSD: {
    routerAddress: ROUTER_ADDRESS_OUSD,
    selector: "0xa6d67510",
    inputTokenAddress: OG_ADDRESS,
    outputTokenAddress: OUSD_ADDRESS,
    inputTokenName: "0G",
    minAmount: 1
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
  },
  OUSD: {
    stakingAddress: STAKING_ADDRESS_OUSD,
    tokenAddress: OUSD_ADDRESS,
    tokenName: "0USD",
    minAmount: 0.0001
  },
  USD1: {
    stakingAddress: STAKING_ADDRESS_USD1,
    tokenAddress: USD1_ADDRESS,
    tokenName: "USD1",
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
  USD1: "https://app.x-network.io/maitrix-usd1/faucet",
  OG: "https://app.x-network.io/maitrix-0g/faucet"
};

// ==== LOGGING & UTILS ====
function log(...args) { console.log(...args); }
function bright(text) { return `\x1b[1m${text}\x1b[0m`; }
function yellow(text) { return `\x1b[33m${text}\x1b[0m`; }
function green(text) { return `\x1b[32m${text}\x1b[0m`; }
function cyan(text) { return `\x1b[36m${text}\x1b[0m`; }
function red(text) { return `\x1b[31m${text}\x1b[0m`; }
function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }
function randomCooldown() { return 2000 + Math.floor(Math.random() * 8000); }

function formatTimeLeft(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${h}h ${m}m ${s}s`;
}

// ==== BOT ACTIONS ====
async function claimFaucetsForAll() {
  if (!privateKeys.length) {
    log(red("No private keys found in data.txt. Please add at least one private key."));
    return;
  }
  for (let i = 0; i < privateKeys.length; ++i) {
    const privKey = privateKeys[i];
    const proxy = proxies[i % proxies.length] || undefined;
    let provider = new ethers.JsonRpcProvider(RPC_URL);
    let wallet;
    try {
      wallet = new ethers.Wallet(privKey, provider);
    } catch (e) {
      log(red(`Invalid private key at line ${i + 1}: ${e.message}`));
      continue;
    }
    log(`\n${bright(`[${i + 1}/${privateKeys.length}]`)} ${cyan(wallet.address)} (Proxy: ${proxy || "none"})`);
    for (const token in FAUCET_APIS) {
      log(yellow(`→ Claiming faucet for ${token}...`));
      await claimFaucet(token, wallet);
      await sleep(randomCooldown());
    }
    log(green(`✔ Faucet claim finished for wallet.`));
    await sleep(randomCooldown());
  }
  log(green("All accounts faucet claim finished."));
}

async function mintAllForAll() {
  if (!privateKeys.length) {
    log(red("No private keys found in data.txt. Please add at least one private key."));
    return;
  }
  for (let i = 0; i < privateKeys.length; ++i) {
    const privKey = privateKeys[i];
    const proxy = proxies[i % proxies.length] || undefined;
    let provider = new ethers.JsonRpcProvider(RPC_URL);
    let wallet;
    try {
      wallet = new ethers.Wallet(privKey, provider);
    } catch (e) {
      log(red(`Invalid private key at line ${i + 1}: ${e.message}`));
      continue;
    }
    log(`\n${bright(`[${i + 1}/${privateKeys.length}]`)} ${cyan(wallet.address)} (Proxy: ${proxy || "none"})`);
    for (const token in TOKEN_CONFIG) {
      log(yellow(`→ Minting token ${token}...`));
      await mintTokenMax(token, wallet, provider);
      await sleep(randomCooldown());
    }
    log(green(`✔ Mint finished for wallet.`));
    await sleep(randomCooldown());
  }
  log(green("All accounts mint finished."));
}

async function stakeAllForAll() {
  if (!privateKeys.length) {
    log(red("No private keys found in data.txt. Please add at least one private key."));
    return;
  }
  for (let i = 0; i < privateKeys.length; ++i) {
    const privKey = privateKeys[i];
    const proxy = proxies[i % proxies.length] || undefined;
    let provider = new ethers.JsonRpcProvider(RPC_URL);
    let wallet;
    try {
      wallet = new ethers.Wallet(privKey, provider);
    } catch (e) {
      log(red(`Invalid private key at line ${i + 1}: ${e.message}`));
      continue;
    }
    log(`\n${bright(`[${i + 1}/${privateKeys.length}]`)} ${cyan(wallet.address)} (Proxy: ${proxy || "none"})`);
    for (const token in STAKING_CONFIG) {
      log(yellow(`→ Staking token ${token}...`));
      await stakeTokenMax(token, wallet, provider);
      await sleep(randomCooldown());
    }
    log(green(`✔ Stake finished for wallet.`));
    await sleep(randomCooldown());
  }
  log(green("All accounts stake finished."));
}

async function runFullBotForAllAccounts() {
  if (!privateKeys.length) {
    log(red("No private keys found in data.txt. Please add at least one private key."));
    return;
  }
  for (let i = 0; i < privateKeys.length; ++i) {
    const privKey = privateKeys[i];
    const proxy = proxies[i % proxies.length] || undefined;
    let provider = new ethers.JsonRpcProvider(RPC_URL);
    let wallet;
    try {
      wallet = new ethers.Wallet(privKey, provider);
    } catch (e) {
      log(red(`Invalid private key at line ${i + 1}: ${e.message}`));
      continue;
    }
    log(`\n${bright(`[${i + 1}/${privateKeys.length}]`)} ${cyan(wallet.address)} (Proxy: ${proxy || "none"})`);
    for (const token in FAUCET_APIS) {
      log(yellow(`→ Claiming faucet for ${token}...`));
      await claimFaucet(token, wallet);
      await sleep(randomCooldown());
    }
    for (const token in TOKEN_CONFIG) {
      log(yellow(`→ Minting token ${token}...`));
      await mintTokenMax(token, wallet, provider);
      await sleep(randomCooldown());
    }
    for (const token in STAKING_CONFIG) {
      log(yellow(`→ Staking token ${token}...`));
      await stakeTokenMax(token, wallet, provider);
      await sleep(randomCooldown());
    }
    log(green(`[${i + 1}] Finished bot sequence for wallet.`));
    await sleep(randomCooldown());
  }
  log(green("All accounts finished."));
}

async function claimFaucet(token, wallet) {
  const apiUrl = FAUCET_APIS[token];
  if (!apiUrl) { log(red(`API for token ${token} not found.`)); return; }
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
      log(green(`✔ Faucet claim success for ${token}: ${data.amount} tokens. TxHash: ${data.txHash}`));
    } else if (code === 202) {
      log(yellow(`Faucet claim for ${token} failed: ${message}`));
    } else {
      log(red(`Faucet claim for ${token} failed: ${message}`));
    }
  } catch (error) {
    log(red(`Error claiming faucet for ${token}: ${error.message}`));
  }
}

async function mintTokenMax(token, wallet, provider) {
  try {
    const config = TOKEN_CONFIG[token];
    const inputContract = new ethers.Contract(config.inputTokenAddress, ERC20ABI, provider);
    const decimals = await inputContract.decimals();
    let rawBalance = await inputContract.balanceOf(wallet.address);
    let buffer = ethers.parseUnits("0.003", decimals);
    if (token === "AUSD" && rawBalance > buffer) rawBalance = rawBalance - buffer;
    if (rawBalance <= 0) {
      log(yellow(`No ${config.inputTokenName} available to mint for ${token}.`));
      return;
    }
    await mintToken(token, ethers.formatUnits(rawBalance, decimals), wallet, provider);
  } catch (e) {
    log(red(`Error in mintTokenMax for ${token}: ${e.message}`));
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
    const decimals = await inputContract.decimals();
    const amountWei = ethers.parseUnits(amount.toString(), decimals);
    const balance = await inputContract.balanceOf(wallet.address);
    if (balance < amountWei) throw new Error(`Not enough ${inputTokenName}: ${ethers.formatUnits(balance, decimals)} available, ${amount} required`);
    const allowance = await inputContract.allowance(wallet.address, routerAddress);
    if (allowance < amountWei) {
      log(yellow(`Requesting approval for ${amount} ${inputTokenName}...`));
      const approveTx = await inputContract.connect(wallet).approve(routerAddress, amountWei);
      await approveTx.wait();
      log(green(`Approval successful!`));
    }
    log(yellow(`Minting ${token}...`));
    const txData = selector + ethers.zeroPadValue(ethers.toBeHex(amountWei), 32).slice(2);
    const tx = await wallet.sendTransaction({ to: routerAddress, data: txData, gasLimit: 250000 });
    log(cyan(`Mint Tx sent. TxHash: ${tx.hash}`));
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      log(green(`Successfully minted ${token}: ${amount} ${inputTokenName}. TxHash: ${receipt.transactionHash || receipt.hash}`));
    } else {
      throw new Error(`Mint transaction failed: TxHash: ${receipt.transactionHash || receipt.hash}`);
    }
  } catch (error) {
    log(red(`Failed to mint ${token}: ${error.message}`));
  }
}

async function stakeTokenMax(token, wallet, provider) {
  try {
    const config = STAKING_CONFIG[token];
    const tokenContract = new ethers.Contract(config.tokenAddress, ERC20ABI, provider);
    const decimals = await tokenContract.decimals();
    let rawBalance = await tokenContract.balanceOf(wallet.address);
    const buffer = ethers.parseUnits("0.00005", decimals);
    if (rawBalance > buffer) rawBalance = rawBalance - buffer;
    if (rawBalance <= 0) {
      log(yellow(`No ${config.tokenName} available to stake for ${token}.`));
      return;
    }
    await stakeToken(token, ethers.formatUnits(rawBalance, decimals), wallet, provider);
  } catch (e) {
    log(red(`Error in stakeTokenMax for ${token}: ${e.message}`));
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
    const decimals = await tokenContract.decimals();
    const amountWei = ethers.parseUnits(amount.toString(), decimals);
    const balance = await tokenContract.balanceOf(wallet.address);
    if (balance < amountWei) throw new Error(`Not enough ${tokenName}: ${ethers.formatUnits(balance, decimals)} available, ${amount} required`);
    const allowance = await tokenContract.allowance(wallet.address, stakingAddress);
    if (allowance < amountWei) {
      log(yellow(`Requesting approval for ${amount} ${tokenName}...`));
      const approveTx = await tokenContract.connect(wallet).approve(stakingAddress, amountWei, { gasLimit: 100000 });
      await approveTx.wait();
      log(green(`Approval successful!`));
    }
    log(yellow(`Staking ${token}...`));
    const stakingContract = new ethers.Contract(stakingAddress, STAKING_ABI, provider);
    const tx = await stakingContract.connect(wallet).stake(amountWei, { gasLimit: 300000 });
    log(cyan(`Stake Tx sent. TxHash: ${tx.hash}`));
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      log(green(`Successfully staked ${amount} ${tokenName}. TxHash: ${receipt.transactionHash || receipt.hash}`));
    } else {
      throw new Error(`Stake transaction failed: TxHash: ${receipt.transactionHash || receipt.hash}`);
    }
  } catch (error) {
    log(red(`Failed to stake ${token}: ${error.message}`));
  }
}

// ==== CLI MENU ====
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function showMenu() {
  log("\n=== Maitrix CLI Bot ===");
  log("1. Claim Faucets for all accounts");
  log("2. Mint all tokens for all accounts");
  log("3. Stake all tokens for all accounts");
  log("4. Run automatic 24h");
  log("5. Exit");
}

async function prompt(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function runAutomatic24h() {
  log(green("Starting bot in 24h automatic mode."));
  while (true) {
    const nextRun = Date.now() + 24 * 60 * 60 * 1000;
    const now = new Date();
    log(`\n${bright(`[AUTO MODE]`)} ${cyan(now.toLocaleString())} Running full bot sequence for all accounts...`);
    await runFullBotForAllAccounts();
    let msLeft = nextRun - Date.now();
    while (msLeft > 0) {
      process.stdout.write(`\r${yellow(`Next run in: ${formatTimeLeft(msLeft)} (press Ctrl+C to exit)`)}   `);
      await sleep(1000);
      msLeft = nextRun - Date.now();
    }
    process.stdout.write("\n");
  }
}

async function main() {
  while (true) {
    showMenu();
    const choice = await prompt("Select option [1-5]: ");
    if (choice === "1") {
      await claimFaucetsForAll();
    } else if (choice === "2") {
      await mintAllForAll();
    } else if (choice === "3") {
      await stakeAllForAll();
    } else if (choice === "4") {
      await runAutomatic24h();
      break;
    } else if (choice === "5") {
      log(green("Exiting..."));
      process.exit(0);
    } else {
      log(red("Invalid option. Try again."));
    }
  }
  rl.close();
}

main();
