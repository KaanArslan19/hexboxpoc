"use client";
import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  Mail,
  MapPin,
} from "lucide-react";

const privacyData = {
  title: "Hexbox™ Privacy Policy",
  effectiveDate: "May 21, 2025",
  lastUpdated: "May 21, 2025",
  company: {
    name: "Hexbox™ LLC",
    location: "Wyoming, United States",
    email: "hello@hexbox.money",
  },
  introduction: `Thank you for visiting the Hexbox™ Privacy Policy. This Policy explains how Hexbox™ LLC ("Hexbox™," "we," "our," or "us") collects, uses, stores, and discloses personal information. It applies to all Users who access or use our Services, including through our website, smart contracts, NFT functionalities, or third-party integrations such as Discord.

Hexbox™ LLC is a company registered in the State of Wyoming, United States. We operate a blockchain-based crowdfunding platform that enables decentralized fundraising through the issuance of NFTs known as Tickets. We are committed to respecting your privacy rights and ensuring transparency about our practices.`,

  definitions: [
    {
      term: "User",
      definition:
        "Any individual who interacts with the Hexbox™ platform, whether logged in or not, including Investors and Executors.",
    },
    {
      term: "Investor",
      definition:
        "An individual who purchases NFTs (referred to as Tickets) in exchange for products, services, or donations.",
    },
    {
      term: "Executor",
      definition:
        "An individual or organization that creates and manages a campaign offering products, services, or donation options via NFTs.",
    },
    {
      term: "Campaign",
      definition:
        "A fundraising effort initiated by an Executor through which Investors can contribute by purchasing Tickets.",
    },
    {
      term: "Tickets",
      definition:
        "NFTs minted when an Investor purchases a product, service, or makes a donation through a campaign.",
    },
    {
      term: "Donation Product",
      definition:
        "An NFT issued in exchange for a contribution equal to one United States dollar's equivalent Circles Crypto Stable Token (USDC), typically without the expectation of receiving a physical product or service.",
    },
    {
      term: "Wallet Address",
      definition:
        "A cryptographic blockchain identifier associated with a User. While it does not directly reveal identity, it may still be considered personal information under applicable privacy laws.",
    },
    {
      term: "On-chain Data",
      definition:
        "Information permanently recorded on a public blockchain, including wallet addresses, token transactions, and funding or voting actions.",
    },
    {
      term: "Off-chain Data",
      definition:
        "Personal information collected outside the blockchain, such as email addresses, IP addresses, Discord IDs, and phone numbers.",
    },
    {
      term: "Platform",
      definition:
        "The Hexbox™ suite of services including its website, smart contracts, APIs, and integrations with third-party tools.",
    },
  ],

  articles: [
    {
      number: 1,
      title: "Scope of Policy",
      content:
        "This Policy applies to all personal data that we collect through our Platform, whether directly or indirectly. By accessing or using any part of the Hexbox™ Platform, you are consenting to the collection, use, and disclosure of your personal data in accordance with this Policy.",
    },
    {
      number: 2,
      title: "Personal Data We Collect",
      content: `Hexbox™ may collect both on-chain and off-chain data when you interact with our Platform. The specific data we collect depends on your role as an Investor, Executor, or visitor.

We may collect the following information, depending on whether you are interacting with Hexbox™ as an Investor, Executor, or as a logged-out visitor:

**Data you voluntarily provide:** This includes your email address, phone number, Discord handle, or other contact information when registering a campaign or submitting a form. Executors are required to provide this data for campaign creation.

**Automatically collected data:** This includes technical details such as your IP address, browser type, device information, session activity, page visits, and referral URLs. Additionally, when Users connect a wallet, their public wallet address and all associated on-chain activity becomes part of our data analysis.

**Data from third-party integrations:** We may collect data through services such as Google Analytics. Blockchain activity may be analyzed using third-party blockchain data providers. In some cases, we also collect data shared by Executors regarding delivery or customer engagement.`,
    },
    {
      number: 3,
      title: "Legal Basis and Purpose of Data Processing",
      content: `Hexbox™ processes personal data on the basis of legitimate interests, contractual necessity, compliance with legal obligations, and, where applicable, user consent. The data we collect enables us to deliver our Services, ensure the integrity of campaigns, and maintain platform security.

Specifically, we process personal data to allow Users to interact with the Platform, including but not limited to minting and managing NFTs. This also includes recording transactions and making them auditable to uphold transparency.

We use personal data to support the delivery of campaign rewards and services by facilitating communication between Executors and Investors. As part of our commitment to platform integrity, we monitor and prevent fraudulent or malicious activity. We also comply with regulatory requirements, including tax and anti-fraud obligations.

In order to improve the user experience, we analyze platform usage and conduct usability testing. Where you have given your consent, we may use your contact information to communicate updates, promotional content, or marketing messages related to Hexbox™ and its services.`,
    },
    {
      number: 4,
      title: "Disclosure and Sharing of Personal Data",
      content: `Hexbox™ may share personal data in limited circumstances when it is necessary for the operation of the Platform, the fulfillment of campaign obligations, or to comply with applicable law.

We may disclose information to Executors or Investors when such disclosure is required for the fulfillment of products, services, or donation-based commitments linked to a Campaign. This ensures that both parties can coordinate delivery and communication effectively.

We may also disclose personal data to third-party service providers that support our technical infrastructure. These include database hosting providers such as MongoDB, server hosting providers such as Vercel & NetCup VPS, and communication integrations such as Discord bots. These providers only receive the minimum data necessary to perform their duties on our behalf and are bound by confidentiality and data protection obligations.

In accordance with applicable legal requirements, we may share personal information with law enforcement authorities, regulatory bodies, or government agencies if we are legally compelled to do so by subpoena, court order, or other lawful process.

Additionally, we may share data with analytics and monitoring services in order to detect security issues, monitor platform performance, and improve user experience.

Hexbox™ does not sell your personal identity data under any circumstances. Furthermore, we do not link on-chain behavioral data to personally identifiable information unless we have expressly disclosed such practices and received your informed consent.`,
    },
    {
      number: 5,
      title: "Blockchain-Specific Limitations",
      content:
        "Due to the nature of blockchain technology, certain information, such as wallet addresses, token transactions, and NFT activity, is publicly available and permanently stored. Such data cannot be modified or deleted. While this information is considered pseudonymous, it may still be subject to privacy regulations depending on how it is combined with off-chain data.",
    },
    {
      number: 6,
      title: "Rights of Data Subjects",
      content: `Depending on your jurisdiction, you may be entitled to certain rights regarding your personal data. These rights may include the ability to access the personal data we hold about you, request that we correct any inaccuracies, or request the deletion of your off-chain data. If you wish to request deletion, you may do so by contacting us at hello@hexbox.money.

In addition, you may have the right to object to our processing of your data, or to withdraw any previously granted consent where the processing is based on consent. You may also request information about the ways in which we use your data, including the legal basis and specific purposes.

All requests will be evaluated and processed in accordance with the legal obligations applicable to Hexbox™ and within the timeframes prescribed by law.`,
    },
    {
      number: 7,
      title: "Use of Cookies and Tracking Technologies",
      content:
        "We use cookies and similar tracking technologies to enhance the functionality and usability of the Platform. These technologies allow us to identify returning Users, monitor browsing patterns, measure session activity, and tailor content to improve user experience. Cookies are placed when you visit our website and may persist across sessions unless you choose to disable them. You can manage or disable cookies at any time by adjusting your browser settings; however, doing so may affect certain features of the Platform.",
    },
    {
      number: 8,
      title: "International Data Transfers",
      content: `If you are located outside of the United States, please be aware that your data may be transferred to, stored in, or processed within the United States or other jurisdictions. By using our Platform, you consent to such international data transfers.

At this time, Hexbox™ does not implement Standard Contractual Clauses or similar frameworks, but may consider doing so as regulatory requirements evolve.`,
    },
    {
      number: 9,
      title: "Children's Privacy",
      content:
        "The Hexbox™ Platform is not intended for use by individuals under the age of 16. We do not knowingly collect personal data from minors. If a parent or legal guardian believes that their child has submitted data to us, they may contact us to request deletion or restriction of access for the associated wallet address.",
    },
    {
      number: 10,
      title: "Data Retention and Storage",
      content:
        "Hexbox™ retains off-chain personal data only for as long as necessary to fulfill the purposes for which it was originally collected. This may include account management, service delivery, legal compliance, and dispute resolution. Once the data is no longer required for these purposes, we delete or anonymize it in accordance with our internal retention policies and applicable legal requirements. Please note that data stored on the blockchain is not subject to modification or deletion, as its permanence is a fundamental feature of decentralized ledger technology.",
    },
    {
      number: 11,
      title: "Data Security Measures",
      content:
        "We implement reasonable technical and organizational safeguards to protect the personal data we process. This includes access controls, encryption, audit logging, and secure storage practices. Users are responsible for securing their wallets and personal devices.",
    },
    {
      number: 12,
      title: "Legal Disclosures and Jurisdictional Statements",
      content: `Hexbox™ operates on a global scale but is headquartered in the United States. While we strive to align with key international privacy frameworks, such as the General Data Protection Regulation and the California Consumer Privacy Act, there are specific mechanisms and representations we do not currently maintain.

These include the appointment of designated representatives in the European Union or United Kingdom, the implementation of consumer privacy mechanisms as set forth under the California Privacy Rights Act, the use of standard contractual clauses or equivalent safeguards for cross-border data transfers, and the establishment of formal processes to receive privacy-related requests through authorized third-party agents.

Although these measures are not yet in place, we continue to evaluate our data protection practices. This Privacy Policy and our internal procedures will be revised accordingly as our legal obligations evolve and our business expands.`,
    },
    {
      number: 13,
      title: "Policy Updates and Revisions",
      content:
        "We occasionally revise this Policy to reflect updates in privacy regulations or changes in how we manage your data. We encourage you to review it regularly. By continuing to use Hexbox™ after updates are published, you agree to the latest version. This Policy may be provided in other languages for convenience, but the English version shall prevail in case of discrepancies.",
    },
    {
      number: 14,
      title: "Contact Information",
      content: `For any questions, concerns, or data-related requests regarding this Privacy Policy, you may contact:

**Hexbox™ LLC**
Wyoming, United States
Email: hello@hexbox.money`,
    },
  ],
};

