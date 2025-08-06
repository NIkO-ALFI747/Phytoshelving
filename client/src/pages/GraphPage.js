import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";

const GraphPage = () => {
  const [data, setData] = useState({
    x: [],
    y: [],
  });

  const [layout, setLayout] = useState({
    title: "График",
    xaxis: {},
    yaxis: {},
    width: 1200,
    height: 700,
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
          setLayout(() => {
            return {
              title: "График",
              xaxis: {
                range: [
                  parseInt(prev.x.slice(-1)) - 10,
                  parseInt(prev.x.slice(-1)) + 10,
                ],
              },
              yaxis: {},
              width: 1200,
              height: 700,
              uirevision: "true",
            };
          });
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

  const location = useLocation();
  let arrayOfStrings = location.pathname.split("/");

  useEffect(() => {
    realtimeGraph(arrayOfStrings[2]);
  }, []);

  // Prevent the component from rendering until data is loaded
  if (data.x.length === 0) {
    return (
      <div className="flex justify-center items-center w-full h-screen bg-slate-900 text-indigo-400 text-xl">
        Loading graph data...
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center w-full h-screen bg-slate-900">
      {/* The Plotly component will automatically update when data state changes. */}
      <div className="bg-slate-800 p-4 rounded-xl shadow-2xl w-full max-w-full h-full max-h-full">
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
            title: "Graph", // Updated title for consistency
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

export default GraphPage;
