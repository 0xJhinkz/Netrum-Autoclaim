import 'dotenv/config';
import { ethers } from 'ethers';
import ERC20ABI from './erc20-abi.js';

const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
const NPT_CONTRACT = "0xb8c2ce84f831175136cebbfd48ce4bab9c7a6424";
const BASENAMES_CONTRACT = "0x03c4738ee98ae44591e1a4a4f3cab6641d95dd9a";
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

async function getWalletReport(address) {
  const [balance, baseName] = await Promise.all([
    getNPTBalance(address),
    getBaseUsername(address)
  ]);
  
  return {
    balance,
    baseName,
    address
  };
}

(async () => {
  try {
    const address = process.env.WALLET;
    
    // Check if we want full report or just balance
    const args = process.argv.slice(2);
    if (args.includes('--report')) {
      const report = await getWalletReport(address);
      console.log(JSON.stringify(report));
    } else {
      // Default: just output balance for backward compatibility
      const balance = await getNPTBalance(address);
      process.stdout.write(balance);
    }
  } catch (err) {
    if (process.argv.slice(2).includes('--report')) {
      console.log(JSON.stringify({ balance: "0.0000", baseName: "Error", address: "Unknown" }));
    } else {
      process.stdout.write("0.0000");
    }
  }
})();onfig';
import Web3 from 'web3';
import ERC20ABI from './erc20-abi.js';

const web3 = new Web3(process.env.BASE_RPC);
const contract = new web3.eth.Contract(ERC20ABI, process.env.NPT_CONTRACT);

(async () => {
  try {
    const balance = await contract.methods.balanceOf(process.env.WALLET).call();
    const formatted = parseFloat(web3.utils.fromWei(balance)).toFixed(4);
    process.stdout.write(formatted);
  } catch (err) {
    process.stdout.write("0.0000");
  }
})();
