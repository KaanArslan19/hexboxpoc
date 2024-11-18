"use client";
import { useRouter } from "next/navigation";
import React from "react";
import Image from "next/image";
import { MoveLeft } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="relative w-64 h-64 mx-auto mb-8">
          <Image
            src="/404.png"
            alt="404 Illustration"
            fill
            className="object-contain"
            priority
          />
        </div>

        <h1 className="text-2xl md:text-3xl font-semibold mb-4">
          Oops! Page Not Found
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
          The page you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </p>

        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orangeColor/80 to-redColor/80 
                      rounded-lg transform transition-all duration-300
                     hover:from-orangeColor hover:to-redColor hover:scale-105 hover:shadow-lg"
        >
          <MoveLeft className="w-5 h-5 " color="white" />
          <span className="text-white">Go Back</span>
        </button>
      </div>
    </div>
  );
}
