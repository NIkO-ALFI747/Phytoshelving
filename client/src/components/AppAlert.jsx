import React from "react";

function AppAlert() {
  return (
    // The main container now uses a dark background, large rounded corners, and a significant shadow.
    // The original grid positioning classes (col-span-5, row-span-9) are maintained.
    <div className="col-span-5 row-span-9 bg-slate-800 rounded-xl shadow-2xl w-full p-4">
      {/* This inner div acts as a container for the video, ensuring it's centered and has consistent styling. */}
      {/* It also has a subtle background and shadow to match the overall theme. */}
      <div className="relative flex justify-center items-center h-full rounded-xl overflow-hidden shadow-lg">
        {/* The iframe is now set to take up the full width and height of its parent container, making it responsive. */}
        <iframe
          className="w-full h-full"
          src="/Images/Growing Plants Time Lapse Compilation - 123 Days Of Growing in 2,5 Minutes.mp4"
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          autoPlay={true}
          loop
          muted
        ></iframe>
      </div>
    </div>
  );
}

export default AppAlert;
