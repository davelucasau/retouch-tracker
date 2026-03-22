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
  const [fileInput, setFileInput] = useState("");
  const [fileNotes, setFileNotes] = useState({});
  const [stagedItems, setStagedItems] = useState([]);

  const [collapsed, setCollapsed] = useState({});

  // LOAD
  useEffect(() => {
    const saved = localStorage.getItem("retouch-data");
    if (saved) setData(JSON.parse(saved));
  }, []);

  // SAVE
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

  // IMPORT
  const addCreative = () => {
    if (!newCreative) return;
    if (!creatives.includes(newCreative)) {
      setCreatives([...creatives, newCreative]);
    }
    setNewCreative("");
  };

  const addFilesToCreative = () => {
    if (!activeCreative || !newShoot) return;

    const files = fileInput.split("\n").filter(f => f.trim());

    const newItems = files.map(file => ({
      id: Date.now() + Math.random(),
      shoot: newShoot,
      creative: activeCreative,
      file,
      notes: fileNotes[file] || "",
      status: "pending"
    }));

    setStagedItems([...stagedItems, ...newItems]);
    setFileInput("");
    setFileNotes({});
  };

  const addShootToApp = () => {
    if (!newShoot || stagedItems.length === 0) return;

    setData([...data, ...stagedItems]);

    // reset
    setNewShoot("");
    setCreatives([]);
    setActiveCreative("");
    setStagedItems([]);
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
      <div className="bg-gradient-to-r from-orange-500 to-amber-400 text-black p-5 flex gap-6">
        {["workspace","import","shoots"].map(t => (
          <button key={t} onClick={()=>setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      <div className="p-6 space-y-6">

        {/* WORKSPACE */}
        {tab==="workspace" && (
          <>
            <div className="flex justify-between items-center">
              <div>{activeShoot || "No shoot selected"}</div>
              <button onClick={()=>setShowShootModal(true)}>
                Select Shoot
              </button>
            </div>

            {!activeShoot && <div>Select a shoot to begin</div>}

            {activeShoot && (
              <>
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
                        className="bg-white/5 p-3 rounded cursor-pointer"
                      >
                        {creative} ({items.length})
                      </div>

                      {!isCollapsed && (
                        <div className="space-y-3 mt-3">

                          {items.map(item => (
                            <div
                              key={item.id}
                              onClick={()=>cycleStatus(item.id)}
                              className="p-4 bg-blue-900/40 border border-white/30 rounded"
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
          </>
        )}

        {/* IMPORT */}
        {tab==="import" && (
          <div className="space-y-4">

            <input
              placeholder="Shoot title"
              value={newShoot}
              onChange={e=>setNewShoot(e.target.value)}
              className="w-full p-2 bg-black/20 rounded"
            />

            <div className="flex gap-2">
              <input
                placeholder="Add creative"
                value={newCreative}
                onChange={e=>setNewCreative(e.target.value)}
                className="flex-1 p-2 bg-black/20 rounded"
              />
              <button onClick={addCreative}>Add</button>
            </div>

            <div className="flex gap-2 flex-wrap">
              {creatives.map(c=>(
                <div
                  key={c}
                  onClick={()=>setActiveCreative(c)}
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
              className="w-full p-2 bg-black/20 rounded h-32"
            />

            {fileInput.split("\n").map(file=>(
              file.trim() && (
                <input
                  key={file}
                  placeholder={`Note for ${file}`}
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

            <button onClick={addShootToApp}>
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

      {/* SELECT SHOOT MODAL */}
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

      {/* SHOOT DETAIL MODAL */}
      {showShootDetail && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">

          <div className="bg-[#1e293b] p-6 rounded w-[500px]">

            <div className="flex justify-between mb-4">
              <div>{selectedShoot}</div>
              <button onClick={()=>setShowShootDetail(false)}>✕</button>
            </div>

            {data
              .filter(d=>d.shoot===selectedShoot)
              .map(item=>(
                <div key={item.id}>{item.file}</div>
              ))}

            <button
              onClick={()=>deleteShoot(selectedShoot)}
              className="text-red-400 mt-4"
            >
              Delete Shoot
            </button>

          </div>

        </div>
      )}

    </div>
  );
}