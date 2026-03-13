import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";
import { Plus, Save } from "lucide-react";

const emptyField = () => ({
  key: cryptoKey(),
  label: "",
  type: "text", // text, number, select, multiselect, payment
  required: false,
  options: [], // for select/multi
  default: null
});

function cryptoKey() {
  return Math.random().toString(36).slice(2, 9);
}

export default function TournamentFormBuilder() {
  const { id } = useParams();
  const [form, setForm] = useState({ fields: [] });
  const nav = useNavigate();

  useEffect(() => {
    async function load() {
      const { data } = await API.get(`/tournaments/${id}`);
      setForm(data.registrationForm || { fields: [] });
    }
    load();
  }, [id]);

  const addField = () => setForm(prev => ({ fields: [...(prev.fields || []), emptyField()] }));
  const saveForm = async () => {
    await API.put(`/tournaments/${id}/form`, { form });
    alert("Form saved");
    nav(`/tournaments/${id}`);
  };

  const updateField = (idx, patch) => {
    const f = [...form.fields];
    f[idx] = { ...f[idx], ...patch };
    setForm({ fields: f });
  };

  const removeField = (idx) => {
    const f = [...form.fields];
    f.splice(idx, 1);
    setForm({ fields: f });
  };

  return (
    <div className="p-6 bg-[#071019] min-h-screen text-white">
      <div className="max-w-3xl mx-auto bg-[#0f0f16]/90 p-6 rounded-2xl">
        <h2 className="text-2xl font-bold mb-4">Registration Form Builder</h2>
        {form.fields.map((fld, i) => (
          <div key={fld.key} className="mb-4 bg-[#09101a] p-4 rounded">
            <div className="flex gap-2 items-center">
              <input className="dark-input flex-1" value={fld.label} placeholder="Label" onChange={e => updateField(i, { label: e.target.value })} />
              <select className="dark-input w-40" value={fld.type} onChange={e => updateField(i, { type: e.target.value })}>
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="select">Select</option>
                <option value="multiselect">Multi-select</option>
                <option value="payment">Payment</option>
              </select>
              <label className="flex items-center gap-1 text-sm">
                <input type="checkbox" checked={fld.required} onChange={e => updateField(i, { required: e.target.checked })} />
                Required
              </label>
            </div>

            {/* options editor for select types */}
            {(fld.type === "select" || fld.type === "multiselect") && (
              <div className="mt-3">
                <div className="text-xs text-gray-400">Options (comma separated)</div>
                <input className="dark-input" value={(fld.options || []).join(",")} onChange={e => updateField(i, { options: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} />
              </div>
            )}

            {/* payment details helper */}
            {fld.type === "payment" && (
              <div className="mt-3 text-xs text-gray-300">
                <div>Payment field — on user side this will show a Pay button. Add any notes required for payment integration (bank name/account id/etc) in default or label.</div>
                <input className="dark-input mt-2" value={fld.default || ""} placeholder="Payment note (eg: UPI/Bank details)" onChange={e => updateField(i, { default: e.target.value })} />
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <button className="px-3 py-1 bg-red-600 rounded" onClick={() => removeField(i)}>Remove</button>
            </div>
          </div>
        ))}

        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-violet-600 rounded" onClick={addField}><Plus /> Add Field</button>
          <button className="flex items-center gap-2 px-3 py-2 bg-green-600 rounded" onClick={saveForm}><Save /> Save Form</button>
        </div>
      </div>
    </div>
  );
}
