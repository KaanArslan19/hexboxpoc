import React from "react";
import GridView from "./components/ui/GridView";

export default function Loading() {
  const dummyData = Array(12).fill("");

  return (
    <div>
      <div className="mt-2 h-[80px] bg-gray-300"></div>

      <div className="max-w-screen-xl mx-auto xl:p-0 p-4">
        <div className=" space-y-6 animate-pulse">
          <div className="mt-16 mb-8 h-[200px] bg-gray-300"></div>

          <GridView>
            {dummyData.map((_, index) => {
              return (
                <div key={index} className="w-full aspect-square bg-gray-300" />
              );
            })}
          </GridView>
        </div>
      </div>
    </div>
  );
}
