import React, { useEffect, useState } from "react";
import AppHeader from "../components/AppHeader";
import AppMenu from "../components/AppMenu";
import Plot from "react-plotly.js";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/dark.css";
// Importing the Tilt component from the react-tilt library
// To use this, you need to install the library with `npm install react-tilt`.
import Tilt from 'react-parallax-tilt';

const GraphicPage = () => {
  const location = useLocation();
  let arrayOfStrings = location.pathname.split("/");

  const [data, setData] = useState({
    x: [],
    y: [],
  });

  const [layout, setLayout] = useState({
    title: "График №" + arrayOfStrings[2],
    xaxis: {},
    yaxis: {},
    width: 1050,
    height: 640,
    uirevision: "true",
    dragmode: "pan",
  });

  const [config, setConfig] = useState({
    scrollZoom: true,
    displayModeBar: true,
    displaylogo: false,
  });

  const SERVER_URL = process.env.REACT_APP_SERVER_URL;

  const realtimeGraph = async (id) => {
    const socket = io(`${SERVER_URL}`);
    socket.on("message", (msg) => {
      if (msg.type === "graph" && msg.configured_parameters_id == id) {
        console.log(
          `Graph, value: ${msg.value}, serial_num: ${msg.fixateSerialNum}, id_configured_parameter: ${msg.configured_parameters_id}, fixate_time: ${msg.fixateTime}`
        );
        const fixating_value_date = new Date(msg.fixateTime);
        fixating_value_date.setHours(fixating_value_date.getHours() + 5);
        setData((prev) => {
          return {
            x: [...prev.x, fixating_value_date],
            y: [...prev.y, msg.value],
          };
        });
      }
    });

    const response = await fetch(`${SERVER_URL}/api/range/realtimeGraph`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: id,
        type: "activeRealtimeGraph",
      }),
    });
    if (response.ok === true) {
      const ans = await response.json();
      if (ans.msg === "success") {
        console.log(`${ans.type} ${ans.id}`);
      } else {
        console.log(`${ans.msg}`);
      }
    }

    let x = [],
      y = [],
      date;
    const response2 = await fetch(`${SERVER_URL}/api/range/graph`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: id,
      }),
    });
    if (response2.ok === true) {
      const ans = await response2.json();
      if (ans.msg === "success") {
        console.log(ans.paramValues);

        for (let i = 0; i < ans.paramValues.length; i++) {
          date = new Date(ans.paramValues[i].fixate_time);
          x[i] = date;
          y[i] = ans.paramValues[i].value;
        }

        setData((prev) => {
          return {
            x: x,
            y: y,
          };
        });
      } else console.log(ans.msg);
    }

    axios
      .post(
        `${SERVER_URL}/api/parameter-setting-rating/ranking`,
        {
          id: id,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then((res) => {
        if (res.data.msg === "success") {
          console.log(
            `Количество посещений графика ${res.data.parameter_id}: ${res.data.visit_num}`
          );
        }
      })
      .catch((e) => {
        console.log(e);
      });
  };

  useEffect(() => {
    realtimeGraph(arrayOfStrings[2]);
  }, []);

  const urlParams = new URLSearchParams(window.location.search);
  const currentRoom = urlParams.get("room");
  const currentShelving = urlParams.get("shelving");
  const currentShelf = urlParams.get("shelf");
  const currentParameter = urlParams.get("parameter");
  const currentActivity = urlParams.get("activity");

  const [currentPlant, setCurrentPlant] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    axios
      .get(`${SERVER_URL}/api/plant/one-by-shelf`, {
        params: {
          shelfNum: currentShelf,
          shelvingName: currentShelving,
          roomName: currentRoom,
        },
      })
      .then((res) => {
        setCurrentPlant(res.data.plant.name);
      })
      .catch((e) => {
        console.log(e);
      });
  }, []);

  // Check if the data is empty and show a loading state
  if (data.x.length === 0) {
    return (
      <div className="flex justify-center items-center w-full h-screen bg-slate-900 text-indigo-400 text-xl">
        Loading graph data...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 font-sans antialiased text-slate-200">
      {/* Header with a fixed position and high z-index to stay on top */}
      <div className="fixed top-0 left-0 w-full z-50">
        <AppHeader />
      </div>
      
      {/* Main content container with padding-top to prevent content from being hidden behind the header */}
      <div className="flex pt-16" style={{ height: "100vh" }}>
        <AppMenu />
        {/* Main content area with scrollbar */}
        <div className="flex-1 p-8 flex space-x-6 overflow-y-auto">
          {/* Left Sidebar for Info and Calendar */}
          <div className="w-1/4 space-y-6">
            {/* Additional Information Card - using a pure CSS hover effect */}
            <div 
              className="bg-slate-800 rounded-xl shadow-lg p-6 flex flex-col items-center"
            >
              <h3 className="text-xl font-bold text-indigo-400 mb-4">
                Additional Information
              </h3>
              <div className="space-y-3 w-full">
                {/* Each of these divs now has its own subtle 3D hover effect using react-tilt */}
                <Tilt
                  tiltMaxAngleX={10} // Increased from 5
                  tiltMaxAngleY={10} // Increased from 5
                  scale={1.05}     // Increased from 1.02
                  glareEnable={false} // The glare effect has been disabled
                >
                  <div className="bg-slate-700 p-3 rounded-lg text-sm text-slate-300 transition-colors cursor-pointer hover:bg-slate-600">
                    <span className="font-semibold text-white">Plant Species:</span>{" "}
                    {currentPlant || "N/A"}
                  </div>
                </Tilt>
                <Tilt
                  tiltMaxAngleX={10} // Increased from 5
                  tiltMaxAngleY={10} // Increased from 5
                  scale={1.05}     // Increased from 1.02
                  glareEnable={false} // The glare effect has been disabled
                >
                  <div className="bg-slate-700 p-3 rounded-lg text-sm text-slate-300 transition-colors cursor-pointer hover:bg-slate-600">
                    <span className="font-semibold text-white">Location:</span>{" "}
                    {currentRoom} / {currentShelving} /{" "}
                    {currentShelf ? `Shelf #${currentShelf}` : "N/A"}
                  </div>
                </Tilt>
                <Tilt
                  tiltMaxAngleX={10} // Increased from 5
                  tiltMaxAngleY={10} // Increased from 5
                  scale={1.05}     // Increased from 1.02
                  glareEnable={false} // The glare effect has been disabled
                >
                  <div className="bg-slate-700 p-3 rounded-lg text-sm text-slate-300 transition-colors cursor-pointer hover:bg-slate-600">
                    <span className="font-semibold text-white">Parameter:</span>{" "}
                    {currentParameter || "N/A"}
                  </div>
                </Tilt>
                <Tilt
                  tiltMaxAngleX={10} // Increased from 5
                  tiltMaxAngleY={10} // Increased from 5
                  scale={1.05}     // Increased from 1.02
                  glareEnable={false} // The glare effect has been disabled
                >
                  <div className="bg-slate-700 p-3 rounded-lg text-sm text-slate-300 transition-colors cursor-pointer hover:bg-slate-600">
                    <span className="font-semibold text-white">Status:</span>{" "}
                    {currentActivity || "N/A"}
                  </div>
                </Tilt>
              </div>
            </div>

            {/* Calendar Card */}
            <div className="bg-slate-800 rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-indigo-400 mb-4 text-center">
                Select Date
              </h3>
              <Flatpickr
                className="bg-slate-700 text-slate-200 p-3 rounded-lg w-full text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={selectedDate}
                options={{
                  weekNumbers: true,
                  altInput: true,
                  altFormat: "F j, Y",
                }}
                onChange={(selectedDate) => {
                  setSelectedDate(selectedDate);
                  axios
                    .get(`${SERVER_URL}/api/parameter-value/dates-range`, {
                      params: { selectedDate: selectedDate },
                    })
                    .then((res) => {
                      console.log(res.data);
                    })
                    .catch((e) => {
                      console.error(e.message);
                    });
                }}
              />
            </div>
          </div>

          {/* Main Content Area for the Graph */}
          <div className="flex-1 bg-slate-800 rounded-xl shadow-lg p-6 flex flex-col justify-center items-center">
            <Plot
              data={[
                {
                  ...data,
                  type: "scatter",
                  mode: "lines",
                  name: `Graph ${arrayOfStrings[2]}`,
                },
              ]}
              layout={{
                ...layout,
                autosize: true,
                title: `Graph #${arrayOfStrings[2]}`, // Updated title
                paper_bgcolor: "rgb(30, 41, 59)", // slate-800
                plot_bgcolor: "rgb(30, 41, 59)", // slate-800
                font: { color: "rgb(148, 163, 184)" }, // slate-400
                xaxis: {
                  ...layout.xaxis,
                  gridcolor: "rgb(51, 65, 85)", // slate-700
                  zerolinecolor: "rgb(51, 65, 85)",
                },
                yaxis: {
                  ...layout.yaxis,
                  gridcolor: "rgb(51, 65, 85)", // slate-700
                  zerolinecolor: "rgb(51, 65, 85)",
                },
                width: null,
                height: null,
              }}
              config={{
                ...config,
                responsive: true,
              }}
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphicPage;
