import { NextApiRequest, NextApiResponse } from "next";
import { getQoute } from "./getQoute";
import { BigNumber, ethers } from "ethers";
import { getProvider } from "../../../../utils/provider";
import {
  getPoolInfo,
  getTokenTransferApproval,
  sendTransaction,
} from "../../../../utils/helpers";
import {
  ChainId,
  CurrencyAmount,
  Percent,
  Token,
  TradeType,
} from "@uniswap/sdk-core";
import {
  FeeAmount,
  Pool,
  Route,
  SwapOptions,
  SwapRouter,
  Trade,
} from "@uniswap/v3-sdk";
import { fromReadableAmount } from "../../../../utils/utils";
import JSBI from "jsbi";
import {
  MAX_FEE_PER_GAS,
  MAX_PRIORITY_FEE_PER_GAS,
  SWAP_ROUTER_ADDRESS,
} from "../../../../constants";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST") {
      res.status(200).json({ message: "Method not allowed" });
      return;
    }
    const {
      privateKey,
      tokenAaddress,
      tokenBaddress,
      tokenAdecimal,
      tokenBdecimal,
      amount,
    } = req.body;

    const wallet = await getProvider(privateKey);
    const poolInfo = await getPoolInfo(privateKey);
    const TOKENA = new Token(ChainId.POLYGON, tokenAaddress, tokenAdecimal);
    const TOKENB = new Token(ChainId.POLYGON, tokenBaddress, tokenBdecimal);
    //create a pool object by populating pool info
    const pool = new Pool(
      TOKENA,
      TOKENB,
      FeeAmount.MEDIUM,
      poolInfo!.sqrtPriceX96.toString(),
      poolInfo!.liquidity.toString(),
      poolInfo!.tick
    );

    //create route instance by populating pool object
    const swapRoute = new Route([pool], TOKENA, TOKENB);
    const amountOut = await getQoute(swapRoute, TOKENA, wallet!, amount);
    const uncheckedTrade = Trade.createUncheckedTrade({
      route: swapRoute,
      inputAmount: CurrencyAmount.fromRawAmount(
        TOKENA,
        fromReadableAmount(amount, 18).toString()
      ),
      outputAmount: CurrencyAmount.fromRawAmount(
        TOKENB,
        JSBI.BigInt(amountOut!).toString()
      ),
      tradeType: TradeType.EXACT_INPUT,
    });

    const tokenApproval = await getTokenTransferApproval(TOKENA, privateKey);
    const options: SwapOptions = {
      slippageTolerance: new Percent(500, 10000), // 50 bips, or 0.50%
      deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from the current Unix time
      recipient: wallet!.address,
    };
    const methodParameters = SwapRouter.swapCallParameters(
      [uncheckedTrade],
      options
    );

    const tx = {
      data: methodParameters.calldata,
      to: SWAP_ROUTER_ADDRESS,
      value: BigNumber.from(methodParameters.value),
      from: wallet!.address,
      maxFeePerGas: MAX_FEE_PER_GAS,
      maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
    };
    const result = await sendTransaction(tx, privateKey);

    res.status(200).json({ trade: "success" });
  } catch (error) {
    res.status(400).send("error: " + error);
  }
}
