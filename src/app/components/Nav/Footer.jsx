"use client";
import React from "react";
import Image from "next/image";
import { Phone, Mail } from "lucide-react";
import { useColor } from "@/app/context/ColorContext";

const Footer = () => {
  const { isDarkMode } = useColor();

  return (
    <footer className="mt-20">
      {/* Top Section */}
      <div
        className={`
          flex flex-col sm:flex-row sm:flex-wrap lg:flex-nowrap
          items-start justify-center lg:justify-evenly
          px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32
          py-8 sm:py-10 md:py-12
          gap-8 sm:gap-10 md:gap-12 lg:gap-16
          backdrop-blur-md
         
        `}
        style={{
          background: isDarkMode
            ? "rgba(30, 30, 30, 0.8)"
            : "rgba(255, 255, 255, 0.8)",
        }}
      >
        {/* Logo + Description */}
        <div className="flex flex-col items-center sm:items-start gap-4 w-full sm:w-auto sm:max-w-xs lg:max-w-sm text-center sm:text-left">
          <Image
            className="w-12 sm:w-14 md:w-16 opacity-90 hover:opacity-100 transition"
            src="/logo.svg"
            alt="Emazon Logo"
            width={70}
            height={70}
          />
          <p
            className={`text-xs sm:text-sm md:text-base leading-relaxed ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            This is a prototype of a dynamic e-commerce platform built using
            <span
              className={`font-medium ${
                isDarkMode ? "text-gray-200" : "text-gray-800"
              }`}
            >
              {" "}
              Next.js, React.js, Tailwind CSS,
            </span>{" "}
            and MongoDB. All products and content are for demonstration purposes
            only.
          </p>
        </div>

        {/* Company Links */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left w-full sm:w-auto">
          <h2
            className={`font-semibold mb-3 sm:mb-4 text-sm sm:text-base uppercase tracking-wide ${
              isDarkMode ? "text-gray-100" : "text-gray-900"
            }`}
          >
            Company
          </h2>
          <ul className="text-xs sm:text-sm md:text-base space-y-2 sm:space-y-2.5">
            {["Home", "About us", "Contact us", "Privacy policy"].map(
              (item) => (
                <li key={item}>
                  <a
                    className={`transition-colors duration-200 hover:underline ${
                      isDarkMode
                        ? "text-gray-400 hover:text-gray-100"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                    href="#"
                  >
                    {item}
                  </a>
                </li>
              )
            )}
          </ul>
        </div>

        {/* Contact Info */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left w-full sm:w-auto">
          <h2
            className={`font-semibold mb-3 sm:mb-4 text-sm sm:text-base uppercase tracking-wide ${
              isDarkMode ? "text-gray-100" : "text-gray-900"
            }`}
          >
            Get in touch
          </h2>
          <div
            className={`text-xs sm:text-sm md:text-base space-y-2.5 sm:space-y-3 ${
              isDarkMode ? "text-gray-300" : "text-gray-800"
            }`}
          >
            <div className="flex items-center justify-center sm:justify-start space-x-2 sm:space-x-3">
              <Phone
                className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${
                  isDarkMode ? "text-gray-500" : "text-gray-500"
                }`}
              />
              <p className="tracking-wide">+91 7342 9232</p>
            </div>
            <div className="flex items-center justify-center sm:justify-start space-x-2 sm:space-x-3">
              <Mail
                className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${
                  isDarkMode ? "text-gray-500" : "text-gray-500"
                }`}
              />
              <p className="tracking-wide">contact@emazon</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div
        className={`py-3 mt-1 sm:py-4 md:py-5 pt-1 text-center text-xs sm:text-sm md:text-base border-t ${
          isDarkMode
            ? "text-gray-100 border-gray-800"
            : "text-gray-500 border-gray-200"
        }`}
        style={{
          background: isDarkMode
            ? "rgba(30, 30, 30, 0.8)"
            : "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      >
        © 2025 sneharajashekar.com — All Rights Reserved.
      </div>
    </footer>
  );
};

export default Footer;
