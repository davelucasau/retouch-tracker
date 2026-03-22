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

  const [creativeData, setCreativeData] = useState({}); // 🔥 key fix

  const [fileInput, setFileInput] = useState("");
  const [fileNotes, setFileNotes] = useState({});

  const [collapsed, setCollapsed] = useState({});

  // LOAD / SAVE
  useEffect(() => {
    const saved = localStorage.getItem("retouch-data");
    if (saved) setData(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("retouch-data", JSON.stringify(data));
  }, [data]);

  const shoots = [...new Set(data.map(d => d.shoot).filter(Boolean))];

  const getProgress = (shoot) => {
    const items = data.filter(d => d.shoot === shoot);
    const complete = items.filter(i => i.status === "completed").length;
    return {
      percent: items.length ? Math.round((complete / items.length) * 100) : 0,
      total: items.length,
      complete
    };
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

  const getStatusStyle = (status) => {
    if (status === "pending") return "bg-yellow-500/20 border-yellow-400/40";
    if (status === "in progress") return "bg-green-500/20 border-green-400/40";
    if (status === "completed") return "bg-blue-500/20 border-blue-400/40";
    return "bg-white/5";
  };

  // IMPORT LOGIC
  const addCreative = () => {
    if (!newCreative) return;
    if (!creatives.includes(newCreative)) {
      setCreatives([...creatives, newCreative]);
      setCreativeData({
        ...creativeData,
        [newCreative]: []
      });
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

  const addShootToApp = () => {
    const allItems = Object.values(creativeData).flat();

    if (!newShoot || allItems.length === 0) return;

    setData([...data, ...allItems]);

    // RESET
    setNewShoot("");
    setCreatives([]);
    setActiveCreative("");
    setCreativeData({});
    setFileInput("");
    setFileNotes({});
  };

  const deleteShoot = (shoot) => {
    if (!confirm("Delete this shoot?")) return;
    setData(data.filter(d => d.shoot !== shoot));
    setShowShootDetail(false);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-400 text-black p-5 flex justify-between">
        <div className="flex gap-6">
          {["workspace","import","shoots"].map(t => (
            <button key={t} onClick={()=>setTab(t)}>
              {t}
            </button>
          ))}
        </div>

        {tab==="workspace" && (
          <button
            onClick={()=>setShowShootModal(true)}
            className="bg-black/20 px-4 py-2 rounded"
          >
            Select Shoot
          </button>
        )}
      </div>

      <div className="p-6 space-y-6">

        {/* WORKSPACE */}
        {tab==="workspace" && (
          <>
            {activeShoot && (
              <div className="flex items-center gap-4">

                {(() => {
                  const p = getProgress(activeShoot);
                  return (
                    <div className="relative w-14 h-14">
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: `conic-gradient(#4ade80 ${p.percent}%, #333 ${p.percent}%)`
                        }}
                      />
                      <div className="absolute inset-2 bg-[#0f172a] rounded-full flex items-center justify-center text-xs">
                        {p.percent}%
                      </div>
                    </div>
                  );
                })()}

                <div>{activeShoot}</div>
              </div>
            )}

            {[...new Set(
              data.filter(d=>d.shoot===activeShoot).map(d=>d.creative)
            )].map((creative,index)=>{

              const items = data.filter(d=>d.shoot===activeShoot && d.creative===creative);
              const isCollapsed = collapsed[creative] ?? (index!==0);

              return (
                <div key={creative}>

                  <div
                    onClick={()=>setCollapsed({...collapsed,[creative]:!isCollapsed})}
                    className="bg-white/5 p-3 rounded cursor-pointer"
                  >
                    {creative} ({items.length})
                  </div>

                  {!isCollapsed && (
                    <div className="mt-3 space-y-3">

                      {items.map(item=>(
                        <div
                          key={item.id}
                          onClick={()=>cycleStatus(item.id)}
                          className={`p-4 rounded border ${getStatusStyle(item.status)}`}
                        >
                          <div className="flex justify-between">

                            <div>
                              <div>{item.file}</div>
                              {item.notes && (
                                <div className="text-sm text-gray-400">
                                  {item.notes}
                                </div>
                              )}
                            </div>

                            <div>{item.status}</div>

                          </div>
                        </div>
                      ))}

                    </div>
                  )}

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
              className="w-full p-3 bg-black/20 rounded"
            />

            <div className="flex gap-2">
              <input
                placeholder="Add creative"
                value={newCreative}
                onChange={e=>setNewCreative(e.target.value)}
                className="flex-1 p-3 bg-black/20 rounded"
              />
              <button onClick={addCreative}>Add</button>
            </div>

            <div className="flex gap-2 flex-wrap">
              {creatives.map(c=>(
                <div
                  key={c}
                  onClick={()=>switchCreative(c)}
                  className={`px-3 py-1 rounded ${
                    activeCreative===c ? "bg-blue-500" : "bg-white/10"
                  }`}
                >
                  {c}
                </div>
              ))}
            </div>

            <textarea
              placeholder="Paste filenames"
              value={fileInput}
              onChange={e=>setFileInput(e.target.value)}
              className="w-full p-3 bg-black/20 rounded h-32"
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
                  className="w-full p-2 bg-black/20 rounded"
                />
              )
            ))}

            <button onClick={addFilesToCreative}>
              Add Files to Creative
            </button>

            <button
              onClick={addShootToApp}
              className="bg-orange-400 text-black p-3 rounded"
            >
              Add Shoot
            </button>

          </div>
        )}

        {/* SHOOTS */}
        {tab==="shoots" && (
          <div className="space-y-3">
            {shoots.map(shoot=>(
              <div
                key={shoot}
                onClick={()=>{setSelectedShoot(shoot); setShowShootDetail(true)}}
                className="p-4 bg-blue-900/40 rounded cursor-pointer"
              >
                {shoot}
              </div>
            ))}
          </div>
        )}

      </div>

      {/* SHOOT MODAL */}
      {showShootDetail && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">

          <div className="bg-[#1e293b] p-6 rounded-xl w-[500px]">

            <div className="flex justify-between mb-4">
              <div>{selectedShoot}</div>
              <button onClick={()=>setShowShootDetail(false)}>✕</button>
            </div>

            <div className="mb-3">
              Progress: {getProgress(selectedShoot).percent}%
            </div>

            {[...new Set(
              data.filter(d=>d.shoot===selectedShoot).map(d=>d.creative)
            )].map(creative=>{

              const items = data.filter(d=>d.shoot===selectedShoot && d.creative===creative);

              return (
                <div key={creative} className="mb-4">

                  <div className="text-blue-300 mb-2">{creative}</div>

                  {items.map(item=>(
                    <div key={item.id} className="text-sm">
                      {item.file} — {item.notes}
                    </div>
                  ))}

                </div>
              );
            })}

            <button
              onClick={()=>deleteShoot(selectedShoot)}
              className="text-red-400 mt-4"
            >
              Delete Shoot
            </button>

          </div>

        </div>
      )}

      {/* SELECT SHOOT */}
      {showShootModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-[#1e293b] p-4 rounded">

            {shoots.map(s=>(
              <div key={s}
                onClick={()=>{setActiveShoot(s); setShowShootModal(false)}}
                className="p-2 cursor-pointer"
              >
                {s}
              </div>
            ))}

          </div>
        </div>
      )}

    </div>
  );
}