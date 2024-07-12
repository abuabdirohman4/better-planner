import Image from "next/image";
import React from "react";

export const Navbar = () => {
  return (
    <nav className="rounded border-gray-200 bg-primary px-2 py-2.5">
      <div className="mx-3 flex flex-wrap items-center justify-between">
        <div className="flex items-center">
          <ul className="flex flex-row my-4 space-x-3 rounded-lg">
            <li className="rounded border border-white px-2 py-1 hover:bg-[#5ab6e0]">
              <a
                href="#"
                className="hover:text- block py-2 pl-3 pr-4 text-white "
              >
                Sales
              </a>
            </li>
            <li className="rounded border border-white px-2 py-1 hover:bg-[#5ab6e0]">
              <a href="#" className="block py-2 pl-3 pr-4 text-white">
                Purchase
              </a>
            </li>
            <li className="rounded border border-white px-2 py-1 hover:bg-[#5ab6e0]">
              <a href="#" className="block py-2 pl-3 pr-4 text-white">
                Expense
              </a>
            </li>
          </ul>
        </div>
        <div className="flex w-auto items-center gap-3">
          <p className="text-white">Abu Abdirohman</p>
          <div className="dropdown-end dropdown flex items-center">
            <button
              tabIndex={0}
              type="button"
              className="mr-3 flex rounded-full bg-gray-800 text-sm focus:ring-4 focus:ring-gray-300 md:mr-0"
            >
              <Image
                className="h-8 w-8 rounded-full"
                width={32}
                height={32}
                src="https://ui-avatars.com/api/?background=30404f&color=FFFFFF&rounded=true&name=Abu+Abdirohman"
                alt="user photo"
                priority
              />
            </button>
            {/* <!-- Dropdown menu --> */}
            {/* <div
              tabIndex={0}
              className="dropdown-content z-50 w-32 my-3 list-none divide-y divide-gray-100 rounded bg-white text-base shadow"
            > */}
              {/* <div className="px-4 py-3">
                <span className="block truncate text-sm text-gray-900">
                  Anthony Lauly
                </span>
              </div> */}
              {/* <ul className="py-1">
                <li>
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Settings
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign out
                  </a>
                </li>
              </ul> */}
            {/* </div> */}
          </div>
        </div>
      </div>
    </nav>
  );
};
