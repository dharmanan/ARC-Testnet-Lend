/**
 * Simple relayer:
 * - Polls schedules and executes when releaseTimestamp <= now
 * - For testnet PoC only
 */

const { ethers } = require("ethers");
require("dotenv").config();

const ARC_RPC_URL = process.env.ARC_TESTNET_RPC_URL || process.env.ARC_TESTNET_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const SCHEDULER_ADDRESS = process.env.SCHEDULER_ADDRESS;

if (!ARC_RPC_URL || !PRIVATE_KEY || !SCHEDULER_ADDRESS) {
  console.error("Set ARC_TESTNET_RPC_URL, PRIVATE_KEY, and SCHEDULER_ADDRESS in .env");
  process.exit(1);
}

const SCHEDULER_ABI = [
  "event ScheduledCreated(uint256 id,address owner,address recipient,uint256 releaseTimestamp,uint256 scaledAmount,uint256 executorFee)",
  "function executeScheduled(uint256 id) external",
  "function schedules(uint256) view returns (uint256 id,address owner,address recipient,uint256 scaledAmount,uint256 releaseTimestamp,uint256 executorFee,bool executed,bool cancelled)"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(ARC_RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const scheduler = new ethers.Contract(SCHEDULER_ADDRESS, SCHEDULER_ABI, wallet);

  console.log("Relayer running with", wallet.address);

  const pollInterval = 15 * 1000; // 15s

  setInterval(async () => {
    try {
      // Naive linear scan for small-scale test
      for (let id = 1; id < 2000; id++) {
        try {
          const s = await scheduler.schedules(id);
          if (s.id == 0) break;
          if (!s.executed && !s.cancelled) {
            const release = Number(s.releaseTimestamp);
            const now = Math.floor(Date.now() / 1000);
            if (release <= now) {
              console.log(`Executing schedule ${id} (owner ${s.owner})`);
              const tx = await scheduler.executeScheduled(id, { gasLimit: 500_000 });
              console.log("tx sent", tx.hash);
              await tx.wait();
              console.log("executed", id);
            }
          }
        } catch (err) {
          // ignore missing ids or read errors
        }
      }
    } catch (err) {
      console.error("Poll error", err);
    }
  }, pollInterval);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});