import 'dotenv/config';
import { ethers } from 'ethers';
import ERC20ABI from './erc20-abi.js';

const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
const NPT_CONTRACT = "0xb8c2ce84f831175136cebbfd48ce4bab9c7a6424";
const REVERSE_REGISTRAR = "0x79ea96012eea67a83431f1701b3dff7e37f9e282";
const RESOLVER = "0xC6d566A56A1aFf6508b41f6c90ff131615583BCD";

const REV_ABI = ["function node(address addr) view returns (bytes32)"];
const RESOLVER_ABI = ["function name(bytes32 node) view returns (string)"];

async function getNPTBalance(address) {
  try {
    const contract = new ethers.Contract(NPT_CONTRACT, ERC20ABI, provider);
    const balance = await contract.balanceOf(address);
    return parseFloat(ethers.formatEther(balance)).toFixed(4);
  } catch (err) {
    return "0.0000";
  }
}

async function getETHBalance(address) {
  try {
    const balance = await provider.getBalance(address);
    return parseFloat(ethers.formatEther(balance)).toFixed(6);
  } catch (err) {
    return "0.000000";
  }
}

async function getBaseUsername(address) {
  try {
    const reverse = new ethers.Contract(REVERSE_REGISTRAR, REV_ABI, provider);
    const node = await reverse.node(address);

    const resolver = new ethers.Contract(RESOLVER, RESOLVER_ABI, provider);
    const name = await resolver.name(node);
    
    return name || "No .base name";
  } catch (err) {
    return "No .base name";
  }
}

async function sendTelegramReport(message) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: process.env.CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    console.log('Report sent successfully');
  } catch (err) {
    console.error('Failed to send report:', err.message);
  }
}

async function generateReport(type = 'start') {
  try {
    const address = process.env.WALLET;
    const [balance, ethBalance, baseName] = await Promise.all([
      getNPTBalance(address),
      getETHBalance(address),
      getBaseUsername(address)
    ]);

    const startTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

    let message = '';
    
    if (type === 'start') {
      message = `🔥 *NETRUM AI MINING SYSTEM* 
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ *System Initialized by Jhinkz*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 *Mining Started* ⛏️
� *Time*: \`${startTime}\`
👤 *Wallet*: \`${address.slice(0,6)}...${address.slice(-4)}\`
🏷️ *Base Name*: \`${baseName}\`
💰 *NPT Balance*: \`${balance} NPT\`
⛽ *ETH Balance*: \`${ethBalance} ETH\``;
    } else if (type === 'claim') {
      message = `🎯 *NETRUM REWARD CLAIM*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏱️ *24H Cycle Complete*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🪙 *Processing Claim* ⏳
🏷️ *Base Name*: \`${baseName}\`
💰 *NPT Balance*: \`${balance} NPT\`
⛽ *ETH Balance*: \`${ethBalance} ETH\``;
    } else if (type === 'complete') {
      message = `✅ *CLAIM SUCCESSFUL*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 *System Restarted*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎉 *Mining Resumed* 🔁
🏷️ *Base Name*: \`${baseName}\`
💰 *NPT Balance*: \`${balance} NPT\`
⛽ *ETH Balance*: \`${ethBalance} ETH\``;
    }

    await sendTelegramReport(message);
  } catch (err) {
    console.error('Error generating report:', err.message);
  }
}

// Command line usage
const args = process.argv.slice(2);
const reportType = args[0] || 'start'; // start, claim, complete

generateReport(reportType);
