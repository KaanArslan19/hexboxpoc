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
  title: "Hexbox Investor Terms of Use",
  effectiveDate: "23.05.2025",
  lastUpdated: "23.05.2025",
  company: {
    name: "Hexbox",
    website: "hexbox.money",
  },

  definitions: [
    {
      term: "Investor",
      definition:
        "An individual or entity contributing digital assets to a campaign.",
    },
    {
      term: "Executor",
      definition: "An individual or entity launching a campaign.",
    },
    {
      term: "Campaign",
      definition: "A public fundraising initiative hosted on Hexbox.",
    },
    {
      term: "NFT",
      definition:
        "A non-fungible token (NFT) is a blockchain-based digital certificate issued upon contribution. It functions as a record of participation and access pass to campaign-specific rights, but does not represent a financial product.",
    },
    {
      term: "Finalization",
      definition:
        "A blockchain-based event that releases campaign funds to the Executor and revokes refund eligibility.",
    },
    {
      term: "Smart Contract",
      definition:
        "Self-executing blockchain code governing transactions, ticket issuance, and refund logic.",
    },
    {
      term: "Escrow Account",
      definition:
        "A smart contract-controlled account that securely holds contributed funds during the campaign period. This account acts as a neutral digital escrow and ensures that funds are only released to the Executor upon Finalization or returned to the Investor if a refund is requested within the Refund Window.",
    },
    {
      term: "Wallet",
      definition:
        "A blockchain address under the Investor's control where NFTs and digital assets are held.",
    },
    {
      term: "Refund Window",
      definition:
        "The period before Finalization during which a refund can be requested.",
    },
    {
      term: "Reward",
      definition:
        "Any benefit, product, service, or priority access offered in return for contribution, subject to campaign-specific terms.",
    },
    {
      term: "User",
      definition:
        "Any individual accessing Hexbox, whether logged in or anonymous.",
    },
  ],

  articles: [
    {
      number: 1,
      title: "Agreement to Terms",
      content:
        "This Article sets forth the terms of agreement between you, the Investor, and Hexbox. By accessing or using Hexbox, including visiting the website hexbox.money or participating in any campaign, you agree to enter into a binding legal agreement with Hexbox under these Terms of Use. This agreement incorporates our Privacy Policy and Cookie Policy by reference. If you do not agree to all the terms, you may not use or access Hexbox or its services.",
    },
    {
      number: 2,
      title: "Purpose and Scope",
      content:
        "Hexbox is a blockchain-based crowdfunding platform designed to facilitate presale access and early-stage support for projects through smart contract infrastructure. In addition to campaign contributions, Hexbox also enables the issuance of digital tickets in the form of NFTs that may serve as vouchers or priority access to future products and services offered by Executors. These digital tickets are not financial products and are not intended to represent ownership, debt, or equity. These Terms govern all contributions made to campaigns, rights attached to NFT Receipts, refund mechanisms, and responsibilities of Investors.",
    },
    {
      number: 3,
      title: "Eligibility and Registration",
      content:
        "To use Hexbox, you must be at least 18 years of age and have the legal capacity to form binding contracts. Your jurisdiction must not prohibit participation in blockchain or crowdfunding platforms. We may require identity verification under KYC/AML regulations.",
    },
    {
      number: 4,
      title: "Investment Mechanism",
      content:
        "By contributing to a campaign on Hexbox, you enter into a direct, on-chain arrangement with the Executor. All contributions are executed via smart contracts, which manage the logic of fund custody, finalization, and refund conditions. Upon successful contribution, a blockchain-based NFT is issued to your designated wallet. This NFT functions as a non-custodial proof of participation and must be retained to access any campaign-related rights, such as initiating a refund during the Refund Window or claiming products, services, or other forms of campaign utility as described by the Executor.",
    },
    {
      number: 5,
      title: "Refund and Withdrawal Terms",
      content:
        "Refunds are available only during the Refund Window. Finalization, which may be automatic or triggered by the Executor, releases the funds and burns the NFT. Hexbox does not guarantee refunds after finalization. If you lose access to your wallet before claiming a refund, your rights may be permanently lost.",
      isImportant: true,
    },
    {
      number: 6,
      title: "Investor Responsibilities and Risk Disclosure",
      content: `You accept the following risks when using Hexbox: the possibility of project failure, fraudulent activity by Executors, legal non-compliance by third parties, delays in delivery or communication, and general volatility in blockchain-based ecosystems. 

As an Investor, it is your responsibility to take reasonable precautions, which include conducting thorough due diligence before investing in a campaign, securing your wallet credentials and the NFT Receipt issued to you, and complying with all tax and legal obligations in your jurisdiction.`,
      isImportant: true,
    },
    {
      number: 7,
      title: "Fees and Taxes",
      content:
        "Fees applicable to your transaction will be clearly presented and must be acknowledged prior to confirming any contribution. These may include service charges imposed by Hexbox, smart contract execution fees, and third-party transaction processing costs. Additionally, you are solely responsible for all blockchain gas fees associated with initiating, interacting with, or reversing transactions on the network. You are also responsible for reporting and paying any local, national, or international taxes that may arise as a result of your activity on the platform. Hexbox does not provide tax advice or act as a withholding agent.",
    },
    {
      number: 8,
      title: "Platform Role and Disclaimers",
      content:
        "Hexbox acts solely as a neutral infrastructure and technology provider. We do not act as a broker, dealer, investment advisor, financial institution, custodian, or intermediary in any transaction. We do not originate, structure, endorse, or promote specific campaigns, nor do we provide financial, legal, or tax advice. Our role is strictly limited to providing smart contract tools and platform access that enable Executors and Investors to interact directly with one another. Hexbox does not mediate disputes between parties, validate the legitimacy of campaigns, or guarantee the outcome, delivery, or success of any project. All risk and decision-making rest entirely with the Users.",
    },
    {
      number: 9,
      title: "Prohibited Activities",
      content:
        "You may not engage in any conduct that violates these Terms or applicable laws. This includes, but is not limited to, fraudulent or deceptive behavior, misrepresentation of your identity or intentions, or any unlawful activity. You are prohibited from interfering with the technical operation of Hexbox, including tampering with smart contracts or attempting to circumvent security protocols. Additionally, you must not use automated bots, scripts, or any manipulative tools to influence campaign mechanics or outcomes.",
    },
    {
      number: 10,
      title: "Suspension and Termination",
      content:
        "Hexbox reserves the right to suspend or permanently terminate your access to the platform, services, and any related systems at any time if you are found to have violated these Terms, attempted to circumvent platform operations, engaged in fraudulent behavior, or otherwise posed a legal or reputational risk to Hexbox or its users. Such action may be taken without prior notice and at Hexbox's sole discretion. In such events, any rights attached to NFTs held by the affected party—including access to refunds, rewards, or campaign-related benefits—may be invalidated without compensation. This includes cases where an account is associated with malicious activity, regulatory non-compliance, abuse of smart contracts, impersonation, or any other conduct detrimental to the integrity or lawful operation of the platform.",
    },
    {
      number: 11,
      title: "Intellectual Property",
      content:
        "All intellectual property, including but not limited to the text, graphics, code, features, design elements, trademarks, and any other materials displayed or made available through the Hexbox platform, are the exclusive property of Hexbox or its licensors. You are strictly prohibited from copying, distributing, modifying, reverse engineering, publicly displaying, or otherwise exploiting any part of the platform or its content for commercial or non-commercial purposes without the express prior written consent of Hexbox. Unauthorized use may constitute a violation of intellectual property laws and could result in legal action.",
    },
    {
      number: 12,
      title: "Limitation of Liability",
      content: `Hexbox disclaims all warranties. We are not liable for indirect or consequential losses, including but not limited to lost funds, campaign failures, product failures, delays, or service interruptions. 

Additionally, Hexbox shall not be held liable for any issues resulting from consumer error or misconduct, including but not limited to: failure to maintain control over one's wallet or private keys; transferring funds to an incorrect address; losing or deleting the NFT Receipt; misunderstanding campaign terms; failing to claim a refund within the Refund Window; reliance on external third-party tools or services; or misinterpreting reward eligibility or delivery timelines.`,
      isImportant: true,
    },
    {
      number: 13,
      title: "Dispute Resolution",
      content:
        "Any dispute, controversy, or claim arising out of or relating to this Agreement, including the breach, termination, or validity thereof, shall be finally resolved by arbitration under the Rules of Arbitration of the International Chamber of Commerce (ICC). The number of arbitrators shall be one. The seat of arbitration shall be Victoria, Australia. The language of arbitration shall be English. This Agreement shall be governed exclusively by the laws of the United States of America. All disputes shall be resolved solely through arbitration; no party shall have recourse to any court of law for any reason related to this Agreement, except to enforce an arbitral award.",
    },
    {
      number: 14,
      title: "Amendments",
      content:
        "We may modify these Terms at any time. Updates will be published on the platform. Continued use signifies acceptance.",
    },
    {
      number: 15,
      title: "Contact and Notices",
      content:
        "Please direct inquiries to our support team through the platform or via the channels listed in our Privacy Policy.",
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
