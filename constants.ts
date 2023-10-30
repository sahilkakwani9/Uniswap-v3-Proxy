import {
  Token,
  SupportedChainsType,
  SUPPORTED_CHAINS,
  ChainId,
} from "@uniswap/sdk-core";

export const POOL_FACTORY_CONTRACT_ADDRESS =
  "0x1F98431c8aD98523631AE4a59f267346ea31F984";
export const QUOTER_CONTRACT_ADDRESS =
  "0x61fFE014bA17989E743c5F6cB21bF9697530B21e";
export const SWAP_ROUTER_ADDRESS = "0xE592427A0AEce92De3Edee1F18E0157C05861564";

export const ERC20_ABI = [
  // Read-Only Functions
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",

  // Authenticated Functions
  "function transfer(address to, uint amount) returns (bool)",
  "function approve(address _spender, uint256 _value) returns (bool)",

  // Events
  "event Transfer(address indexed from, address indexed to, uint amount)",
];

export const TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER = "4000000000000000000";
export const MAX_FEE_PER_GAS = 150000000000;
export const MAX_PRIORITY_FEE_PER_GAS = 50000000000;

export const USDC_TOKEN = new Token(
  ChainId.POLYGON,
  "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
  6,
  "USDC",
  "USD//C"
);
export const WMATIC_TOKEN = new Token(
  ChainId.POLYGON,
  "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
  18,
  "WMATIC",
  "Wrapped MATIC"
);

export const MATIC_TOKEN = new Token(
  ChainId.POLYGON,
  "0x0000000000000000000000000000000000001010",
  18
);
