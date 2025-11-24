import { ethers } from "ethers";

// USDC contract ABI (only the methods we need)
const USDC_ABI = [
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) view external returns (uint256)",
  "function decimals() view external returns (uint8)",
];

export const createUSDCTransaction = async (
  campaignWallet: string,
  amount: number
) => {
  try {
    // USDC contract address on Ethereum mainnet
    const USDC_ADDRESS = process.env.NEXT_PUBLIC_TESTNET_USDC_ADDRESS!;
    // Initialize provider for Avalanche Fuji testnet
    const provider = new ethers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_RPC_URL
    );

    const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider);
    // Get USDC decimals (usually 6, but better to check)
    const decimals = await usdcContract.decimals();

    // Calculate USDC amount with proper decimals
    console.log(amount);
    //const usdAmount = amount.toFixed(decimals)
    const usdcAmount = ethers.parseUnits(amount.toString(), decimals);

    // Create contract interface for encoding
    const usdcInterface = new ethers.Interface(USDC_ABI);

    // Encode the transfer function call
    const data = usdcInterface.encodeFunctionData("transfer", [
      campaignWallet,
      usdcAmount,
    ]);

    // Construct the transaction
    const transaction = {
      to: USDC_ADDRESS,
      data: data,
      value: "0x00", // No AVAX value since we're transferring USDC
      chainId: 43113, // Avalanche Fuji testnet chain ID
      type: 2, // EIP-1559 transaction type
    };

    return {
      transaction,
      usdcAmount: usdcAmount.toString(),
      formattedAmount: ethers.formatUnits(usdcAmount, decimals),
    };
  } catch (error) {
    console.error("Error creating USDC transaction:", error);
    throw error;
  }
};
