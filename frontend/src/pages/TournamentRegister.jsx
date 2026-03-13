import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api";

export default function TournamentRegister() {
  const { id, slug } = useParams();
  const [t, setT] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await API.get(`/tournaments/${id}/register/${slug}`);
        setT(data);
      } catch (err) {
        alert("Not available");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, slug]);

  if (loading) return <div>Loading...</div>;
  if (!t) return <div>Not found</div>;

  const handleChange = (key, v) => setAnswers(prev => ({ ...prev, [key]: v }));

  const submit = async () => {
    try {
      // validate required client-side
      for (const f of t.registrationForm?.fields || []) {
        if (f.required && (answers[f.key] === undefined || answers[f.key] === "")) {
          return alert(`Field ${f.label} required`);
        }
      }

      // If fields include payment type, show a Pay step (MVP: show confirm)
      const hasPayment = (t.registrationForm?.fields || []).some(f => f.type === "payment");
      if (hasPayment) {
        // TODO: integrate gateway; for now ask confirm
        const ok = window.confirm("This registration requires payment. Proceed with mock payment?");
        if (!ok) return;
        // simulate payment success...
      }

      await API.post(`/tournaments/${id}/register`, { answers });
      alert("Registered. Good luck.");
    } catch (err) {
      alert(err?.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen p-6 bg-[#081019] text-white">
      <div className="max-w-3xl mx-auto bg-[#0f1014]/80 p-6 rounded">
        <h1 className="text-2xl font-bold">{t.name}</h1>
        <p className="text-sm text-gray-400 mb-4">{t.tagline}</p>

        <div className="space-y-4">
          {(t.registrationForm?.fields || []).map(f => (
            <div key={f.key}>
              <label className="text-sm font-semibold">{f.label} {f.required && <span className="text-red-400">*</span>}</label>

              {f.type === "text" && (
                <input className="dark-input w-full" value={answers[f.key] || ""} onChange={e => handleChange(f.key, e.target.value)} />
              )}

              {f.type === "number" && (
                <input type="number" className="dark-input w-full" value={answers[f.key] || ""} onChange={e => handleChange(f.key, e.target.value)} />
              )}

              {f.type === "select" && (
                <select className="dark-input w-full" value={answers[f.key] || ""} onChange={e => handleChange(f.key, e.target.value)}>
                  <option value="">— select —</option>
                  {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              )}

              {f.type === "multiselect" && (
                <select multiple className="dark-input w-full" value={answers[f.key] || []} onChange={e => {
                  const vals = Array.from(e.target.selectedOptions).map(o => o.value);
                  handleChange(f.key, vals);
                }}>
                  {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              )}

              {f.type === "payment" && (
                <div className="mt-2 flex gap-2 items-center">
                  <div className="text-sm text-gray-300">{f.default || "Payment required"}</div>
                  <button className="ml-auto px-3 py-1 bg-emerald-600 rounded" onClick={() => alert("Mock pay — integrate later")}>Pay Now</button>
                </div>
              )}
            </div>
          ))}

          <div className="mt-6">
            <button onClick={submit} className="px-4 py-2 bg-cyan-500 rounded">Submit Registration</button>
          </div>
        </div>
      </div>
    </div>
  );
}
