import React, { useEffect } from "react";
import Plot from "plotly.js";
const PlotlyGraph = () => {
  useEffect(() => {
    const data = [
      {
        x: [1, 2, 3, 4, 5],
        y: [2, 4, 1, 5, 3],
      },
    ];
    const layout = {
      title: "Plotly Graph",
    };
    Plot.newPlot("graph", data, layout);
  }, []);

  return <div id="graph" />;
};

export default PlotlyGraph;
