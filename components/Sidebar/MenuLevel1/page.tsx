"use client";
import {
  faChevronDown,
  faChevronUp,
  faCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";
import MenuLevel2 from "../MenuLevel2/page";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface MenuLevelProps {
  children: React.ReactNode;
  menuLevel?: any;
  link: string;
  showSidebar: boolean;
}

export default function MenuLevel1({
  children,
  menuLevel,
  link,
  showSidebar,
}: MenuLevelProps) {
  const pathname = usePathname();
  const [dropdown, setdropdown] = useState(false);
  const [collapse, setCollapse] = useState(false);
  useEffect(() => {
    if (!showSidebar) {
      setdropdown(false);
    } else {
      if (collapse) {
        setdropdown(true);
      }
    }
  }, [showSidebar, collapse]);

  return (
    <>
      {menuLevel !== undefined ? (
        <li>
          <button
            type="button"
            className={`mb-4 flex w-full items-center truncate rounded-lg p-2 text-base font-semibold hover:bg-primary`}
            onClick={() => {
              setdropdown(!dropdown);
              setCollapse(!collapse);
            }}
            disabled={!showSidebar}
          >
            <FontAwesomeIcon icon={faCircle} className="ml-1" />
            <span className="ml-3 flex-1 whitespace-nowrap text-left text-sm">
              {children}
            </span>
            <FontAwesomeIcon
              icon={dropdown ? faChevronUp : faChevronDown}
              className={`${!showSidebar && "hidden"} mr-3`}
            />
          </button>
          <ul className={`${dropdown ? `block` : `hidden`}`}>
            {menuLevel.map((menu: any, id: number) => (
              <MenuLevel2
                key={id}
                menuLevel={menu.menuLevel2}
                link={`/${link}/${menu.link}`}
              >
                {menu.name}
              </MenuLevel2>
            ))}
          </ul>
        </li>
      ) : (
        <li>
          <Link
            href={`/${link}`}
            className={
              pathname == `/${link}`
                ? "mb-4 flex w-full items-center truncate rounded-lg bg-primary p-2 text-base font-semibold"
                : "mb-4 flex w-full items-center truncate rounded-lg p-2 text-base font-semibold hover:bg-primary"
            }
          >
            <FontAwesomeIcon icon={faCircle} className="ml-1" />
            <span className="ml-3 flex-1 whitespace-nowrap text-left text-sm">
              {children}
            </span>
          </Link>
        </li>
      )}
    </>
  );
}
