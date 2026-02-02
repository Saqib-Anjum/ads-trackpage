import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { CloudDownload, Search, ChevronLeft, ChevronRight } from "lucide-react";



export default function ClicksDashboard({ apiBase = "https://blue-flamingo-376671.hostingersite.com/api/clicks" }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters & pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sessionId, setSessionId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // UI
  const [expanded, setExpanded] = useState(null);

  // Fetch data
  useEffect(() => {
    let ignore = false;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("limit", String(limit));
        params.set("page", String(page));
        if (sessionId) params.set("sessionId", sessionId);
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);

        const resp = await fetch(`${apiBase}?${params.toString()}`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json();
        if (!ignore) setData(Array.isArray(json.data) ? json.data : []);
      } catch (err) {
        if (!ignore) setError(err.message || "Fetch failed");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchData();
    return () => {
      ignore = true;
    };
  }, [apiBase, page, limit, sessionId, startDate, endDate]);

  // chart: counts by button (or page as fallback)
  const chartData = useMemo(() => {
    const map = new Map();
    data.forEach((d) => {
      const key = d.button || d.page || "(unknown)";
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [data]);

  function formatDate(iso) {
    if (!iso) return "-";
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  }

  function exportCSV() {
    if (!data || !data.length) return;
    const headers = [
      "timestamp",
      "button",
      "page",
      "referrer",
      "userAgent",
      "sessionId",
      "screenResolution",
      "metadata",
      "raw",
    ];
    const rows = data.map((r) =>
      headers
        .map((h) => {
          const val = r[h] === undefined ? "" : r[h];
          // stringify objects
          if (typeof val === "object") return JSON.stringify(val).replace(/\n/g, " ");
          return String(val).replace(/\r?\n/g, " ");
        })
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clicks_page${page}_limit${limit}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold">Clicks Dashboard</h1>
            <p className="text-sm text-slate-500">Live view of your click events — beautiful, fast, and filterable.</p>
          </div>
          {/* <div className="flex gap-2 items-center">
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white text-sm hover:opacity-90"
              title="Export visible rows as CSV"
            >
              <CloudDownload size={16} /> Export CSV
            </button>
          </div> */}
        </motion.header>

        {/* Filters + controls */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white shadow-md rounded-xl p-4 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-500 mb-1">Session ID</label>
              <div className="flex items-center">
                <input
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  placeholder="filter by session id"
                  className="flex-1 rounded-lg border px-3 py-2 text-sm"
                />
                <button
                  onClick={() => setSessionId("")}
                  className="ml-2 px-2 py-2 rounded-lg text-sm border"
                  title="Clear"
                >
                  ✕
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Rows per page</label>
              <select value={limit} onChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(1); }} className="w-full rounded-lg border px-3 py-2 text-sm">
                {[10, 25, 50, 100, 250].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end justify-end">
              <button
                onClick={() => { setPage(1); /* trigger fetch via deps */ }}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm"
              >
                <Search size={16} /> &nbsp; Apply
              </button>
            </div>
          </div>
        </motion.section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* left: table */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-xl overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="font-medium">Recent Clicks</h2>
                <div className="text-sm text-slate-500">Showing {data.length} rows</div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left p-3">When</th>
                      <th className="text-left p-3">Button</th>
                      <th className="text-left p-3">Page / Referrer</th>
                      <th className="text-left p-3">Session</th>
                      <th className="text-left p-3">Screen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} className="p-6 text-center">Loading…</td></tr>
                    ) : error ? (
                      <tr><td colSpan={6} className="p-6 text-center text-red-600">{error}</td></tr>
                    ) : data.length === 0 ? (
                      <tr><td colSpan={6} className="p-6 text-center text-slate-500">No click events found.</td></tr>
                    ) : (
                      data.map((r, idx) => (
                        <React.Fragment key={r._id || idx}>
                          <tr className="border-b hover:bg-slate-50">
                            <td className="p-3 align-top w-40">{formatDate(r.timestamp)}</td>
                            <td className="p-3 align-top max-w-xs truncate" title={r.button}>{r.button || "—"}</td>
                            <td className="p-3 align-top max-w-[48ch] truncate" title={r.page}>{r.page || r.referrer || "—"}</td>
                            <td className="p-3 align-top max-w-xs truncate" title={r.sessionId}>{r.sessionId || "—"}</td>
                            <td className="p-3 align-top">{r.screenResolution || "—"}</td>
                            <td className="p-3 align-top">{r.metadata.timezone || "—"}</td>
                            <td className="p-3 align-top">
                              <div className="flex gap-2">
                                {/* <button onClick={() => setExpanded(expanded === (r._id || idx) ? null : (r._id || idx))} className="px-2 py-1 rounded border text-xs">View</button> */}
                                {/* <button onClick={() => navigator.clipboard?.writeText(JSON.stringify(r))} className="px-2 py-1 rounded border text-xs">Copy</button> */}
                              </div>
                            </td>
                          </tr>

                          {/* {expanded === (r._id || idx) && (
                            <tr className="bg-slate-50">
                              <td colSpan={6} className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium mb-2">Raw JSON</h4>
                                    <pre className="text-xs max-h-48 overflow-auto bg-white p-3 rounded border">{JSON.stringify(r, null, 2)}</pre>
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-2">Metadata preview</h4>
                                    <div className="text-xs p-3 rounded border bg-white max-h-48 overflow-auto">
                                      {r.metadata ? <pre className="text-xs">{JSON.stringify(r.metadata, null, 2)}</pre> : <div className="text-slate-500">No metadata</div>}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )} */}

                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* pagination */}
              <div className="p-4 border-t flex items-center justify-between">
                <div className="text-sm text-slate-500">Page {page}</div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-2 rounded border flex items-center gap-2">
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <button onClick={() => setPage((p) => p + 1)} className="px-3 py-2 rounded border flex items-center gap-2">
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* right: charts & summary */}
          <aside>
            <div className="bg-white shadow rounded-xl p-4 mb-6">
              <h3 className="font-medium mb-2">Top buttons/pages</h3>
              <div style={{ height: 240 }}>
                {chartData.length === 0 ? (
                  <div className="text-sm text-slate-500">No data to chart.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={120} />
                      <Tooltip />
                      <Bar dataKey="count" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="bg-white shadow rounded-xl p-4">
              <h3 className="font-medium mb-2">Quick summary</h3>
              <ul className="text-sm space-y-2 text-slate-600">
                <li>Total rows shown: <strong className="text-slate-900">{data.length}</strong></li>
                <li>Filters: {sessionId ? <code className="px-1 py-0.5 rounded bg-slate-100">sessionId</code> : <span className="text-slate-400">none</span>}</li>
                <li>Date range: {startDate || "—"} → {endDate || "—"}</li>
              </ul>
            </div>
          </aside>
        </div>

        <footer className="text-center text-xs text-slate-400 mt-8">Tip: Use server-side pagination for large datasets. This UI assumes your API returns a page of results at a time.</footer>
      </div>
    </div>
  );
}
