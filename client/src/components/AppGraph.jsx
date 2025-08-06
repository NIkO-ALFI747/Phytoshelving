import React, { useEffect, useState } from "react";

function AppGraph({ paramSettings, paramCount }) {
  const [allParameterSettings, setAllParameterSettings] = useState([]);
  const [parameterSettingCount, setParameterSettingCount] = useState(0);

  useEffect(() => {
    setAllParameterSettings(paramSettings);
    setParameterSettingCount(paramCount);
  }, [paramSettings, paramCount]);

  function Graphs() {
    if (parameterSettingCount !== 0) {
      return (
        <div className="flex gap-3 flex-wrap col-span-12 p-6 bg-slate-800 rounded-xl shadow-2xl self-start">
          <div className="grid w-full grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {allParameterSettings.map((setting) => {
              let activity;
              if (setting.activity) activity = `Активен`;
              else activity = `Не активен`;

              return (
                <div
                  key={setting.configured_parameters_id}
                  className="block bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/20"
                >
                  <a
                    key={setting.configured_parameters_id}
                    href={`../graphic/${setting.configured_parameters_id}?room=${setting.room}&shelving=${setting.shelving}&shelf=${setting.shelfs_serial_num}&parameter=${setting.parameters_name}&activity=${activity}`}
                    className="group block bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/20"
                  >
                    <img
                      className="w-full h-32 object-cover"
                      src="/graph72.png"
                      alt="Graph visualization"
                    />
                    <div className="p-4">
                      <h5 className="text-white font-bold text-base mb-2 truncate group-hover:text-indigo-400 transition-colors">
                        График №{setting.configured_parameters_id}
                      </h5>
                      <div className="text-xs text-slate-400 space-y-1">
                        <p className="truncate">
                          <b>Расположение:</b> {setting.room}, {setting.shelving},
                          Полка №{setting.shelfs_serial_num}
                        </p>
                        <p>
                          <b>Параметр:</b> {setting.parameters_name}
                        </p>
                        <p>
                          <b>Активность:</b>{" "}
                          <span
                            className={
                              setting.activity
                                ? "text-green-400 font-semibold"
                                : "text-red-400 font-semibold"
                            }
                          >
                            {activity}
                          </span>
                        </p>
                      </div>
                    </div>
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      );
    } else {
      return (
        <section className="col-span-12 p-6 bg-slate-800 rounded-xl shadow-2xl h-full flex flex-col items-center justify-center text-slate-500">
          <p className="text-5xl mb-4">🕸️</p>
          <h3 className="text-xl font-semibold">Графиков не найдено</h3>
        </section>
      );
    }
  }

  return <Graphs />;
}

export default AppGraph;