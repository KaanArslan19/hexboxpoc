import About from "../components/About";
import CampaignList from "../components/campaign/CampaignList";
import { fetchCampaigns } from "../utils/apiHelpers";

export default async function Home() {
  const campaigns = await fetchCampaigns(10, 0);
  return (
    <main className="py-4 space-y-4">
      <div className="max-w-2xl lg:max-w-6xl mx-auto ">
        <div className="text-center mt-16   ">
          <h1 className="text-4xl lg:text-4xl font-customFont_bold mb-4 tracking-tight  ">
            Fund Your Campaigns
          </h1>
          <p className="mx-auto text-lg lg:text-xl">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Nostrum
            dolorem nobis quibusdam deserunt temporibus neque, quo et delectus
            ullam quos, iste recusandae distinctio repellat! At labore excepturi
            est saepe laudantium.
          </p>
        </div>
        <CampaignList listings={campaigns} />
      </div>
    </main>
  );
}
