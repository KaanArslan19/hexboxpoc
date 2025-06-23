import About from "../components/About";
import AnalyticsBanner from "../components/AnalyticsBanner";
import CampaignList from "../components/campaign/CampaignList";
import SystemFeatures from "../components/SystemFeatures";
import Funnel from "../components/ui/Funnel";
import { fetchCampaigns } from "../utils/apiHelpers";
import FeaturedCampaigns from "../components/FeaturedCampaigns";
import AnnouncementBanner from "../components/ui/AnnouncementBanner";

export default async function Home() {
  const campaigns = await fetchCampaigns(4, 0);
  return (
    <>
      <AnnouncementBanner />
      <main className="py-4 space-y-4">
        <div className="max-w-2xl lg:max-w-6xl mx-auto ">
          <FeaturedCampaigns listings={campaigns} />
          <div className="text-center mt-16  px-4 ">
            <h1 className="text-4xl md:text-6xl font-customFont_bold mb-4  text-blueColorDull ">
              Make an Impact
            </h1>
            <p className="mx-auto text-lg lg:text-xl text-textPrimary">
              Fuel the spark, ignite the action.
            </p>
            <Funnel
              firstButtonLink="/campaign/create"
              firstButtonText="Create a campaign"
              secondButtonLink="campaigns"
              secondButtonText="Explore the campaigns"
            />
          </div>

          <CampaignList listings={campaigns} />
        </div>
        {/*         <div className="bg-lightBlueColor">
          <AnalyticsBanner />
        </div> */}
        <SystemFeatures />
        <About />
      </main>
    </>
  );
}
