import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import AppMenu from "../components/AppMenu";
import { io } from "socket.io-client";
import axios from "axios";
import Plot from "react-plotly.js";
import Tilt from 'react-parallax-tilt';
import { Lightbulb, Droplets, ThermometerSun, Sprout } from 'lucide-react';

const ShelfPage = () => {
  const [humidityValue, setHumidityValue] = useState("Не измеряется");
  const [temperatureValue, setTemperatureValue] = useState("Не измеряется");
  const [wateringValue, setWateringValue] = useState("Не измеряется");
  const [lightValue, setLightValue] = useState("Не измеряется");
  const [plants, setPlants] = useState("");

  const [data, setData] = useState({});
  const [layout, setLayout] = useState({});
  const [config, setConfig] = useState({
    scrollZoom: true,
    displayModeBar: true,
    displaylogo: false,
  });

  const [socket, setSocket] = useState(null);
  const [paramsId, setparamsId] = useState({});
  const [num, setNum] = useState(0); // Flag to ensure initial data fetch completes

  // useRef to hold the latest paramsId state
  const paramsIdRef = useRef(paramsId);

  // Update paramsIdRef whenever paramsId state changes
  useEffect(() => {
    paramsIdRef.current = paramsId;
  }, [paramsId]);


  const SERVER_URL = process.env.REACT_APP_SERVER_URL;

  /**
   * Fetches historical data for a specific parameter and tracks a visit.
   * @param {string} id - The configured parameter ID.
   * @param {string} title - The parameter title for tracking.
   */
  const realtimeGraph = async (id, title) => {
    let x = [],
      y = [],
      date;

    try {
      const response2 = await fetch(`${SERVER_URL}/api/range/graph`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id }),
      });

      if (response2.ok) {
        const ans = await response2.json();
        if (ans.msg === "success") {
          for (let i = 0; i < ans.paramValues.length; i++) {
            date = new Date(ans.paramValues[i].fixate_time);
            x[i] = date;
            y[i] = ans.paramValues[i].value;
          }
        } else {
          console.log(ans.msg);
        }
      }
    } catch (e) {
      console.error("Failed to fetch graph data:", e);
    }
    try {
      await axios.post(`${SERVER_URL}/api/parameter-setting-rating/ranking`, {
        id: id,
      });
    } catch (e) {
      console.error(`Failed to track visit for graph ${id}:`, e);
    }
    return { x: x, y: y };
  };

  const location = useLocation();
  let arrayOfStrings = location.pathname.split("/");

  /**
   * Fetches shelf data, sets parameter IDs and initial graph data.
   * @param {string} id - The shelf ID.
   */
  const fetchData = async (id) => {
    try {
      const response = await fetch(`${SERVER_URL}/api/shelf/shelf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: id,
          type: "activeRealtimeShelf",
        }),
      });

      if (response.ok) {
        const ans = await response.json();
        if (ans.msg === "success") {
          if (ans.type === "activeRealtimeShelf") {
            setPlants(ans.shelf_params[0]?.plants || "N/A");

            let newParamsId = {};
            let newDataObj = {};
            let newLayoutObj = {};

            // Initialize all values to "Не измеряется"
            setHumidityValue("Не измеряется");
            setTemperatureValue("Не измеряется");
            setWateringValue("Не измеряется");
            setLightValue("Не измеряется");

            for (let i = 0; i < ans.shelf_params.length; i++) {
              const param = ans.shelf_params[i];
              const paramId = param.configured_parameters_id;
              let paramType = "";
              let historicalData;

              if (param.parameter === "Влажность") {
                // Ensure value is parsed to float for initial display
                setHumidityValue(parseFloat(param.lastValue));
                newParamsId.humidity = paramId;
                paramType = "humidity";
                historicalData = await realtimeGraph(paramId, "Влажность");
                newDataObj[paramType] = {
                  x: historicalData.x,
                  y: historicalData.y,
                  type: "scatter",
                  mode: "lines",
                  line: { color: "#60a5fa" } // blue-400
                };
              } else if (param.parameter === "Температура") {
                // Ensure value is parsed to float for initial display
                setTemperatureValue(parseFloat(param.lastValue));
                newParamsId.temperature = paramId;
                paramType = "temperature";
                historicalData = await realtimeGraph(paramId, "Температура");
                newDataObj[paramType] = {
                  x: historicalData.x,
                  y: historicalData.y,
                  type: "scatter",
                  mode: "lines",
                  line: { color: "#fca5a5" } // red-400
                };
              } else if (param.parameter === "Полив") {
                // Ensure value is parsed to float for initial display
                setWateringValue(parseFloat(param.lastValue));
                newParamsId.watering = paramId;
                paramType = "watering";
                historicalData = await realtimeGraph(paramId, "Полив");
                newDataObj[paramType] = {
                  x: historicalData.x,
                  y: historicalData.y,
                  type: "scatter",
                  mode: "lines",
                  line: { color: "#a5b4fc" } // indigo-400
                };
              } else if (param.parameter === "Освещенность") {
                // Ensure value is parsed to float for initial display
                setLightValue(parseFloat(param.lastValue));
                newParamsId.light = paramId;
                paramType = "light";
                historicalData = await realtimeGraph(paramId, "Освещенность");
                newDataObj[paramType] = {
                  x: historicalData.x,
                  y: historicalData.y,
                  type: "scatter",
                  mode: "lines",
                  line: { color: "#fcd34d" } // yellow-400
                };
              }

              newLayoutObj[paramType] = {
                title: param.parameter,
                xaxis: { type: "date" },
                yaxis: {},
                autosize: true,
                paper_bgcolor: "#1f2937", // slate-800
                plot_bgcolor: "#1f2937", // slate-800
                font: { color: "#94a3b8" }, // slate-400
                xaxis: {
                  gridcolor: "#475569", // slate-600
                  zerolinecolor: "#475569",
                },
                yaxis: {
                  gridcolor: "#475569", // slate-600
                  zerolinecolor: "#475569",
                },
                margin: { l: 40, r: 20, b: 40, t: 40 },
                width: null,
                height: null,
                uirevision: "true",
              };
            }

            setparamsId(newParamsId);
            setLayout(newLayoutObj);
            setData(newDataObj);
            setNum(1); // Indicate initial data load is complete
          }
        } else {
          console.log(ans.msg);
        }
      }
    } catch (e) {
      console.error("Не удалось получить данные", e);
    }
  };

  useEffect(() => {
    // Initialize socket connection only once
    const newSocket = io(`${SERVER_URL}`);
    setSocket(newSocket);

    // Fetch initial data
    fetchData(arrayOfStrings[2]);

    // Cleanup function for socket disconnection
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []); // Empty dependency array means this runs only on mount and unmount

  useEffect(() => {
    // Listen for socket messages only after socket is established and initial data is loaded
    // Add paramsId to the dependency array to ensure the listener re-attaches with the latest paramsId
    if (socket && num === 1) {
      const handleSocketMessage = (msg) => {
        console.log("Received raw socket message in ShelfPage:", msg);

        // The type from the server for shelf-related data is "shelf"
        if (msg.type === "shelf") {
          const id = msg.configured_parameters_id;
          // Parse the incoming value to a float
          const value = parseFloat(msg.value);
          const fixating_value_date = new Date(msg.fixateTime);
          fixating_value_date.setHours(fixating_value_date.getHours() + 5);

          // Use the paramsId directly from the dependency array, which is guaranteed to be fresh
          const currentParamsId = paramsId; // Use paramsId directly

          // Update individual live parameter values
          if (id === currentParamsId.humidity) {
            setHumidityValue(value);
          }
          if (id === currentParamsId.temperature) {
            setTemperatureValue(value);
          }
          if (id === currentParamsId.watering) {
            setWateringValue(value);
          }
          if (id === currentParamsId.light) {
            setLightValue(value);
          }

          // Update graph data
          setData((prevData) => {
            const newData = { ...prevData };
            if (id === currentParamsId.humidity && newData.humidity) {
              newData.humidity = {
                ...newData.humidity,
                x: [...(newData.humidity.x || []), fixating_value_date],
                y: [...(newData.humidity.y || []), value],
              };
            } else if (id === currentParamsId.temperature && newData.temperature) {
              newData.temperature = {
                ...newData.temperature,
                x: [...(newData.temperature.x || []), fixating_value_date],
                y: [...(newData.temperature.y || []), value],
              };
            } else if (id === currentParamsId.watering && newData.watering) {
              newData.watering = {
                ...newData.watering,
                x: [...(newData.watering.x || []), fixating_value_date],
                y: [...(newData.watering.y || []), value],
              };
            } else if (id === currentParamsId.light && newData.light) {
              newData.light = {
                ...newData.light,
                x: [...(newData.light.x || []), fixating_value_date],
                y: [...(newData.light.y || []), value],
              };
            }
            return newData;
          });
        }
      };

      socket.on("message", handleSocketMessage);

      // Cleanup function for socket message listener
      return () => {
        socket.off("message", handleSocketMessage); // Pass the specific handler to off
      };
    }
  }, [socket, num, paramsId]); // paramsId is now in dependencies!

  // Show loading state until initial data is fetched
  if (num === 0) {
    return (
      <div className="flex justify-center items-center w-full h-screen bg-slate-900 text-indigo-400 text-xl">
        Loading shelf data...
      </div>
    );
  }

  // A function to render graphs in alternating rows
  const renderGraphs = () => {
    const graphs = Object.entries(data).map(([key, value]) => ({
      key: key,
      data: [value],
      layout: layout[key],
    })).filter(item => item.data[0] && item.data[0].y && item.data[0].y.length > 0);

    // If no graphs have data, display a message
    if (graphs.length === 0) {
      return (
        <div className="flex-grow flex flex-col items-center justify-center text-slate-500 p-6 rounded-xl shadow-lg h-full">
          <h3 className="text-xl font-semibold">No Graphs Available</h3>
          <p className="text-sm text-slate-400 text-center">
            There is no historical data to display for this shelf.
          </p>
        </div>
      );
    }

    // Split graphs into rows of 2
    const rows = [];
    for (let i = 0; i < graphs.length; i += 2) {
      rows.push(graphs.slice(i, i + 2));
    }

    return (
      <div className="flex flex-col gap-6 w-full">
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className={`grid gap-6 ${
              rowIndex % 2 === 0 ? 'grid-cols-1 md:grid-cols-2' : 'md:flex md:justify-end md:gap-6'
            }`}
          >
            {row.map((graph, index) => (
              <div key={index} className="relative rounded-xl p-4 shadow-xl bg-slate-800 flex-1">
                <Plot
                  data={graph.data}
                  layout={graph.layout}
                  config={config}
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  // Prepare live parameter data for rendering
  const liveParameters = [
    {
      label: "Temperature",
      value: temperatureValue,
      unit: "°C",
      icon: <ThermometerSun size={20} className="text-red-400" />,
    },
    {
      label: "Humidity",
      value: humidityValue,
      unit: "%",
      icon: <Droplets size={20} className="text-blue-400" />,
    },
    {
      label: "Watering",
      value: wateringValue,
      unit: "mm³",
      icon: <Droplets size={20} className="text-blue-400" />,
    },
    {
      label: "Light",
      value: lightValue,
      unit: "%",
      icon: <Lightbulb size={20} className="text-yellow-400" />,
    },
  ];

  // Filter out parameters with "Не измеряется" for display
  const displayLiveParameters = liveParameters.filter(param => param.value !== "Не измеряется");

  // Check if all live parameter values are "Не измеряется"
  const allLiveParamsNoData = displayLiveParameters.length === 0;

  return (
    <div className="min-h-screen bg-slate-900 font-sans antialiased text-slate-200">
      <div className="fixed top-0 left-0 w-full z-50">
        <AppHeader />
      </div>

      <div className="flex pt-16 min-h-screen">
        <AppMenu />
        <div className="flex-1 p-8 flex space-x-6 overflow-y-auto">
          {/* Left Sidebar for Info */}
          <div className="w-1/4 space-y-4 flex flex-col h-full">
            {/* Shelf Information Card */}
            <div className="bg-slate-800 rounded-xl shadow-lg p-6 flex flex-col items-center">
              <div className="flex items-center space-x-4 mb-4 w-full">
                <div className="flex items-center justify-center bg-slate-700 w-16 h-16 rounded-full text-indigo-400">
                  <Sprout size={32} />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-xl font-bold text-indigo-400">
                    Shelf #{arrayOfStrings[2]}
                  </h3>
                  <p className="text-sm text-slate-400">{plants}</p>
                </div>
              </div>
            </div>

            {/* Live Parameter Values Card */}
            <div className="bg-slate-800 rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-indigo-400 mb-4 text-center">
                Live Parameters
              </h3>
              <div className="space-y-3 w-full">
                {allLiveParamsNoData ? (
                  <div className="flex flex-col items-center justify-center text-slate-500 p-4">
                    <p className="text-3xl mb-2">🚫</p>
                    <p className="text-sm text-center">No Live Data Available</p>
                  </div>
                ) : (
                  displayLiveParameters.map((param, index) => (
                    <Tilt key={index} tiltMaxAngleX={10} tiltMaxAngleY={10} scale={1.05} glareEnable={false}>
                      <div className="bg-slate-700 p-4 rounded-lg flex items-center justify-between transition-colors cursor-pointer hover:bg-slate-600">
                        <div className="flex items-center space-x-3">
                          {param.icon}
                          <span className="font-semibold text-white">{param.label}:</span>
                        </div>
                        <p className="text-white">
                          {/* Ensure value is a number before rounding and displaying */}
                          {typeof param.value === 'number' && !isNaN(param.value) ? `${Math.round(param.value * 100) / 100} ${param.unit}` : "No Data"}
                        </p>
                      </div>
                    </Tilt>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area for the Graphs - now flexible */}
          <div className="flex-1 space-y-4 pb-4">
            {renderGraphs()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShelfPage;
