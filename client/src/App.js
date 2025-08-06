import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Sliders,
  Search,
  LineChart,
  Package,
  LayoutGrid,
  BarChart,
  HardDrive,
} from "lucide-react";

const App = () => {
  // State to store the fetched room data.
  const [rooms, setRooms] = useState([]);

  // The server URL is pulled from environment variables.
  const SERVER_URL = process.env.REACT_APP_SERVER_URL;

  /**
   * useEffect hook to fetch room data from the server
   * when the component mounts.
   */
  useEffect(() => {
    const url = `${SERVER_URL}/api/room`;
    axios
      .get(url)
      .then((res) => {
        setRooms(res.data);
        console.log("Fetched rooms:", res.data);
      })
      .catch((e) => {
        console.error("Error fetching room data:", e);
      });
  }, [SERVER_URL]);

  // The routes and their descriptions to be displayed.
  const routes = [
    {
      title: "Control Panel",
      path: "/auxiliary",
      description: "Control real-time graphs and parameters.",
      icon: <Sliders />,
    },
    {
      title: "Search Page",
      path: "/search",
      description: "Search for specific data points.",
      icon: <Search />,
    },
    {
      title: "Single Graphic",
      path: "/graphic/34?room=%D0%9A%D0%BE%D0%BC%D0%BD%D0%B0%D1%82%D0%B0%201&shelving=%D0%A1%D1%82%D0%B5%D0%BB%D0%BB%D0%B0%D0%B6%202&shelf=1&parameter=%D0%9F%D0%BE%D0%BB%D0%B8%D0%B2&activity=%D0%90%D0%BA%D1%82%D0%B8%D0%B2%D0%B5%D0%BD",
      description: "View a single graphic (example ID: 1).",
      example: "/graphic/:id",
      icon: <LineChart />,
    },
    {
      title: "Shelving",
      path: "/shelving/1",
      description: "Manage shelving units.",
      example: "/shelving/:id",
      icon: <Package />,
    },
    {
      title: "Shelf",
      path: "/shelf/1",
      description: "Manage individual shelves.",
      example: "/shelf/:id",
      icon: <LayoutGrid />,
    },
    {
      title: "Single Graph",
      path: "/graph/1",
      description: "View a single graph (example ID: 1).",
      example: "/graph/:id",
      icon: <BarChart />,
    },
    {
      title: "Several Graphs",
      path: "/big_graph?graphs=%5B1%2C5%2C6%2C7%5D",
      description: "View multiple graphs on one chart.",
      example: "/big_graph?graphs=%5Bid1,id2,id3%5D",
      icon: <BarChart />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 p-8 font-sans antialiased text-slate-200">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Main Header Section */}
        <header className="text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-indigo-400 tracking-tight">
            Dashboard
          </h1>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
            Welcome to the application dashboard. Use the links below to
            navigate through the different control panels and data
            visualizations.
          </p>
        </header>

        {/* Grid of Route Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routes.map((route, index) => (
            <a
              key={index}
              href={route.path}
              className="flex flex-col items-start bg-slate-800 p-6 rounded-xl shadow-lg hover:bg-slate-700 transition-colors transform hover:scale-105"
            >
              <div className="text-indigo-400 mb-4">{route.icon}</div>
              <h3 className="font-bold text-xl mb-1">{route.title}</h3>
              <p className="text-slate-400 text-sm mb-2">{route.description}</p>
              {route.example && (
                <p className="text-slate-500 text-xs font-mono">
                  Example:{" "}
                  <span className="text-indigo-400">{route.example}</span>
                </p>
              )}
            </a>
          ))}
        </div>

        {/* Section for Rooms Data */}
        <section className="bg-slate-800 p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-indigo-400 mb-4 flex items-center">
            <HardDrive className="mr-2" />
            Available Rooms
          </h2>
          {rooms.length > 0 ? (
            <ul className="space-y-2 text-slate-300">
              {rooms.map((room) => (
                <li
                  key={room.id}
                  className="bg-slate-700 p-3 rounded-lg hover:bg-slate-600 transition-colors"
                >
                  <span className="font-semibold text-white">{room.name}</span>{" "}
                  - ID: {room.id}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-400">No room data available.</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default App;
