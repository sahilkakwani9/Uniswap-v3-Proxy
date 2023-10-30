import { NextApiRequest, NextApiResponse } from "next";
import { getProvider } from "../../../../utils/provider";
import { getPoolInfo } from "../../../../utils/helpers";
import { ChainId, CurrencyAmount, Token, TradeType } from "@uniswap/sdk-core";
import { FeeAmount, Pool, Route, SwapQuoter } from "@uniswap/v3-sdk";
import { fromReadableAmount } from "../../../../utils/utils";
import { QUOTER_CONTRACT_ADDRESS } from "../../../../constants";
import { ethers } from "ethers";

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
    const result = await getQoute(swapRoute, TOKENA, wallet!, amount);

    res.status(200).json(ethers.utils.formatUnits(result![0], 6));
  } catch (error) {
    res.status(400).send("error: " + error);
  }
}

export async function getQoute(
  swapRoute: Route<Token, Token>,
  TOKENA: Token,
  wallet: ethers.Wallet,

  amount: number
) {
  try {
    const { calldata } = await SwapQuoter.quoteCallParameters(
      swapRoute,
      CurrencyAmount.fromRawAmount(
        TOKENA,
        fromReadableAmount(amount, TOKENA.decimals)
      ),
      TradeType.EXACT_INPUT,
      {
        useQuoterV2: true,
      }
    );
    const quoteCallReturnData = await wallet!.provider.call({
      to: QUOTER_CONTRACT_ADDRESS,
      data: calldata,
    });

    const amountOut = ethers.utils.defaultAbiCoder.decode(
      ["uint256"],
      quoteCallReturnData
    );
    return amountOut;
  } catch (error) {
    console.log("something wwent wrong");
  }
}
