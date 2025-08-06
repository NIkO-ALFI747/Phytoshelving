import React, { useState, useEffect } from "react";
import AppHeader from "../components/AppHeader";
import AppMenu from "../components/AppMenu";
import AppAlert from "../components/AppAlert";
import AppShelf from "../components/AppShelf";
import AppGraph from "../components/AppGraph";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";

const ShelvingPage = () => {
  const [shelfData, setShelfData] = useState();
  const [allParameterSettings, setAllParameterSettings] = useState([]);
  const [parameterSettingCount, setParameterSettingCount] = useState(0);

  const SERVER_URL = process.env.REACT_APP_SERVER_URL;

  const getGraphs = async (id) => {
    axios
      .post(
        `${SERVER_URL}/api/parameter-setting/filter`,
        {
          filter: {
            shelving_id: id,
          },
          offset: 0,
          type: "all",
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then((res) => {
        if (res.data.msg === "success") {
          console.log(res.data.all_filter_params);
          setAllParameterSettings(res.data.all_filter_params);
          setParameterSettingCount(res.data.all_filter_params.length);
        } else console.log(`${res.data.msg}`);
      })
      .catch((e) => {
        console.log(e);
      });
  };

  async function shelving(id, type) {
    try {
      const response = await fetch(`${SERVER_URL}/api/shelving/shelving`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: id,
          type: type,
        }),
      });

      // Check for a successful response (status code in the 200s)
      if (response.ok) {
        const ans = await response.json();
        if (ans.msg === "success") {
          if (ans.type === "activeRealtimeShelving") {
            const test = ans.shelvings_params;
            let res = test.reduce(function (results, org) {
              (results[org.shelf] = results[org.shelf] || []).push(org);
              return results;
            }, {});
            setShelfData(res);
            console.log(res);
            console.log(ans.shelvings_params);
          }
          console.log(`${ans.type} ${ans.id}\n${ans.msg2}`);
        } else {
          console.log(`${ans.msg}`);
        }
      } else {
        // If response is not ok (e.g., 500 status code)
        const errorData = await response.json();
        console.error(`Error: ${response.status} - ${errorData.msg}`);
      }
    } catch (error) {
      // This catches network errors, like the server being down
      console.error("Failed to connect to the server:", error);
    }
  }

  const location = useLocation();
  let arrayOfStrings = location.pathname.split("/");

  useEffect(() => {
    getGraphs(arrayOfStrings[2]);
    shelving(arrayOfStrings[2], "activeRealtimeShelving");
  }, []);

  return (
    <>
      <div className="App min-h-screen bg-slate-900 font-sans antialiased text-slate-200">
        <AppHeader />
        <div className="flex">
          <AppMenu />
          {/* Main content container with the same background as AppHeader. */}
          {/* This container will hold all the page-specific content. */}
          <div className="grow m-4">
            <div className="grid grid-cols-12 grid-rows-12 gap-1 p-4">
              <AppAlert />
              <AppShelf shelfArray={shelfData} />
              <AppGraph
                paramSettings={allParameterSettings}
                paramCount={parameterSettingCount}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ShelvingPage;