const PrivacyAndPolicy: React.FC = () => {
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
          {privacyData.title}
        </h1>

        <div className="flex flex-wrap gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Effective: {privacyData.effectiveDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{privacyData.company.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <a
              href={`mailto:${privacyData.company.email}`}
              className="text-blueColor hover:text-blueColor/80"
            >
              {privacyData.company.email}
            </a>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="prose max-w-none">
          {formatContent(privacyData.introduction)}
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
              {privacyData.definitions.map((def, index) => (
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
        {privacyData.articles.map((article) => (
          <div
            key={article.number}
            className="border border-gray-200 rounded-lg"
          >
            <button
              onClick={() => toggleArticle(article.number)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {expandedArticles.includes(article.number) ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
                <h2 className="text-lg font-semibold text-gray-900">
                  Article {article.number} – {article.title}
                </h2>
              </div>
            </button>

            {expandedArticles.includes(article.number) && (
              <div className="px-4 pb-4">
                <div className="prose max-w-none text-gray-700 pl-8">
                  {formatContent(article.content)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
        <p>Last updated: {privacyData.lastUpdated}</p>
        <p className="mt-2">
          For questions regarding this policy, contact us at{" "}
          <a
            href={`mailto:${privacyData.company.email}`}
            className="text-blueColor hover:text-lightBlueColor"
          >
            {privacyData.company.email}
          </a>
        </p>
      </div>
    </div>
  );
};

export default PrivacyAndPolicy;
