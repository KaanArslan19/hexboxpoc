import Sentry from "@sentry/nextjs";

export const fetchCampaignsWithCount = async (
  limit: number,
  skip: number,
  query?: string,
  status: string = "active",
  sortBy: string = "total_raised",
  sortOrder: string = "desc"
): Promise<{ campaigns: any[]; total: number }> => {
  try {
    console.log("fetchCampaignsWithCount | apiHelpers | utils");
    console.log(`${process.env.NEXTAUTH_URL}/api/getCampaigns`);
    const url = new URL(`${process.env.NEXTAUTH_URL}/api/getCampaigns`);
    url.searchParams.append("limit", limit.toString());
    url.searchParams.append("skip", skip.toString());
    url.searchParams.append("sortBy", sortBy);
    url.searchParams.append("sortOrder", sortOrder);

    if (status) {
      url.searchParams.append("status", status);
    }
    if (query) {
      url.searchParams.append("query", query);
    }

    const response = await fetch(url.toString(), {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch campaigns | fetchCampaignsWithCount | apiHelpers");
    }

    const data = await response.json();

    if (data.campaigns && data.total !== undefined) {
      return {
        campaigns: data.campaigns,
        total: data.total,
      };
    } else if (Array.isArray(data)) {
      return {
        campaigns: data,
        total: data.length,
      };
    } else {
      return {
        campaigns: data.campaigns || [],
        total: data.total || 0,
      };
    }
  } catch (error) {
    console.error("Failed to fetch campaigns with count:", error);
    return { campaigns: [], total: 0 };
  }
};
export const fetchCampaigns = async (
  limit: number,
  skip: number,
  query?: string,
  status: string = "active",
  sortBy: string = "total_raised",
  sortOrder: string = "desc"
): Promise<any> => {
  try {
    console.log("fetchCampaigns | apiHelpers | utils");
    console.log(`${process.env.NEXTAUTH_URL}/api/getCampaigns`);
    const url = new URL(`${process.env.NEXTAUTH_URL}/api/getCampaigns`);
    url.searchParams.append("limit", limit.toString());
    url.searchParams.append("skip", skip.toString());
    url.searchParams.append("sortBy", sortBy);
    url.searchParams.append("sortOrder", sortOrder);

    if (status) {
      url.searchParams.append("status", status);
    }

    if (query) {
      url.searchParams.append("query", query);
    }

    const response = await fetch(url.toString(), {
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("fetchCampaigns non-OK response:", {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
      });

      try {
        const errorText = await response.text();
        console.error("fetchCampaigns error body:", errorText);
      } catch (readError) {
        console.error("Failed to read fetchCampaigns error body:", readError);
      }

      throw new Error("Failed to fetch campaigns | fetchCampaigns | apiHelpers");
    }

    const data = await response.json();
    console.log("fetchCampaigns data:", data);

    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray((data as any).campaigns)) {
      return (data as any).campaigns;
    }

    return [];
  } catch (error) {
    console.error("Failed to fetch campaigns:", error);
    return [];
  }
};
export const fetchCampaignsByUser = async (userId: string): Promise<any> => {
  const response = await fetch(`/api/userCampaigns?userId=${userId}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch campaigns for the user");
  }

  return response.json();
};

export const fetchSingleCampaign = async (campaignId: string): Promise<any> => {
  console.log("campaignId----fetch", campaignId);

  try {
    console.log("fetchSingleCampaign | apiHelpers | utils");
    console.log(`${process.env.NEXTAUTH_URL}/api/getCampaign?campaignId=${campaignId}`);
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
