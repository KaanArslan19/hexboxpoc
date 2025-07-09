"use client";
import React, { useState, useEffect } from "react";
import {
  Rocket,
  BarChart3,
  Shield,
  Wallet,
  Users,
  Package,
  TrendingUp,
  Eye,
  CheckCircle,
  Zap,
  Crown,
  Lock,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

const AnalyticsAnnouncement = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 5);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Wallet,
      title: "Executor's Wallet Analytics",
      color: "from-[#002d5d] to-[#1A456F]",
    },
    {
      icon: Shield,
      title: "Fraud Scoring",
      color: "from-[#CE0E2D] to-[#B21C38]",
    },
    {
      icon: BarChart3,
      title: "Treasury Analytics",
      color: "from-[#E94E1B] to-[#D04A22]",
    },
    {
      icon: Users,
      title: "Audience Analytics",
      color: "from-[#FFC629] to-[#E5B226]",
    },
    {
      icon: Package,
      title: "Product & Services Analytics",
      color: "from-purple-600 to-purple-800",
    },
  ];

  const advantages = [
    {
      icon: Shield,
      title: "Build Unshakable Trust",
      desc: "Show backers exactly where money goes with transparent proof",
    },
    {
      icon: TrendingUp,
      title: "Boost Campaign Success",
      desc: "Fine-tune campaigns in real time for better results",
    },
    {
      icon: Eye,
      title: "Protect Your Reputation",
      desc: "Monitor and prevent risks to keep your campaign clean",
    },
    {
      icon: Zap,
      title: "Stay Ahead of the Game",
      desc: "Get early warnings and spot trends before competition",
    },
    {
      icon: Crown,
      title: "Show Off Your Edge",
      desc: "Signal you're in the big leagues with cutting-edge tools",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#121212] via-[#002d5d] to-[#1A456F] text-white overflow-hidden ">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#E94E1B] rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-[#FFC629] rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-75"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-[#002d5d] rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-150"></div>
      </div>

      <div className="relative  max-w-6xl mx-auto px-6 py-12">
        <div
          className={`text-center mb-16 transform transition-all duration-1000 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Rocket className="w-16 h-16 text-cyan-400 animate-bounce" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-ping"></div>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-[#FFC629] via-[#E94E1B] to-[#002d5d] bg-clip-text text-transparent leading-tight">
            Your Blockchain Campaign
            <br />
            <span className="text-6xl md:text-8xl">Command Center</span>
          </h1>

          <div className="text-2xl md:text-3xl font-bold text-gray-300 mb-8">
            Is <span className="text-[#FFC629] animate-pulse">Almost Here</span>
          </div>

          <div className="max-w-4xl mx-auto text-lg md:text-xl text-gray-300 leading-relaxed">
            We`re about to drop something{" "}
            <span className="font-bold text-white">big</span>:
            <br />
            The{" "}
            <span className="bg-gradient-to-r from-[#FFC629] to-[#E94E1B] bg-clip-text text-transparent font-bold">
              Analytics Hub
            </span>{" "}
            — a blockchain-powered dashboard giving you full, real-time insights
            into your campaign`s wallets, treasury, audience, products, and
            services.
          </div>
        </div>

        <div className="text-center mb-20">
          <div className="inline-block bg-gradient-to-r from-[#E94E1B] to-[#002d5d] p-1 rounded-2xl mb-6">
            <div className="bg-[#121212] rounded-xl px-8 py-6">
              <div className="text-2xl font-bold mb-2">
                And here`s the best part:
              </div>
              <div className="text-xl text-gray-300 mb-4">
                You don`t need to wait.
              </div>
              <div className="text-lg">
                You can unlock{" "}
                <span className="text-[#FFC629] font-bold">
                  lifetime access
                </span>{" "}
                right now by grabbing your{" "}
                <span className="text-[#E94E1B] font-bold">GSD NFT</span> piece.
              </div>
            </div>
          </div>
        </div>

        <div className="mb-20">
          <div className="text-center mb-12">
            <div className="flex justify-center items-center gap-3 mb-4">
              <BarChart3 className="w-8 h-8 text-[#FFC629]" />
              <h2 className="text-4xl font-black">
                What You`ll Unlock with GSD NFT
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isActive = activeFeature === index;

              return (
                <div
                  key={index}
                  className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-500 transform hover:scale-105 ${
                    isActive
                      ? "bg-gradient-to-br from-[#2A2A2A] to-[#121212] ring-2 ring-[#FFC629]"
                      : "bg-[#002d5d25] hover:bg-[#1A456F40]"
                  }`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-10 group-hover:opacity-20 transition-opacity`}
                  ></div>

                  <div className="">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle className="w-6 h-6 text-[#FFC629] flex-shrink-0" />
                      <div
                        className={`p-3 rounded-xl bg-gradient-to-r ${feature.color}`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>

                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>

                    {index === 0 && (
                      <p className="text-gray-300">
                        See every on-chain move your executors make. Track
                        wallet flows, token interactions, and funding behaviors
                        across the blockchain — no middlemen, no delay.
                      </p>
                    )}
                    {index === 1 && (
                      <p className="text-gray-300">
                        We run fraud detection straight from the chain. Get
                        real-time risk scores, flag sketchy patterns, and keep
                        your campaign clean.
                      </p>
                    )}
                    {index === 2 && (
                      <p className="text-gray-300">
                        Every dollar, token, or coin — traced, tracked, and
                        displayed. Full transparency on how campaign funds are
                        collected, stored, and spent.
                      </p>
                    )}
                    {index === 3 && (
                      <p className="text-gray-300">
                        Map wallet activity, NFT interactions, and token holds.
                        Blend that with off-chain audience insights for the full
                        360° view of who`s engaging.
                      </p>
                    )}
                    {index === 4 && (
                      <p className="text-gray-300">
                        Measure how your NFTs, products, or services are
                        performing. Understand sales trends, unlock patterns, or
                        token-based actions all in one unified view.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Advantages Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <div className="flex justify-center items-center gap-3 mb-4">
              <Crown className="w-8 h-8 text-[#FFC629]" />
              <h2 className="text-4xl font-black">Why Executors Should Care</h2>
            </div>
            <p className="text-xl text-gray-300">Big Advantages for You</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {advantages.map((advantage, index) => {
              const Icon = advantage.icon;

              return (
                <div
                  key={index}
                  className="group bg-gradient-to-r from-[#002d5d25] to-[#1A456F40] rounded-xl p-6 hover:from-[#1A456F40] hover:to-[#002d5d] transition-all duration-300 border border-[#2A2A2A] hover:border-[#FFC629]/50"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-3 h-3 bg-[#E94E1B] rounded-full animate-pulse"></div>
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-3">
                        <Icon className="w-6 h-6 text-[#FFC629]" />
                        <h3 className="text-xl font-bold">{advantage.title}</h3>
                      </div>
                      <p className="text-gray-300">{advantage.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-20">
          <div className="text-center mb-12">
            <div className="flex justify-center items-center gap-3 mb-4">
              <Lock className="w-8 h-8 text-[#E94E1B]" />
              <h2 className="text-4xl font-black">Why You Need the GSD NFT</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: Sparkles,
                title: "Lifetime Access",
                desc: "One-time purchase = forever access. No monthly fees, no subscriptions, no nonsense.",
              },
              {
                icon: Crown,
                title: "VIP-Only Features",
                desc: "Advanced analytics, early feature drops, and blockchain-native insights reserved just for GSD NFT holders.",
              },
              {
                icon: Shield,
                title: "On-Chain Transparency",
                desc: "Proof-backed data you can trust, straight from the blockchain.",
              },
              {
                icon: Zap,
                title: "Flex + Bragging Rights",
                desc: "Show the world you're an early supporter who's playing at the top level.",
              },
            ].map((benefit, index) => {
              const Icon = benefit.icon;
              const iconColors = [
                "text-[#FFC629]",
                "text-[#E94E1B]",
                "text-[#002d5d]",
                "text-[#FFC629]",
              ];

              return (
                <div
                  key={index}
                  className="flex items-start gap-4 bg-gradient-to-r from-[#E94E1B]/20 to-[#002d5d]/20 rounded-xl p-6 border border-[#E94E1B]/30"
                >
                  <CheckCircle className="w-6 h-6 text-[#FFC629] flex-shrink-0 mt-1" />
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className={`w-5 h-5 ${iconColors[index]}`} />
                      <h3 className="text-lg font-bold">{benefit.title}</h3>
                    </div>
                    <p className="text-gray-300">{benefit.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center">
          <div className="bg-gradient-to-r from-[#E94E1B] via-[#FFC629] to-[#002d5d] p-1 rounded-3xl inline-block mb-8">
            <div className="bg-[#121212] rounded-3xl px-12 py-8">
              <div className="flex justify-center items-center gap-3 mb-4">
                <Package className="w-8 h-8 text-[#FFC629]" />
                <h2 className="text-3xl font-black">Get Your GSD NFT Now</h2>
              </div>

              <p className="text-xl text-gray-300 mb-6">
                The Analytics Hub is built for NFT holders only.
              </p>
              <p className="text-lg text-gray-300 mb-8">
                To unlock your access, all you need is to:
              </p>
              <Link
                href="https://opensea.io/collection/hexbox-gif-collection/overview"
                target="_blank"
              >
                <button className="bg-gradient-to-r from-[#E94E1B] to-[#FFC629] text-white px-8 py-4 rounded-xl text-xl font-bold inline-flex items-center gap-3 hover:from-[#D04A22] hover:to-[#E5B226] transition-all duration-300 transform hover:scale-105 cursor-pointer">
                  <Sparkles className="w-6 h-6" />
                  Buy a GSD NFT piece today
                </button>
              </Link>

              <div className="mt-8 text-gray-300">
                <p className="mb-2">
                  Once you hold it, you`re in — lifetime access, premium tools,
                  and exclusive perks.
                </p>
                <p className="font-bold">
                  No waiting. No future paywalls. No compromises.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsAnnouncement;
