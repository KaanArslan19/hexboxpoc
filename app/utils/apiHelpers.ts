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
