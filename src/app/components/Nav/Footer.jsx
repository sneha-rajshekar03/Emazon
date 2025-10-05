"use client";
import React from "react";
import Image from "next/image";
import { Phone, Mail } from "lucide-react";
import { useColor } from "@app/context/ColorContext";

const Footer = () => {
  const { isDarkMode } = useColor();

  return (
    <footer className="mt-20">
      {/* Top Section */}
      <div
        className={`
          flex flex-col md:flex-row items-start justify-evenly
          px-8 md:px-16 lg:px-32 py-10 gap-12
          backdrop-blur-md
          ${
            isDarkMode ? "border-t border-gray-800" : "border-t border-gray-200"
          }
        `}
        style={{
          background: isDarkMode
            ? "rgba(30, 30, 30, 0.8)"
            : "rgba(255, 255, 255, 0.8)",
        }}
      >
        {/* Logo + Description */}
        <div className="flex flex-row items-center md:items-start gap-5 max-w-sm text-center md:text-left">
          <Image
            className="w-14 md:w-16 opacity-90 hover:opacity-100 transition"
            src="/logo.svg"
            alt="Emazon Logo"
            width={70}
            height={70}
          />
          <p
            className={`text-xs md:text-sm leading-relaxed ${
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
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <h2
            className={`font-semibold mb-4 text-sm uppercase tracking-wide ${
              isDarkMode ? "text-gray-100" : "text-gray-900"
            }`}
          >
            Company
          </h2>
          <ul className="text-xs md:text-sm space-y-2">
            {["Home", "About us", "Contact us", "Privacy policy"].map(
              (item) => (
                <li key={item}>
                  <a
                    className={`transition-colors duration-200 ${
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
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <h2
            className={`font-semibold mb-4 text-sm uppercase tracking-wide ${
              isDarkMode ? "text-gray-100" : "text-gray-900"
            }`}
          >
            Get in touch
          </h2>
          <div
            className={`text-xs md:text-sm space-y-2 ${
              isDarkMode ? "text-gray-300" : "text-gray-800"
            }`}
          >
            <div className="flex items-center justify-center md:justify-start space-x-2">
              <Phone
                className={`w-4 h-4 ${
                  isDarkMode ? "text-gray-500" : "text-gray-500"
                }`}
              />
              <p className="tracking-wide">+91 7342 9232</p>
            </div>
            <div className="flex items-center justify-center md:justify-start space-x-2">
              <Mail
                className={`w-4 h-4 ${
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
        className={`py-4 text-center text-xs md:text-sm ${
          isDarkMode
            ? "text-gray-500 border-t border-gray-800 bg-gray-950"
            : "text-gray-500 border-t border-gray-200 bg-white"
        }`}
      >
        © 2025 sneharajashekar.com — All Rights Reserved.
      </div>
    </footer>
  );
};

export default Footer;
