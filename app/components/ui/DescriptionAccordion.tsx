import { useState } from "react";
export const DescriptionAccordion = ({
  description,
  maxChars = 300,
}: {
  description: string;
  maxChars?: number;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if truncation is needed based on character count
  const needsTruncation = description.length > maxChars;

  // Create preview text
  const previewText = needsTruncation
    ? description.substring(0, maxChars) + "..."
    : description;

  return (
    <div className="space-y-3">
      <p className="text-lg text-gray-700 leading-relaxed break-words whitespace-pre-wrap">
        {isExpanded ? description : previewText}
      </p>

      {needsTruncation && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center text-blueColor hover:text-blueColor/80 font-medium text-sm transition-colors duration-200 group"
        >
          {isExpanded ? (
            <>
              <span>Show Less</span>
              <svg
                className="ml-1 w-4 h-4 transform transition-transform duration-200 group-hover:-translate-y-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
            </>
          ) : (
            <>
              <span>Read More</span>
              <svg
                className="ml-1 w-4 h-4 transform transition-transform duration-200 group-hover:translate-y-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </>
          )}
        </button>
      )}
    </div>
  );
};
