import React, { useEffect, useState, useRef } from "react";
import Plot from "react-plotly.js";
import { io } from "socket.io-client";

const BigGraphPage = () => {
  const SERVER_URL = process.env.REACT_APP_SERVER_URL;

  // Parsing URL parameters to get the list of graph IDs.
  const urlParams = new URLSearchParams(window.location.search);
  const graphsArr = JSON.parse(urlParams.get("graphs") || "[]");

  // State to hold the graph data for Plotly.
  const [graphsComponent, setGraphsComponent] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Plotly layout configuration.
  const layout = {
    title: "Graph",
    xaxis: {},
    yaxis: {},
    uirevision: "true",
    dragmode: "pan",
  };

  // Plotly config options.
  const config = {
    scrollZoom: true,
    displayModeBar: true,
    displaylogo: false,
  };

  // useRef to store the socket instance and prevent re-creation.
  const socketRef = useRef(null);

  /**
   * This useEffect is responsible for setting up the real-time socket connection.
   * It should only run once on component mount and disconnect on unmount.
   * The empty dependency array `[]` ensures this.
   */
  useEffect(() => {
    // Only create the socket if it doesn't exist.
    if (!socketRef.current) {
      socketRef.current = io(SERVER_URL);

      // Listen for "message" events from the server.
      socketRef.current.on("message", (msg) => {
        if (msg.type === "graph") {
          console.log(
            `Graph, value: ${msg.value}, serial_num: ${msg.fixateSerialNum}, id_configured_parameter: ${msg.configured_parameters_id}, fixate_time: ${msg.fixateTime}`
          );

          // Use the functional updater for setGraphsComponent
          // to safely modify the state based on its previous value.
          setGraphsComponent((prevGraphs) => {
            const updatedGraphs = prevGraphs.map((graph) => {
              if (graph.id === msg.configured_parameters_id) {
                const fixating_value_date = new Date(msg.fixateTime);
                // Adjusting time zone (e.g., +5 hours).
                fixating_value_date.setHours(
                  fixating_value_date.getHours() + 5
                );
                return {
                  ...graph, // Keep all other properties of the graph object
                  x: [...graph.x, fixating_value_date],
                  y: [...graph.y, msg.value],
                };
              }
              return graph;
            });
            console.log("Updated graph data:", updatedGraphs);
            return updatedGraphs;
          });
        }
      });
    }

    // Cleanup function to disconnect the socket when the component unmounts.
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        console.log("Socket disconnected.");
      }
    };
  }, [SERVER_URL]);

  /**
   * This useEffect fetches the initial data for all graphs.
   * It runs once when the component mounts and the graphsArr and SERVER_URL are available.
   * The `isDataLoaded` state is used to ensure this effect runs only once.
   */
  useEffect(() => {
    if (graphsArr.length > 0 && !isDataLoaded) {
      const fetchInitialData = async () => {
        const initialGraphData = [];
        for (const graphId of graphsArr) {
          try {
            // Fetch historical data for the graph.
            const response = await fetch(`${SERVER_URL}/api/range/graph`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: graphId }),
            });

            const ans = await response.json();
            if (response.ok && ans.msg === "success") {
              const x = [];
              const y = [];
              ans.paramValues.forEach((paramValue) => {
                const date = new Date(paramValue.fixate_time);
                x.push(date);
                y.push(paramValue.value);
              });
              initialGraphData.push({
                x,
                y,
                id: graphId,
                type: "scatter",
                mode: "lines",
                name: `Graph ${graphId}`,
              });
            } else {
              console.error(
                `Error fetching graph data for ID ${graphId}: ${ans.msg}`
              );
            }

            // Send a request to the server to activate the real-time stream for the graph.
            const realtimeResponse = await fetch(
              `${SERVER_URL}/api/range/realtimeGraph`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: graphId,
                  type: "activeRealtimeGraph",
                }),
              }
            );
            const realtimeAns = await realtimeResponse.json();
            if (realtimeResponse.ok && realtimeAns.msg === "success") {
              console.log(
                `Real-time stream activated for graph ID: ${graphId}`
              );
            } else {
              console.error(
                `Error activating real-time stream for graph ID ${graphId}: ${realtimeAns.msg}`
              );
            }

            // Update the graph's ranking/visit count.
            await updateGraphRank(graphId);
          } catch (error) {
            console.error(
              `Error fetching data for graph ID ${graphId}:`,
              error
            );
          }
        }
        setGraphsComponent(initialGraphData);
        setIsDataLoaded(true);
      };

      fetchInitialData();
    }
  }, [graphsArr, SERVER_URL, isDataLoaded]);

  /**
   * Asynchronous function to update the graph's ranking on the server.
   * It now uses the native fetch API instead of axios.
   * @param {number} id The ID of the graph.
   */
  const updateGraphRank = async (id) => {
    try {
      const response = await fetch(
        `${SERVER_URL}/api/parameter-setting-rating/ranking`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: id }),
        }
      );
      const res = await response.json();
      if (response.ok && res.msg === "success") {
        console.log(
          `Visit count for graph ${res.parameter_id}: ${res.visit_num}`
        );
      } else {
        console.error(`Error updating rank for graph ID ${id}: ${res.msg}`);
      }
    } catch (e) {
      console.error(`Error updating rank for graph ID ${id}:`, e);
    }
  };

  // Prevent the component from rendering until data is loaded
  if (!isDataLoaded) {
    return (
      <div className="flex justify-center items-center w-full h-screen bg-slate-900 text-indigo-400 text-xl">
        Loading graph data...
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center w-full h-screen bg-slate-900">
      {/* The Plotly component will automatically update when graphsComponent state changes. */}
      <div className="bg-slate-800 p-4 rounded-xl shadow-2xl w-full max-w-full h-full max-h-full">
        <Plot
          data={graphsComponent}
          layout={{
            ...layout,
            autosize: true,
            paper_bgcolor: "rgb(30, 41, 59)", // slate-800
            plot_bgcolor: "rgb(30, 41, 59)", // slate-800
            font: {
              color: "rgb(148, 163, 184)", // slate-400
            },
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
            width: null, // Let Plotly handle the width based on autosize
            height: null, // Let Plotly handle the height based on autosize
          }}
          config={{
            ...config,
            responsive: true, // Make the plot responsive to the container
          }}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </div>
  );
};

export default BigGraphPage;
