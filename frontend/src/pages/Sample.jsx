import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { usePageTitle } from "@/lib/motion";

export default function Sample() {
  usePageTitle("FlatPal | Sample match");
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    api
      .get("/sample")
      .then((res) => {
        if (active) navigate(`/results/${res.data.profile_id}`, { replace: true });
      })
      .catch(() => {
        if (active) navigate("/match", { replace: true });
      });
    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF3DD]">
      <p className="font-display text-lg text-[#2E3340]">Picking a sample match...</p>
    </div>
  );
}
