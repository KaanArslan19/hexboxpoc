"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { AboutData } from "../types";
import CustomButton from "./ui/CustomButton";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

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
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl xl:text-6xl capitalize text-center mb-4 tracking-tight">
        Involve in Hexbox world <br className="hidden sm:inline" />
        just in a Minute
      </h1>
      <p className="mb-8 text-lg lg:text-xl text-center ">
        Follow these steps to launch your own project
      </p>
      <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 justify-items-center">
        {ABOUT_DATA.map((item, index) => (
          <li
            key={index}
            className="w-full max-w-sm h-[28rem] flex flex-col bg-gradient-to-bl from-yellowColor/30 via-orangeColor/30 to-blueColor/30 rounded-2xl overflow-hidden shadow-lg"
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
              <h4 className="text-2xl font-semibold text-center mb-4">
                {item.header}
              </h4>
              <div className="flex-1 overflow-y-auto">
                <p className="text-base lg:text-lg ">{item.description}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div
        className="relative mt-8 flex justify-center"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CustomButton
          onClick={handleButtonClick}
          className="group relative px-8 py-3 bg-orangeColor/30 hover:bg-orangeColor/70
                text-white rounded-lg transform transition-all duration-300
                hover:translate-y-[-2px] hover:shadow-lg
                flex items-center gap-2 overflow-hidden  border-orangeColor"
        >
          {isHovered && (
            <div
              className="absolute inset-0 bg-orangeColor transition-transform duration-300 ease-out"
              style={{
                transform: `translateX(${progress - 100}%)`,
              }}
            />
          )}

          <span
            className={`relative z-10 ${
              isHovered ? "text-white" : "text-orangeColor/90"
            }`}
          >
            Join the Waitlist
          </span>
          <ArrowRight
            className={`relative z-10 w-5 h-5 transition-transform duration-300
                ${isHovered ? "translate-x-1 " : ""}`}
            color={isHovered ? "white" : "#E94E1B"}
          />
        </CustomButton>
      </div>
    </div>
  );
}
