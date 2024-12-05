import Image from "next/image";
import React from "react";
import Funnel from "./ui/Funnel";
const SYSTEM_DATA = [
  {
    image: "/hexbox_black_logo.svg",
    header: "Feature1",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Tempore, rem fuga? Iure, fuga alias! Sit dicta maxime ipsum voluptates laboriosam dolorum.",
  },
  {
    image: "/hexbox_black_logo.svg",
    header: "Feature2",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Tempore, rem fuga? Iure, fuga alias! Sit dicta maxime ipsum voluptates laboriosam dolorum, saepe harum delectus nihil cupiditate rerum ducimus at officiis?",
  },
  {
    image: "/hexbox_black_logo.svg",
    header: "Feature3",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Tempore, rem fuga? Iure, fuga alias! Sit dicta maxime ipsum voluptates laboriosam dolorum, saepe harum delectus nihil.?",
  },
  {
    image: "/hexbox_black_logo.svg",
    header: "Feature14",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Tempore, rem fuga? Iure, fuga alias! Sit dicta maxime ipsum voluptates laboriosam dolorum, saepe harum delectus nihil cupiditate rerum ducimus at officiis?",
  },
];
export default function SystemFeatures() {
  return (
    <div className="py-8">
      <div className="text-center">
        <h2 className="text-3xl md:text-5xl font-customFont_bold mb-4 text-blueColor">
          Here for Innovators like you
        </h2>
        <p>
          Hexbox is an antifraudulent multisignature wallet tied to a
          crowdfunding platform for business organizations in Australia and
          globally.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 mt-8 mx-auto ">
        {SYSTEM_DATA.map((item, index) => (
          <div className="flex flex-col items-center text-center" key={index}>
            <div className="relative w-48 h-48 rounded-full overflow-hidden mb-6">
              <Image
                src={item.image}
                alt={item.header}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
              />
            </div>
            <h4 className="text-xl font-semibold mb-4 text-black/90">
              {item.header}
            </h4>
            <p className="text-base lg:text-lg">{item.description}</p>
          </div>
        ))}
      </div>
      <Funnel />
    </div>
  );
}
