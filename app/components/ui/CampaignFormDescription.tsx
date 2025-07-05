import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { campaignFormDescription } from "@/app/utils/campaignFormDescriptionHelper";

const CampaignFormDescription = () => {
  const [expandedSections, setExpandedSections] = useState<number[]>([]);

  const toggleSection = (sectionNumber: number) => {
    setExpandedSections((prev) =>
      prev.includes(sectionNumber)
        ? prev.filter((num) => num !== sectionNumber)
        : [...prev, sectionNumber]
    );
  };

  const formatText = (text: string) => {
    return text.split("*").map((part, index) =>
      index % 2 === 1 ? (
        <em key={index} className="text-gray-600 font-medium">
          {part}
        </em>
      ) : (
        part
      )
    );
  };

  return (
    <div className="w-full mb-2">
      <p className="text-md mb-6 font-thin">
        Provide the essential details about your campaign to help potential
        supporters understand your project and how to reach you.
      </p>

      <div className="space-y-4">
        {campaignFormDescription.map((section) => (
          <div key={section.id} className="border border-gray-200 rounded-lg">
            <button
              type="button"
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-900">
                {section.title}
              </h3>
              {expandedSections.includes(section.id) ? (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-500" />
              )}
            </button>

            {expandedSections.includes(section.id) && (
              <div className="px-4 pb-4 border-t border-gray-100">
                <ul className="space-y-3 mt-3">
                  {section.items.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-blueColorDull rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-gray-700 leading-relaxed">
                        {formatText(item)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CampaignFormDescription;
