"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { AboutData } from "../types";
import CustomButton from "./ui/CustomButton";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import Funnel from "./ui/Funnel";

export default function About() {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const router = useRouter();
  useEffect(() => {
    let progressInterval: NodeJS.Timeout | null = null;

    if (isHovered) {
      setProgress(0);
      let currentProgress = 0;

      progressInterval = setInterval(() => {
        currentProgress += 1;
        if (currentProgress <= 100) {
          setProgress(currentProgress);
        } else {
          if (progressInterval) clearInterval(progressInterval);
        }
      }, 20);
    } else {
      setProgress(0);
    }

    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [isHovered]);
  const handleButtonClick = () => {
    router.push("/waitlist");
  };
  const ABOUT_DATA: AboutData[] = [
    {
      image: "/images/about/join_waitlist.png",
      header: "Join our Waitlist",
      description:
        "Be part of our exclusive community by joining our waitlist. Fill out the form to secure your spot and stay updated on our exciting launch!",
    },
    {
      image: "/images/about/collaborate.png",
      header: "Collaborate with Us",
      description:
        "Once you’re on our list, we’ll reach out with opportunities for collaboration. Let’s build a safer, smarter fundraising future together.",
    },
    {
      image: "/images/about/launch.png",
      header: "Launch Your Crowdfunding ",
      description:
        "Ready to start raising funds? Hexbox offers a streamlined, secure platform for your crowdfunding needs for businesses and investors. Let’s turn your ideas into reality!",
    },
  ];
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl md:text-5xl capitalize text-center mb-4 font-customFont_bold text-blueColor">
        Involve in Hexbox world <br className="hidden sm:inline " />
        just in a Minute
      </h1>
      <p className="mb-8 text-lg lg:text-xl text-center ">
        Follow these steps to launch your own project
      </p>
      <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 justify-items-center">
        {ABOUT_DATA.map((item, index) => (
          <li
            key={index}
            className="w-full max-w-sm h-[28rem] flex flex-col bg-gradient-to-bl from-yellowColor/50 via-orangeColor/40 to-blueColor/30 rounded-2xl overflow-hidden shadow-lg"
          >
            <div className="h-48 flex items-center justify-center p-4">
              <Image
                className="h-32 w-32 rounded-full object-contain"
                src={item.image}
                alt={item.header}
                width={128}
                height={128}
              />
            </div>
            <div className="flex-1 p-6 flex flex-col">
              <h4 className="text-2xl font-customFont_regular text-center mb-4 text-orangeColor">
                {item.header}
              </h4>
              <div className="flex-1 overflow-y-auto">
                <p className="text-base lg:text-lg text-black/80 ">
                  {item.description}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <Funnel
        firstButtonLink="campaigns"
        firstButtonText="Explore campaigns"
        secondButtonLink="/campaign/create"
        secondButtonText="Create a campaign"
      />
    </div>
  );
}
