import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const AuxiliaryPage = () => {
  const SERVER_URL = process.env.REACT_APP_SERVER_URL;

  // State to manage the list of active graphs.
  const [graphs, setGraphs] = useState([]);

  // State to manage input values for the various forms.
  const [graphInputId, setGraphInputId] = useState("");
  const [paramInputId, setParamInputId] = useState("");
  const [graphValueInputId, setGraphValueInputId] = useState("");
  const [rackInputId, setRackInputId] = useState("");
  const [shelfInputId, setShelfInputId] = useState("");

  // useEffect hook to handle the socket connection lifecycle.
  useEffect(() => {
    // Establishes a socket connection.
    const socket = io(SERVER_URL);

    // Listener for incoming messages from the socket.
    socket.on("message", (msg) => {
      console.log(msg)
      if (msg.type === "shelving") {
        console.log(
          `Shelving, value: ${msg.value}, serial_num: ${msg.fixateSerialNum}, id_configured_parameter: ${msg.configured_parameters_id}, fixate_time: ${msg.fixateTime}`
        );
      } else if (msg.type === "shelf") {
        console.log(
          `Shelf, value: ${msg.value}, serial_num: ${msg.fixateSerialNum}, id_configured_parameter: ${msg.configured_parameters_id}, fixate_time: ${msg.fixateTime}`
        );
      } else {
        console.log(
          `Graph, value: ${msg.value}, serial_num: ${msg.fixateSerialNum}, id_configured_parameter: ${msg.configured_parameters_id}, fixate_time: ${msg.fixateTime}`
        );
      }
    });

    // Cleanup function to disconnect the socket when the component unmounts.
    return () => {
      socket.disconnect();
    };
  }, [SERVER_URL]);

  // Asynchronous function to handle real-time graph activation and deactivation.
  // It updates the 'graphs' state directly.
  const realtimeGraph = async (id, type) => {
    try {
      const response = await fetch(`${SERVER_URL}/api/range/realtimeGraph`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: id,
          type: type,
        }),
      });

      if (response.ok) {
        const ans = await response.json();
        if (ans.msg === "success") {
          console.log(ans.paramValues);

          // Update the graphs state based on the response.
          setGraphs((currentGraphs) => {
            if (ans.type === "activeRealtimeGraph") {
              // If not already in the list, add the new graph ID and sort.
              if (!currentGraphs.includes(ans.id)) {
                const newGraphs = [...currentGraphs, ans.id];
                return newGraphs.sort((a, b) => a - b);
              }
              return currentGraphs; // No change if already exists.
            } else {
              // Remove the graph ID from the list.
              return currentGraphs.filter((graphId) => graphId !== ans.id);
            }
          });
          console.log(`${ans.type} ${ans.id}`);
        } else {
          console.log(`${ans.msg}`);
        }
      } else {
        console.error("API call failed:", response.statusText);
      }
    } catch (error) {
      console.error("An error occurred:", error);
    }
  };

  // Asynchronous function to get graph values.
  const graph = async (id) => {
    try {
      const response = await fetch(`${SERVER_URL}/api/range/graph`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: id,
        }),
      });
      if (response.ok) {
        const ans = await response.json();
        if (ans.msg === "success") console.log(ans.paramValues);
        else console.log(ans.msg);
      }
    } catch (error) {
      console.error("An error occurred:", error);
    }
  };

  // Asynchronous function to activate/deactivate a parameter.
  const activateParameter = async (id, activity, type) => {
    try {
      const response = await fetch(
        `${SERVER_URL}/api/range/activateParameter`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: id,
            activity: activity,
            type: type,
          }),
        }
      );
      if (response.ok) {
        const ans = await response.json();
        console.log(ans);
      }
    } catch (error) {
      console.error("An error occurred:", error);
    }
  };

  // Asynchronous function to handle shelving.
  const shelving = async (id, type) => {
    try {
      const response = await fetch(`${SERVER_URL}/api/shelving/shelving`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: id,
          type: type,
        }),
      });
      if (response.ok) {
        const ans = await response.json();
        if (ans.msg === "success") {
          if (ans.type === "activeRealtimeShelving")
            console.log(ans.shelvings_params);
          console.log(`${ans.type} ${ans.id}\n${ans.msg2}`);
        } else {
          console.log(`${ans.msg}`);
        }
      }
    } catch (error) {
      console.error("An error occurred:", error);
    }
  };

  // Asynchronous function to handle shelf.
  const shelf = async (id, type) => {
    try {
      const response = await fetch(`${SERVER_URL}/api/shelf/shelf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: id,
          type: type,
        }),
      });
      if (response.ok) {
        const ans = await response.json();
        if (ans.msg === "success") {
          if (ans.type === "activeRealtimeShelf") console.log(ans.shelf_params);
          console.log(`${ans.type} ${ans.id}\n${ans.msg2}`);
        } else {
          console.log(`${ans.msg}`);
        }
      }
    } catch (error) {
      console.error("An error occurred:", error);
    }
  };

  const clearTable = async () => {
    try {
      // Use the DELETE method for the request
      const response = await fetch(`${SERVER_URL}/api/parameter-value/clear`, {
        method: "DELETE",
      });
      if (response.ok) {
        const ans = await response.json();
        console.log(ans.msg); // Log the success message from the server
      } else {
        console.error("Failed to clear table:", response.statusText);
      }
    } catch (error) {
      console.error("An error occurred while clearing the table:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6 md:p-12 font-sans antialiased text-slate-200">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Main Heading */}
        <h1 className="text-4xl sm:text-5xl font-extrabold text-center text-indigo-400 mb-10 tracking-tight">
          Панель управления
        </h1>

        {/* Section for Parameter Activation */}
        <div className="bg-slate-800 rounded-xl shadow-2xl p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            Активация параметров
          </h2>
          <form name="userForm2" onSubmit={(e) => e.preventDefault()}>
            <div className="mb-4">
              <label
                htmlFor="paramId"
                className="block text-sm font-medium text-slate-400 mb-1"
              >
                ID параметра
              </label>
              <input
                type="text"
                name="id"
                id="paramId"
                value={paramInputId}
                onChange={(e) => setParamInputId(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
            </div>

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mb-6">
              <button
                type="button"
                onClick={() =>
                  activateParameter(parseInt(paramInputId, 10), true, "one")
                }
                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-500 text-white font-medium rounded-lg shadow-lg hover:bg-indigo-600 transition-colors transform hover:scale-105"
              >
                Активировать параметр
              </button>
              <button
                type="button"
                onClick={() =>
                  activateParameter(parseInt(paramInputId, 10), false, "one")
                }
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-700 text-slate-300 font-medium rounded-lg shadow-lg hover:bg-slate-600 transition-colors transform hover:scale-105"
              >
                Деактивировать параметр
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => activateParameter(0, true, "all")}
                className="px-4 py-2.5 bg-indigo-500 text-white font-medium rounded-lg shadow-lg hover:bg-indigo-600 transition-colors transform hover:scale-105"
              >
                Активировать все
              </button>
              <button
                type="button"
                onClick={() => activateParameter(0, false, "all")}
                className="px-4 py-2.5 bg-slate-700 text-slate-300 font-medium rounded-lg shadow-lg hover:bg-slate-600 transition-colors transform hover:scale-105"
              >
                Деактивировать все
              </button>
              <button
                type="button"
                onClick={() => activateParameter(0, true, "auto")}
                className="px-4 py-2.5 bg-indigo-500 text-white font-medium rounded-lg shadow-lg hover:bg-indigo-600 transition-colors transform hover:scale-105"
              >
                Включить авто. активацию
              </button>
              <button
                type="button"
                onClick={() => activateParameter(0, false, "auto")}
                className="px-4 py-2.5 bg-slate-700 text-slate-300 font-medium rounded-lg shadow-lg hover:bg-slate-600 transition-colors transform hover:scale-105"
              >
                Отключить авто. активацию
              </button>
            </div>
          </form>
        </div>

        {/* Section for Getting Graph Values */}
        <div className="bg-slate-800 rounded-xl shadow-2xl p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            Получить значения графика
          </h2>
          <form
            name="userForm3"
            onSubmit={(e) => {
              e.preventDefault();
              graph(parseInt(graphValueInputId, 10));
            }}
          >
            <div className="mb-4">
              <label
                htmlFor="graphValueId"
                className="block text-sm font-medium text-slate-400 mb-1"
              >
                ID графика
              </label>
              <input
                type="text"
                name="id"
                id="graphValueId"
                value={graphValueInputId}
                onChange={(e) => setGraphValueInputId(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 bg-indigo-500 text-white font-medium rounded-lg shadow-lg hover:bg-indigo-600 transition-colors transform hover:scale-105"
            >
              Получить
            </button>
          </form>
        </div>

        {/* Section for Real-time Graph */}
        <div className="bg-slate-800 rounded-xl shadow-2xl p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            График в реальном времени
          </h2>
          <form
            name="userForm"
            onSubmit={(e) => {
              e.preventDefault();
              realtimeGraph(parseInt(graphInputId, 10), "activeRealtimeGraph");
            }}
          >
            <div className="mb-4">
              <label
                htmlFor="graphId"
                className="block text-sm font-medium text-slate-400 mb-1"
              >
                ID графика
              </label>
              <input
                type="text"
                name="id"
                id="graphId"
                value={graphInputId}
                onChange={(e) => setGraphInputId(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
            </div>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-500 text-white font-medium rounded-lg shadow-lg hover:bg-indigo-600 transition-colors transform hover:scale-105"
              >
                Активировать
              </button>
              <button
                type="button"
                onClick={() =>
                  realtimeGraph(parseInt(graphInputId, 10), "stopRealtimeGraph")
                }
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-700 text-slate-300 font-medium rounded-lg shadow-lg hover:bg-slate-600 transition-colors transform hover:scale-105"
              >
                Остановить
              </button>
            </div>
          </form>
          <div className="mt-6 text-sm">
            <p className="text-slate-400">
              Активированные графики в реальном времени:{" "}
              <span className="text-indigo-400 font-bold">
                {graphs.length > 0 ? graphs.join(", ") : "Нет"}
              </span>
            </p>
          </div>
        </div>

        {/* Section for Real-time Rack */}
        <div className="bg-slate-800 rounded-xl shadow-2xl p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            Стеллаж в реальном времени
          </h2>
          <form
            name="userForm4"
            onSubmit={(e) => {
              e.preventDefault();
              shelving(parseInt(rackInputId, 10), "activeRealtimeShelving");
            }}
          >
            <div className="mb-4">
              <label
                htmlFor="rackId"
                className="block text-sm font-medium text-slate-400 mb-1"
              >
                ID стеллажа
              </label>
              <input
                type="text"
                name="id"
                id="rackId"
                value={rackInputId}
                onChange={(e) => setRackInputId(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
            </div>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-500 text-white font-medium rounded-lg shadow-lg hover:bg-indigo-600 transition-colors transform hover:scale-105"
              >
                Активировать
              </button>
              <button
                type="button"
                onClick={() =>
                  shelving(parseInt(rackInputId, 10), "stopRealtimeGraph")
                }
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-700 text-slate-300 font-medium rounded-lg shadow-lg hover:bg-slate-600 transition-colors transform hover:scale-105"
              >
                Остановить
              </button>
            </div>
          </form>
        </div>

        {/* Section for Real-time Shelf */}
        <div className="bg-slate-800 rounded-xl shadow-2xl p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            Полка в реальном времени
          </h2>
          <form
            name="userForm5"
            onSubmit={(e) => {
              e.preventDefault();
              shelf(parseInt(shelfInputId, 10), "activeRealtimeShelf");
            }}
          >
            <div className="mb-4">
              <label
                htmlFor="shelfId"
                className="block text-sm font-medium text-slate-400 mb-1"
              >
                ID полки
              </label>
              <input
                type="text"
                name="id"
                id="shelfId"
                value={shelfInputId}
                onChange={(e) => setShelfInputId(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
            </div>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-500 text-white font-medium rounded-lg shadow-lg hover:bg-indigo-600 transition-colors transform hover:scale-105"
              >
                Активировать
              </button>
              <button
                type="button"
                onClick={() =>
                  shelf(parseInt(shelfInputId, 10), "stopRealtimeGraph")
                }
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-700 text-slate-300 font-medium rounded-lg shadow-lg hover:bg-slate-600 transition-colors transform hover:scale-105"
              >
                Остановить
              </button>
            </div>
          </form>
        </div>

        {/* Section for Clearing Data */}
        <div className="bg-slate-800 rounded-xl shadow-2xl p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold mb-4 text-red-400">
            Очистка данных
          </h2>
          <p className="text-slate-400 mb-4">
            Нажмите кнопку ниже, чтобы полностью очистить таблицу
            parameter-value. Это действие необратимо.
          </p>
          <button
            type="button"
            onClick={clearTable}
            className="w-full px-6 py-2.5 bg-red-600 text-white font-medium rounded-lg shadow-lg hover:bg-red-700 transition-colors transform hover:scale-105"
          >
            Очистить таблицу
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuxiliaryPage;