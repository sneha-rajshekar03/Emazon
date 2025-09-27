// components/Nav/AccountMenu.jsx
'use client';

import React, { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';

// Assume assets and router are available (via import or useAppContext)

export function AccountMenu({ assets, router }) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  
  const iconBaseClasses = 'w-8 h-8 rounded-full'; 
  const toggleMenu = () => setIsOpen(!isOpen);

  // Determine the displayed icon
  const userIcon = session?.user?.image || assets.user_icon;
  const iconSize = session ? 'w-8 h-8 rounded-full' : 'w-6 h-6'; // Adjust styling
  const conditionalClasses = session 
    ? 'border-2 border-red-200' // Signed in: use a border
    : ''; 

  return (
    <div className="relative">
      {/* 1. The main icon button */}
      <button 
        onClick={toggleMenu} 
        className="transition-all duration-300 focus:outline-none" // ⬅️ IMPORTANT: Add transition class
      >
        <Image 
          src={userIcon} 
          alt="Account Icon" 
          width={32} 
          height={32}
          className={`
            object-cover                  
            transition-all duration-300
            ${iconBaseClasses}            /* ⬅️ Includes rounded-full (Fix) */
            ${conditionalClasses}         /* ⬅️ Includes border (if signed in) */
            hover:shadow-lg hover:scale-110 
            hover:ring-2 hover:ring-indigo-500
          `} 
        />
      </button>


      {/* 2. The Popover/Dropdown Menu (Conditional Rendering) */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="py-1">
            
            {/* --- Options available to both states (e.g., Cart) --- */}
            <Link 
              href="/cart"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)} // Close menu on click
            >
                View Cart
            </Link>

            {/* --- Conditional Options --- */}
            {session ? (
              <>
                {/* SIGNED IN STATE */}
                <Link 
                  href="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  My Profile
                </Link>
                <button
                  onClick={() => signOut()}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  Sign Out
                </button>
              </>
            ) : (
              // SIGNED OUT STATE
              <button
                onClick={() => signIn()}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-medium"
              >
                    Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}