import { ethers } from "ethers";

export async function getProvider(privateKey: string) {
  try {
    const provider = new ethers.providers.JsonRpcProvider(
      process.env.PUBLIC_RPC_URL
    );

    return new ethers.Wallet(privateKey, provider);
  } catch (error) {
    console.log("something went wrong in getting provider", error);
  }
}
