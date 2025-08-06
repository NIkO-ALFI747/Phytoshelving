import React, { useEffect, useState } from 'react';

function AppShelf({ shelfArray }) {
  const [shelfData, setShelfData] = useState([]);

  // Use useEffect to update the state when the shelfArray prop changes.
  useEffect(() => {
    if (typeof shelfArray !== 'undefined') {
      setShelfData(Object.values(shelfArray));
    }
  }, [shelfArray]);

  let test = 7748000.523739777;
  console.log(parseFloat(test).toExponential(2));

  // Function to handle card clicks - you can add your custom logic here later.
  const handleCardClick = (shelf) => {
    console.log(`Shelf card clicked: ${shelf}`);
    // You can add navigation or other interactive functionality here.
  };

  return (
    // The main container is now a column container that sits on the right side.
    // We are restoring the original positioning classes: col-span-7, row-span-9, col-start-6.
    <div className="col-span-7 row-span-8 col-start-6 p-4 bg-slate-800 rounded-xl shadow-2xl w-full h-[300px] overflow-y-auto">
      <div className="flex flex-col space-y-4">
        {shelfData && shelfData.length > 0 ? (
          // Loop through each shelf's data and create a clickable card.
          shelfData.map((el, idx) => (
            // Each shelf card is now styled with a dark background, rounded corners, and a shadow.
            // The hover effect makes it clear that the card is interactive.
            <div
              key={idx}
              onClick={() => handleCardClick(el[0].shelf)}
              className="flex items-center gap-6 p-4 bg-slate-700 rounded-lg shadow-md hover:shadow-lg hover:scale-[1.01] transition-all duration-300 ease-in-out cursor-pointer"
            >
              {/* Shelf label and number */}
              <div className="flex flex-col items-center justify-center text-center text-slate-200">
                <p className="text-xl font-bold">Полка</p>
                <p className="text-4xl font-extrabold text-indigo-400">
                  {el[0].shelf}
                </p>
              </div>

              {/* Plants count container */}
              <div className="w-20 h-20 bg-slate-600 rounded-full flex justify-center items-center text-center text-slate-200 shadow-xl flex-shrink-0">
                <p className="text-lg font-semibold">
                  {el[0].plants}
                </p>
              </div>

              {/* Loop through each parameter for the current shelf */}
              <div className="flex-grow flex flex-row space-x-6 overflow-x-auto p-2">
                {el.map((param, paramIdx) => (
                  <div key={paramIdx} className="flex-shrink-0 flex flex-col items-center gap-2">
                    {/* Parameter value container */}
                    <div className="w-28 h-20 bg-slate-600 rounded-full flex justify-center items-center text-center text-slate-200 shadow-xl">
                      <p className='text-2xl font-bold'>
                        {param.parameter === 'Полив'
                          ? parseFloat(param.lastValue).toExponential(2)
                          : parseFloat(param.lastValue).toFixed(2)}
                      </p>
                    </div>
                    {/* Parameter name and type */}
                    <div className="text-xs text-center text-slate-400">
                      <p className="font-medium">{param.parameter}</p>
                      <p className="font-light">{param.parameters_type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          // Message to display when no shelf data is available, styled to match the new design
          <div className="flex-grow flex flex-col items-center justify-center text-slate-500 p-6">
            <p className="text-5xl mb-4">📚</p>
            <h3 className="text-xl font-semibold">Полки не найдены</h3>
          </div>
        )}
      </div>
    </div>
  );
}

export default AppShelf;
