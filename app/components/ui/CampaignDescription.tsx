import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const CampaignStory = ({ description }: { description: string }) => {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center pb-3 border-b-4 border-gray-300">
        Story of the Campaign
      </h2>

      <div className="prose prose-lg prose-gray max-w-none leading-relaxed text-gray-800 mt-6">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{description}</ReactMarkdown>
      </div>
    </div>
  );
};

export default CampaignStory;
