"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [tab, setTab] = useState("workspace");
  const [data, setData] = useState([]);

  const [activeShoot, setActiveShoot] = useState("");
  const [showShootModal, setShowShootModal] = useState(false);

  const [selectedShoot, setSelectedShoot] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const [currentShoot, setCurrentShoot] = useState("");
  const [selectedCreative, setSelectedCreative] = useState("");
  const [bulkInput, setBulkInput] = useState("");

  const [collapsed, setCollapsed] = useState({});

  useEffect(() => {
    const saved = localStorage.getItem("retouch-data");
    if (saved) {
      setData(JSON.parse(saved).filter(d => d.file));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("retouch-data", JSON.stringify(data));
  }, [data]);

  const shoots = [...new Set(data.map(d => d.shoot).filter(Boolean))];

  const getProgress = (shoot) => {
    const items = data.filter(d => d.shoot === shoot);
    const complete = items.filter(i => i.status === "completed").length;

    return {
      percent: items.length
        ? Math.round((complete / items.length) * 100)
        : 0,
      complete,
      total: items.length
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

  const handleImport = () => {
    const files = bulkInput.split("\n").filter(f => f.trim());

    const newItems = files.map(file => ({
      id: Date.now() + Math.random(),
      shoot: currentShoot || "Unsorted",
      creative: selectedCreative || "Unassigned",
      file,
      notes: "",
      status: "pending"
    }));

    setData([...data, ...newItems]);
    setBulkInput("");
  };

  const deleteImage = (id) => {
    if (!confirm("Delete this image?")) return;
    setData(data.filter(d => d.id !== id));
  };

  const deleteCreative = (shoot, creative) => {
    if (!confirm("Delete this creative?")) return;
    setData(data.filter(d => !(d.shoot === shoot && d.creative === creative)));
  };

  const deleteShoot = (shoot) => {
    if (!confirm("Delete this shoot?")) return;
    setData(data.filter(d => d.shoot !== shoot));
    setSelectedShoot(null);
  };

  const getStatusStyle = (status) => {
    if (status === "pending") return "bg-yellow-500/20 border-yellow-400/40";
    if (status === "in progress") return "bg-green-500/20 border-green-400/40";
    if (status === "completed") return "bg-blue-500/20 border-blue-400/40";
    return "bg-white/5";
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-400 text-black p-5 flex gap-6 text-base">
        <div className="font-semibold text-lg">Retouch Tracker</div>

        {["workspace","import","shoots"].map(t => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setSelectedShoot(null);
              setEditMode(false);
            }}
            className={tab===t ? "bg-black/20 px-3 py-2 rounded-lg" : ""}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-8">

        {/* WORKSPACE */}
        {tab==="workspace" && (
          <>
            <div className="flex justify-between items-center">
              <div className="text-lg font-medium">
                {activeShoot || "No shoot selected"}
              </div>

              <button
                onClick={() => setShowShootModal(true)}
                className="bg-white/10 px-5 py-3 rounded-xl text-sm"
              >
                Select Shoot
              </button>
            </div>

            {!activeShoot && (
              <div className="text-gray-400 text-base">
                Select a shoot to begin working
              </div>
            )}

            {activeShoot && (
              <>
                {/* PROGRESS */}
                {(() => {
                  const p = getProgress(activeShoot);
                  return (
                    <div className="flex items-center gap-5">

                      <div className="relative w-16 h-16">
                        <div
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: `conic-gradient(#4ade80 ${p.percent}%, #333 ${p.percent}%)`
                          }}
                        />
                        <div className="absolute inset-2 bg-[#0f172a] rounded-full flex items-center justify-center text-sm">
                          {p.percent}%
                        </div>
                      </div>

                      <div className="text-base text-gray-300">
                        {p.complete}/{p.total} complete
                      </div>

                    </div>
                  );
                })()}

                {/* CREATIVES */}
                {[...new Set(
                  data
                    .filter(d => d.shoot === activeShoot)
                    .map(d => d.creative || "Unassigned")
                )].map((creative, index) => {

                  const items = data.filter(d =>
                    d.shoot === activeShoot &&
                    (d.creative || "Unassigned") === creative
                  );

                  const isCollapsed =
                    collapsed[creative] ?? (index !== 0);

                  return (
                    <div key={creative}>

                      <div
                        onClick={() =>
                          setCollapsed(prev => ({
                            ...prev,
                            [creative]: !isCollapsed
                          }))
                        }
                        className="flex justify-between items-center bg-white/5 px-4 py-3 rounded-xl cursor-pointer"
                      >
                        <div className="text-blue-300 text-base">
                          {creative} ({items.length})
                        </div>
                      </div>

                      {!isCollapsed && (
                        <div className="mt-4 space-y-4">

                          {items.map(item => (
                            <div
                              key={item.id}
                              onClick={() => cycleStatus(item.id)}
                              className={`p-5 rounded-xl border transition active:scale-[0.98] ${getStatusStyle(item.status)}`}
                            >
                              <div className="flex justify-between items-center">

                                {/* LEFT */}
                                <div>
                                  <div className="text-base">{item.file}</div>

                                  {item.notes && (
                                    <div className="text-sm text-gray-400 mt-1">
                                      {item.notes}
                                    </div>
                                  )}
                                </div>

                                {/* RIGHT STATUS */}
                                <div className="text-sm text-gray-300 capitalize">
                                  {item.status}
                                </div>

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
          </>
        )}

        {/* IMPORT */}
        {tab==="import" && (
          <div className="space-y-5">

            <input
              placeholder="Shoot"
              value={currentShoot}
              onChange={e=>setCurrentShoot(e.target.value)}
              className="w-full p-4 bg-black/20 rounded-xl text-base"
            />

            <input
              placeholder="Creative"
              value={selectedCreative}
              onChange={e=>setSelectedCreative(e.target.value)}
              className="w-full p-4 bg-black/20 rounded-xl text-base"
            />

            <textarea
              placeholder="Paste filenames"
              value={bulkInput}
              onChange={e=>setBulkInput(e.target.value)}
              className="w-full p-4 bg-black/20 rounded-xl h-40 text-base"
            />

            <button
              onClick={handleImport}
              className="bg-orange-400 text-black px-5 py-3 rounded-xl text-base"
            >
              Add Files
            </button>

          </div>
        )}

        {/* SHOOTS */}
        {tab==="shoots" && !selectedShoot && (
          <div className="space-y-4">

            {shoots.map(shoot=>{
              const p = getProgress(shoot);

              return (
                <div key={shoot}
                  onClick={()=>setSelectedShoot(shoot)}
                  className="bg-blue-900/40 p-5 rounded-xl flex justify-between text-base cursor-pointer">

                  <div>
                    <div>{shoot}</div>
                    <div className="text-gray-400">
                      {p.complete}/{p.total}
                    </div>
                  </div>

                  <div>{p.percent}%</div>

                </div>
              );
            })}

          </div>
        )}

        {/* SHOOT DETAIL */}
        {tab==="shoots" && selectedShoot && (
          <div className="space-y-4">

            <button onClick={()=>setSelectedShoot(null)}>
              ← Back
            </button>

            <div className="flex justify-between">
              <div className="text-lg">{selectedShoot}</div>

              <div className="flex gap-4">
                <button onClick={()=>setEditMode(!editMode)}>
                  {editMode ? "Done" : "Edit"}
                </button>

                <button
                  onClick={()=>deleteShoot(selectedShoot)}
                  className="text-red-400"
                >
                  Delete
                </button>
              </div>
            </div>

            {[...new Set(
              data.filter(d=>d.shoot===selectedShoot).map(d=>d.creative)
            )].map(creative=>(
              <div key={creative}>

                <div className="flex justify-between">
                  <div>{creative}</div>

                  {editMode && (
                    <button
                      onClick={()=>deleteCreative(selectedShoot,creative)}
                      className="text-red-400"
                    >
                      Delete
                    </button>
                  )}
                </div>

                {data
                  .filter(d=>d.shoot===selectedShoot && d.creative===creative)
                  .map(item=>(
                    <div key={item.id} className="flex justify-between pl-4">

                      <div>{item.file}</div>

                      {editMode && (
                        <button
                          onClick={()=>deleteImage(item.id)}
                          className="text-red-400"
                        >
                          Delete
                        </button>
                      )}

                    </div>
                  ))}

              </div>
            ))}

          </div>
        )}

      </div>

      {/* MODAL */}
      {showShootModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">

          <div className="bg-[#1e293b] w-[400px] rounded-xl p-4">

            <div className="flex justify-between mb-3">
              <div>Select Shoot</div>
              <button onClick={()=>setShowShootModal(false)}>✕</button>
            </div>

            {shoots.map(s=>(
              <div key={s}
                onClick={()=>{
                  setActiveShoot(s);
                  setShowShootModal(false);
                }}
                className="p-3 hover:bg-white/10 cursor-pointer text-base"
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