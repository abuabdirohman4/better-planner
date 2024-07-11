"use client";
import { faBars, faCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MenuLevel1 from "./MenuLevel1/page";
import listMenu from "./listMenu.json";
import { usePathname } from "next/navigation";
import { Navbar } from "../Navbar/page";
import { useState } from "react";
import Link from "next/link";

interface Menu {
  name: string;
  link: string;
  menuLevel1?: any;
}

const Sidebar = ({ children }: { children: React.ReactNode }) => {
  // const Sidebar = (children: ReactNode) => {
  const menus: Menu[] = listMenu.data;
  const pathname = usePathname();
  const [showSidebar, setShowSidebar] = useState(true);
  return (
    <div className="flex">
      <aside
        className={`z-30 bg-teal-400 duration-1000 ease-in-out ${
          showSidebar ? "w-80" : "w-[72px]"
        }`}
      >
        <div
          className={`min-h-screen bg-blue-1 pb-10 pt-3 text-white duration-1000 ease-in-out ${
            showSidebar ? "px-5" : "px-4"
          }`}
        >
          <div className="flex justify-center">
            <FontAwesomeIcon
              icon={faBars}
              className={`${
                showSidebar && "ml-[80%]"
              } cursor-pointer bg-blue-2 py-3 px-4 text-2xl text-white duration-1000 ease-in-out hover:brightness-125`}
              onClick={() => {
                setShowSidebar(!showSidebar);
              }}
            />
          </div>
          <ul className={`mt-14`}>
            <li>
              <Link
                href="/"
                className={
                  pathname == "/"
                    ? `mb-4 flex items-center truncate rounded-lg bg-blue-3 p-2 text-base font-semibold`
                    : `mb-4 flex items-center truncate rounded-lg p-2 text-base font-semibold hover:bg-blue-3`
                }
              >
                <FontAwesomeIcon icon={faCircle} className="ml-1" />
                <span className="ml-3 text-sm">Dashboard</span>
              </Link>
            </li>
            {menus.map((menu, id) => {
              if (menu.menuLevel1) {
                return (
                  <MenuLevel1
                    menuLevel={menu.menuLevel1}
                    link={menu.link}
                    key={id}
                    showSidebar={showSidebar}
                  >
                    {menu.name}
                  </MenuLevel1>
                );
              } else {
                return (
                  <MenuLevel1
                    key={id}
                    link={menu.link}
                    showSidebar={showSidebar}
                  >
                    {menu.name}
                  </MenuLevel1>
                );
              }
            })}
          </ul>
        </div>
      </aside>
      <main className="w-full bg-[#F4F7F9] duration-1000 ease-in-out">
        <Navbar />
        {children}
      </main>
    </div>
  );
};

export default Sidebar;
