import About from "../components/About";
import AnalyticsBanner from "../components/AnalyticsBanner";
import CampaignList from "../components/campaign/CampaignList";
import SystemFeatures from "../components/SystemFeatures";
import Funnel from "../components/ui/Funnel";
import { fetchCampaigns } from "../utils/apiHelpers";

export default async function Home() {
  const campaigns = await fetchCampaigns(4, 0);
  return (
    <main className="py-4 space-y-4">
      <div className="max-w-2xl lg:max-w-6xl mx-auto ">
        <div className="text-center mt-16   ">
          <h1 className="text-4xl md:text-6xl font-customFont_bold mb-4  text-blueColor ">
            Fund Your Campaigns
          </h1>
          <p className="mx-auto text-lg lg:text-xl text-black/80">
            Stand against fraud and secure your funds with a multisignature
            wallet today!
          </p>
        </div>
        <Funnel
          firstButtonLink="explore"
          firstButtonText="Explore the campaigns"
          secondButtonLink="create"
          secondButtonText="Create a campaign"
        />

        <CampaignList listings={campaigns} />
      </div>
      <div className="bg-lightBlueColor/10">
        <AnalyticsBanner />
      </div>
      <SystemFeatures />
      <About />
    </main>
  );
}
