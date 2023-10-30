import {
  FeeAmount,
  Route,
  SwapQuoter,
  computePoolAddress,
} from "@uniswap/v3-sdk";
import {
  ERC20_ABI,
  MATIC_TOKEN,
  MAX_FEE_PER_GAS,
  MAX_PRIORITY_FEE_PER_GAS,
  POOL_FACTORY_CONTRACT_ADDRESS,
  QUOTER_CONTRACT_ADDRESS,
  SWAP_ROUTER_ADDRESS,
  TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER,
  USDC_TOKEN,
  WMATIC_TOKEN,
} from "../constants";
import IUniswapV3PoolABI from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json";
import { BigNumber, ethers } from "ethers";
import { Currency, CurrencyAmount, Token, TradeType } from "@uniswap/sdk-core";
import { fromReadableAmount } from "./utils";
import { parseUnits } from "ethers/lib/utils";
import { getProvider } from "./provider";

export enum TransactionState {
  Failed = "Failed",
  New = "New",
  Rejected = "Rejected",
  Sending = "Sending",
  Sent = "Sent",
}

export async function getPoolInfo(privateKey: string) {
  const wallet = await getProvider(privateKey);
  const currentPoolAddress = computePoolAddress({
    factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
    tokenA: WMATIC_TOKEN,
    tokenB: USDC_TOKEN,
    fee: FeeAmount.MEDIUM,
  });

  const poolContract = new ethers.Contract(
    currentPoolAddress,
    IUniswapV3PoolABI.abi,
    wallet?.provider
  );
  const [token0, token1, fee, tickSpacing, liquidity, slot0] =
    await Promise.all([
      poolContract.token0(),
      poolContract.token1(),
      poolContract.fee(),
      poolContract.tickSpacing(),
      poolContract.liquidity(),
      poolContract.slot0(),
    ]);

  return {
    token0,
    token1,
    fee,
    tickSpacing,
    liquidity,
    sqrtPriceX96: slot0[0],
    tick: slot0[1],
  };
}

export async function getTokenTransferApproval(
  token: Token,
  privateKey: string
): Promise<TransactionState> {
  try {
    const wallet = await getProvider(privateKey);
    const tokenContract = new ethers.Contract(
      token.address,
      ERC20_ABI,
      wallet!.provider
    );

    const transaction = await tokenContract.populateTransaction.approve(
      SWAP_ROUTER_ADDRESS,
      TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER
    );
    console.log(transaction), "THIS IS TX";

    return sendTransaction(
      {
        ...transaction,
        from: wallet!.address,
        maxFeePerGas: MAX_FEE_PER_GAS,
        maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
      },
      privateKey
    );
  } catch (e) {
    console.error(e);
    return TransactionState.Failed;
  }
}

export async function sendTransaction(
  tx: ethers.providers.TransactionRequest,
  privateKey: string
): Promise<TransactionState> {
  const wallet = await getProvider(privateKey);

  if (tx.value) {
    tx.value = BigNumber.from(tx.value);
  }
  const txRes = await wallet!.sendTransaction(tx);
  let receipt = null;
  const provider = wallet!.provider;
  if (!provider) {
    return TransactionState.Failed;
  }
  while (receipt === null) {
    try {
      receipt = await provider.getTransactionReceipt(txRes.hash);

      if (receipt === null) {
        continue;
      }
    } catch (e) {
      console.log(`Receipt error:`, e);
      break;
    }
  }

  // Transaction was successful if status === 1
  if (receipt) {
    return TransactionState.Sent;
  } else {
    return TransactionState.Failed;
  }
}
