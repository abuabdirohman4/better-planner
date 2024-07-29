import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function Daily() {
  return (
    <main>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 text-black">Daily Focus</h1>
        <div className={`flex items-center justify-between p-2`}>
          <div className={`relative group cursor-pointer bg-white`}>
            <div className="w-2 h-2 bg-black rounded-full"></div>
            <div
              className={`absolute -left-1.5 -top-1.5 inset-0 w-5 h-5 rounded-full border-[6px] border-transparent group-hover:border-gray-300 transition-all duration-300 ease-in-out`}
            ></div>
          </div>
          <input
            type="text"
            // value={title}
            // onChange={(e) => setTitle(e.target.value)}
            // onKeyDown={handleKeyDown}
            // onFocus={() => setIsFocused(true)}
            // onBlur={() => setIsFocused(false)}
            className="block pl-3 w-full text-gray-900 bg-transparent appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
            placeholder="High Focus Goal"
            // placeholder={`${isFocused ? "Add a new task..." : ""}`}
          />
        </div>
        <div className="ml-0.5 py-2 flex">
          <FontAwesomeIcon
            icon={faPlus}
            className="hover:bg-gray-300 rounded-full w-3 h-3 p-1 pt-1.5"
            // onClick={addTask}
          />
        </div>
      </div>
    </main>
  );
}
