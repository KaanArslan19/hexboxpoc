"use client";
import Image from "next/image";
import React from "react";
import Slider from "react-slick";

const OurStory = () => {
  const storyContent = [
    {
      id: 1,
      text: "We came together as three founders who met in the heart of crypto communities, where we witnessed both the promise and the pitfalls of the space. We bonded over our shared passion for building and helping others. Our journey has been shaped by personal experiences with fraud, trust loss, and a genuine desire to protect and empower our community. These experiences inspired our vision for Hexbox, a platform where both creators and backers can engage with confidence and transparency.",
    },
    {
      id: 2,
      text: "We have also been there on both sides of the table. As founders, we have felt the pressure of securing early-stage funding, balancing tight deadlines, and building trust with an audience that needed proof before believing. As backers, we have experienced the uncertainty of supporting projects we believed in, only to wonder if our contributions were making a real impact. These challenges taught us a valuable lesson: the only way for a prosperous economy is to build and serve each other. That is the core idea behind Hexbox.",
    },
    {
      id: 3,
      text: "Our mission is simple: empower businesses, protect people. We believe that when trust is embedded in the system, communities and businesses grow together, creating a cycle of prosperity. With Hexbox, we have combined real-time tracking, fraud prevention, and community-driven voting to ensure that every project remains transparent and accountable. Whether you are a creator bringing your vision to life or a backer ready to support an innovative product or service, Hexbox is here to make that journey safer, clearer, and more rewarding. We have started this journey, but the next chapter is yours because when we lift each other up, we all rise.",
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
          <h2 className="text-3xl md:text-5xl capitalize text-center mb-4 font-customFont text-blueColorDull tracking-tight">
            Our Story
          </h2>
          <div className="relative h-[500px] md:h-[300px] lg:h-[300px] w-full">
            <div className="h-full cursor-grab active:cursor-grabbing">
              <Slider {...sliderSettings} className="h-full story-slider">
                {storyContent.map((content) => (
                  <div key={content.id} className="focus:outline-none h-full">
                    <p className="text-lg lg:text-xl leading-relaxed px-4">
                      {content.id === 3 ? (
                        <>
                          Our mission is simple:
                          <strong className="font-customFont_bold">
                            empower businesses, protect people.
                          </strong>
                          We believe that when trust is embedded in the system,
                          communities and businesses grow together, creating a
                          cycle of prosperity. With Hexbox, we have combined
                          real-time tracking, fraud prevention, and
                          community-driven voting to ensure that every project
                          remains transparent and accountable. Whether you are a
                          creator bringing your vision to life or a backer ready
                          to support an innovative product or service, Hexbox is
                          here to make that journey safer, clearer, and more
                          rewarding. We have started this journey, but the next
                          chapter is yours because when we lift each other up,
                          we all rise.
                        </>
                      ) : (
                        content.text
                      )}
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
