
import { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";

// eslint-disable-next-line no-undef
const Router = typeof __STATIC_PREVIEW__ !== "undefined" && __STATIC_PREVIEW__ ? HashRouter : BrowserRouter;
const isPreview = typeof __STATIC_PREVIEW__ !== "undefined" && __STATIC_PREVIEW__;
import { Toaster } from "@/components/ui/sonner";
import Landing from "@/pages/Landing";
import Match from "@/pages/Match";
import Results from "@/pages/Results";
import About from "@/pages/About";
import BuiltOnEmergent from "@/pages/BuiltOnEmergent";
import Sample from "@/pages/Sample";

function App() {
  return (
    <div className="App">
      {isPreview && (
        <div className="fixed bottom-3 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-[6px] border-2 border-[#2E3340] bg-[#FFA69E] px-3 py-2 text-center text-xs font-semibold text-[#2E3340] shadow-[3px_3px_0_#2E3340]" data-testid="preview-banner">
          Preview build: matching runs in your browser and profiles you add stay on this device only. The live version shares one pool.
        </div>
      )}
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/match" element={<Match />} />
          <Route path="/results/:profileId" element={<Results />} />
          <Route path="/about" element={<About />} />
          <Route path="/built-on-emergent" element={<BuiltOnEmergent />} />
          <Route path="/sample" element={<Sample />} />
        </Routes>
      </Router>
      <Toaster position="top-center" />
    </div>
  );
}

export default App;
