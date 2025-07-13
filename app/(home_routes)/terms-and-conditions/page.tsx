"use client";
import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  Mail,
  AlertTriangle,
} from "lucide-react";

const termsData = {
  title: "Hexbox Executors Terms and Conditions",
  effectiveDate: "08.07.2025",
  lastUpdated: "08.07.2025",
  company: {
    name: "Hexbox",
    website: "hexbox.money",
  },

  definitions: [
    {
      term: "Executor",
      definition:
        "The individual or entity who creates and manages a fundraising campaign on Hexbox.",
    },
    {
      term: "Investor",
      definition:
        "Any individual or entity who contributes funds to a campaign.",
    },
    {
      term: "Platform",
      definition: "The Hexbox website, smart contracts, and related services.",
    },
    {
      term: "User",
      definition:
        "Any person accessing the Hexbox platform, including Executors, Investors, or general visitors.",
    },
    {
      term: "Escrow Smart Contract",
      definition:
        "The blockchain-based mechanism holding funds until specified conditions are met.",
    },
    {
      term: "Finalization",
      definition:
        "The formal process where campaign conditions are verified, and funds are released to the Executor.",
    },
    {
      term: "Funding Types",
      definition:
        "The available funding models on Hexbox, including All or Nothing, Flexible Funding, and Limitless Funding.",
    },
    {
      term: "All or Nothing",
      definition:
        "Funds are only released if the campaign reaches its full fundraising target by the set deadline. No partial funding is disbursed if the goal is not met.",
    },
    {
      term: "Flexible Funding",
      definition:
        "Any amount raised, even if less than the original target, is transferred to the Executor. The Executor must scale project delivery proportionally and communicate transparently with Investors.",
    },
    {
      term: "Limitless Funding",
      definition:
        "There is no predefined fundraising cap, and funds can be collected continuously over time.",
    },
    {
      term: "Ticket",
      definition:
        "A blockchain-based digital proof of contribution issued automatically to the Investor upon successful donation. Tickets enforce refund eligibility and finalization logic via smart contracts.",
    },
  ],

  articles: [
    {
      number: 1,
      title: "Agreement to Terms",
      content:
        "These Executors Terms and Conditions establish the legal framework between you and Hexbox for your use of the Platform as an Executor. By using the Platform, you agree to be bound by these Terms.",
    },
    {
      number: 2,
      title: "Goodwill Rules and Fair Trade",
      content:
        "Parties shall act in accordance with goodwill rules and fair-trade principles while fulfilling their obligations under this agreement.",
    },
    {
      number: 3,
      title: "Scope of the Agreement",
      content:
        "These Terms apply to all Executors using the Hexbox Platform to raise funds, including project posting, campaign management, fund usage, and interactions with Investors and the Platform.",
    },
    {
      number: 4,
      title: "Eligibility",
      content:
        "You must be at least 18 years old and have the legal capacity to bind any entity you represent. Executors are responsible for providing accurate, current, and complete information.",
    },
    {
      number: 5,
      title: "Responsibilities of the Executor",
      content:
        "Executors must provide truthful project details, fulfill promised deliverables, use funds solely for campaign purposes, comply with all laws, and provide transparent updates to Investors.",
      isImportant: true,
    },
    {
      number: 6,
      title: "Responsibilities of Hexbox",
      content:
        "Hexbox provides platform infrastructure, smart contracts, and digital ticket issuance. Hexbox does not guarantee campaign success or act as a broker, financial institution, or intermediary.",
    },
    {
      number: 7,
      title: "Fees and Payment",
      content:
        "Hexbox charges a standard commission of 2.5% per donation. Blockchain gas fees are also the responsibility of users and deducted automatically.",
    },
    {
      number: 8,
      title: "Funding Types",
      content:
        "Executors must select their funding model before launch. This choice is binding and includes All or Nothing, Flexible Funding, and Limitless Funding, each with specific rules and obligations.",
    },
    {
      number: 9,
      title: "Late Pledges and Additional Funding",
      content:
        "Late pledges are not permitted. Executors must conduct fundraising only through official Platform channels.",
    },
    {
      number: 10,
      title: "Escrow and Disbursement",
      content:
        "Funds are held in escrow smart contracts until campaign conditions are met. Executors may not access funds prior to release and must use funds only for stated campaign purposes.",
    },
    {
      number: 11,
      title: "Reporting Errors and Failures",
      content:
        "Executors must promptly report any bugs, errors, or failures and are prohibited from exploiting vulnerabilities in the Platform.",
    },
    {
      number: 12,
      title: "Force Majeure",
      content:
        "Neither party is liable for delays or failures due to events beyond their control, such as natural disasters or wars.",
    },
    {
      number: 13,
      title: "Refunds and Cancellations",
      content:
        "Refunds are governed by Platform rules. Executors must comply fully with refund policies and communicate with Investors in good faith.",
    },
    {
      number: 14,
      title: "Intellectual Property",
      content:
        "Executors retain ownership of their intellectual property but grant Hexbox a non-exclusive license to use submitted content for platform operations and promotion.",
    },
    {
      number: 15,
      title: "Limitation of Liability",
      content:
        "Hexbox provides the Platform on an 'as is' basis and is not liable for project outcomes, delays, or third-party actions.",
    },
    {
      number: 16,
      title: "Indemnification",
      content:
        "Executors agree to indemnify Hexbox against all claims arising from their misuse of the Platform or legal violations.",
      isImportant: true,
    },
    {
      number: 17,
      title: "Dispute Resolution",
      content:
        "Disputes will be resolved by binding arbitration under ICC rules, governed by U.S. law.",
    },
    {
      number: 18,
      title: "Blockchain Irreversibility Notice",
      content:
        "Even if campaigns are removed from Hexbox, blockchain records remain immutable and publicly accessible.",
    },
    {
      number: 19,
      title: "Jurisdiction-Specific Compliance",
      content:
        "Executors must comply with all relevant jurisdiction-specific laws and provide evidence of compliance if requested.",
    },
    {
      number: 20,
      title: "Post-Finalization Dispute Limitation",
      content:
        "After funds are finalized and disbursed, all disputes are solely between the Executor and Investors.",
    },
    {
      number: 21,
      title: "Amendments Fairness and Notice",
      content:
        "Hexbox will provide reasonable notice for material amendments to these Terms. Continued use after notice constitutes acceptance.",
    },
    {
      number: 22,
      title: "Governing Law and Sanctioned Countries Disclosure",
      content:
        "These Terms are governed by U.S. law. Executors must not operate from countries under international sanctions.",
    },
  ],
};

