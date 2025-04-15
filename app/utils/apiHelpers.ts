export const fetchCampaigns = async (
  limit: number,
  skip: number
): Promise<any> => {
  const response = await fetch(
    `${process.env.NEXTAUTH_URL}/api/getCampaigns?limit=${limit}&skip=${skip}/* &factCheck=true */`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch campaigns");
  }

  return response.json();
};
export const fetchCampaignsByUser = async (userId: string): Promise<any> => {
  const response = await fetch(
    `${process.env.NEXTAUTH_URL}/api/getCampaigns?userId=${userId}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch campaigns for the user");
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
  transaction?: any;
};

export const buyCampaignToken = async (
  campaign_id: string,
  amount: number
): Promise<BuyTokenResponse> => {
  const apiUrl = "/api/buyToken";
  try {
    const formData = new FormData();
    formData.append("campaign_id", campaign_id);
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
