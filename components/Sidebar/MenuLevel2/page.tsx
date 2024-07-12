"use client";
import {
  faChevronDown,
  faChevronUp,
  faCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

interface MenuLevelProps {
  children: React.ReactNode;
  menuLevel?: any;
  link: string;
}

export default function MenuLevel2({
  children,
  menuLevel,
  link,
}: MenuLevelProps) {
  const pathname = usePathname();
  const [dropdown, setdropdown] = useState(false);
  return (
    <>
      {menuLevel !== undefined ? (
        <li>
          <button
            type="button"
            className="mb-2 flex w-full items-center rounded-lg p-2 pl-11 text-base font-semibold transition ease-in-out hover:bg-primary"
            onClick={() => {
              setdropdown(!dropdown);
            }}
          >
            <FontAwesomeIcon icon={faCircle} />
            <span className={`ml-3 flex-1 text-left text-sm`}>{children}</span>
            {dropdown ? (
              <FontAwesomeIcon icon={faChevronUp} className="mr-3" />
            ) : (
              <FontAwesomeIcon icon={faChevronDown} className="mr-3" />
            )}
          </button>
          <ul className={`${dropdown ? `block` : `hidden`}`}>
            {menuLevel.map((menu: any, id: number) => (
              <li key={id}>
                <a
                  href={`${link}/${menu.link}`}
                  className={
                    pathname == `${link}/${menu.link}`
                      ? "mb-2 flex w-full items-center rounded-lg bg-primary p-2 pl-[4.5rem] text-base font-semibold"
                      : "mb-2 flex w-full items-center rounded-lg p-2 pl-[4.5rem] text-base font-semibold hover:bg-primary "
                  }
                >
                  <FontAwesomeIcon icon={faCircle} className="" />
                  <span className="ml-[.8rem] flex-1 text-left text-sm">
                    {menu.name}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </li>
      ) : (
        <li>
          <Link
            href={link}
            className={
              pathname === `${link}`
                ? "mb-2 flex w-full items-center rounded-lg bg-primary p-2 pl-11 text-base font-semibold"
                : "mb-2 flex w-full items-center rounded-lg p-2 pl-11 text-base font-semibold hover:bg-primary "
            }
          >
            <div>
              <FontAwesomeIcon icon={faCircle} />
              <span className="ml-[.8rem] flex-1 text-left text-sm">
                {children}
              </span>
            </div>
          </Link>
        </li>
      )}
    </>
  );
}
