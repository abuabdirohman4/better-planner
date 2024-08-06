"use client";
import InputChecbox from "@/components/Input/InputCheckbox/page";
import InputSelect from "@/components/Input/InputSelect";
import { ReactSelect, Week } from "@/types";
import { SESSIONKEY } from "@/utils/constants";
import { getSession } from "@/utils/session";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { addDays, format, subDays } from "date-fns";
import { id } from "date-fns/locale";
import Image from "next/image";
import { useEffect, useState } from "react";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

export default function Daily() {
  const [isLoading, setIsLoading] = useState(true);
  const [today, setToday] = useState<{ value: Date; label: string }>();
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [weekOptions, setWeekOptions] = useState<ReactSelect[]>([]);
  const [weekSelected, setWeekSelected] = useState<{
    id: number;
    value: number;
    startDate: Date;
    endDate: Date;
  }>();

  const handleChangeWeek = async (weekActive: Week) => {
    // set week
    setWeekSelected({
      id: weekActive.id,
      value: weekActive.week,
      startDate: weekActive.startDate,
      endDate: weekActive.endDate,
    });

    // set day
    const tempToday = new Date();
    const startDate = new Date(weekActive.startDate);
    const endDate = new Date(weekActive.endDate);
    if (tempToday >= startDate && tempToday <= endDate) {
      setToday({
        value: tempToday,
        label: format(tempToday, "cccc, d MMMM yyyy", {
          locale: id,
        }),
      });
    } else {
      setToday({
        value: weekActive.startDate,
        label: format(new Date(weekActive.startDate), "cccc, d MMMM yyyy", {
          locale: id,
        }),
      });
    }
  };

  const handleChangeDay = (direction: "Back" | "Forward") => {
    const startDate = weekSelected?.startDate
      ? new Date(weekSelected.startDate)
      : new Date();
    const endDate = weekSelected?.endDate
      ? new Date(weekSelected.endDate)
      : new Date();
    setToday((prevToday) => {
      let tempToday = prevToday ? new Date(prevToday.value) : new Date();
      if (direction === "Back") {
        tempToday = subDays(tempToday, 1);
        if (startDate && tempToday < startDate) {
          tempToday = endDate;
        }
      } else if (direction === "Forward") {
        tempToday = addDays(tempToday, 1);
        if (endDate && tempToday > endDate) {
          tempToday = startDate;
        }
      }

      return {
        value: tempToday,
        label: format(tempToday, "cccc, d MMMM yyyy", { locale: id }),
      };
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      const weeksActive = getSession(SESSIONKEY.weeksActive);
      if (weeksActive) {
        setWeeks(weeksActive);
        const options = weeksActive.map((week: Week) => ({
          value: week.id,
          label: `Week ${week.week}`,
        }));
        setWeekOptions(
          options.sort(
            (a: ReactSelect, b: ReactSelect) =>
              Number(a.value) - Number(b.value)
          )
        );
      }

      const weekActive = getSession(SESSIONKEY.weekActive);
      if (weekActive) {
        handleChangeWeek(weekActive);
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <div className="absolute mt-3 flex gap-2">
          <div className="w-64">
            <InputSelect
              name=""
              placeholder="Select Week"
              options={weekOptions}
              defaultValue={weekOptions.find(
                (item) => item.value === weekSelected?.id
              )}
              onChange={(selected: any) => {
                const weekActive = weeks.find(
                  (item: Week) => item.id === selected.value
                );
                if (weekActive) {
                  handleChangeWeek(weekActive);
                }
              }}
            />
          </div>
        </div>
        <div className="absolute right-10 mt-2 flex gap-2">
          <div className="flex flex-col mt-1">
            <div className="text-right">{today?.label.split(", ")[0]}</div>
            <div>{today?.label.split(", ")[1]}</div>
          </div>
          <div className="flex gap-4">
            <button
              className="bg-white px-4 py-2 rounded-md border border-gray-200 hover:cursor-pointer hover:bg-gray-100"
              onClick={() => handleChangeDay("Back")}
            >
              <IoIosArrowBack className="text-2xl" />
            </button>
            <button
              className="bg-white px-4 py-2 rounded-md border border-gray-200 hover:cursor-pointer hover:bg-gray-100"
              onClick={() => handleChangeDay("Forward")}
            >
              <IoIosArrowForward className="text-2xl" />
            </button>
          </div>
        </div>
        <div className="text-center">
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
      </div>

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
            <InputChecbox label="90/15" />
            <InputChecbox label="60/10" />
            <InputChecbox label="60/10" />
            <InputChecbox label="60/10" />
          </div>

          <div className="mt-5">
            <h2 className="text-xl font-bold mt-auto mb-4 text-black">
              Tugas Lain
            </h2>
            <InputChecbox label="" />
            <InputChecbox label="" />
            <InputChecbox label="" />
          </div>

          <div className="mt-5">
            <h2 className="text-xl font-bold mt-auto mb-4 text-black">
              Daily Routine
            </h2>
            <InputChecbox label="Tubuh" />
            <InputChecbox label="Pikiran" />
            <InputChecbox label="Spiritual" />
            <InputChecbox label="S.D.C" />
          </div>
        </div>

        {/* Right */}
        <div>
          <div className="mb-5">
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
          <div>
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
