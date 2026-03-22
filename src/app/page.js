"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [tab, setTab] = useState("workspace");
  const [data, setData] = useState([]);

  const [activeShoot, setActiveShoot] = useState("");
  const [showShootModal, setShowShootModal] = useState(false);

  const [showShootDetail, setShowShootDetail] = useState(false);
  const [selectedShoot, setSelectedShoot] = useState(null);

  // IMPORT STATE
  const [newShoot, setNewShoot] = useState("");
  const [newCreative, setNewCreative] = useState("");
  const [creatives, setCreatives] = useState([]);
  const [activeCreative, setActiveCreative] = useState("");

  const [creativeData, setCreativeData] = useState({});

  const [fileInput, setFileInput] = useState("");
  const [fileNotes, setFileNotes] = useState({});

  useEffect(() => {
    const saved = localStorage.getItem("retouch-data");
    if (saved) setData(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("retouch-data", JSON.stringify(data));
  }, [data]);

  const shoots = [...new Set(data.map(d => d.shoot))];

  const getProgress = (shoot) => {
    const items = data.filter(d => d.shoot === shoot);
    const complete = items.filter(i => i.status === "completed").length;
    return Math.round((complete / (items.length || 1)) * 100);
  };

  const cycleStatus = (id) => {
    setData(data.map(d => {
      if (d.id !== id) return d;

      const next =
        d.status === "pending"
          ? "in progress"
          : d.status === "in progress"
          ? "completed"
          : "pending";

      return { ...d, status: next };
    }));
  };

  const statusStyle = (status) => {
    if (status === "pending") return "bg-yellow-500/20 border-yellow-400";
    if (status === "in progress") return "bg-green-500/20 border-green-400";
    if (status === "completed") return "bg-blue-500/20 border-blue-400";
  };

  // IMPORT LOGIC
  const addCreative = () => {
    if (!newCreative) return;
    if (!creatives.includes(newCreative)) {
      setCreatives([...creatives, newCreative]);
      setCreativeData({ ...creativeData, [newCreative]: [] });
    }
    setNewCreative("");
  };

  const switchCreative = (c) => {
    setActiveCreative(c);

    const existing = creativeData[c] || [];

    setFileInput(existing.map(i => i.file).join("\n"));

    const notesObj = {};
    existing.forEach(i => {
      notesObj[i.file] = i.notes;
    });
    setFileNotes(notesObj);
  };

  const addFilesToCreative = () => {
    if (!activeCreative || !newShoot) return;

    const files = fileInput.split("\n").filter(f => f.trim());

    const items = files.map(file => ({
      id: Date.now() + Math.random(),
      shoot: newShoot,
      creative: activeCreative,
      file,
      notes: fileNotes[file] || "",
      status: "pending"
    }));

    setCreativeData({
      ...creativeData,
      [activeCreative]: items
    });

    setFileInput("");
    setFileNotes({});
  };

  const addShoot = () => {
    const all = Object.values(creativeData).flat();
    if (!newShoot || all.length === 0) return;

    setData([...data, ...all]);

    setNewShoot("");
    setCreatives([]);
    setActiveCreative("");
    setCreativeData({});
  };

  const deleteShoot = (shoot) => {
    if (!confirm("Delete this shoot?")) return;
    setData(data.filter(d => d.shoot !== shoot));
    setShowShootDetail(false);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">

      {/* HEADER */}
      <div className="flex justify-between p-4 bg-gradient-to-r from-orange-500 to-amber-400 text-black">
        <div className="flex gap-4">
          {["workspace","import","shoots"].map(t=>(
            <button key={t} onClick={()=>setTab(t)}>{t}</button>
          ))}
        </div>

        {tab==="workspace" && (
          <button onClick={()=>setShowShootModal(true)}>
            Select Shoot
          </button>
        )}
      </div>

      <div className="p-6">

        {/* WORKSPACE */}
        {tab==="workspace" && activeShoot && (
          <>
            <div className="mb-4">
              {activeShoot} ({getProgress(activeShoot)}%)
            </div>

            {[...new Set(
              data.filter(d=>d.shoot===activeShoot).map(d=>d.creative)
            )].map(c=>{

              const items = data.filter(d=>d.shoot===activeShoot && d.creative===c);

              return (
                <div key={c} className="mb-4">
                  <div>{c}</div>

                  {items.map(i=>(
                    <div
                      key={i.id}
                      onClick={()=>cycleStatus(i.id)}
                      className={`p-3 border rounded ${statusStyle(i.status)}`}
                    >
                      {i.file} — {i.notes}
                    </div>
                  ))}
                </div>
              );
            })}
          </>
        )}

        {/* IMPORT */}
        {tab==="import" && (
          <div className="space-y-4">

            <input
              placeholder="Shoot title"
              value={newShoot}
              onChange={e=>setNewShoot(e.target.value)}
              className="w-full p-2 bg-black/20"
            />

            <div className="flex gap-2">
              <input
                placeholder="Creative"
                value={newCreative}
                onChange={e=>setNewCreative(e.target.value)}
                className="flex-1 p-2 bg-black/20"
              />
              <button onClick={addCreative}>Add</button>
            </div>

            <div className="flex gap-2">
              {creatives.map(c=>(
                <div key={c} onClick={()=>switchCreative(c)}>
                  {c}
                </div>
              ))}
            </div>

            {activeCreative && (
              <>
                <div>{activeCreative}</div>

                <textarea
                  placeholder="Paste filenames (one per line)"
                  value={fileInput}
                  onChange={e=>setFileInput(e.target.value)}
                />

                {fileInput.split("\n").map(file=>(
                  file.trim() && (
                    <input
                      key={file}
                      placeholder={`Note for ${file}`}
                      value={fileNotes[file] || ""}
                      onChange={e=>{
                        setFileNotes({...fileNotes,[file]:e.target.value})
                      }}
                    />
                  )
                ))}

                <button onClick={addFilesToCreative}>
                  Add Files
                </button>
              </>
            )}

            <button onClick={addShoot}>
              Add Shoot
            </button>

          </div>
        )}

        {/* SHOOTS */}
        {tab==="shoots" && (
          <div>
            {shoots.map(s=>(
              <div key={s} onClick={()=>{setSelectedShoot(s);setShowShootDetail(true)}}>
                {s}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}