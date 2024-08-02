import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { GoDotFill } from "react-icons/go";
import { IoRemoveOutline } from "react-icons/io5";
import Image from "next/image";

export default function Daily() {
  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 text-center">
        <h1 className="text-2xl font-bold text-black">DAILY SYNC</h1>
        <div className="flex justify-center mt-2">
          <Image
            width={150}
            height={150}
            src="/title.svg"
            alt="title"
            priority
          />
        </div>
      </div>
      {/* <div className="flex">
        <div className="flex">
          <IoRemoveOutline />
          <IoRemoveOutline className="relative -left1" />
          <GoDotFill className="relative -left-2" />
        </div>
        <div className="flex relative -left-2">
          <GoDotFill />
          <IoRemoveOutline className="relative -left-2" />
          <IoRemoveOutline className="relative -left-4" />
        </div>
      </div> */}

      <div className="grid grid-cols-2">
        {/* Left */}
        <div className="border-r border-black">
          <h2 className="text-xl font-bold my-3 text-black">Daily Focus</h2>
          <div className="flex items-center justify-between p-2">
            <div className="relative group cursor-pointer bg-white">
              <div className="w-2 h-2 bg-black rounded-full"></div>
              <div className="absolute -left-1.5 -top-1.5 inset-0 w-5 h-5 rounded-full border-[6px] border-transparent group-hover:border-gray-300 transition-all duration-300 ease-in-out"></div>
            </div>
            <input
              type="text"
              className="block pl-3 w-full text-gray-900 bg-transparent appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
              placeholder="High Focus Goal"
            />
          </div>
          <div className="flex items-center justify-between p-2">
            <div className="relative group cursor-pointer bg-white">
              <div className="w-2 h-2 bg-black rounded-full"></div>
              <div className="absolute -left-1.5 -top-1.5 inset-0 w-5 h-5 rounded-full border-[6px] border-transparent group-hover:border-gray-300 transition-all duration-300 ease-in-out"></div>
            </div>
            <input
              type="text"
              className="block pl-3 w-full text-gray-900 bg-transparent appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
              placeholder="High Focus Goal"
            />
          </div>
          <div className="flex items-center justify-between p-2">
            <div className="relative group cursor-pointer bg-white">
              <div className="w-2 h-2 bg-black rounded-full"></div>
              <div className="absolute -left-1.5 -top-1.5 inset-0 w-5 h-5 rounded-full border-[6px] border-transparent group-hover:border-gray-300 transition-all duration-300 ease-in-out"></div>
            </div>
            <input
              type="text"
              className="block pl-3 w-full text-gray-900 bg-transparent appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
              placeholder="High Focus Goal"
            />
          </div>
          <div className="ml-0.5 py-2 flex">
            <FontAwesomeIcon
              icon={faPlus}
              className="hover:bg-gray-300 rounded-full w-3 h-3 p-1 pt-1.5"
            />
          </div>

          <div className="mt-5">
            <h2 className="text-xl font-bold mt-auto mb-4 text-black">
              Siklus Kerja
            </h2>
            <div className="flex items-center mb-4">
              <input
                id="default-checkbox"
                type="checkbox"
                value=""
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label
                htmlFor="default-checkbox"
                className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
              >
                90/15
              </label>
            </div>
            <div className="flex items-center mb-4">
              <input
                id="checked-checkbox"
                type="checkbox"
                value=""
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label
                htmlFor="checked-checkbox"
                className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
              >
                60/10
              </label>
            </div>
            <div className="flex items-center mb-4">
              <input
                id="default-checkbox"
                type="checkbox"
                value=""
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label
                htmlFor="default-checkbox"
                className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
              >
                60/10
              </label>
            </div>
            <div className="flex items-center mb-4">
              <input
                id="checked-checkbox"
                type="checkbox"
                value=""
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label
                htmlFor="checked-checkbox"
                className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
              >
                60/10
              </label>
            </div>
          </div>

          <div className="mt-5">
            <h2 className="text-xl font-bold mt-auto mb-4 text-black">
              Tugas Lain
            </h2>
            <div className="flex items-center mb-4">
              <input
                id="default-checkbox"
                type="checkbox"
                value=""
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div className="flex items-center mb-4">
              <input
                id="checked-checkbox"
                type="checkbox"
                value=""
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div className="flex items-center mb-4">
              <input
                id="default-checkbox"
                type="checkbox"
                value=""
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>

          <div className="mt-5">
            <h2 className="text-xl font-bold mt-auto mb-4 text-black">
              Daily Routine
            </h2>
            <div className="flex items-center mb-4">
              <input
                id="default-checkbox"
                type="checkbox"
                value=""
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label
                htmlFor="default-checkbox"
                className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
              >
                Tubuh
              </label>
            </div>
            <div className="flex items-center mb-4">
              <input
                id="checked-checkbox"
                type="checkbox"
                value=""
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label
                htmlFor="checked-checkbox"
                className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
              >
                Pikiran
              </label>
            </div>
            <div className="flex items-center mb-4">
              <input
                id="default-checkbox"
                type="checkbox"
                value=""
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label
                htmlFor="default-checkbox"
                className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
              >
                Spiritual
              </label>
            </div>
            <div className="flex items-center mb-4">
              <input
                id="checked-checkbox"
                type="checkbox"
                value=""
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label
                htmlFor="checked-checkbox"
                className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
              >
                S.D.C
              </label>
            </div>
          </div>
        </div>

        {/* Right */}
        <div>
          <div className="flex gap-4 justify-end">
            <div className="flex flex-col mt-1">
              <div className="text-xs">Minggu 1</div>
              <div className="text-xs md:text-sm">Kamis, 01 Aug 2024</div>
            </div>
            <div className="flex gap-4">
              <button className="bg-white px-4 py-2 rounded-md border border-gray-200 hover:cursor-pointer hover:bg-gray-100">
                <IoIosArrowBack className="text-2xl" />
              </button>
              <button className="bg-white px-4 py-2 rounded-md border border-gray-200 hover:cursor-pointer hover:bg-gray-100">
                <IoIosArrowForward className="text-2xl" />
              </button>
            </div>
          </div>
          <div className="mt-5">
            <div className="mb-4">
              <h2 className="text-xl text-center font-bold mt-auto text-black">
                One Minute Journal
              </h2>
              <div className="flex justify-center mt-2">
                <Image
                  width={100}
                  height={100}
                  src="/title.svg"
                  alt="title"
                  priority
                />
              </div>
            </div>
            <textarea
              rows={10}
              className="block p-4 mx-6 w-full rounded-md border border-gray-400 text-gray-900 resize-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
            />
          </div>
          <div className="mt-5">
            <div className="mb-4">
              <h2 className="text-xl text-center font-bold mt-auto text-black">
                Brain Dump
              </h2>
              <div className="flex justify-center mt-2">
                <Image
                  width={100}
                  height={100}
                  src="/title.svg"
                  alt="title"
                  priority
                />
              </div>
            </div>
            <textarea
              rows={10}
              className="block p-4 mx-6 w-full rounded-md border border-gray-400 text-gray-900 resize-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
