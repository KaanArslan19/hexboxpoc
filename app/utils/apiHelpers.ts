export const fetchCampaigns = async (
  limit: number,
  skip: number
): Promise<any> => {
  const response = await fetch(
    `${process.env.NEXTAUTH_URL}/api/getCampaigns?limit=${limit}&skip=${skip}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch campaigns");
  }

  return response.json();
};

export const fetchSingleCampaign = async (campaignId: string): Promise<any> => {
  console.log("campaignId----fetch", campaignId);
  try {
    const response = await fetch(
      `${process.env.NEXTAUTH_URL}/api/getCampaign?campaignId=${campaignId}`,
      {
        cache: "no-store",
      }
    );
    return response.json();
  } catch (error) {
    console.log(
      "Error while fetching a single Campaign",
      (error as any).message
    );
    throw error;
  }
};

type BuyTokenResponse = {
  success?: boolean;
  error?: string;
  [key: string]: any;
};

export const buyCampaignToken = async (
  user: string,
  tokenAddress: string,
  amount: number
): Promise<BuyTokenResponse> => {
  const apiUrl = "/api/buyToken";
  try {
    const formData = new FormData();
    formData.append("user", user);
    formData.append("token_address", tokenAddress);
    formData.append("amount", amount.toString());
    console.log("----------FoRM", formData);
    const response = await fetch(apiUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch");
    }

    const data: BuyTokenResponse = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error calling buyToken API:", error.message);
    return { error: error.message };
  }
};
