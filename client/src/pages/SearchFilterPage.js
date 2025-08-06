import React, { useEffect, useState, useCallback } from "react";
import { FaChevronLeft, FaChevronRight, FaChevronDown } from "react-icons/fa";
import AppHeader from "../components/AppHeader";
import AppMenu from "../components/AppMenu";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const SearchFilterPage = () => {
  const [roomsCount, setRoomsCount] = useState(0);
  const [shelvingsCount, setShelvingsCount] = useState(0);
  const [shelvesCount, setShelvesCount] = useState(0);
  const [parameterSettingCount, setParameterSettingCount] = useState(0);
  const [allRooms, setAllRooms] = useState([]);
  const [allParameters, setAllParameters] = useState([]);
  const [allParameterSettings, setAllParameterSettings] = useState([]);
  const SERVER_URL = process.env.REACT_APP_SERVER_URL;
  const [isHiddenShelvingBlock, setIsHiddenShelvingBlock] = useState(true);
  const [isHiddenShelfBlock, setIsHiddenShelfBlock] = useState(true);
  const [shelvingsByRoom, setShelvingsByRoom] = useState([]);
  const [shelvesByShelving, setShelvesByShelving] = useState([]);
  const [currentPlace, setCurrentPlace] = useState("Не выбрано");
  const [currentParameter, setCurrentParameter] = useState("Не задан");
  const [currentShelvingId, setCurrentShelvingId] = useState(0);
  const [currentShelfId, setCurrentShelfId] = useState(0);
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [pageIndex, setPageIndex] = useState(0);

  const [currentFilter, setCurrentFilter] = useState({
    room: "",
    shelving: "",
    shelf: "",
    parameter: "",
  });

  const handleApiResponse = (res) => {
    if (res.data.msg === "success") {
      if (res.data.hasOwnProperty("all_filter_params")) {
        setParameterSettingCount(res.data.all_filter_params.length);
      }
      setAllParameterSettings(res.data.filter_params || []);
      toast.success("Данные успешно загружены!");
    } else {
      setParameterSettingCount(0);
      setAllParameterSettings([]);
      toast.error("Не удалось загрузить данные. Попробуйте еще раз.");
    }
  };

  const buildFilterPayload = (offset = 0, newFilterState, minVal, maxVal) => {
    const payload = { offset, type: "all", filter: {} };
    if (newFilterState.room) payload.filter.room = newFilterState.room;
    if (newFilterState.shelving)
      payload.filter.shelving = newFilterState.shelving;
    if (newFilterState.shelf) payload.filter.shelf = newFilterState.shelf;
    if (newFilterState.parameter)
      payload.filter.parameter = newFilterState.parameter;
    if (minVal) payload.filter.min_value = minVal;
    if (maxVal) payload.filter.max_value = maxVal;
    return payload;
  };

  useEffect(() => {
    axios
      .get(`${SERVER_URL}/api/room/count`)
      .then((res) => setRoomsCount(res.data))
      .catch(console.error);
    axios
      .get(`${SERVER_URL}/api/shelving/count`)
      .then((res) => setShelvingsCount(res.data))
      .catch(console.error);
    axios
      .get(`${SERVER_URL}/api/shelf/count`)
      .then((res) => setShelvesCount(res.data))
      .catch(console.error);
    axios
      .post(`${SERVER_URL}/api/parameter-setting/filter`, {
        offset: 0,
        type: "all",
      })
      .then(handleApiResponse)
      .catch((error) => {
        console.error(error);
        toast.error(
          "Ошибка при получении данных. Проверьте подключение к серверу."
        );
      });
    axios
      .get(`${SERVER_URL}/api/room`)
      .then((res) => setAllRooms(res.data))
      .catch(console.error);
    axios
      .get(`${SERVER_URL}/api/parameter`)
      .then((res) => setAllParameters(res.data))
      .catch(console.error);
  }, [SERVER_URL]);

  function selectRoom(room) {
    axios
      .get(`${SERVER_URL}/api/shelving/shelving-by-room?id=${room.id}`)
      .then((res) => {
        setShelvingsByRoom(res.data);
        setIsHiddenShelvingBlock(false);
        setIsHiddenShelfBlock(true);
        setCurrentPlace(room.name + " / ");
        const newFilterState = {
          ...currentFilter,
          room: room.name,
          shelving: "",
          shelf: "",
        };
        setCurrentFilter(newFilterState);
        if (pageIndex > 0) setPageIndex(0);

        const payload = buildFilterPayload(
          0,
          newFilterState,
          minValue,
          maxValue
        );
        axios
          .post(`${SERVER_URL}/api/parameter-setting/filter`, payload)
          .then(handleApiResponse)
          .catch(console.error);
      })
      .catch((e) => {
        if (e.response && e.response.status === 404) {
          setIsHiddenShelvingBlock(true);
          setIsHiddenShelfBlock(true);
          toast.warn("Стеллажи для данной комнаты отсутствуют!");
        } else console.error(e);
      });
  }

  function selectShelving(shelving) {
    axios
      .get(`${SERVER_URL}/api/shelf/shelf-by-shelving?id=${shelving.id}`)
      .then((res) => {
        setShelvesByShelving(res.data);
        setCurrentShelvingId(shelving.id);
        setIsHiddenShelfBlock(false);
        setCurrentPlace(
          currentPlace.split("/")[0].trim() + " / " + shelving.name + " / "
        );
        const newFilterState = {
          ...currentFilter,
          shelving: shelving.name,
          shelf: "",
        };
        setCurrentFilter(newFilterState);
        if (pageIndex > 0) setPageIndex(0);

        const payload = buildFilterPayload(
          0,
          newFilterState,
          minValue,
          maxValue
        );
        axios
          .post(`${SERVER_URL}/api/parameter-setting/filter`, payload)
          .then(handleApiResponse)
          .catch(console.error);
      })
      .catch((e) => {
        if (e.response && e.response.status === 404) {
          setIsHiddenShelfBlock(true);
          toast.warn("Полки для данного стеллажа отсутствуют!");
        } else console.error(e);
      });
  }

  function selectShelf(shelf) {
    setCurrentPlace(
      currentPlace.split("/")[0].trim() +
        " / " +
        currentPlace.split("/")[1].trim() +
        " / Полка №" +
        shelf.serial_num
    );
    setCurrentShelfId(shelf.id);
    const newFilterState = { ...currentFilter, shelf: shelf.serial_num };
    setCurrentFilter(newFilterState);
    if (pageIndex > 0) setPageIndex(0);

    const payload = buildFilterPayload(0, newFilterState, minValue, maxValue);
    axios
      .post(`${SERVER_URL}/api/parameter-setting/filter`, payload)
      .then(handleApiResponse)
      .catch(console.error);
  }

  function selectParameter(parameter) {
    setCurrentParameter(parameter.name);
    const newFilterState = { ...currentFilter, parameter: parameter.name };
    setCurrentFilter(newFilterState);
    if (pageIndex > 0) setPageIndex(0);

    const payload = buildFilterPayload(0, newFilterState, minValue, maxValue);
    axios
      .post(`${SERVER_URL}/api/parameter-setting/filter`, payload)
      .then(handleApiResponse)
      .catch(console.error);
  }

  function selectMinValue(value) {
    setMinValue(value);
    if (pageIndex > 0) setPageIndex(0);
    const payload = buildFilterPayload(0, currentFilter, value, maxValue);
    axios
      .post(`${SERVER_URL}/api/parameter-setting/filter`, payload)
      .then(handleApiResponse)
      .catch(console.error);
  }

  function selectMaxValue(value) {
    setMaxValue(value);
    if (pageIndex > 0) setPageIndex(0);
    const payload = buildFilterPayload(0, currentFilter, minValue, value);
    axios
      .post(`${SERVER_URL}/api/parameter-setting/filter`, payload)
      .then(handleApiResponse)
      .catch(console.error);
  }

  function removeFilterSettings() {
    setCurrentPlace("Не выбрано");
    setCurrentParameter("Не задан");
    setIsHiddenShelvingBlock(true);
    setIsHiddenShelfBlock(true);
    setMinValue("");
    setMaxValue("");
    setCurrentFilter({ room: "", shelving: "", shelf: "", parameter: "" });
    if (pageIndex > 0) setPageIndex(0);
    axios
      .post(`${SERVER_URL}/api/parameter-setting/filter`, {
        offset: 0,
        type: "all",
      })
      .then(handleApiResponse)
      .catch(console.error);
  }

  const getGraphicOffset = (offset) => {
    let payload = { offset: offset, type: "all" };

    const activeFilters = {};
    if (currentFilter.room) activeFilters.room = currentFilter.room;
    if (currentFilter.shelving) activeFilters.shelving = currentFilter.shelving;
    if (currentFilter.shelf) activeFilters.shelf = currentFilter.shelf;
    if (currentFilter.parameter)
      activeFilters.parameter = currentFilter.parameter;
    if (minValue) activeFilters.min_value = minValue;
    if (maxValue) activeFilters.max_value = maxValue;

    if (Object.keys(activeFilters).length > 0) {
      payload.filter = activeFilters;
    }

    axios
      .post(`${SERVER_URL}/api/parameter-setting/filter`, payload)
      .then((res) => {
        if (res.data.msg === "success") {
          setAllParameterSettings(res.data.filter_params || []);
        }
      })
      .catch(console.error);
  };

  const itemsPerPage = 12;
  const canPreviousPage = pageIndex > 0;
  const pageCount =
    parameterSettingCount > 0
      ? Math.ceil(parameterSettingCount / itemsPerPage)
      : 1;
  const canNextPage = (pageIndex + 1) * itemsPerPage < parameterSettingCount;

  const gotoPage = useCallback((page) => {
    setPageIndex(page);
  }, []);

  return (
    <div className="flex h-screen bg-slate-900 text-slate-300 font-sans">
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <AppMenu />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <aside className="w-full lg:w-1/4 lg:max-w-xs flex-shrink-0 flex flex-col gap-6">
              <InfoPanel
                roomsCount={roomsCount}
                shelvingsCount={shelvingsCount}
                shelvesCount={shelvesCount}
              />
              <FiltersPanel
                allRooms={allRooms}
                selectRoom={selectRoom}
                shelvingsByRoom={shelvingsByRoom}
                selectShelving={selectShelving}
                isHiddenShelving={isHiddenShelvingBlock}
                shelvesByShelving={shelvesByShelving}
                selectShelf={selectShelf}
                isHiddenShelf={isHiddenShelfBlock}
                allParameters={allParameters}
                selectParameter={selectParameter}
                currentParameter={currentParameter}
                minValue={minValue}
                maxValue={maxValue}
                selectMinValue={selectMinValue}
                selectMaxValue={selectMaxValue}
                removeFilterSettings={removeFilterSettings}
              />
            </aside>
            <div className="flex-1 flex flex-col gap-6">
              <CurrentSelectionPanel
                currentPlace={currentPlace}
                currentParameter={currentParameter}
                shelvingId={currentShelvingId}
                shelfId={currentShelfId}
              />
              <GraphicsGrid
                settings={allParameterSettings}
                count={parameterSettingCount}
                pageIndex={pageIndex}
                pageCount={pageCount}
                gotoPage={gotoPage}
                canPreviousPage={canPreviousPage}
                canNextPage={canNextPage}
                getGraphicOffset={getGraphicOffset}
                itemsPerPage={itemsPerPage}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const InfoPanel = ({ roomsCount, shelvingsCount, shelvesCount }) => (
  <section className="bg-slate-800 rounded-xl shadow-2xl p-6">
    <h2 className="text-xl font-bold text-white mb-4 border-b border-slate-700 pb-3">
      Основная Информация
    </h2>
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span>Всего Комнат:</span>{" "}
        <span className="font-semibold text-white">{roomsCount}</span>
      </div>
      <div className="flex justify-between">
        <span>Всего Стеллажей:</span>{" "}
        <span className="font-semibold text-white">{shelvingsCount}</span>
      </div>
      <div className="flex justify-between">
        <span>Всего Полок:</span>{" "}
        <span className="font-semibold text-white">{shelvesCount}</span>
      </div>
    </div>
  </section>
);

const FilterDropdown = ({
  title,
  items,
  onSelect,
  renderItem,
  isHidden = false,
}) => {
  if (isHidden) return null;
  return (
    <details className="group" open>
      <summary className="flex items-center justify-between p-3 rounded-lg cursor-pointer list-none hover:bg-slate-700/50 transition-colors">
        <span className="font-semibold text-white">{title}</span>
        <FaChevronDown className="group-open:rotate-180 transition-transform duration-300" />
      </summary>
      <ul className="mt-2 pl-4 space-y-1 max-h-48 overflow-y-auto">
        {items.map((item) => (
          <li
            key={item.id}
            onClick={() => onSelect(item)}
            className="p-2 text-slate-300 rounded-md cursor-pointer hover:bg-indigo-600 hover:text-white transition-colors"
          >
            {renderItem(item)}
          </li>
        ))}
      </ul>
    </details>
  );
};

const FiltersPanel = ({
  allRooms,
  selectRoom,
  shelvingsByRoom,
  selectShelving,
  isHiddenShelving,
  shelvesByShelving,
  selectShelf,
  isHiddenShelf,
  allParameters,
  selectParameter,
  currentParameter,
  minValue,
  maxValue,
  selectMinValue,
  selectMaxValue,
  removeFilterSettings,
}) => (
  <section className="bg-slate-800 rounded-xl shadow-2xl p-6 flex-grow">
    <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
      <h2 className="text-xl font-bold text-white">Фильтры</h2>
      <button
        onClick={removeFilterSettings}
        className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-semibold"
      >
        Очистить
      </button>
    </div>
    <div className="space-y-4">
      <FilterDropdown
        title="Комната"
        items={allRooms}
        onSelect={selectRoom}
        renderItem={(room) => room.name}
      />
      <FilterDropdown
        title="Стеллаж"
        items={shelvingsByRoom}
        onSelect={selectShelving}
        renderItem={(s) => s.name}
        isHidden={isHiddenShelving}
      />
      <FilterDropdown
        title="Полка"
        items={shelvesByShelving}
        onSelect={selectShelf}
        renderItem={(s) => `Полка №${s.serial_num}`}
        isHidden={isHiddenShelf}
      />
      <FilterDropdown
        title="Параметр"
        items={allParameters}
        onSelect={selectParameter}
        renderItem={(p) => p.name}
      />
      {currentParameter !== "Не задан" && (
        <div className="space-y-3 pt-2">
          <input
            type="number"
            min="0"
            max="100"
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            placeholder="Мин. значение"
            value={minValue}
            onInput={(e) => selectMinValue(e.target.value)}
          />
          <input
            type="number"
            min="0"
            max="100"
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            placeholder="Макс. значение"
            value={maxValue}
            onInput={(e) => selectMaxValue(e.target.value)}
          />
        </div>
      )}
    </div>
  </section>
);

const CurrentSelectionPanel = ({
  currentPlace,
  currentParameter,
  shelvingId,
  shelfId,
}) => {
  const parts = currentPlace.split("/").map((p) => p.trim());
  return (
    <section className="bg-slate-800 rounded-xl shadow-2xl p-5">
      <div className="flex items-center mb-2">
        <p className="font-semibold text-white w-40 flex-shrink-0">
          Текущее место:
        </p>
        <span className="text-indigo-400 font-medium truncate">
          {parts[0] && <span>{parts[0]}</span>}
          {parts[1] && (
            <a
              href={`../shelving/${shelvingId}`}
              className="hover:underline"
            >{` / ${parts[1]}`}</a>
          )}
          {parts[2] && (
            <a
              href={`../shelf/${shelfId}`}
              className="hover:underline"
            >{` / ${parts[2]}`}</a>
          )}
        </span>
      </div>
      <div className="flex items-center">
        <p className="font-semibold text-white w-40 flex-shrink-0">
          Текущий параметр:
        </p>
        <span className="text-indigo-400 font-medium">{currentParameter}</span>
      </div>
    </section>
  );
};

const PaginationNav = ({
  gotoPage,
  canPreviousPage,
  canNextPage,
  pageCount,
  pageIndex,
  getGraphicOffset,
}) => {
  const Button = ({ content, onClick, active, disabled }) => {
    const base =
      "flex items-center justify-center w-10 h-10 rounded-lg font-semibold transition-colors duration-200";
    const activeClasses =
      "bg-indigo-500 text-white shadow-lg shadow-indigo-500/50";
    const inactiveClasses = "bg-slate-700 text-slate-300 hover:bg-slate-600";
    const disabledClasses =
      "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50";
    return (
      <button
        className={`${base} ${
          disabled ? disabledClasses : active ? activeClasses : inactiveClasses
        }`}
        onClick={onClick}
        disabled={disabled}
      >
        {content}
      </button>
    );
  };

  const renderPageLinks = useCallback(() => {
    if (pageCount === 0) return null;
    const pageLinks = [];
    const maxVisibleButtons = 4;
    let startPage = Math.max(0, pageIndex - Math.floor(maxVisibleButtons / 2));
    let endPage = Math.min(pageCount - 1, startPage + maxVisibleButtons - 1);

    if (endPage - startPage + 1 < maxVisibleButtons) {
      startPage = Math.max(0, endPage - maxVisibleButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageLinks.push(
        <li key={i}>
          <Button
            content={i + 1}
            onClick={() => {
              getGraphicOffset(i);
              gotoPage(i);
            }}
            active={pageIndex === i}
          />
        </li>
      );
    }
    return pageLinks;
  }, [pageCount, pageIndex, gotoPage, getGraphicOffset]);

  if (pageCount <= 1) return null;

  return (
    <nav className="flex justify-center items-center w-full pt-6">
      <ul className="flex gap-2 items-center">
        <li>
          <Button
            content={<FaChevronLeft />}
            onClick={() => {
              getGraphicOffset(pageIndex - 1);
              gotoPage(pageIndex - 1);
            }}
            disabled={!canPreviousPage}
          />
        </li>
        {renderPageLinks()}
        <li>
          <Button
            content={<FaChevronRight />}
            onClick={() => {
              getGraphicOffset(pageIndex + 1);
              gotoPage(pageIndex + 1);
            }}
            disabled={!canNextPage}
          />
        </li>
      </ul>
    </nav>
  );
};

const GraphicsGrid = ({
  settings,
  count,
  pageIndex,
  pageCount,
  gotoPage,
  canPreviousPage,
  canNextPage,
  getGraphicOffset,
}) => {
  if (count === 0) {
    return (
      <section className="bg-slate-800 rounded-xl shadow-2xl p-6 h-full flex flex-col items-center justify-center text-slate-500">
        <p className="text-5xl mb-4">🕸️</p>
        <h3 className="text-xl font-semibold">Графиков не найдено</h3>
        <p className="mt-2 text-sm">
          Попробуйте изменить параметры фильтрации.
        </p>
      </section>
    );
  }

  return (
    <section className="bg-slate-800 rounded-xl shadow-2xl p-6 self-start">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {settings.map((setting) => {
          const activity = setting.activity ? "Активен" : "Не активен";
          const href = `../graphic/${setting.configured_parameters_id}?room=${setting.room}&shelving=${setting.shelving}&shelf=${setting.shelfs_serial_num}&parameter=${setting.parameters_name}&activity=${activity}`;
          return (
            <a
              key={setting.configured_parameters_id}
              href={href}
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
          );
        })}
      </div>
      <PaginationNav
        gotoPage={gotoPage}
        canPreviousPage={canPreviousPage}
        canNextPage={canNextPage}
        pageCount={pageCount}
        pageIndex={pageIndex}
        getGraphicOffset={getGraphicOffset}
      />
    </section>
  );
};

export default SearchFilterPage;
