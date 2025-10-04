import React from "react";
import Image from "next/image";
import { Phone, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="mt-20">
      {/* Top Section */}
      <div
        className="
          flex flex-col md:flex-row items-start justify-evenly
          px-8 md:px-16 lg:px-32 py-10 gap-12
          border-t border-gray-200
          text-gray-600
          bg-white/80 backdrop-blur-md
        "
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
          <p className="text-xs md:text-sm leading-relaxed text-gray-600">
            This is a prototype of a dynamic e-commerce platform built using
            <span className="text-gray-800 font-medium">
              {" "}
              Next.js, React.js, Tailwind CSS,
            </span>{" "}
            and MongoDB. All products and content are for demonstration purposes
            only.
          </p>
        </div>

        {/* Company Links */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <h2 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">
            Company
          </h2>
          <ul className="text-xs md:text-sm space-y-2">
            {["Home", "About us", "Contact us", "Privacy policy"].map(
              (item) => (
                <li key={item}>
                  <a
                    className="hover:text-gray-900 transition-colors duration-200"
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
          <h2 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">
            Get in touch
          </h2>
          <div className="text-gray-800 text-xs md:text-sm space-y-2">
            <div className="flex items-center justify-center md:justify-start space-x-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <p className="tracking-wide">+91 7342 9232</p>
            </div>
            <div className="flex items-center justify-center md:justify-start space-x-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <p className="tracking-wide">contact@emazon</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="py-4 text-center text-xs md:text-sm text-gray-500 border-t border-gray-200 bg-white">
        © 2025 sneharajashekar.com — All Rights Reserved.
      </div>
    </footer>
  );
};

export default Footer;