const TermsAndConditions: React.FC = () => {
  const [expandedDefinitions, setExpandedDefinitions] = useState(false);
  const [expandedArticles, setExpandedArticles] = useState<number[]>([]);

  const toggleDefinitions = () => {
    setExpandedDefinitions(!expandedDefinitions);
  };

  const toggleArticle = (articleNumber: number) => {
    setExpandedArticles((prev) =>
      prev.includes(articleNumber)
        ? prev.filter((num) => num !== articleNumber)
        : [...prev, articleNumber]
    );
  };

  const formatContent = (content: string) => {
    return content.split("\n").map((paragraph, index) => (
      <p key={index} className="mb-4 last:mb-0">
        {paragraph.split("**").map((text, i) =>
          i % 2 === 1 ? (
            <strong key={i} className="font-semibold">
              {text}
            </strong>
          ) : (
            text
          )
        )}
      </p>
    ));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="mb-8 pb-6 border-b border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {termsData.title}
        </h1>

        <div className="flex flex-wrap gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Effective: {termsData.effectiveDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <span>Platform: {termsData.company.website}</span>
          </div>
        </div>
      </div>

      <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-orangeColor mb-2">
              Important Notice
            </h3>
            <p className="text-orangeColorDull/70 text-sm">
              By investing via Hexbox, you confirm that you have read,
              understood, and agreed to these Terms. This is a legally binding
              agreement that incorporates blockchain technology and carries
              specific risks.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <button
          onClick={toggleDefinitions}
          className="flex items-center gap-2 text-xl font-semibold text-gray-900 hover:text-gray-700 mb-4"
        >
          {expandedDefinitions ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
          Definitions
        </button>

        {expandedDefinitions && (
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="grid gap-4">
              {termsData.definitions.map((def, index) => (
                <div key={index} className="border-l-4 border-blueColor pl-4">
                  <dt className="font-semibold text-gray-900 mb-1">
                    {def.term}
                  </dt>
                  <dd className="text-gray-700">{def.definition}</dd>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {termsData.articles.map((article) => (
          <div
            key={article.number}
            className={`border rounded-lg ${
              article.isImportant
                ? "border-red-200 bg-red-50"
                : "border-gray-200"
            }`}
          >
            <button
              onClick={() => toggleArticle(article.number)}
              className={`w-full flex items-center justify-between p-4 text-left transition-colors ${
                article.isImportant ? "hover:bg-red-100" : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                {expandedArticles.includes(article.number) ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  Article {article.number} – {article.title}
                  {article.isImportant && (
                    <AlertTriangle className="w-4 h-4 text-redColor" />
                  )}
                </h2>
              </div>
            </button>

            {expandedArticles.includes(article.number) && (
              <div className="px-4 pb-4">
                <div
                  className={`prose max-w-none pl-8 ${
                    article.isImportant ? "text-redColor" : "text-gray-700"
                  }`}
                >
                  {formatContent(article.content)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-12 pt-8 border-t border-gray-200">
        <div className="bg-blue-50 border border-lightBlueColor rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">
            Agreement Confirmation
          </h3>
          <p className="text-blueColor mb-4">
            By investing via Hexbox, you confirm that you have read, understood,
            and agreed to these Terms.
          </p>
          <div className="text-sm text-blueColor">
            <p>
              <strong>Last updated:</strong> {termsData.lastUpdated}
            </p>
            <p>
              <strong>Contact:</strong> Please direct inquiries to our support
              team through the platform or via the channels listed in our
              Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
