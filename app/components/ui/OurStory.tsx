"use client";
import Image from "next/image";
import React from "react";
import Slider from "react-slick";

const OurStory = () => {
  const storyContent = [
    {
      id: 1,
      text: "Our friends and family have been deeply affected by the fraud and failures of unreliable exchanges, businesses and project. We felt a strong urge to help, but by the time we knew of the damage, it was too late. The system had failed them—ineffective regulations and a lack of protections left regular people and investors vulnerable. This issue wasn't just affecting businesses; it was impacting personal lives and innocent families.",
    },
    {
      id: 2,
      text: "We wanted to put an end to this suffering and create a safer, better world for individuals, families, and businesses alike. Business is inherently risky, so why add unnecessary risk with fraud and malpractice? We saw an opportunity to fix this. With our expertise in code, business, and community, we committed ourselves to make a difference.",
    },
    {
      id: 3,
      text: "As we developed our project, we encountered obstacles in fundraising—a critical step for any venture. The challenges we faced highlighted the need for a transparent, secure platform to support legitimate projects and protect investors. That's why Hexbox was born: to make fundraising safer, more accessible, and trustworthy for everyone.",
    },
  ];

  // Slider settings
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 700,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    draggable: true,
    swipe: true,
    swipeToSlide: true,
    touchThreshold: 10,
    useCSS: true,
    pauseOnHover: true,
    autoplay: false,
    customPaging: (i: number) => (
      <button
        className="w-2.5 h-2.5 rounded-full transition-all duration-300 hover:bg-lightBlueColor focus:outline-none"
        aria-label={`Story Part ${i + 1}`}
      />
    ),
    dotsClass: "slick-dots custom-dots",
  };

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="flex flex-col lg:flex-row lg:justify-center lg:items-center gap-8">
        <div className="w-1/3 mx-auto lg:w-1/4 flex items-center justify-center">
          <div className="relative w-full aspect-square lg:bottom-5">
            <Image
              src="/images/about/our_story.png"
              fill
              className="object-contain"
              alt="about-logo"
            />
          </div>
        </div>
        <div className="w-full lg:w-2/3">
          <h2 className="text-4xl xl:text-6xl font-light mb-8 text-center tracking-tight">
            Our Story
          </h2>
          <div className="relative h-[500px] md:h-[300px] lg:h-[300px] w-full">
            <div className="h-full cursor-grab active:cursor-grabbing">
              <Slider {...sliderSettings} className="h-full story-slider">
                {storyContent.map((content) => (
                  <div key={content.id} className="focus:outline-none h-full">
                    <p className="text-lg lg:text-xl leading-relaxed px-4">
                      {content.text}
                    </p>
                  </div>
                ))}
              </Slider>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OurStory;
