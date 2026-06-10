import { useState, useEffect } from "react";

// ─── Supabase Client ─────────────────────────────────────────────
const SUPABASE_URL = "https://yzdglmopwhjgknusjchn.supabase.co";
const SUPABASE_KEY = "eyJhbGci0iJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6ZGdsbW9wd2hqZ2tudXNqY2huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMzQ5NDUsImV4cCI6MjA2NDcxMDk0NX0.eyJhbGci0iJIUzI1NiIsInR5cCI6IkpXVCJ9";

const sb = {
async getAll(table) {
const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&order=created_at.desc`, {
headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
});
const rows = await res.json();
return rows.map(r => r.data);
},
async insert(table, data) {
await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
method: "POST",
headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
body: JSON.stringify({ data })
});
},
async update(table, id, data) {
await fetch(`${SUPABASE_URL}/rest/v1/${table}?data->>id=eq.${id}`, {
method: "PATCH",
headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
body: JSON.stringify({ data })
});
},
async delete(table, id) {
await fetch(`${SUPABASE_URL}/rest/v1/${table}?data->>id=eq.${id}`, {
method: "DELETE",
headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
});
},
async replaceAll(table, items) {
// Delete all then insert all - simplest sync approach
await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=gte.0`, {
method: "DELETE",
headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
});
if (items.length > 0) {
const rows = items.map(data => ({ data }));
await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
method: "POST",
headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
body: JSON.stringify(rows)
});
}
}
};

// ─── Cloud Sync Hook ─────────────────────────────────────────────
const TABLE_MAP = {
tasks:"tasks", projects:"projects", clients:"clients", inquiries:"inquiries",
contracts:"contracts", quotes:"quotes", quickquotes:"quickquotes",
inspection:"inspection", acceptance:"acceptance", pending:"pending",
knowledge:"knowledge", lighting:"lighting", design:"design",
ledger:"ledger", purchase:"purchase", expense:"expense", payroll:"payroll",
monthly:"monthly", attendance:"attendance", leave:"leave_requests",
overtime:"overtime", materials:"materials", inventory:"inventory",
tracking:"tracking", losses:"losses", appointments:"appointments",
schedule:"schedule", album:"album"
};

function useCloudSync(key, defaultValue) {
const tableName = TABLE_MAP[key];
const [value, setValue] = useState(defaultValue);
const [synced, setSynced] = useState(false);

// Load from cloud on mount
useEffect(() => {
if (!tableName) return;
sb.getAll(tableName).then(rows => {
if (rows && rows.length > 0) setValue(rows.filter(Boolean));
setSynced(true);
}).catch(() => setSynced(true));
}, [tableName]);

// Save to cloud when value changes (after initial sync)
useEffect(() => {
if (!synced || !tableName) return;
const t = setTimeout(() => {
sb.replaceAll(tableName, value).catch(console.error);
}, 1000); // debounce 1 second
return () => clearTimeout(t);
}, [value, synced, tableName]);

// Also keep localStorage as fallback
useEffect(() => {
try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}, [key, value]);

return [value, setValue];
}



function useLocalStorage(key, defaultValue) {
const [value, setValue] = useState(() => {
try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : defaultValue; }
catch { return defaultValue; }
});
useEffect(() => { localStorage.setItem(key, JSON.stringify(value)); }, [key, value]);
return [value, setValue];
}

const NAV_SECTIONS = [
{ label: "DASHBOARD", items: [
{ icon: "⊞", label: "工作面板", id: "dashboard" },
{ icon: "≡", label: "所有任務", id: "tasks" },
{ icon: "📅", label: "行事曆", id: "calendar" },
{ icon: "📋", label: "預約總覽", id: "appointments" },
]},
{ label: "客戶與排程", items: [
{ icon: "👥", label: "客戶管理", id: "clients" },
{ icon: "🗓", label: "智慧排程", id: "schedule" },
]},
{ label: "專案管理", items: [
{ icon: "📝", label: "諮詢單管理", id: "inquiries" },
{ icon: "🏠", label: "專案總覽", id: "projects" },
{ icon: "📸", label: "專案相簿", id: "album" },
{ icon: "📄", label: "合約管理", id: "contracts" },
{ icon: "💰", label: "報價單", id: "quotes" },
{ icon: "📋", label: "初步報價", id: "quickquote" },
{ icon: "🔍", label: "工程檢核", id: "inspection" },
{ icon: "✅", label: "工程驗收", id: "acceptance" },
{ icon: "👤", label: "待客戶確認", id: "pending" },
{ icon: "📚", label: "知識文件庫", id: "knowledge" },
]},
{ label: "工具", items: [
{ icon: "💡", label: "燈光設計", id: "lighting" },
{ icon: "🖥", label: "設計提案", id: "design" },
{ icon: "⊞", label: "磁磚計算", id: "tiles" },
{ icon: "📄", label: "報表輸出", id: "reports" },
]},
{ label: "財務管理", items: [
{ icon: "📒", label: "公司帳本", id: "ledger" },
{ icon: "💵", label: "採購申請單", id: "purchase" },
{ icon: "🧾", label: "報銷申請", id: "expense" },
{ icon: "💳", label: "薪資計算", id: "payroll" },
{ icon: "🐷", label: "月度支出", id: "monthly" },
{ icon: "📈", label: "財務預測", id: "forecast" },
]},
{ label: "人事管理", items: [
{ icon: "⏱", label: "出勤記錄", id: "attendance" },
{ icon: "📄", label: "假單管理", id: "leave" },
{ icon: "⏰", label: "加班申請", id: "overtime" },
]},
{ label: "材料資源", items: [
{ icon: "📦", label: "建材庫", id: "materials" },
{ icon: "📦", label: "物料庫存", id: "inventory" },
{ icon: "🔗", label: "備料追蹤", id: "tracking" },
]},
{ label: "經營分析", items: [
{ icon: "📈", label: "利潤分析", id: "profit" },
{ icon: "⚠", label: "異常損失", id: "losses" },
]},
{ label: "系統設定", items: [
{ icon: "⚙", label: "系統設定", id: "settings" },
]},
];

function getProjectList() {
try {
const p = JSON.parse(localStorage.getItem("projects") || "[]");
const names = p.map(x => x.name).filter(Boolean);
return [...new Set([...names, "公司內部"])];
} catch { return ["公司內部"]; }
}
const SC = { "施工中":"blue","設計中":"yellow","驗收中":"green","報價中":"gray","完工":"green","待審":"yellow","已核准":"green","已拒絕":"red","進行中":"blue","已完成":"green","草稿":"gray","確認中":"blue","已確認":"green","取消":"red" };

function Badge({ color, children }) {
const c = { red:"bg-red-100 text-red-700", green:"bg-green-100 text-green-700", yellow:"bg-yellow-100 text-yellow-700", blue:"bg-blue-100 text-blue-700", gray:"bg-gray-100 text-gray-600" };
return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c[color]||c.gray}`}>{children}</span>;
}

function Modal({ title, onClose, children }) {
return (
<div className="fixed inset-0 z-50 flex items-end justify-center" style={{maxWidth:430,margin:"0 auto"}}>
<div className="absolute inset-0 bg-black/40" onClick={onClose}/>
<div className="relative bg-white rounded-t-3xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
<div className="flex justify-between items-center mb-5">
<h3 className="text-base font-semibold text-stone-800">{title}</h3>
<button onClick={onClose} className="text-stone-400 text-xl w-8 h-8 flex items-center justify-center">✕</button>
</div>
{children}
</div>
</div>
);
}

function Inp({ label, ...p }) {
return <div>{label&&<label className="text-xs text-stone-400 mb-1 block">{label}</label>}<input className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-stone-400" {...p}/></div>;
}
function Sel({ label, options, ...p }) {
return <div>{label&&<label className="text-xs text-stone-400 mb-1 block">{label}</label>}<select className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-stone-400 bg-white" {...p}>{options.map(o=><option key={o} value={o}>{o}</option>)}</select></div>;
}
function Txt({ label, ...p }) {
return <div>{label&&<label className="text-xs text-stone-400 mb-1 block">{label}</label>}<textarea className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-stone-400 resize-none" rows={3} {...p}/></div>;
}
function Btn({ onClick, label="儲存" }) {
return <button onClick={onClick} className="w-full bg-stone-800 text-white rounded-xl py-3 mt-4 font-medium text-sm">{label}</button>;
}

function ListPage({ items, onAdd, onEdit, onDelete, addLabel="新增", renderItem, extra }) {
const [delId, setDelId] = useState(null);
return (
<div className="space-y-3">
<div className="flex justify-between items-center">
<span className="text-sm text-stone-400">共 {items.length} 筆</span>
<button onClick={onAdd} className="text-xs bg-stone-800 text-white px-3 py-1.5 rounded-lg">＋ {addLabel}</button>
</div>
{extra}
{items.length===0&&<div className="text-center text-stone-400 py-12 text-sm">尚無資料</div>}
{items.map(item=>(
<div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
{renderItem(item)}
<div className="flex gap-2 mt-3 pt-3 border-t border-stone-50">
<button onClick={()=>onEdit(item)} className="flex-1 text-xs text-stone-500 py-1.5 rounded-lg bg-stone-50">✏️ 編輯</button>
<button onClick={()=>setDelId(item.id)} className="flex-1 text-xs text-red-400 py-1.5 rounded-lg bg-red-50">🗑 刪除</button>
</div>
</div>
))}
{delId&&(
<div className="fixed inset-0 z-50 flex items-center justify-center" style={{maxWidth:430,margin:"0 auto"}}>
<div className="absolute inset-0 bg-black/40" onClick={()=>setDelId(null)}/>
<div className="relative bg-white rounded-2xl p-6 mx-4 shadow-2xl">
<div className="text-base font-semibold text-stone-800 mb-2">確認刪除？</div>
<div className="text-sm text-stone-400 mb-5">此筆資料將被永久刪除。</div>
<div className="flex gap-3">
<button onClick={()=>setDelId(null)} className="flex-1 bg-stone-100 text-stone-600 rounded-xl py-2.5 text-sm">取消</button>
<button onClick={()=>{onDelete(delId);setDelId(null);}} className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm">刪除</button>
</div>
</div>
</div>
)}
</div>
);
}
function Dashboard({ tasks, projects, attendance, setActiveId }) {
const pending = tasks.filter(t=>!t.done);
const todayStr = new Date().toLocaleDateString("zh-TW");
const todayAtt = attendance.find(a=>a.date===todayStr);
return (
<div className="space-y-4">
<div className="grid grid-cols-2 gap-3">
<div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
<div className="text-xs text-stone-400 mb-1">進行中專案</div>
<div className="text-2xl font-bold text-stone-800">{projects.filter(p=>p.status!=="完工").length}</div>
<div className="text-xs text-stone-400 mt-1">共 {projects.length} 個</div>
</div>
<div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
<div className="text-xs text-stone-400 mb-1">待完成任務</div>
<div className="text-2xl font-bold text-red-500">{pending.length}</div>
<div className="text-xs text-stone-400 mt-1">需要處理</div>
</div>
</div>
<div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
<div className="text-xs text-stone-400 mb-3">今日出勤</div>
<div className="grid grid-cols-3 gap-2 text-center mb-3">
{[["上班",todayAtt?.clockIn||"—"],["下班",todayAtt?.clockOut||"—"],["工時",todayAtt?.hours||"—"]].map(([l,v])=>(
<div key={l}><div className="text-xs text-stone-400 mb-1">{l}</div><div className="text-sm font-bold text-stone-700">{v}</div></div>
))}
</div>
<button onClick={()=>setActiveId("attendance")} className="w-full bg-stone-800 text-white text-sm rounded-xl py-2 font-medium">前往打卡</button>
</div>
<div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
<div className="text-xs text-stone-400 mb-3">近期待辦</div>
{pending.slice(0,4).map(t=>(
<div key={t.id} className="flex items-center gap-3 mb-2 last:mb-0">
<div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.priority==="高"?"bg-red-400":t.priority==="中"?"bg-yellow-400":"bg-green-400"}`}/>
<div className="flex-1 min-w-0">
<div className="text-sm text-stone-700 truncate">{t.title}</div>
<div className="text-xs text-stone-400">{t.project}</div>
</div>
<span className="text-xs text-stone-400">{t.due}</span>
</div>
))}
{pending.length===0&&<div className="text-sm text-stone-400 text-center py-2">🎉 所有任務已完成！</div>}
</div>
{projects.length>0&&(
<div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
<div className="text-xs text-stone-400 mb-3">專案進度</div>
{projects.slice(0,3).map(p=>(
<div key={p.id} className="mb-3 last:mb-0">
<div className="flex justify-between text-xs mb-1">
<span className="text-stone-600 truncate max-w-[60%]">{p.name}</span>
<Badge color={SC[p.status]}>{p.status}</Badge>
</div>
<div className="bg-stone-100 rounded-full h-1.5">
<div className="bg-emerald-500 h-1.5 rounded-full" style={{width:`${p.progress||0}%`}}/>
</div>
</div>
))}
</div>
)}
</div>
);
}

function Tasks({ tasks, setTasks }) {
const [modal, setModal] = useState(false);
const [edit, setEdit] = useState(null);
const [filter, setFilter] = useState("全部");
const blank = {title:"",project:"",priority:"中",due:"",note:""};
const [form, setForm] = useState(blank);
const open = (item=null)=>{setEdit(item);setForm(item||blank);setModal(true);};
const save = ()=>{
if(!form.title.trim())return;
if(edit)setTasks(p=>p.map(t=>t.id===edit.id?{...t,...form}:t));
else setTasks(p=>[{...form,id:Date.now(),done:false},...p]);
setModal(false);
};
const filtered = tasks.filter(t=>filter==="全部"||(filter==="未完成"&&!t.done)||(filter==="已完成"&&t.done));
return (
<>
<div className="space-y-3">
<div className="flex justify-between items-center">
<div className="flex gap-1">
{["全部","未完成","已完成"].map(f=>(
<button key={f} onClick={()=>setFilter(f)} className={`text-xs px-3 py-1.5 rounded-lg font-medium ${filter===f?"bg-stone-800 text-white":"bg-stone-100 text-stone-500"}`}>{f}</button>
))}
</div>
<button onClick={()=>open()} className="text-xs bg-stone-800 text-white px-3 py-1.5 rounded-lg">＋ 新增</button>
</div>
{filtered.length===0&&<div className="text-center text-stone-400 py-12 text-sm">沒有任務</div>}
{filtered.map(t=>(
<div key={t.id} className={`bg-white rounded-2xl p-4 shadow-sm border border-stone-100 ${t.done?"opacity-50":""}`}>
<div className="flex items-start gap-3">
<button onClick={()=>setTasks(p=>p.map(x=>x.id===t.id?{...x,done:!x.done}:x))} className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${t.done?"bg-stone-800 border-stone-800 text-white":"border-stone-300"}`}>
{t.done&&<span className="text-xs">✓</span>}
</button>
<div className="flex-1 min-w-0">
<div className={`text-sm font-medium ${t.done?"line-through text-stone-400":"text-stone-800"}`}>{t.title}</div>
{t.project&&<div className="text-xs text-stone-400 mt-0.5">{t.project}</div>}
{t.note&&<div className="text-xs text-stone-400 mt-1">{t.note}</div>}
</div>
<div className="flex flex-col items-end gap-1">
<Badge color={t.priority==="高"?"red":t.priority==="中"?"yellow":"green"}>{t.priority}</Badge>
{t.due&&<span className="text-xs text-stone-400">{t.due}</span>}
</div>
</div>
<div className="flex gap-2 mt-3 pt-3 border-t border-stone-50">
<button onClick={()=>open(t)} className="flex-1 text-xs text-stone-500 py-1.5 rounded-lg bg-stone-50">✏️ 編輯</button>
<button onClick={()=>setTasks(p=>p.filter(x=>x.id!==t.id))} className="flex-1 text-xs text-red-400 py-1.5 rounded-lg bg-red-50">🗑 刪除</button>
</div>
</div>
))}
</div>
{modal&&(
<Modal title={edit?"編輯任務":"新增任務"} onClose={()=>setModal(false)}>
<div className="space-y-3">
<Inp label="任務名稱 *" placeholder="輸入任務名稱" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
<Sel label="所屬專案" options={["",...getProjectList()]} value={form.project} onChange={e=>setForm({...form,project:e.target.value})}/>
<div className="grid grid-cols-2 gap-3">
<Sel label="優先度" options={["高","中","低"]} value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}/>
<Inp label="截止日期" type="date" value={form.due} onChange={e=>setForm({...form,due:e.target.value})}/>
</div>
<Txt label="備註" value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/>
</div>
<Btn onClick={save} label={edit?"儲存變更":"新增任務"}/>
</Modal>
)}
</>
);
}

function Calendar({ tasks }) {
const today = new Date();
const [year, setYear] = useState(today.getFullYear());
const [month, setMonth] = useState(today.getMonth());
const firstDay = new Date(year,month,1).getDay();
const daysInMonth = new Date(year,month+1,0).getDate();
const mNames = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
const taskDays = new Set(tasks.map(t=>{
if(!t.due)return null;
const d = new Date(t.due);
return(d.getFullYear()===year&&d.getMonth()===month)?d.getDate():null;
}).filter(Boolean));
return (
<div className="space-y-3">
<div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
<div className="flex justify-between items-center mb-4">
<button onClick={()=>{if(month===0){setMonth(11);setYear(y=>y-1)}else setMonth(m=>m-1);}} className="w-8 h-8 flex items-center justify-center text-stone-400 text-xl">‹</button>
<span className="text-sm font-semibold text-stone-700">{year}年 {mNames[month]}</span>
<button onClick={()=>{if(month===11){setMonth(0);setYear(y=>y+1)}else setMonth(m=>m+1);}} className="w-8 h-8 flex items-center justify-center text-stone-400 text-xl">›</button>
</div>
<div className="grid grid-cols-7 text-center mb-2">
{["日","一","二","三","四","五","六"].map(d=><div key={d} className="text-xs text-stone-400 py-1">{d}</div>)}
</div>
<div className="grid grid-cols-7 text-center gap-y-1">
{Array(firstDay).fill(null).map((_,i)=><div key={`e${i}`}/>)}
{Array(daysInMonth).fill(null).map((_,i)=>{
const day=i+1;
const isToday=day===today.getDate()&&month===today.getMonth()&&year===today.getFullYear();
return(
<div key={day} className="flex flex-col items-center py-1">
<div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm ${isToday?"bg-stone-800 text-white font-bold":""}`}>{day}</div>
{taskDays.has(day)&&<div className="w-1 h-1 bg-red-400 rounded-full mt-0.5"/>}
</div>
);
})}
</div>
</div>
<div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
<div className="text-xs text-stone-400 mb-3">本月有截止日的任務</div>
{tasks.filter(t=>{if(!t.due)return false;const d=new Date(t.due);return d.getFullYear()===year&&d.getMonth()===month;}).map(t=>(
<div key={t.id} className="flex items-center gap-3 mb-2 last:mb-0">
<div className={`w-2 h-2 rounded-full ${t.done?"bg-green-400":"bg-red-400"}`}/>
<div className="flex-1 text-sm text-stone-700 truncate">{t.title}</div>
<span className="text-xs text-stone-400">{t.due}</span>
</div>
))}
</div>
</div>
);
}
function mkPage(fields, addLabel, renderItem) {
return function Page({ items, setItems }) {
const [modal, setModal] = useState(false);
const [edit, setEdit] = useState(null);
const blank = Object.fromEntries(fields.map(f=>[f.key, f.default||""]));
const [form, setForm] = useState(blank);
const open=(item=null)=>{setEdit(item);setForm(item||blank);setModal(true);};
const save=()=>{
const req = fields.find(f=>f.required);
if(req&&!form[req.key]?.trim())return;
if(edit)setItems(p=>p.map(i=>i.id===edit.id?{...i,...form}:i));
else setItems(p=>[{...form,id:Date.now()},...p]);
setModal(false);
};
return(
<>
<ListPage items={items} onAdd={()=>open()} onEdit={open} onDelete={id=>setItems(p=>p.filter(i=>i.id!==id))} addLabel={addLabel} renderItem={renderItem}/>
{modal&&(
<Modal title={edit?`編輯${addLabel}`:addLabel} onClose={()=>setModal(false)}>
<div className="space-y-3">
{fields.map(f=>{
if(f.type==="select")return<Sel key={f.key} label={f.label} options={f.options} value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})}/>;
if(f.type==="textarea")return<Txt key={f.key} label={f.label} value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})}/>;
if(f.type==="grid")return<div key={f.key} className={`grid grid-cols-${f.cols||2} gap-3`}>{f.children.map(c=>c.type==="select"?<Sel key={c.key} label={c.label} options={c.options} value={form[c.key]} onChange={e=>setForm({...form,[c.key]:e.target.value})}/>:<Inp key={c.key} label={c.label} type={c.inputType||"text"} placeholder={c.placeholder||""} value={form[c.key]} onChange={e=>setForm({...form,[c.key]:e.target.value})}/>)}</div>;
return<Inp key={f.key} label={f.label} type={f.inputType||"text"} placeholder={f.placeholder||""} value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})}/>;
})}
</div>
<Btn onClick={save} label={edit?"儲存變更":`新增${addLabel}`}/>
</Modal>
)}
</>
);
};
}

const Appointments = mkPage([
{key:"title",label:"標題 *",required:true},
{key:"client",label:"客戶"},
{key:"type",label:"類型",type:"select",options:["現場勘查","設計討論","簽約","驗收","其他"]},
{key:"date",label:"日期",inputType:"date",type:"grid",cols:2,children:[
{key:"date",label:"日期",inputType:"date"},{key:"time",label:"時間",inputType:"time"}
]},
{key:"location",label:"地點"},
{key:"project",label:"所屬專案",type:"select",options:["",...getProjectList()]},
{key:"status",label:"狀態",type:"select",options:["確認中","已確認","已完成","取消"],default:"確認中"},
{key:"note",label:"備註",type:"textarea"},
],"預約",i=>(
<>
<div className="flex justify-between items-start mb-1"><div className="font-semibold text-stone-800 text-sm">{i.title}</div><Badge color={SC[i.status]}>{i.status}</Badge></div>
<div className="text-xs text-stone-400">{i.client} · {i.type}</div>
<div className="text-xs text-stone-500 mt-1">📅 {i.date} {i.time}</div>
{i.location&&<div className="text-xs text-stone-400">📍 {i.location}</div>}
</>
));

function Appointments2({ items, setItems }) {
const [modal, setModal] = useState(false);
const [edit, setEdit] = useState(null);
const blank = {title:"",client:"",type:"現場勘查",date:"",time:"",location:"",project:"",status:"確認中",note:""};
const [form, setForm] = useState(blank);
const open=(item=null)=>{setEdit(item);setForm(item||blank);setModal(true);};
const save=()=>{
if(!form.title.trim())return;
if(edit)setItems(p=>p.map(i=>i.id===edit.id?{...i,...form}:i));
else setItems(p=>[{...form,id:Date.now()},...p]);
setModal(false);
};
return(
<>
<ListPage items={items} onAdd={()=>open()} onEdit={open} onDelete={id=>setItems(p=>p.filter(i=>i.id!==id))} addLabel="新增預約"
renderItem={i=>(
<>
<div className="flex justify-between items-start mb-1"><div className="font-semibold text-stone-800 text-sm">{i.title}</div><Badge color={SC[i.status]||"blue"}>{i.status}</Badge></div>
<div className="text-xs text-stone-400">{i.client} · {i.type}</div>
<div className="text-xs text-stone-500 mt-1">📅 {i.date} {i.time}</div>
{i.location&&<div className="text-xs text-stone-400">📍 {i.location}</div>}
</>
)}
/>
{modal&&<Modal title={edit?"編輯預約":"新增預約"} onClose={()=>setModal(false)}>
<div className="space-y-3">
<Inp label="標題 *" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
<Inp label="客戶" value={form.client} onChange={e=>setForm({...form,client:e.target.value})}/>
<Sel label="類型" options={["現場勘查","設計討論","簽約","驗收","其他"]} value={form.type} onChange={e=>setForm({...form,type:e.target.value})}/>
<div className="grid grid-cols-2 gap-3"><Inp label="日期" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/><Inp label="時間" type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/></div>
<Inp label="地點" value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/>
<Sel label="所屬專案" options={["",...getProjectList()]} value={form.project} onChange={e=>setForm({...form,project:e.target.value})}/>
<Sel label="狀態" options={["確認中","已確認","已完成","取消"]} value={form.status} onChange={e=>setForm({...form,status:e.target.value})}/>
<Txt label="備註" value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/>
</div>
<Btn onClick={save}/>
</Modal>}
</>
);
}

function Projects({ items, setItems }) {
const [modal, setModal] = useState(false);
const [edit, setEdit] = useState(null);
const blank = {name:"",client:"",address:"",budget:"",status:"設計中",progress:0,note:""};
const [form, setForm] = useState(blank);
const open=(item=null)=>{setEdit(item);setForm(item||blank);setModal(true);};
const save=()=>{
if(!form.name.trim())return;
if(edit)setItems(p=>p.map(i=>i.id===edit.id?{...i,...form}:i));
else setItems(p=>[{...form,id:Date.now()},...p]);
setModal(false);
};
return(
<>
<ListPage items={items} onAdd={()=>open()} onEdit={open} onDelete={id=>setItems(p=>p.filter(i=>i.id!==id))} addLabel="新增專案"
renderItem={p=>(
<>
<div className="flex justify-between items-start mb-2"><div className="font-semibold text-stone-800 text-sm">{p.name}</div><Badge color={SC[p.status]}>{p.status}</Badge></div>
{p.client&&<div className="text-xs text-stone-400 mb-1">👤 {p.client}</div>}
{p.budget&&<div className="text-xs text-stone-400 mb-2">💰 {p.budget}</div>}
<div className="flex items-center gap-2">
<div className="flex-1 bg-stone-100 rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full" style={{width:`${p.progress||0}%`}}/></div>
<span className="text-xs text-emerald-600 font-semibold">{p.progress||0}%</span>
</div>
</>
)}
/>
{modal&&<Modal title={edit?"編輯專案":"新增專案"} onClose={()=>setModal(false)}>
<div className="space-y-3">
<Inp label="專案名稱 *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
<Inp label="客戶" value={form.client} onChange={e=>setForm({...form,client:e.target.value})}/>
<Inp label="地址" value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/>
<Inp label="預算" placeholder="NT$" value={form.budget} onChange={e=>setForm({...form,budget:e.target.value})}/>
<div className="grid grid-cols-2 gap-3">
<Sel label="狀態" options={["設計中","施工中","驗收中","報價中","完工"]} value={form.status} onChange={e=>setForm({...form,status:e.target.value})}/>
<div><label className="text-xs text-stone-400 mb-1 block">進度 {form.progress}%</label><input type="range" min="0" max="100" className="w-full mt-1" value={form.progress} onChange={e=>setForm({...form,progress:Number(e.target.value)})}/></div>
</div>
<Txt label="備註" value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/>
</div>
<Btn onClick={save}/>
</Modal>}
</>
);
}
function SimpleForm({ title, fields, items, setItems, addLabel, renderItem }) {
const [modal, setModal] = useState(false);
const [edit, setEdit] = useState(null);
const blank = Object.fromEntries(fields.map(f=>[f.key,f.default||""]));
const [form, setForm] = useState(blank);
const open=(item=null)=>{setEdit(item);setForm(item?{...blank,...item}:blank);setModal(true);};
const save=()=>{
const req=fields.find(f=>f.req);
if(req&&!String(form[req.key]).trim())return;
if(edit)setItems(p=>p.map(i=>i.id===edit.id?{...i,...form}:i));
else setItems(p=>[{...form,id:Date.now()},...p]);
setModal(false);
};
const F=({f})=>{
if(f.type==="sel")return<Sel label={f.label} options={f.opts} value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})}/>;
if(f.type==="txt")return<Txt label={f.label} placeholder={f.ph||""} value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})}/>;
if(f.type==="range")return<div><label className="text-xs text-stone-400 mb-1 block">{f.label} {form[f.key]}%</label><input type="range" min="0" max="100" className="w-full" value={form[f.key]} onChange={e=>setForm({...form,[f.key]:Number(e.target.value)})}/></div>;
return<Inp label={f.label} type={f.it||"text"} placeholder={f.ph||""} value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})}/>;
};
return(
<>
<ListPage items={items} onAdd={()=>open()} onEdit={open} onDelete={id=>setItems(p=>p.filter(i=>i.id!==id))} addLabel={addLabel} renderItem={renderItem}/>
{modal&&<Modal title={edit?`編輯`:addLabel} onClose={()=>setModal(false)}>
<div className="space-y-3">
{fields.map((f,i)=>{
if(f.grid)return<div key={i} className={`grid grid-cols-${f.grid} gap-2`}>{f.children.map((c,j)=><F key={j} f={c}/>)}</div>;
return<F key={i} f={f}/>;
})}
</div>
<Btn onClick={save} label={edit?"儲存":"新增"}/>
</Modal>}
</>
);
}

function Inquiries({ items, setItems }) {
return <SimpleForm title="諮詢單" addLabel="新增諮詢" items={items} setItems={setItems}
fields={[
{key:"name",label:"客戶姓名 *",req:true},{key:"phone",label:"聯絡電話"},
{key:"address",label:"地址"},
{grid:2,children:[{key:"type",label:"類型",type:"sel",opts:["住宅","商辦","店面","其他"]},{key:"status",label:"狀態",type:"sel",opts:["待審","進行中","已完成","已拒絕"],default:"待審"}]},
{key:"budget",label:"預算",ph:"NT$"},{key:"date",label:"預約日期",it:"date"},
{key:"note",label:"備註",type:"txt"},
]}
renderItem={i=>(
<>
<div className="flex justify-between items-start mb-1"><div className="font-semibold text-stone-800 text-sm">{i.name}</div><Badge color={SC[i.status]}>{i.status}</Badge></div>
<div className="text-xs text-stone-400">{i.phone} · {i.type}</div>
{i.budget&&<div className="text-xs text-stone-400">預算：{i.budget}</div>}
{i.date&&<div className="text-xs text-stone-400">預約：{i.date}</div>}
</>
)}
/>;
}

function Contracts({ items, setItems }) {
return <SimpleForm addLabel="新增合約" items={items} setItems={setItems}
fields={[
{key:"project",label:"所屬專案 *",req:true,type:"sel",opts:["",...getProjectList()]},
{key:"client",label:"客戶"},{key:"amount",label:"合約金額",ph:"NT$"},
{key:"signDate",label:"簽約日期",it:"date"},
{grid:2,children:[{key:"startDate",label:"開工日期",it:"date"},{key:"endDate",label:"完工日期",it:"date"}]},
{key:"status",label:"狀態",type:"sel",opts:["草稿","已核准","進行中","已完成"],default:"草稿"},
{key:"note",label:"備註",type:"txt"},
]}
renderItem={i=>(
<>
<div className="flex justify-between items-start mb-1"><div className="font-semibold text-stone-800 text-sm">{i.project}</div><Badge color={SC[i.status]}>{i.status}</Badge></div>
<div className="text-xs text-stone-400">{i.client}</div>
{i.amount&&<div className="text-xs text-stone-500 font-medium mt-1">{i.amount}</div>}
{i.startDate&&<div className="text-xs text-stone-400">{i.startDate} ～ {i.endDate}</div>}
</>
)}
/>;
}

function Quotes({ items, setItems }) {
return <SimpleForm addLabel="新增報價" items={items} setItems={setItems}
fields={[
{key:"project",label:"所屬專案 *",req:true,type:"sel",opts:["",...getProjectList()]},
{key:"client",label:"客戶"},{key:"total",label:"報價總額",ph:"NT$"},
{grid:2,children:[{key:"date",label:"報價日期",it:"date"},{key:"validUntil",label:"有效期限",it:"date"}]},
{key:"status",label:"狀態",type:"sel",opts:["草稿","已送出","已核准","已拒絕"],default:"草稿"},
{key:"items_list",label:"報價項目",type:"txt",ph:"列出工程項目"},
{key:"note",label:"備註",type:"txt"},
]}
renderItem={i=>(
<>
<div className="flex justify-between items-start mb-1"><div className="font-semibold text-stone-800 text-sm">{i.project}</div><Badge color={SC[i.status]}>{i.status}</Badge></div>
<div className="text-xs text-stone-400">{i.client}</div>
{i.total&&<div className="text-xs text-stone-500 font-semibold mt-1">總計：{i.total}</div>}
{i.validUntil&&<div className="text-xs text-stone-400">有效期限：{i.validUntil}</div>}
</>
)}
/>;
}

function Inspection({ items, setItems }) {
return <SimpleForm addLabel="新增檢核" items={items} setItems={setItems}
fields={[
{key:"project",label:"所屬專案 *",req:true,type:"sel",opts:["",...getProjectList()]},
{grid:2,children:[{key:"type",label:"工種",type:"sel",opts:["木作","泥作","水電","油漆","鐵件","其他"]},{key:"inspector",label:"檢核人員"}]},
{key:"date",label:"檢核日期",it:"date"},
{key:"result",label:"結果",type:"sel",opts:["待審","通過","不通過","待改善"],default:"待審"},
{key:"issues",label:"問題描述",type:"txt",ph:"記錄問題點"},
{key:"note",label:"備註",type:"txt"},
]}
renderItem={i=>(
<>
<div className="flex justify-between items-start mb-1"><div className="font-semibold text-stone-800 text-sm">{i.project}</div><Badge color={i.result==="通過"?"green":i.result==="待審"?"yellow":"red"}>{i.result}</Badge></div>
<div className="text-xs text-stone-400">{i.type} · {i.inspector}</div>
{i.date&&<div className="text-xs text-stone-400">{i.date}</div>}
{i.issues&&<div className="text-xs text-red-400 mt-1">問題：{i.issues}</div>}
</>
)}
/>;
}

function Acceptance({ items, setItems }) {
return <SimpleForm addLabel="新增驗收" items={items} setItems={setItems}
fields={[
{key:"project",label:"所屬專案 *",req:true,type:"sel",opts:["",...getProjectList()]},
{key:"client",label:"客戶"},{key:"date",label:"驗收日期",it:"date"},
{key:"status",label:"狀態",type:"sel",opts:["待驗收","已完成","有缺失"],default:"待驗收"},
{key:"items_checked",label:"驗收項目",type:"txt",ph:"列出驗收項目"},
{key:"issues",label:"缺失說明",type:"txt"},
{key:"note",label:"備註",type:"txt"},
]}
renderItem={i=>(
<>
<div className="flex justify-between items-start mb-1"><div className="font-semibold text-stone-800 text-sm">{i.project}</div><Badge color={i.status==="已完成"?"green":i.status==="待驗收"?"yellow":"red"}>{i.status}</Badge></div>
<div className="text-xs text-stone-400">{i.client}</div>
{i.date&&<div className="text-xs text-stone-400">驗收日：{i.date}</div>}
{i.issues&&<div className="text-xs text-red-400 mt-1">缺失：{i.issues}</div>}
</>
)}
/>;
}

function Pending({ items, setItems }) {
return <SimpleForm addLabel="新增待確認" items={items} setItems={setItems}
fields={[
{key:"project",label:"所屬專案 *",req:true,type:"sel",opts:["",...getProjectList()]},
{key:"client",label:"客戶"},
{key:"type",label:"類型",type:"sel",opts:["設計確認","材料確認","報價確認","合約確認","其他"]},
{key:"deadline",label:"截止日期",it:"date"},
{key:"status",label:"狀態",type:"sel",opts:["待確認","已確認"],default:"待確認"},
{key:"note",label:"說明",type:"txt"},
]}
renderItem={i=>(
<>
<div className="flex justify-between items-start mb-1"><div className="font-semibold text-stone-800 text-sm">{i.project}</div><Badge color={i.status==="已確認"?"green":"yellow"}>{i.status}</Badge></div>
<div className="text-xs text-stone-400">{i.client} · {i.type}</div>
{i.deadline&&<div className="text-xs text-red-400">截止：{i.deadline}</div>}
</>
)}
/>;
}

function Knowledge({ items, setItems }) {
const [view, setView] = useState(null);
return(
<>
<SimpleForm addLabel="新增文件" items={items} setItems={setItems}
fields={[
{key:"title",label:"標題 *",req:true},
{key:"category",label:"分類",type:"sel",opts:["施工知識","材料規格","法規資訊","工法說明","其他"]},
{key:"tags",label:"標籤（逗號分隔）"},
{key:"content",label:"內容",type:"txt",ph:"輸入知識內容"},
]}
renderItem={i=>(
<>
<div className="flex justify-between items-start mb-1"><div className="font-semibold text-stone-800 text-sm">{i.title}</div><Badge color="blue">{i.category}</Badge></div>
{i.tags&&<div className="text-xs text-stone-400">{i.tags}</div>}
{i.content&&<div className="text-xs text-stone-500 mt-1 line-clamp-2">{i.content}</div>}
<button onClick={e=>{e.stopPropagation();setView(i);}} className="text-xs text-blue-500 mt-1">查看全文 →</button>
</>
)}
/>
{view&&<Modal title={view.title} onClose={()=>setView(null)}>
<Badge color="blue">{view.category}</Badge>
{view.tags&&<div className="text-xs text-stone-400 mt-2">{view.tags}</div>}
<div className="text-sm text-stone-700 mt-3 whitespace-pre-wrap leading-relaxed">{view.content}</div>
</Modal>}
</>
);
}
function TilesCalc() {
const [room, setRoom] = useState({l:"",w:""});
const [tile, setTile] = useState({l:"30",w:"30"});
const [waste, setWaste] = useState("10");
const [res, setRes] = useState(null);
const calc=()=>{
const rA=parseFloat(room.l)*parseFloat(room.w);
const tA=(parseFloat(tile.l)/100)*(parseFloat(tile.w)/100);
if(!rA||!tA)return;
const base=Math.ceil(rA/tA);
const total=Math.ceil(base*(1+parseFloat(waste)/100));
setRes({area:rA.toFixed(2),base,total});
};
return(
<div className="space-y-4">
<div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
<div className="text-xs text-stone-400 mb-3 font-medium">房間尺寸（公尺）</div>
<div className="grid grid-cols-2 gap-3">
<Inp label="長度 (m)" type="number" placeholder="4.5" value={room.l} onChange={e=>setRoom({...room,l:e.target.value})}/>
<Inp label="寬度 (m)" type="number" placeholder="3.2" value={room.w} onChange={e=>setRoom({...room,w:e.target.value})}/>
</div>
</div>
<div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
<div className="text-xs text-stone-400 mb-3 font-medium">磁磚尺寸（公分）</div>
<div className="grid grid-cols-2 gap-3">
<Inp label="長度 (cm)" type="number" value={tile.l} onChange={e=>setTile({...tile,l:e.target.value})}/>
<Inp label="寬度 (cm)" type="number" value={tile.w} onChange={e=>setTile({...tile,w:e.target.value})}/>
</div>
</div>
<div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
<Sel label="耗損率" options={["5","10","15","20"]} value={waste} onChange={e=>setWaste(e.target.value)}/>
<div className="text-xs text-stone-400 mt-1">室內建議 10%，有切割建議 15%</div>
</div>
<button onClick={calc} className="w-full bg-stone-800 text-white rounded-xl py-3 font-medium text-sm">開始計算</button>
{res&&<div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
<div className="text-xs text-emerald-600 font-medium mb-3">計算結果</div>
<div className="grid grid-cols-3 gap-3 text-center">
{[["地坪面積",`${res.area} m²`],["基本用量",`${res.base} 片`],["建議採購",`${res.total} 片`]].map(([l,v])=>(
<div key={l}><div className="text-xs text-stone-400 mb-1">{l}</div><div className="text-lg font-bold text-stone-800">{v.split(" ")[0]}</div><div className="text-xs text-stone-400">{v.split(" ")[1]}</div></div>
))}
</div>
</div>}
</div>
);
}

function Lighting({ items, setItems }) {
return <SimpleForm addLabel="新增燈具" items={items} setItems={setItems}
fields={[
{key:"project",label:"所屬專案 *",req:true,type:"sel",opts:["",...getProjectList()]},
{grid:2,children:[{key:"room",label:"空間",type:"sel",opts:["客廳","臥室","廚房","浴室","走廊","書房","餐廳","其他"]},{key:"type",label:"燈具類型",type:"sel",opts:["主燈","嵌燈","吊燈","壁燈","夜燈","軌道燈","其他"]}]},
{key:"brand",label:"品牌"},
{grid:3,children:[{key:"watt",label:"瓦數W",it:"number"},{key:"colorTemp",label:"色溫",type:"sel",opts:["2700K","3000K","4000K","5000K","6500K"]},{key:"qty",label:"數量",it:"number"}]},
{key:"price",label:"單價",ph:"NT$"},
{key:"note",label:"備註",type:"txt"},
]}
renderItem={i=>(
<>
<div className="flex justify-between items-start mb-1"><div className="font-semibold text-stone-800 text-sm">{i.room} · {i.type}</div><Badge color="yellow">{i.colorTemp}</Badge></div>
<div className="text-xs text-stone-400">{i.project}</div>
<div className="text-xs text-stone-500 mt-1">{i.brand} · {i.watt}W · 數量：{i.qty}</div>
{i.price&&<div className="text-xs text-stone-400">單價：{i.price}</div>}
</>
)}
/>;
}

function Design({ items, setItems }) {
return <SimpleForm addLabel="新增提案" items={items} setItems={setItems}
fields={[
{key:"project",label:"所屬專案 *",req:true,type:"sel",opts:["",...getProjectList()]},
{key:"name",label:"提案名稱"},
{key:"style",label:"風格",type:"sel",opts:["現代風","北歐風","工業風","日式風","古典風","混搭風","其他"]},
{key:"budget",label:"設計預算",ph:"NT$"},
{key:"status",label:"狀態",type:"sel",opts:["草稿","提案中","已核准","施工中","已完成"],default:"草稿"},
{key:"description",label:"設計說明",type:"txt"},
]}
renderItem={i=>(
<>
<div className="flex justify-between items-start mb-1"><div className="font-semibold text-stone-800 text-sm">{i.name||i.project}</div><Badge color={SC[i.status]}>{i.status}</Badge></div>
<div className="text-xs text-stone-400">{i.project} · {i.style}</div>
{i.description&&<div className="text-xs text-stone-500 mt-1 line-clamp-2">{i.description}</div>}
</>
)}
/>;
}

function Ledger({ items, setItems }) {
const [modal, setModal] = useState(false);
const [edit, setEdit] = useState(null);
const blank = {date:"",type:"收入",project:"",category:"工程款",amount:"",note:""};
const [form, setForm] = useState(blank);
const open=(item=null)=>{setEdit(item);setForm(item||blank);setModal(true);};
const save=()=>{
if(!form.amount)return;
if(edit)setItems(p=>p.map(i=>i.id===edit.id?{...i,...form}:i));
else setItems(p=>[{...form,id:Date.now()},...p]);
setModal(false);
};
const income=items.filter(i=>i.type==="收入").reduce((s,i)=>s+Number(i.amount||0),0);
const expense=items.filter(i=>i.type==="支出").reduce((s,i)=>s+Number(i.amount||0),0);
return(
<>
<div className="grid grid-cols-2 gap-3 mb-3">
<div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100"><div className="text-xs text-emerald-600 mb-1">總收入</div><div className="text-lg font-bold text-emerald-700">NT${income.toLocaleString()}</div></div>
<div className="bg-red-50 rounded-2xl p-4 border border-red-100"><div className="text-xs text-red-500 mb-1">總支出</div><div className="text-lg font-bold text-red-600">NT${expense.toLocaleString()}</div></div>
</div>
<div className="bg-stone-100 rounded-2xl p-3 text-center mb-3">
<div className="text-xs text-stone-400 mb-1">淨利潤</div>
<div className={`text-xl font-bold ${income-expense>=0?"text-emerald-600":"text-red-500"}`}>NT${(income-expense).toLocaleString()}</div>
</div>
<ListPage items={items} onAdd={()=>open()} onEdit={open} onDelete={id=>setItems(p=>p.filter(i=>i.id!==id))} addLabel="新增記錄"
renderItem={i=>(
<div className="flex justify-between items-start">
<div><div className="text-sm font-medium text-stone-800">{i.category}</div><div className="text-xs text-stone-400">{i.project} · {i.date}</div>{i.note&&<div className="text-xs text-stone-400">{i.note}</div>}</div>
<div className={`text-base font-bold ${i.type==="收入"?"text-emerald-600":"text-red-500"}`}>{i.type==="收入"?"+":"-"}NT${Number(i.amount||0).toLocaleString()}</div>
</div>
)}
/>
{modal&&<Modal title={edit?"編輯記錄":"新增帳本記錄"} onClose={()=>setModal(false)}>
<div className="space-y-3">
<div className="grid grid-cols-2 gap-3">
<Sel label="類型" options={["收入","支出"]} value={form.type} onChange={e=>setForm({...form,type:e.target.value})}/>
<Inp label="金額 *" type="number" placeholder="0" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/>
</div>
<Sel label="類別" options={["工程款","設計費","材料費","人工費","管銷費","其他"]} value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/>
<Sel label="所屬專案" options={["",...getProjectList()]} value={form.project} onChange={e=>setForm({...form,project:e.target.value})}/>
<Inp label="日期" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
<Txt label="備註" value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/>
</div>
<Btn onClick={save}/>
</Modal>}
</>
);
}
function Purchase({ items, setItems }) {
return <SimpleForm addLabel="新增採購" items={items} setItems={setItems}
fields={[
{key:"item",label:"採購品項 *",req:true},
{key:"project",label:"所屬專案",type:"sel",opts:["",...getProjectList()]},
{grid:3,children:[{key:"qty",label:"數量",it:"number"},{key:"unit",label:"單位",ph:"個/箱/片"},{key:"price",label:"單價",it:"number"}]},
{key:"supplier",label:"供應商"},
{key:"date",label:"需求日期",it:"date"},
{key:"status",label:"狀態",type:"sel",opts:["待審","已核准","已採購","已到貨"],default:"待審"},
{key:"note",label:"備註",type:"txt"},
]}
renderItem={i=>(
<>
<div className="flex justify-between items-start mb-1"><div className="font-semibold text-stone-800 text-sm">{i.item}</div><Badge color={SC[i.status]}>{i.status}</Badge></div>
<div className="text-xs text-stone-400">{i.project} · {i.supplier}</div>
<div className="text-xs text-stone-500 mt-1">數量：{i.qty} {i.unit} · 單價：NT${i.price}</div>
</>
)}
/>;
}

function Expense({ items, setItems }) {
return <SimpleForm addLabel="新增報銷" items={items} setItems={setItems}
fields={[
{key:"name",label:"申請人"},
{key:"category",label:"費用類別",type:"sel",opts:["交通費","餐費","住宿費","材料費","工具費","其他"]},
{key:"amount",label:"金額 *",req:true,it:"number"},
{key:"date",label:"費用日期",it:"date"},
{key:"project",label:"所屬專案",type:"sel",opts:["",...getProjectList()]},
{key:"status",label:"狀態",type:"sel",opts:["待審","已核准","已拒絕","已撥款"],default:"待審"},
{key:"note",label:"說明",type:"txt"},
]}
renderItem={i=>(
<>
<div className="flex justify-between items-start mb-1"><div className="font-semibold text-stone-800 text-sm">{i.category}</div><Badge color={SC[i.status]}>{i.status}</Badge></div>
<div className="text-xs text-stone-400">{i.name} · {i.date}</div>
<div className="text-base font-bold text-stone-700 mt-1">NT${Number(i.amount||0).toLocaleString()}</div>
</>
)}
/>;
}

function Payroll({ items, setItems }) {
const net=i=>Number(i.baseSalary||0)+Number(i.bonus||0)-Number(i.deduction||0);
return <SimpleForm addLabel="新增薪資" items={items} setItems={setItems}
fields={[
{key:"name",label:"員工姓名 *",req:true},{key:"role",label:"職稱"},
{key:"month",label:"發薪月份",ph:"2024-06"},
{grid:3,children:[{key:"baseSalary",label:"底薪",it:"number"},{key:"bonus",label:"獎金",it:"number"},{key:"deduction",label:"扣款",it:"number"}]},
{key:"status",label:"狀態",type:"sel",opts:["待發","已發"],default:"待發"},
]}
renderItem={i=>(
<>
<div className="flex justify-between items-start mb-1"><div className="font-semibold text-stone-800 text-sm">{i.name}</div><Badge color={i.status==="已發"?"green":"yellow"}>{i.status}</Badge></div>
<div className="text-xs text-stone-400">{i.role} · {i.month}</div>
<div className="grid grid-cols-3 gap-2 mt-2 text-center">
<div><div className="text-xs text-stone-400">底薪</div><div className="text-xs font-medium">{Number(i.baseSalary||0).toLocaleString()}</div></div>
<div><div className="text-xs text-stone-400">獎金</div><div className="text-xs font-medium text-emerald-600">+{Number(i.bonus||0).toLocaleString()}</div></div>
<div><div className="text-xs text-stone-400">實發</div><div className="text-sm font-bold">{net(i).toLocaleString()}</div></div>
</div>
</>
)}
/>;
}

function Monthly({ items, setItems }) {
const total=items.reduce((s,i)=>s+Number(i.amount||0),0);
return(
<>
<div className="bg-stone-800 text-white rounded-2xl p-4 mb-3">
<div className="text-xs opacity-60 mb-1">累計支出</div>
<div className="text-2xl font-bold">NT${total.toLocaleString()}</div>
</div>
<SimpleForm addLabel="新增支出" items={items} setItems={setItems}
fields={[
{key:"month",label:"月份",ph:"2024-06"},
{key:"category",label:"類別",type:"sel",opts:["辦公費用","水電費","租金","人事費用","材料費","行銷費","其他"]},
{key:"amount",label:"金額 *",req:true,it:"number"},
{key:"note",label:"備註",type:"txt"},
]}
renderItem={i=>(
<div className="flex justify-between items-center">
<div><div className="text-sm font-medium text-stone-800">{i.category}</div><div className="text-xs text-stone-400">{i.month}{i.note?` · ${i.note}`:""}</div></div>
<div className="text-base font-bold text-red-500">NT${Number(i.amount||0).toLocaleString()}</div>
</div>
)}
/>
</>
);
}

function Forecast({ ledger, projects }) {
const income=ledger.filter(i=>i.type==="收入").reduce((s,i)=>s+Number(i.amount||0),0);
const expense=ledger.filter(i=>i.type==="支出").reduce((s,i)=>s+Number(i.amount||0),0);
const profit=income-expense;
const margin=income>0?((profit/income)*100).toFixed(1):0;
return(
<div className="space-y-4">
<div className="grid grid-cols-2 gap-3">
{[["累計收入",`NT$${income.toLocaleString()}`,"text-emerald-600"],["累計支出",`NT$${expense.toLocaleString()}`,"text-red-500"],["淨利潤",`NT$${profit.toLocaleString()}`,profit>=0?"text-stone-800":"text-red-500"],["利潤率",`${margin}%`,Number(margin)>=20?"text-emerald-600":Number(margin)>=10?"text-yellow-500":"text-red-500"]].map(([l,v,c])=>(
<div key={l} className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm">
<div className="text-xs text-stone-400 mb-1">{l}</div>
<div className={`text-lg font-bold ${c}`}>{v}</div>
</div>
))}
</div>
<div className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm">
<div className="text-xs text-stone-400 mb-3">營運概況</div>
{[["進行中專案",`${projects.filter(p=>p.status!=="完工").length} 個`,"blue"],["完工專案",`${projects.filter(p=>p.status==="完工").length} 個`,"green"],["總帳本筆數",`${ledger.length} 筆`,"gray"]].map(([l,v,c])=>(
<div key={l} className="flex justify-between items-center mb-2 last:mb-0">
<span className="text-sm text-stone-600">{l}</span><Badge color={c}>{v}</Badge>
</div>
))}
</div>
<div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
<div className="text-xs text-amber-600 font-medium mb-1">💡 財務建議</div>
<div className="text-xs text-amber-700">
{Number(margin)<10?"利潤率偏低，建議檢視成本結構或提高報價。":Number(margin)<20?"利潤率尚可，持續監控各項支出。":"財務狀況健康，繼續保持！"}
</div>
</div>
</div>
);
}

function Attendance({ items, setItems }) {
const todayStr=new Date().toLocaleDateString("zh-TW");
const rec=items.find(i=>i.date===todayStr);
const clockIn=()=>{
const t=new Date().toLocaleTimeString("zh-TW",{hour:"2-digit",minute:"2-digit"});
if(rec)setItems(p=>p.map(i=>i.date===todayStr?{...i,clockIn:t}:i));
else setItems(p=>[{id:Date.now(),date:todayStr,clockIn:t,clockOut:"",hours:""},...p]);
};
const clockOut=()=>{
const t=new Date().toLocaleTimeString("zh-TW",{hour:"2-digit",minute:"2-digit"});
if(rec?.clockIn){
const[ih,im]=rec.clockIn.split(":").map(Number);
const[oh,om]=t.split(":").map(Number);
const hrs=((oh*60+om)-(ih*60+im))/60;
setItems(p=>p.map(i=>i.date===todayStr?{...i,clockOut:t,hours:`${hrs.toFixed(1)}h`}:i));
}
};
return(
<div className="space-y-4">
<div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 text-center">
<div className="text-xs text-stone-400 mb-1">今日 {todayStr}</div>
<div className="grid grid-cols-3 gap-3 my-4">
{[["上班時間",rec?.clockIn||"—"],["下班時間",rec?.clockOut||"—"],["工時",rec?.hours||"—"]].map(([l,v])=>(
<div key={l}><div className="text-xs text-stone-400 mb-1">{l}</div><div className="text-sm font-bold text-stone-700">{v}</div></div>
))}
</div>
<div className="grid grid-cols-2 gap-3">
<button onClick={clockIn} disabled={!!rec?.clockIn} className={`rounded-xl py-3 text-sm font-medium ${rec?.clockIn?"bg-stone-100 text-stone-400":"bg-stone-800 text-white"}`}>
{rec?.clockIn?`✓ ${rec.clockIn}`:"上班打卡"}
</button>
<button onClick={clockOut} disabled={!rec?.clockIn||!!rec?.clockOut} className={`rounded-xl py-3 text-sm font-medium ${!rec?.clockIn||rec?.clockOut?"bg-stone-100 text-stone-400":"bg-red-500 text-white"}`}>
{rec?.clockOut?`✓ ${rec.clockOut}`:"下班打卡"}
</button>
</div>
</div>
<div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
<div className="text-xs text-stone-400 mb-3">出勤紀錄</div>
{items.length===0&&<div className="text-center text-stone-400 text-sm py-4">尚無紀錄</div>}
{items.map(i=>(
<div key={i.id} className="flex justify-between items-center py-2 border-b border-stone-50 last:border-0">
<span className="text-sm text-stone-700">{i.date}</span>
<div className="text-xs text-stone-400">{i.clockIn}～{i.clockOut||"—"}</div>
<Badge color={i.hours?"green":"yellow"}>{i.hours||"未完整"}</Badge>
</div>
))}
</div>
</div>
);
}
function Leave({ items, setItems }) {
return <SimpleForm addLabel="新增請假" items={items} setItems={setItems}
fields={[
{key:"name",label:"申請人 *",req:true},
{key:"type",label:"假別",type:"sel",opts:["特休","病假","事假","婚假","喪假","公假","其他"]},
{grid:2,children:[{key:"startDate",label:"開始日期",it:"date"},{key:"endDate",label:"結束日期",it:"date"}]},
{key:"days",label:"天數",it:"number"},
{key:"reason",label:"請假原因",type:"txt"},
{key:"status",label:"狀態",type:"sel",opts:["待審","已核准","已拒絕"],default:"待審"},
]}
renderItem={i=>(
<>
<div className="flex justify-between items-start mb-1"><div className="font-semibold text-stone-800 text-sm">{i.name} · {i.type}</div><Badge color={i.status==="已核准"?"green":i.status==="已拒絕"?"red":"yellow"}>{i.status}</Badge></div>
<div className="text-xs text-stone-400">{i.startDate} ～ {i.endDate}（{i.days}天）</div>
{i.reason&&<div className="text-xs text-stone-400 mt-1">{i.reason}</div>}
</>
)}
/>;
}

function Overtime({ items, setItems }) {
return <SimpleForm addLabel="新增加班" items={items} setItems={setItems}
fields={[
{key:"name",label:"員工姓名 *",req:true},
{key:"date",label:"加班日期",it:"date"},
{grid:3,children:[{key:"startTime",label:"開始",it:"time"},{key:"endTime",label:"結束",it:"time"},{key:"hours",label:"時數",it:"number"}]},
{key:"project",label:"所屬專案",type:"sel",opts:["",...getProjectList()]},
{key:"reason",label:"加班原因",type:"txt"},
{key:"status",label:"狀態",type:"sel",opts:["待審","已核准","已拒絕"],default:"待審"},
]}
renderItem={i=>(
<>
<div className="flex justify-between items-start mb-1"><div className="font-semibold text-stone-800 text-sm">{i.name}</div><Badge color={i.status==="已核准"?"green":i.status==="已拒絕"?"red":"yellow"}>{i.status}</Badge></div>
<div className="text-xs text-stone-400">{i.date} · {i.startTime}～{i.endTime}</div>
<div className="text-xs text-stone-500">{i.project} · {i.hours} 小時</div>
</>
)}
/>;
}

function Materials({ items, setItems }) {
return <SimpleForm addLabel="新增建材" items={items} setItems={setItems}
fields={[
{key:"name",label:"建材名稱 *",req:true},
{key:"category",label:"類別",type:"sel",opts:["木材","磁磚","石材","油漆","鐵件","玻璃","電料","水管","其他"]},
{key:"spec",label:"規格",ph:"尺寸、型號"},
{grid:2,children:[{key:"unit",label:"單位",ph:"片/m²/kg"},{key:"price",label:"單價",ph:"NT$"}]},
{key:"supplier",label:"供應商"},
{key:"note",label:"備註",type:"txt"},
]}
renderItem={i=>(
<>
<div className="flex justify-between items-start mb-1"><div className="font-semibold text-stone-800 text-sm">{i.name}</div><Badge color="blue">{i.category}</Badge></div>
{i.spec&&<div className="text-xs text-stone-400">{i.spec}</div>}
<div className="text-xs text-stone-500 mt-1">{i.supplier} · NT${i.price}/{i.unit}</div>
</>
)}
/>;
}

function Inventory({ items, setItems }) {
const low=items.filter(i=>Number(i.qty||0)<=Number(i.minQty||0)&&Number(i.qty||0)>=0);
return(
<>
{low.length>0&&<div className="bg-red-50 border border-red-200 rounded-2xl p-3 mb-3"><div className="text-xs text-red-600 font-medium">⚠ 庫存不足：{low.map(i=>i.name).join("、")}</div></div>}
<SimpleForm addLabel="新增庫存" items={items} setItems={setItems}
fields={[
{key:"name",label:"物料名稱 *",req:true},
{grid:3,children:[{key:"qty",label:"現有數量",it:"number"},{key:"unit",label:"單位"},{key:"minQty",label:"安全庫存",it:"number"}]},
{key:"location",label:"存放位置"},
{key:"note",label:"備註",type:"txt"},
]}
renderItem={i=>(
<>
<div className="flex justify-between items-start mb-1"><div className="font-semibold text-stone-800 text-sm">{i.name}</div><Badge color={Number(i.qty||0)<=Number(i.minQty||0)?"red":"green"}>{i.qty} {i.unit}</Badge></div>
{i.location&&<div className="text-xs text-stone-400">存放：{i.location}</div>}
<div className="text-xs text-stone-400">安全庫存：{i.minQty} {i.unit}</div>
</>
)}
/>
</>
);
}

function Tracking({ items, setItems }) {
return <SimpleForm addLabel="新增備料" items={items} setItems={setItems}
fields={[
{key:"material",label:"材料名稱 *",req:true},
{key:"project",label:"所屬專案",type:"sel",opts:["",...getProjectList()]},
{grid:2,children:[{key:"qty",label:"數量"},{key:"unit",label:"單位"}]},
{key:"needDate",label:"需求日期",it:"date"},
{key:"supplier",label:"供應商"},
{key:"status",label:"狀態",type:"sel",opts:["待採購","已採購","已到貨","延誤"],default:"待採購"},
{key:"note",label:"備註",type:"txt"},
]}
renderItem={i=>(
<>
<div className="flex justify-between items-start mb-1"><div className="font-semibold text-stone-800 text-sm">{i.material}</div><Badge color={i.status==="已到貨"?"green":i.status==="已採購"?"blue":i.status==="延誤"?"red":"yellow"}>{i.status}</Badge></div>
<div className="text-xs text-stone-400">{i.project}</div>
<div className="text-xs text-stone-500 mt-1">需求：{i.qty} {i.unit} · {i.needDate}</div>
</>
)}
/>;
}

function Profit({ ledger, projects }) {
const byProject=getProjectList().map(name=>{
const inc=ledger.filter(i=>i.project===name&&i.type==="收入").reduce((s,i)=>s+Number(i.amount||0),0);
const exp=ledger.filter(i=>i.project===name&&i.type==="支出").reduce((s,i)=>s+Number(i.amount||0),0);
return{name,income:inc,expense:exp,profit:inc-exp};
}).filter(p=>p.income>0||p.expense>0);
return(
<div className="space-y-3">
{byProject.length===0&&<div className="text-center text-stone-400 py-12 text-sm">請先在帳本新增收支資料</div>}
{byProject.map((p,i)=>(
<div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
<div className="font-semibold text-stone-800 text-sm mb-3">{p.name}</div>
<div className="grid grid-cols-3 gap-2 text-center">
{[["收入",`NT$${p.income.toLocaleString()}`,"text-emerald-600"],["支出",`NT$${p.expense.toLocaleString()}`,"text-red-500"],["利潤",`NT$${p.profit.toLocaleString()}`,p.profit>=0?"text-stone-800":"text-red-500"]].map(([l,v,c])=>(
<div key={l}><div className="text-xs text-stone-400 mb-1">{l}</div><div className={`text-sm font-bold ${c}`}>{v}</div></div>
))}
</div>
</div>
))}
</div>
);
}

function Losses({ items, setItems }) {
const total=items.reduce((s,i)=>s+Number(i.amount||0),0);
return(
<>
<div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-3">
<div className="text-xs text-red-500 mb-1">累計異常損失</div>
<div className="text-2xl font-bold text-red-600">NT${total.toLocaleString()}</div>
</div>
<SimpleForm addLabel="新增損失" items={items} setItems={setItems}
fields={[
{key:"project",label:"所屬專案 *",req:true,type:"sel",opts:["",...getProjectList()]},
{key:"type",label:"損失類型",type:"sel",opts:["材料損耗","工程返工","設備損壞","人工浪費","其他"]},
{key:"amount",label:"損失金額",it:"number",ph:"NT$"},
{key:"date",label:"發生日期",it:"date"},
{key:"cause",label:"原因說明",type:"txt"},
{key:"note",label:"備註",type:"txt"},
]}
renderItem={i=>(
<>
<div className="flex justify-between items-start mb-1"><div className="font-semibold text-stone-800 text-sm">{i.type}</div><div className="text-base font-bold text-red-500">NT${Number(i.amount||0).toLocaleString()}</div></div>
<div className="text-xs text-stone-400">{i.project} · {i.date}</div>
{i.cause&&<div className="text-xs text-stone-500 mt-1">{i.cause}</div>}
</>
)}
/>
</>
);
}

function SettingsSection({ title, icon, children, defaultOpen=false }) {
const [open, setOpen] = useState(defaultOpen);
return (
<div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
<button onClick={()=>setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3.5">
<div className="flex items-center gap-2">
<span className="text-base">{icon}</span>
<span className="text-sm font-semibold text-stone-700">{title}</span>
</div>
<span className={`text-stone-400 text-xs transition-transform ${open?"rotate-180":""}`}>▼</span>
</button>
{open && <div className="px-4 pb-4 border-t border-stone-50">{children}</div>}
</div>
);
}

function Settings({ onClearAll, companyInfo, setCompanyInfo, notifSettings, setNotifSettings, menuCustom, setMenuCustom, appPassword, setAppPassword }) {
const [confirm, setConfirm] = useState(false);
const [company, setCompany] = useState(companyInfo || {name:"",phone:"",address:"",taxId:"",bank:"",bankAccount:""});
const [notif, setNotif] = useState(notifSettings || {taskOverdue:true,taskDueToday:true,lowInventory:true,pendingApproval:true,quoteExpiry:true,projectNoUpdate:true});
const [pwForm, setPwForm] = useState({current:"",newPw:"",confirm:""});
const [pwError, setPwError] = useState("");
const [pwSuccess, setPwSuccess] = useState(false);

const saveCompany = () => { setCompanyInfo(company); alert("✅ 公司資料已儲存"); };
const saveNotif = () => { setNotifSettings(notif); alert("✅ 通知設定已儲存"); };

const changePassword = () => {
if (pwForm.current !== appPassword) { setPwError("目前密碼錯誤"); return; }
if (pwForm.newPw.length < 4) { setPwError("新密碼至少需要 4 位"); return; }
if (pwForm.newPw !== pwForm.confirm) { setPwError("兩次密碼不一致"); return; }
setAppPassword(pwForm.newPw);
setPwForm({current:"",newPw:"",confirm:""});
setPwError("");
setPwSuccess(true);
setTimeout(() => setPwSuccess(false), 2000);
};


return(
<div className="space-y-3">

{/* Password Management */}
<SettingsSection title="密碼與權限管理" icon="🔐" defaultOpen={true}>
<div className="mt-3 space-y-3">
<div className="bg-stone-50 rounded-xl p-3 text-xs text-stone-500 space-y-1">
<div className="font-medium text-stone-600 mb-2">🔒 以下功能需密碼存取：</div>
{Object.entries(PROTECTED_PAGES).map(([id,p])=>(
<div key={id} className="flex items-center gap-2">
<span>{p.icon}</span><span>{p.label}</span>
</div>
))}
</div>
<div className="text-xs text-stone-400 font-medium mt-2">更改密碼</div>
<div className="relative">
<input type="password" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm" placeholder="目前密碼" value={pwForm.current} onChange={e=>setPwForm({...pwForm,current:e.target.value})}/>
</div>
<input type="password" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm" placeholder="新密碼（至少4位）" value={pwForm.newPw} onChange={e=>setPwForm({...pwForm,newPw:e.target.value})}/>
<input type="password" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm" placeholder="確認新密碼" value={pwForm.confirm} onChange={e=>setPwForm({...pwForm,confirm:e.target.value})}/>
{pwError && <div className="text-xs text-red-500 text-center">{pwError}</div>}
{pwSuccess && <div className="text-xs text-emerald-500 text-center">✅ 密碼已更新！</div>}
<button onClick={changePassword} className="w-full bg-stone-800 text-white rounded-xl py-2.5 text-sm font-medium">更新密碼</button>
<div className="text-xs text-stone-300 text-center">預設密碼：1234</div>
</div>
</SettingsSection>

{/* Company Info */}
<SettingsSection title="公司基本資料" icon="🏢" defaultOpen={true}>
<div className="space-y-3 mt-3">
<Inp label="公司名稱" placeholder="請輸入公司名稱" value={company.name} onChange={e=>setCompany({...company,name:e.target.value})}/>
<Inp label="聯絡電話" placeholder="02-XXXX-XXXX" value={company.phone} onChange={e=>setCompany({...company,phone:e.target.value})}/>
<Inp label="公司地址" placeholder="請輸入地址" value={company.address} onChange={e=>setCompany({...company,address:e.target.value})}/>
<Inp label="統一編號" placeholder="8位數字" value={company.taxId} onChange={e=>setCompany({...company,taxId:e.target.value})}/>
<Inp label="銀行名稱" placeholder="例：台灣銀行" value={company.bank} onChange={e=>setCompany({...company,bank:e.target.value})}/>
<Inp label="銀行帳號" placeholder="帳號" value={company.bankAccount} onChange={e=>setCompany({...company,bankAccount:e.target.value})}/>
<button onClick={saveCompany} className="w-full bg-stone-800 text-white rounded-xl py-2.5 text-sm font-medium mt-2">儲存公司資料</button>
</div>
</SettingsSection>

{/* Notification Settings */}
<SettingsSection title="通知設定" icon="🔔">
<div className="space-y-3 mt-3">
{[
["taskOverdue","任務逾期提醒"],
["taskDueToday","任務今日截止提醒"],
["lowInventory","庫存不足提醒"],
["pendingApproval","假單/加班待審提醒"],
["quoteExpiry","報價到期提醒"],
["projectNoUpdate","專案進度未更新提醒"],
].map(([key,label])=>(
<div key={key} className="flex items-center justify-between py-1">
<span className="text-sm text-stone-700">{label}</span>
<button onClick={()=>setNotif({...notif,[key]:!notif[key]})}
className={`w-11 h-6 rounded-full transition-colors relative ${notif[key]?"bg-stone-800":"bg-stone-200"}`}>
<span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${notif[key]?"left-5":"left-0.5"}`}/>
</button>
</div>
))}
<button onClick={saveNotif} className="w-full bg-stone-800 text-white rounded-xl py-2.5 text-sm font-medium mt-2">儲存通知設定</button>
</div>
</SettingsSection>

{/* Menu Label Customization */}
<SettingsSection title="選單項目名稱編輯" icon="✏️">
<div className="mt-3 space-y-2">
<div className="text-xs text-stone-400 mb-3">可自訂每個功能項目的顯示名稱與圖示</div>
{NAV_SECTIONS.flatMap(s=>s.items).map(item=>{
const custom = menuCustom[item.id] || {};
return (
<div key={item.id} className="flex items-center gap-2">
<input
className="w-10 border border-stone-200 rounded-lg px-1 py-1.5 text-center text-sm focus:outline-none"
placeholder="圖"
value={custom.icon !== undefined ? custom.icon : item.icon}
onChange={e=>setMenuCustom(prev=>({...prev,[item.id]:{...( prev[item.id]||{}),icon:e.target.value}}))}
/>
<input
className="flex-1 border border-stone-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-stone-400"
value={custom.label !== undefined ? custom.label : item.label}
onChange={e=>setMenuCustom(prev=>({...prev,[item.id]:{...(prev[item.id]||{}),label:e.target.value}}))}
/>
{(custom.label !== undefined || custom.icon !== undefined) && (
<button onClick={()=>setMenuCustom(prev=>{const n={...prev};delete n[item.id];return n;})} className="text-xs text-red-400 px-2 py-1.5 rounded-lg bg-red-50 flex-shrink-0">還原</button>
)}
</div>
);
})}
<button onClick={()=>alert("✅ 選單名稱已儲存")} className="w-full bg-stone-800 text-white rounded-xl py-2.5 text-sm font-medium mt-2">套用變更</button>
</div>
</SettingsSection>

{/* Project Status Options */}
<SettingsSection title="專案狀態選項" icon="🏠">
<div className="mt-3 space-y-1">
{["設計中","報價中","施工中","驗收中","完工"].map(s=>(
<div key={s} className="flex items-center gap-2 px-3 py-2 bg-stone-50 rounded-xl">
<span className="text-xs font-medium text-stone-600">{s}</span>
</div>
))}
<div className="text-xs text-stone-400 mt-2">* 狀態選項為系統預設，如需自訂請聯繫開發者</div>
</div>
</SettingsSection>

{/* Priority Options */}
<SettingsSection title="任務優先度" icon="📋">
<div className="mt-3 space-y-1">
{[["高","bg-red-100 text-red-700"],["中","bg-yellow-100 text-yellow-700"],["低","bg-green-100 text-green-700"]].map(([p,c])=>(
<div key={p} className="flex items-center gap-2 px-3 py-2 bg-stone-50 rounded-xl">
<span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c}`}>{p}</span>
</div>
))}
</div>
</SettingsSection>

{/* About */}
<SettingsSection title="關於系統" icon="ℹ️">
<div className="mt-3 text-xs text-stone-400 space-y-1.5">
<div className="flex justify-between"><span>版本</span><span>1.0.0</span></div>
<div className="flex justify-between"><span>資料儲存</span><span>瀏覽器本機</span></div>
<div className="flex justify-between"><span>建議瀏覽器</span><span>Safari / Chrome</span></div>
<div className="mt-2 text-stone-300 text-center text-xs">所有資料儲存在您的裝置上</div>
</div>
</SettingsSection>

{/* Data Management */}
<SettingsSection title="資料管理" icon="🗄️">
<div className="mt-3 space-y-2">
<div className="bg-stone-50 rounded-xl p-3 text-xs text-stone-400">
⚠️ 清除資料後無法復原，請謹慎操作。建議先截圖備份重要資料。
</div>
<button onClick={()=>setConfirm(true)} className="w-full bg-red-50 text-red-500 rounded-xl py-3 text-sm font-medium">🗑 清除所有資料</button>
</div>
</SettingsSection>

{confirm&&(
<div className="fixed inset-0 z-50 flex items-center justify-center" style={{maxWidth:430,margin:"0 auto"}}>
<div className="absolute inset-0 bg-black/40" onClick={()=>setConfirm(false)}/>
<div className="relative bg-white rounded-2xl p-6 mx-4 shadow-2xl">
<div className="text-base font-semibold text-stone-800 mb-2">確認清除所有資料？</div>
<div className="text-sm text-stone-400 mb-5">此操作無法復原，所有資料將被永久刪除。</div>
<div className="flex gap-3">
<button onClick={()=>setConfirm(false)} className="flex-1 bg-stone-100 text-stone-600 rounded-xl py-2.5 text-sm">取消</button>
<button onClick={()=>{onClearAll();setConfirm(false);}} className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm">確認清除</button>
</div>
</div>
</div>
)}
</div>
);
}



// ─── Quick Quote System ─────────────────────────────────────────
const QUOTE_TEMPLATES = {
living: { label:"客廳", icon:"🛋️", items:[
{name:"拆除工程",unit:"式",qty:1,price:15000},
{name:"輕隔間工程",unit:"才",qty:0,price:350},
{name:"木作天花板",unit:"才",qty:0,price:450},
{name:"木作電視牆",unit:"式",qty:1,price:45000},
{name:"木作展示櫃",unit:"尺",qty:0,price:6500},
{name:"油漆工程",unit:"才",qty:0,price:120},
{name:"地板鋪設（超耐磨）",unit:"才",qty:0,price:280},
{name:"燈具安裝",unit:"式",qty:1,price:8000},
{name:"窗簾安裝",unit:"式",qty:1,price:12000},
]},
bedroom: { label:"臥室", icon:"🛏️", items:[
{name:"拆除工程",unit:"式",qty:1,price:8000},
{name:"木作天花板",unit:"才",qty:0,price:450},
{name:"系統衣櫃",unit:"尺",qty:0,price:7500},
{name:"床頭背板",unit:"式",qty:1,price:25000},
{name:"油漆工程",unit:"才",qty:0,price:120},
{name:"地板鋪設（超耐磨）",unit:"才",qty:0,price:280},
{name:"燈具安裝",unit:"式",qty:1,price:5000},
{name:"窗簾安裝",unit:"式",qty:1,price:8000},
]},
kitchen: { label:"廚房", icon:"🍳", items:[
{name:"拆除工程",unit:"式",qty:1,price:20000},
{name:"水電配管",unit:"式",qty:1,price:35000},
{name:"廚具（上下櫃）",unit:"尺",qty:0,price:12000},
{name:"磁磚工程",unit:"才",qty:0,price:380},
{name:"油煙機安裝",unit:"式",qty:1,price:5000},
{name:"廚房門施作",unit:"式",qty:1,price:15000},
]},
bathroom: { label:"浴室", icon:"🚿", items:[
{name:"拆除工程",unit:"式",qty:1,price:18000},
{name:"防水工程",unit:"才",qty:0,price:350},
{name:"磁磚工程",unit:"才",qty:0,price:420},
{name:"衛浴設備",unit:"式",qty:1,price:45000},
{name:"水電配管",unit:"式",qty:1,price:25000},
{name:"乾濕分離",unit:"式",qty:1,price:18000},
{name:"浴室門施作",unit:"式",qty:1,price:12000},
]},
dining: { label:"餐廳", icon:"🍽️", items:[
{name:"木作酒櫃/餐邊櫃",unit:"尺",qty:0,price:6500},
{name:"油漆工程",unit:"才",qty:0,price:120},
{name:"地板鋪設",unit:"才",qty:0,price:280},
{name:"燈具安裝",unit:"式",qty:1,price:6000},
{name:"壁紙/牆面造型",unit:"式",qty:1,price:15000},
]},
study: { label:"書房", icon:"📚", items:[
{name:"系統書櫃",unit:"尺",qty:0,price:7000},
{name:"書桌訂製",unit:"式",qty:1,price:20000},
{name:"木作天花板",unit:"才",qty:0,price:450},
{name:"油漆工程",unit:"才",qty:0,price:120},
{name:"地板鋪設",unit:"才",qty:0,price:280},
{name:"燈具安裝",unit:"式",qty:1,price:4000},
]},
};

const EXTRA_ITEMS = [
{name:"設計費",unit:"坪",qty:0,price:8000,category:"設計"},
{name:"工程管理費",unit:"式",qty:1,price:30000,category:"管理"},
{name:"清潔費",unit:"式",qty:1,price:8000,category:"雜項"},
{name:"運費/搬運費",unit:"式",qty:1,price:5000,category:"雜項"},
{name:"保護工程",unit:"式",qty:1,price:12000,category:"施工"},
{name:"鋁窗更換",unit:"才",qty:0,price:650,category:"門窗"},
{name:"冷氣安裝",unit:"台",qty:0,price:8000,category:"設備"},
{name:"弱電工程",unit:"式",qty:1,price:20000,category:"水電"},
{name:"地板架高",unit:"才",qty:0,price:180,category:"地板"},
];

function QuickQuote({ items: savedQuotes, setItems: setSavedQuotes }) {
const [step, setStep] = useState(1); // 1=基本資訊, 2=選空間, 3=調整項目, 4=總覽
const [quoteInfo, setQuoteInfo] = useState({
client:"", projectName:"", date:new Date().toISOString().split("T")[0],
size:"", style:"現代風", note:"", discount:0, taxRate:5
});
const [selectedRooms, setSelectedRooms] = useState({});
const [lineItems, setLineItems] = useState([]);
const [showSaved, setShowSaved] = useState(false);
const [viewQuote, setViewQuote] = useState(null);

const toggleRoom = (roomKey) => {
const tmpl = QUOTE_TEMPLATES[roomKey];
if (selectedRooms[roomKey]) {
const newRooms = {...selectedRooms};
delete newRooms[roomKey];
setSelectedRooms(newRooms);
setLineItems(prev => prev.filter(i => i.roomKey !== roomKey));
} else {
setSelectedRooms(prev => ({...prev, [roomKey]: true}));
setLineItems(prev => [
...prev,
...tmpl.items.map((item,i) => ({
...item, id: `${roomKey}-${i}-${Date.now()}`,
roomKey, enabled: true
}))
]);
}
};

const addExtraItem = (item) => {
setLineItems(prev => [...prev, {...item, id:`extra-${Date.now()}`, roomKey:"extra", enabled:true}]);
};

const updateItem = (id, field, val) => {
setLineItems(prev => prev.map(i => i.id===id ? {...i,[field]:val} : i));
};

const removeItem = (id) => setLineItems(prev => prev.filter(i => i.id!==id));

const addCustomItem = () => {
setLineItems(prev => [...prev, {
id:`custom-${Date.now()}`, name:"自訂項目", unit:"式", qty:1, price:0,
roomKey:"custom", enabled:true
}]);
};

const subtotal = lineItems.filter(i=>i.enabled).reduce((s,i)=>s+Number(i.qty||0)*Number(i.price||0),0);
const discountAmt = Math.round(subtotal * (Number(quoteInfo.discount)||0) / 100);
const afterDiscount = subtotal - discountAmt;
const taxAmt = Math.round(afterDiscount * (Number(quoteInfo.taxRate)||0) / 100);
const total = afterDiscount + taxAmt;

const saveQuote = () => {
const q = {
id: Date.now(),
...quoteInfo,
rooms: Object.keys(selectedRooms),
lineItems: lineItems.filter(i=>i.enabled),
subtotal, discountAmt, taxAmt, total,
savedAt: new Date().toLocaleDateString("zh-TW"),
status:"草稿"
};
setSavedQuotes(prev => [q, ...prev]);
alert("✅ 報價已儲存！");
};

const resetQuote = () => {
setStep(1);
setQuoteInfo({client:"",projectName:"",date:new Date().toISOString().split("T")[0],size:"",style:"現代風",note:"",discount:0,taxRate:5});
setSelectedRooms({});
setLineItems([]);
};

if (showSaved) return (
<div className="space-y-3">
<button onClick={()=>{setShowSaved(false);setViewQuote(null);}} className="text-xs text-stone-500 flex items-center gap-1">‹ 返回</button>
<div className="flex justify-between items-center">
<span className="text-sm text-stone-400">共 {savedQuotes.length} 份報價</span>
<button onClick={()=>setShowSaved(false)} className="text-xs bg-stone-800 text-white px-3 py-1.5 rounded-lg">＋ 新增報價</button>
</div>
{savedQuotes.length===0&&<div className="text-center text-stone-400 py-12 text-sm">尚無儲存的報價</div>}
{savedQuotes.map(q=>(
<div key={q.id} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
<div className="flex justify-between items-start mb-1">
<div className="font-semibold text-stone-800 text-sm">{q.client||"未命名客戶"}</div>
<Badge color={q.status==="已確認"?"green":q.status==="已拒絕"?"red":"gray"}>{q.status||"草稿"}</Badge>
</div>
<div className="text-xs text-stone-400">{q.projectName} · {q.savedAt}</div>
<div className="text-base font-bold text-stone-800 mt-1">NT${q.total.toLocaleString()}</div>
<div className="text-xs text-stone-400">{(q.rooms||[]).map(r=>QUOTE_TEMPLATES[r]?.label).filter(Boolean).join("、")}</div>
<div className="flex gap-2 mt-3 pt-3 border-t border-stone-50">
<button onClick={()=>setViewQuote(q)} className="flex-1 text-xs text-stone-500 py-1.5 rounded-lg bg-stone-50">📄 查看</button>
<button onClick={()=>setSavedQuotes(p=>p.map(x=>x.id===q.id?{...x,status:x.status==="已確認"?"草稿":"已確認"}:x))} className="flex-1 text-xs text-emerald-600 py-1.5 rounded-lg bg-emerald-50">{q.status==="已確認"?"取消確認":"✓ 確認"}</button>
<button onClick={()=>setSavedQuotes(p=>p.filter(x=>x.id!==q.id))} className="flex-1 text-xs text-red-400 py-1.5 rounded-lg bg-red-50">🗑 刪除</button>
</div>
</div>
))}
{viewQuote&&(
<div className="fixed inset-0 z-50 flex flex-col bg-white" style={{maxWidth:430,margin:"0 auto"}}>
<div className="flex justify-between items-center px-4 py-3 border-b border-stone-100">
<div><div className="text-sm font-semibold">{viewQuote.client} 報價單</div><div className="text-xs text-stone-400">{viewQuote.savedAt}</div></div>
<button onClick={()=>setViewQuote(null)} className="text-stone-400 text-xl">✕</button>
</div>
<div className="flex-1 overflow-y-auto p-4 space-y-3">
<div className="bg-stone-800 text-white rounded-2xl p-4">
<div className="text-xs opacity-60 mb-1">初步報價單</div>
<div className="text-lg font-bold">{viewQuote.client}</div>
<div className="text-sm opacity-80">{viewQuote.projectName}</div>
<div className="text-xs opacity-60 mt-1">{viewQuote.date} · {viewQuote.style}</div>
</div>
<div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
<div className="grid grid-cols-12 text-xs text-stone-400 px-3 py-2 bg-stone-50 font-medium">
<div className="col-span-6">項目</div><div className="col-span-2 text-center">數量</div><div className="col-span-2 text-center">單位</div><div className="col-span-2 text-right">小計</div>
</div>
{viewQuote.lineItems.map((item,i)=>(
<div key={i} className="grid grid-cols-12 text-xs px-3 py-2 border-t border-stone-50">
<div className="col-span-6 text-stone-700">{item.name}</div>
<div className="col-span-2 text-center text-stone-500">{item.qty}</div>
<div className="col-span-2 text-center text-stone-400">{item.unit}</div>
<div className="col-span-2 text-right text-stone-700">{(Number(item.qty)*Number(item.price)).toLocaleString()}</div>
</div>
))}
</div>
<div className="bg-white rounded-2xl p-4 border border-stone-100 space-y-2">
<div className="flex justify-between text-sm"><span className="text-stone-400">小計</span><span>NT${viewQuote.subtotal.toLocaleString()}</span></div>
{viewQuote.discountAmt>0&&<div className="flex justify-between text-sm"><span className="text-stone-400">折扣</span><span className="text-red-500">-NT${viewQuote.discountAmt.toLocaleString()}</span></div>}
{viewQuote.taxAmt>0&&<div className="flex justify-between text-sm"><span className="text-stone-400">稅金 ({viewQuote.taxRate}%)</span><span>NT${viewQuote.taxAmt.toLocaleString()}</span></div>}
<div className="flex justify-between text-base font-bold pt-2 border-t border-stone-100"><span>總計</span><span className="text-stone-800">NT${viewQuote.total.toLocaleString()}</span></div>
</div>
{viewQuote.note&&<div className="bg-stone-50 rounded-xl p-3 text-xs text-stone-500">{viewQuote.note}</div>}
<button onClick={()=>window.print()} className="w-full bg-stone-800 text-white rounded-xl py-3 text-sm font-medium">🖨️ 列印 / 儲存 PDF</button>
</div>
</div>
)}
</div>
);

return (
<div className="space-y-4">
{/* Header */}
<div className="flex justify-between items-center">
<div className="flex gap-1">
{[1,2,3,4].map(s=>(
<div key={s} className={`w-8 h-1.5 rounded-full ${step>=s?"bg-stone-800":"bg-stone-200"}`}/>
))}
</div>
<button onClick={()=>setShowSaved(true)} className="text-xs text-stone-500 border border-stone-200 px-3 py-1.5 rounded-lg">
📄 已儲存 ({savedQuotes.length})
</button>
</div>

{/* Step 1: 基本資訊 */}
{step===1&&(
<div className="space-y-3">
<div className="bg-stone-800 text-white rounded-2xl p-4">
<div className="text-xs opacity-60 mb-1">步驟 1 / 4</div>
<div className="text-base font-bold">填寫基本資訊</div>
</div>
<Inp label="客戶姓名" placeholder="例：陳先生" value={quoteInfo.client} onChange={e=>setQuoteInfo({...quoteInfo,client:e.target.value})}/>
<Inp label="專案名稱" placeholder="例：大安區陳宅翻修" value={quoteInfo.projectName} onChange={e=>setQuoteInfo({...quoteInfo,projectName:e.target.value})}/>
<div className="grid grid-cols-2 gap-3">
<Inp label="報價日期" type="date" value={quoteInfo.date} onChange={e=>setQuoteInfo({...quoteInfo,date:e.target.value})}/>
<Inp label="室內坪數" placeholder="例：30" value={quoteInfo.size} onChange={e=>setQuoteInfo({...quoteInfo,size:e.target.value})}/>
</div>
<Sel label="設計風格" options={["現代風","北歐風","工業風","日式風","古典風","混搭風","其他"]} value={quoteInfo.style} onChange={e=>setQuoteInfo({...quoteInfo,style:e.target.value})}/>
<button onClick={()=>setStep(2)} className="w-full bg-stone-800 text-white rounded-xl py-3 text-sm font-medium">下一步 →</button>
</div>
)}

{/* Step 2: 選空間 */}
{step===2&&(
<div className="space-y-3">
<div className="bg-stone-800 text-white rounded-2xl p-4">
<div className="text-xs opacity-60 mb-1">步驟 2 / 4</div>
<div className="text-base font-bold">選擇施作空間</div>
<div className="text-xs opacity-60 mt-1">可多選，系統自動帶入建議項目</div>
</div>
<div className="grid grid-cols-3 gap-2">
{Object.entries(QUOTE_TEMPLATES).map(([key,tmpl])=>(
<button key={key} onClick={()=>toggleRoom(key)}
className={`rounded-2xl p-3 text-center border-2 transition-all ${selectedRooms[key]?"border-stone-800 bg-stone-800 text-white":"border-stone-200 bg-white text-stone-600"}`}>
<div className="text-2xl mb-1">{tmpl.icon}</div>
<div className="text-xs font-medium">{tmpl.label}</div>
</button>
))}
</div>
{Object.keys(selectedRooms).length>0&&(
<div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-700">
✅ 已選：{Object.keys(selectedRooms).map(k=>QUOTE_TEMPLATES[k].label).join("、")}
</div>
)}
<div className="flex gap-2">
<button onClick={()=>setStep(1)} className="flex-1 bg-stone-100 text-stone-600 rounded-xl py-3 text-sm">← 返回</button>
<button onClick={()=>setStep(3)} disabled={Object.keys(selectedRooms).length===0} className={`flex-1 rounded-xl py-3 text-sm font-medium ${Object.keys(selectedRooms).length>0?"bg-stone-800 text-white":"bg-stone-200 text-stone-400"}`}>下一步 →</button>
</div>
</div>
)}

{/* Step 3: 調整項目 */}
{step===3&&(
<div className="space-y-3">
<div className="bg-stone-800 text-white rounded-2xl p-4">
<div className="text-xs opacity-60 mb-1">步驟 3 / 4</div>
<div className="text-base font-bold">調整工程項目</div>
<div className="text-xs opacity-60 mt-1">可修改數量、單價，或取消勾選不需要的項目</div>
</div>

{Object.keys(selectedRooms).map(roomKey=>(
<div key={roomKey} className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
<div className="flex items-center gap-2 px-4 py-3 bg-stone-50">
<span>{QUOTE_TEMPLATES[roomKey].icon}</span>
<span className="text-sm font-semibold text-stone-700">{QUOTE_TEMPLATES[roomKey].label}</span>
</div>
{lineItems.filter(i=>i.roomKey===roomKey).map(item=>(
<div key={item.id} className={`border-t border-stone-50 px-3 py-2 ${!item.enabled?"opacity-40":""}`}>
<div className="flex items-center gap-2 mb-1">
<button onClick={()=>updateItem(item.id,"enabled",!item.enabled)} className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-[10px] ${item.enabled?"bg-stone-800 border-stone-800 text-white":"border-stone-300"}`}>{item.enabled?"✓":""}</button>
<input className="flex-1 text-xs text-stone-700 bg-transparent border-none outline-none" value={item.name} onChange={e=>updateItem(item.id,"name",e.target.value)}/>
<button onClick={()=>removeItem(item.id)} className="text-red-300 text-xs flex-shrink-0">✕</button>
</div>
<div className="flex items-center gap-2 ml-6">
<input className="w-16 border border-stone-200 rounded-lg px-2 py-1 text-xs text-center" type="number" value={item.qty} onChange={e=>updateItem(item.id,"qty",e.target.value)} placeholder="數量"/>
<span className="text-xs text-stone-400">{item.unit}</span>
<span className="text-xs text-stone-400">×</span>
<input className="w-20 border border-stone-200 rounded-lg px-2 py-1 text-xs text-center" type="number" value={item.price} onChange={e=>updateItem(item.id,"price",e.target.value)} placeholder="單價"/>
<span className="text-xs text-stone-400 ml-auto">{item.enabled?(Number(item.qty||0)*Number(item.price||0)).toLocaleString():"-"}</span>
</div>
</div>
))}
</div>
))}

{/* Extra items */}
<div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
<div className="px-4 py-3 bg-stone-50">
<span className="text-sm font-semibold text-stone-700">➕ 其他費用</span>
</div>
<div className="p-3 flex flex-wrap gap-2">
{EXTRA_ITEMS.map((item,i)=>(
<button key={i} onClick={()=>addExtraItem(item)} className="text-xs bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-stone-600">{item.name}</button>
))}
</div>
{lineItems.filter(i=>i.roomKey==="extra"||i.roomKey==="custom").map(item=>(
<div key={item.id} className={`border-t border-stone-50 px-3 py-2 ${!item.enabled?"opacity-40":""}`}>
<div className="flex items-center gap-2 mb-1">
<button onClick={()=>updateItem(item.id,"enabled",!item.enabled)} className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-[10px] ${item.enabled?"bg-stone-800 border-stone-800 text-white":"border-stone-300"}`}>{item.enabled?"✓":""}</button>
<input className="flex-1 text-xs text-stone-700 bg-transparent border-none outline-none" value={item.name} onChange={e=>updateItem(item.id,"name",e.target.value)}/>
<button onClick={()=>removeItem(item.id)} className="text-red-300 text-xs">✕</button>
</div>
<div className="flex items-center gap-2 ml-6">
<input className="w-16 border border-stone-200 rounded-lg px-2 py-1 text-xs text-center" type="number" value={item.qty} onChange={e=>updateItem(item.id,"qty",e.target.value)}/>
<span className="text-xs text-stone-400">{item.unit}</span>
<span className="text-xs text-stone-400">×</span>
<input className="w-20 border border-stone-200 rounded-lg px-2 py-1 text-xs text-center" type="number" value={item.price} onChange={e=>updateItem(item.id,"price",e.target.value)}/>
<span className="text-xs text-stone-400 ml-auto">{item.enabled?(Number(item.qty||0)*Number(item.price||0)).toLocaleString():"-"}</span>
</div>
</div>
))}
<div className="p-3 border-t border-stone-50">
<button onClick={addCustomItem} className="w-full text-xs text-stone-400 border border-dashed border-stone-200 rounded-xl py-2">＋ 自訂項目</button>
</div>
</div>

<div className="bg-stone-50 rounded-2xl p-3 border border-stone-200">
<div className="flex justify-between text-sm font-semibold">
<span className="text-stone-600">目前小計</span>
<span className="text-stone-800">NT${subtotal.toLocaleString()}</span>
</div>
</div>

<div className="flex gap-2">
<button onClick={()=>setStep(2)} className="flex-1 bg-stone-100 text-stone-600 rounded-xl py-3 text-sm">← 返回</button>
<button onClick={()=>setStep(4)} className="flex-1 bg-stone-800 text-white rounded-xl py-3 text-sm font-medium">下一步 →</button>
</div>
</div>
)}

{/* Step 4: 總覽 */}
{step===4&&(
<div className="space-y-3">
<div className="bg-stone-800 text-white rounded-2xl p-4">
<div className="text-xs opacity-60 mb-1">步驟 4 / 4</div>
<div className="text-base font-bold">報價總覽</div>
<div className="text-xs opacity-60 mt-1">確認後可儲存或列印</div>
</div>

<div className="bg-white rounded-2xl p-4 border border-stone-100">
<div className="text-xs text-stone-400 mb-3 font-medium">報價資訊</div>
{[["客戶",quoteInfo.client],["專案",quoteInfo.projectName],["日期",quoteInfo.date],["坪數",quoteInfo.size?`${quoteInfo.size} 坪`:""],["風格",quoteInfo.style]].filter(([,v])=>v).map(([l,v])=>(
<div key={l} className="flex justify-between text-sm mb-1"><span className="text-stone-400">{l}</span><span className="text-stone-700">{v}</span></div>
))}
</div>

<div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
<div className="grid grid-cols-12 text-xs text-stone-400 px-3 py-2 bg-stone-50 font-medium">
<div className="col-span-6">項目</div><div className="col-span-2 text-center">數量</div><div className="col-span-2 text-center">單位</div><div className="col-span-2 text-right">小計</div>
</div>
{lineItems.filter(i=>i.enabled&&Number(i.qty)>0).map(item=>(
<div key={item.id} className="grid grid-cols-12 text-xs px-3 py-2 border-t border-stone-50">
<div className="col-span-6 text-stone-700">{item.name}</div>
<div className="col-span-2 text-center text-stone-500">{item.qty}</div>
<div className="col-span-2 text-center text-stone-400">{item.unit}</div>
<div className="col-span-2 text-right text-stone-700">{(Number(item.qty)*Number(item.price)).toLocaleString()}</div>
</div>
))}
</div>

<div className="bg-white rounded-2xl p-4 border border-stone-100 space-y-3">
<div className="flex justify-between items-center">
<span className="text-sm text-stone-400">工程小計</span>
<span className="text-sm font-medium">NT${subtotal.toLocaleString()}</span>
</div>
<div className="flex items-center gap-3">
<span className="text-sm text-stone-400 flex-shrink-0">折扣</span>
<input type="number" min="0" max="50" className="w-16 border border-stone-200 rounded-lg px-2 py-1 text-sm text-center" value={quoteInfo.discount} onChange={e=>setQuoteInfo({...quoteInfo,discount:e.target.value})}/>
<span className="text-sm text-stone-400">%</span>
{discountAmt>0&&<span className="text-sm text-red-500 ml-auto">-NT${discountAmt.toLocaleString()}</span>}
</div>
<div className="flex items-center gap-3">
<span className="text-sm text-stone-400 flex-shrink-0">稅金</span>
<input type="number" min="0" max="20" className="w-16 border border-stone-200 rounded-lg px-2 py-1 text-sm text-center" value={quoteInfo.taxRate} onChange={e=>setQuoteInfo({...quoteInfo,taxRate:e.target.value})}/>
<span className="text-sm text-stone-400">%</span>
{taxAmt>0&&<span className="text-sm text-stone-500 ml-auto">+NT${taxAmt.toLocaleString()}</span>}
</div>
<div className="flex justify-between items-center pt-3 border-t border-stone-100">
<span className="text-base font-bold text-stone-700">總計</span>
<span className="text-xl font-bold text-stone-800">NT${total.toLocaleString()}</span>
</div>
</div>

<Txt label="備註說明" placeholder="例：此為初步估價，實際費用依現場丈量為準，報價有效期限30天" value={quoteInfo.note} onChange={e=>setQuoteInfo({...quoteInfo,note:e.target.value})}/>

<div className="flex gap-2">
<button onClick={()=>setStep(3)} className="flex-1 bg-stone-100 text-stone-600 rounded-xl py-3 text-sm">← 返回</button>
<button onClick={saveQuote} className="flex-1 bg-emerald-600 text-white rounded-xl py-3 text-sm font-medium">💾 儲存報價</button>
</div>
<button onClick={()=>window.print()} className="w-full bg-stone-800 text-white rounded-xl py-3 text-sm font-medium">🖨️ 列印 / PDF</button>
<button onClick={resetQuote} className="w-full text-stone-400 text-sm py-2">重新開始</button>
</div>
)}
</div>
);
}


// ─── Clients ────────────────────────────────────────────────────
function Clients({ items, setItems }) {
const [modal, setModal] = useState(false);
const [edit, setEdit] = useState(null);
const [view, setView] = useState(null);
const blank = {name:"",phone:"",email:"",address:"",style:"現代風",budget:"",source:"介紹",status:"潛在客戶",birthday:"",note:"",history:""};
const [form, setForm] = useState(blank);
const open=(item=null)=>{setEdit(item);setForm(item||blank);setModal(true);};
const save=()=>{
if(!form.name.trim())return;
if(edit)setItems(p=>p.map(i=>i.id===edit.id?{...i,...form}:i));
else setItems(p=>[{...form,id:Date.now(),createdAt:new Date().toLocaleDateString("zh-TW")},...p]);
setModal(false);
};
const statusColor={
"潛在客戶":"yellow","進行中":"blue","已完工":"green","長期客戶":"green","不合適":"gray"
};
return(
<>
<div className="grid grid-cols-3 gap-2 mb-3">
{[["全部客戶",items.length,"stone"],["進行中",items.filter(i=>i.status==="進行中").length,"blue"],["已完工",items.filter(i=>i.status==="已完工").length,"green"]].map(([l,v,c])=>(
<div key={l} className="bg-white rounded-2xl p-3 text-center border border-stone-100 shadow-sm">
<div className={`text-lg font-bold ${c==="blue"?"text-blue-500":c==="green"?"text-emerald-500":"text-stone-700"}`}>{v}</div>
<div className="text-xs text-stone-400">{l}</div>
</div>
))}
</div>
<ListPage items={items} onAdd={()=>open()} onEdit={open} onDelete={id=>setItems(p=>p.filter(i=>i.id!==id))} addLabel="新增客戶"
renderItem={i=>(
<>
<div className="flex justify-between items-start mb-1">
<div className="font-semibold text-stone-800 text-sm">{i.name}</div>
<Badge color={statusColor[i.status]||"gray"}>{i.status}</Badge>
</div>
<div className="text-xs text-stone-400">{i.phone}{i.email?` · ${i.email}`:""}</div>
<div className="text-xs text-stone-400 mt-0.5">{i.style}{i.budget?` · 預算 ${i.budget}`:""}</div>
{i.note&&<div className="text-xs text-stone-500 mt-1 line-clamp-1">{i.note}</div>}
<button onClick={e=>{e.stopPropagation();setView(i);}} className="text-xs text-blue-500 mt-1">查看詳情 →</button>
</>
)}
/>
{modal&&<Modal title={edit?"編輯客戶":"新增客戶"} onClose={()=>setModal(false)}>
<div className="space-y-3">
<Inp label="客戶姓名 *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
<div className="grid grid-cols-2 gap-3">
<Inp label="聯絡電話" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/>
<Inp label="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
</div>
<Inp label="地址" value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/>
<div className="grid grid-cols-2 gap-3">
<Sel label="偏好風格" options={["現代風","北歐風","工業風","日式風","古典風","混搭風","其他"]} value={form.style} onChange={e=>setForm({...form,style:e.target.value})}/>
<Inp label="預算範圍" placeholder="NT$" value={form.budget} onChange={e=>setForm({...form,budget:e.target.value})}/>
</div>
<div className="grid grid-cols-2 gap-3">
<Sel label="客戶來源" options={["介紹","網路","廣告","展覽","其他"]} value={form.source} onChange={e=>setForm({...form,source:e.target.value})}/>
<Sel label="狀態" options={["潛在客戶","進行中","已完工","長期客戶","不合適"]} value={form.status} onChange={e=>setForm({...form,status:e.target.value})}/>
</div>
<Inp label="生日" type="date" value={form.birthday} onChange={e=>setForm({...form,birthday:e.target.value})}/>
<Txt label="溝通紀錄" placeholder="記錄每次溝通重點" value={form.history} onChange={e=>setForm({...form,history:e.target.value})}/>
<Txt label="備註" value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/>
</div>
<Btn onClick={save}/>
</Modal>}
{view&&<Modal title={view.name} onClose={()=>setView(null)}>
<div className="space-y-3">
<div className="flex justify-between items-center">
<Badge color={statusColor[view.status]||"gray"}>{view.status}</Badge>
<span className="text-xs text-stone-400">{view.createdAt} 建立</span>
</div>
{[["📞 電話",view.phone],["📧 Email",view.email],["📍 地址",view.address],["🎨 風格",view.style],["💰 預算",view.budget],["📣 來源",view.source],["🎂 生日",view.birthday]].filter(([,v])=>v).map(([l,v])=>(
<div key={l} className="flex gap-2 text-sm"><span className="text-stone-400 flex-shrink-0">{l}</span><span className="text-stone-700">{v}</span></div>
))}
{view.history&&<><div className="text-xs text-stone-400 mt-2 font-medium">溝通紀錄</div><div className="text-sm text-stone-700 whitespace-pre-wrap bg-stone-50 rounded-xl p-3">{view.history}</div></>}
{view.note&&<><div className="text-xs text-stone-400 font-medium">備註</div><div className="text-sm text-stone-700">{view.note}</div></>}
<div className="flex gap-2 mt-2">
<button onClick={()=>{setView(null);open(view);}} className="flex-1 bg-stone-800 text-white rounded-xl py-2.5 text-sm">✏️ 編輯</button>
</div>
</div>
</Modal>}
</>
);
}

// ─── Schedule ───────────────────────────────────────────────────
function Schedule({ items, setItems, projects }) {
const [modal, setModal] = useState(false);
const [edit, setEdit] = useState(null);
const blank = {title:"",project:"",worker:"",type:"施工",startDate:"",endDate:"",startTime:"",endTime:"",color:"blue",note:""};
const [form, setForm] = useState(blank);
const [viewMonth, setViewMonth] = useState(new Date().getMonth());
const [viewYear, setViewYear] = useState(new Date().getFullYear());
const open=(item=null)=>{setEdit(item);setForm(item||blank);setModal(true);};
const save=()=>{
if(!form.title.trim())return;
if(edit)setItems(p=>p.map(i=>i.id===edit.id?{...i,...form}:i));
else setItems(p=>[{...form,id:Date.now()},...p]);
setModal(false);
};

const today=new Date();
const firstDay=new Date(viewYear,viewMonth,1).getDay();
const daysInMonth=new Date(viewYear,viewMonth+1,0).getDate();
const mNames=["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];

const getEventsForDay=(day)=>{
const dateStr=`${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
return items.filter(i=>i.startDate<=dateStr&&i.endDate>=dateStr);
};

const typeColor={施工:"bg-blue-200",設計:"bg-purple-200",驗收:"bg-green-200",會議:"bg-yellow-200",其他:"bg-stone-200"};

// Conflict detection
const conflicts=[];
for(let i=0;i<items.length;i++){
for(let j=i+1;j<items.length;j++){
const a=items[i],b=items[j];
if(a.worker&&b.worker&&a.worker===b.worker&&a.startDate<=b.endDate&&b.startDate<=a.endDate){
conflicts.push({a:a.title,b:b.title,worker:a.worker});
}
}
}

return(
<div className="space-y-3">
{conflicts.length>0&&(
<div className="bg-red-50 border border-red-200 rounded-2xl p-3">
<div className="text-xs text-red-600 font-medium mb-1">⚠️ 排程衝突</div>
{conflicts.map((c,i)=><div key={i} className="text-xs text-red-500">「{c.worker}」：{c.a} 與 {c.b} 時間重疊</div>)}
</div>
)}
<div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
<div className="flex justify-between items-center mb-4">
<button onClick={()=>{if(viewMonth===0){setViewMonth(11);setViewYear(y=>y-1)}else setViewMonth(m=>m-1);}} className="w-8 h-8 flex items-center justify-center text-stone-400 text-xl">‹</button>
<span className="text-sm font-semibold">{viewYear}年 {mNames[viewMonth]}</span>
<button onClick={()=>{if(viewMonth===11){setViewMonth(0);setViewYear(y=>y+1)}else setViewMonth(m=>m+1);}} className="w-8 h-8 flex items-center justify-center text-stone-400 text-xl">›</button>
</div>
<div className="grid grid-cols-7 text-center mb-1">
{["日","一","二","三","四","五","六"].map(d=><div key={d} className="text-xs text-stone-400">{d}</div>)}
</div>
<div className="grid grid-cols-7 gap-y-1">
{Array(firstDay).fill(null).map((_,i)=><div key={`e${i}`}/>)}
{Array(daysInMonth).fill(null).map((_,i)=>{
const day=i+1;
const isToday=day===today.getDate()&&viewMonth===today.getMonth()&&viewYear===today.getFullYear();
const evts=getEventsForDay(day);
return(
<div key={day} className="flex flex-col items-center">
<div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs ${isToday?"bg-stone-800 text-white font-bold":""}`}>{day}</div>
{evts.slice(0,2).map(e=><div key={e.id} className={`w-full text-[9px] rounded px-0.5 truncate mt-0.5 ${typeColor[e.type]||"bg-stone-200"}`}>{e.title}</div>)}
{evts.length>2&&<div className="text-[9px] text-stone-400">+{evts.length-2}</div>}
</div>
);
})}
</div>
</div>
<div className="flex justify-between items-center">
<span className="text-sm text-stone-400">共 {items.length} 筆排程</span>
<button onClick={()=>open()} className="text-xs bg-stone-800 text-white px-3 py-1.5 rounded-lg">＋ 新增排程</button>
</div>
{items.sort((a,b)=>a.startDate>b.startDate?1:-1).slice(0,10).map(i=>(
<div key={i.id} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
<div className="flex justify-between items-start mb-1">
<div className="font-semibold text-stone-800 text-sm">{i.title}</div>
<span className={`text-xs px-2 py-0.5 rounded-full ${typeColor[i.type]||"bg-stone-100"}`}>{i.type}</span>
</div>
<div className="text-xs text-stone-400">{i.project}{i.worker?` · 負責：${i.worker}`:""}</div>
<div className="text-xs text-stone-500 mt-1">📅 {i.startDate}{i.endDate!==i.startDate?` ～ ${i.endDate}`:""} {i.startTime}{i.endTime?`～${i.endTime}`:""}</div>
<div className="flex gap-2 mt-3 pt-3 border-t border-stone-50">
<button onClick={()=>open(i)} className="flex-1 text-xs text-stone-500 py-1.5 rounded-lg bg-stone-50">✏️ 編輯</button>
<button onClick={()=>setItems(p=>p.filter(x=>x.id!==i.id))} className="flex-1 text-xs text-red-400 py-1.5 rounded-lg bg-red-50">🗑 刪除</button>
</div>
</div>
))}
{modal&&<Modal title={edit?"編輯排程":"新增排程"} onClose={()=>setModal(false)}>
<div className="space-y-3">
<Inp label="標題 *" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
<Sel label="所屬專案" options={["",...getProjectList()]} value={form.project} onChange={e=>setForm({...form,project:e.target.value})}/>
<div className="grid grid-cols-2 gap-3">
<Sel label="類型" options={["施工","設計","驗收","會議","其他"]} value={form.type} onChange={e=>setForm({...form,type:e.target.value})}/>
<Inp label="負責人/師傅" value={form.worker} onChange={e=>setForm({...form,worker:e.target.value})}/>
</div>
<div className="grid grid-cols-2 gap-3">
<Inp label="開始日期" type="date" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})}/>
<Inp label="結束日期" type="date" value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})}/>
</div>
<div className="grid grid-cols-2 gap-3">
<Inp label="開始時間" type="time" value={form.startTime} onChange={e=>setForm({...form,startTime:e.target.value})}/>
<Inp label="結束時間" type="time" value={form.endTime} onChange={e=>setForm({...form,endTime:e.target.value})}/>
</div>
<Txt label="備註" value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/>
</div>
<Btn onClick={save}/>
</Modal>}
</div>
);
}

// ─── Album ──────────────────────────────────────────────────────
function Album({ items, setItems }) {
const [modal, setModal] = useState(false);
const [edit, setEdit] = useState(null);
const [viewImg, setViewImg] = useState(null);
const blank = {project:"",stage:"施工前",title:"",url:"",note:"",date:""};
const [form, setForm] = useState(blank);
const open=(item=null)=>{setEdit(item);setForm(item||blank);setModal(true);};
const save=()=>{
if(!form.url.trim()&&!form.title.trim())return;
if(edit)setItems(p=>p.map(i=>i.id===edit.id?{...i,...form}:i));
else setItems(p=>[{...form,id:Date.now(),date:form.date||new Date().toLocaleDateString("zh-TW")},...p]);
setModal(false);
};
const stages=["施工前","施工中","施工後","設計圖","其他"];
const stageColor={"施工前":"gray","施工中":"blue","施工後":"green","設計圖":"purple","其他":"yellow"};
const byProject={};
items.forEach(i=>{if(!byProject[i.project])byProject[i.project]=[];byProject[i.project].push(i);});

return(
<>
<div className="flex justify-between items-center mb-3">
<span className="text-sm text-stone-400">共 {items.length} 張</span>
<button onClick={()=>open()} className="text-xs bg-stone-800 text-white px-3 py-1.5 rounded-lg">＋ 新增照片</button>
</div>
{Object.keys(byProject).length===0&&<div className="text-center text-stone-400 py-12 text-sm">尚無照片，點右上角新增</div>}
{Object.entries(byProject).map(([proj,imgs])=>(
<div key={proj} className="mb-4">
<div className="text-xs font-semibold text-stone-500 mb-2 px-1">🏠 {proj||"未分類"}</div>
<div className="grid grid-cols-3 gap-2">
{imgs.map(img=>(
<div key={img.id} className="relative rounded-xl overflow-hidden border border-stone-100 bg-stone-50 aspect-square flex flex-col">
{img.url?(
<img src={img.url} alt={img.title} className="w-full h-full object-cover cursor-pointer" onClick={()=>setViewImg(img)} onError={e=>{e.target.style.display="none";}}/>
):(
<div className="flex-1 flex items-center justify-center text-2xl cursor-pointer" onClick={()=>setViewImg(img)}>🖼️</div>
)}
<div className={`absolute top-1 left-1 text-[9px] px-1.5 py-0.5 rounded-full text-white ${stageColor[img.stage]==="blue"?"bg-blue-500":stageColor[img.stage]==="green"?"bg-emerald-500":stageColor[img.stage]==="purple"?"bg-purple-500":"bg-stone-500"}`}>{img.stage}</div>
<button onClick={()=>open(img)} className="absolute top-1 right-1 w-5 h-5 bg-white/80 rounded-full text-xs flex items-center justify-center">✏️</button>
</div>
))}
</div>
</div>
))}
{modal&&<Modal title={edit?"編輯照片":"新增照片"} onClose={()=>setModal(false)}>
<div className="space-y-3">
<Inp label="照片標題" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
<Sel label="所屬專案" options={["",...getProjectList()]} value={form.project} onChange={e=>setForm({...form,project:e.target.value})}/>
<Sel label="施工階段" options={stages} value={form.stage} onChange={e=>setForm({...form,stage:e.target.value})}/>
<Inp label="圖片網址（URL）" placeholder="https://..." value={form.url} onChange={e=>setForm({...form,url:e.target.value})}/>
<div className="bg-stone-50 rounded-xl p-3 text-xs text-stone-400">
💡 可將照片上傳到 Google 相簿或 Imgur，再貼入圖片連結
</div>
<Inp label="拍攝日期" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
<Txt label="備註" value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/>
</div>
<Btn onClick={save}/>
</Modal>}
{viewImg&&(
<div className="fixed inset-0 z-50 bg-black/90 flex flex-col" style={{maxWidth:430,margin:"0 auto"}}>
<div className="flex justify-between items-center p-4">
<div><div className="text-white text-sm font-medium">{viewImg.title||"照片"}</div><div className="text-white/60 text-xs">{viewImg.project} · {viewImg.stage}</div></div>
<button onClick={()=>setViewImg(null)} className="text-white text-xl w-8 h-8 flex items-center justify-center">✕</button>
</div>
<div className="flex-1 flex items-center justify-center p-4">
{viewImg.url?<img src={viewImg.url} alt={viewImg.title} className="max-w-full max-h-full rounded-xl object-contain"/>:<div className="text-white text-6xl">🖼️</div>}
</div>
{viewImg.note&&<div className="p-4 text-white/70 text-sm">{viewImg.note}</div>}
<div className="flex gap-2 p-4">
<button onClick={()=>{setViewImg(null);open(viewImg);}} className="flex-1 bg-white/20 text-white rounded-xl py-2.5 text-sm">✏️ 編輯</button>
<button onClick={()=>{setItems(p=>p.filter(i=>i.id!==viewImg.id));setViewImg(null);}} className="flex-1 bg-red-500/80 text-white rounded-xl py-2.5 text-sm">🗑 刪除</button>
</div>
</div>
)}
</>
);
}

// ─── Reports ────────────────────────────────────────────────────
function Reports({ projects, tasks, ledger, clients, quotes, contracts, attendance }) {
const [selected, setSelected] = useState(null);
const [projectFilter, setProjectFilter] = useState("");

const income=ledger.filter(i=>i.type==="收入").reduce((s,i)=>s+Number(i.amount||0),0);
const expense=ledger.filter(i=>i.type==="支出").reduce((s,i)=>s+Number(i.amount||0),0);
const profit=income-expense;

const reportTypes = [
{ id:"summary", icon:"📊", title:"公司月報", desc:"收支、專案、任務綜合報表" },
{ id:"project", icon:"🏠", title:"專案報告", desc:"單一專案完整紀錄" },
{ id:"finance", icon:"💰", title:"財務報表", desc:"收入支出明細" },
{ id:"client", icon:"👥", title:"客戶報告", desc:"客戶名單與狀態" },
];

const printReport=()=>{
window.print();
};

return(
<div className="space-y-3">
{!selected?(
<>
<div className="text-xs text-stone-400 px-1">選擇要產出的報表類型</div>
{reportTypes.map(r=>(
<button key={r.id} onClick={()=>setSelected(r.id)} className="w-full bg-white rounded-2xl p-4 shadow-sm border border-stone-100 flex items-center gap-3 text-left">
<span className="text-2xl">{r.icon}</span>
<div><div className="text-sm font-semibold text-stone-800">{r.title}</div><div className="text-xs text-stone-400">{r.desc}</div></div>
<span className="ml-auto text-stone-300">›</span>
</button>
))}
</>
):(
<div className="space-y-3">
<button onClick={()=>setSelected(null)} className="text-xs text-stone-500 flex items-center gap-1">‹ 返回</button>

{selected==="summary"&&(
<div id="report-content" className="space-y-3">
<div className="bg-stone-800 text-white rounded-2xl p-4">
<div className="text-xs opacity-60 mb-1">公司月報 · {new Date().toLocaleDateString("zh-TW")}</div>
<div className="text-lg font-bold">營運總覽</div>
</div>
<div className="grid grid-cols-2 gap-3">
<div className="bg-white rounded-2xl p-4 border border-stone-100"><div className="text-xs text-stone-400 mb-1">累計收入</div><div className="text-lg font-bold text-emerald-600">NT${income.toLocaleString()}</div></div>
<div className="bg-white rounded-2xl p-4 border border-stone-100"><div className="text-xs text-stone-400 mb-1">累計支出</div><div className="text-lg font-bold text-red-500">NT${expense.toLocaleString()}</div></div>
<div className="bg-white rounded-2xl p-4 border border-stone-100"><div className="text-xs text-stone-400 mb-1">淨利潤</div><div className={`text-lg font-bold ${profit>=0?"text-stone-800":"text-red-500"}`}>NT${profit.toLocaleString()}</div></div>
<div className="bg-white rounded-2xl p-4 border border-stone-100"><div className="text-xs text-stone-400 mb-1">利潤率</div><div className="text-lg font-bold text-stone-800">{income>0?((profit/income)*100).toFixed(1):0}%</div></div>
</div>
<div className="bg-white rounded-2xl p-4 border border-stone-100">
<div className="text-xs text-stone-400 mb-3 font-medium">專案狀態</div>
{["設計中","施工中","驗收中","完工"].map(s=>{
const cnt=projects.filter(p=>p.status===s).length;
return cnt>0?(
<div key={s} className="flex justify-between items-center mb-2">
<span className="text-sm text-stone-600">{s}</span>
<span className="text-sm font-bold text-stone-800">{cnt} 個</span>
</div>
):null;
})}
</div>
<div className="bg-white rounded-2xl p-4 border border-stone-100">
<div className="text-xs text-stone-400 mb-3 font-medium">任務完成率</div>
<div className="flex items-center gap-3">
<div className="flex-1 bg-stone-100 rounded-full h-3">
<div className="bg-emerald-500 h-3 rounded-full" style={{width:`${tasks.length>0?((tasks.filter(t=>t.done).length/tasks.length)*100).toFixed(0):0}%`}}/>
</div>
<span className="text-sm font-bold">{tasks.length>0?((tasks.filter(t=>t.done).length/tasks.length)*100).toFixed(0):0}%</span>
</div>
<div className="text-xs text-stone-400 mt-1">{tasks.filter(t=>t.done).length} / {tasks.length} 已完成</div>
</div>
</div>
)}

{selected==="finance"&&(
<div className="space-y-3">
<div className="bg-stone-800 text-white rounded-2xl p-4">
<div className="text-xs opacity-60 mb-1">財務報表 · {new Date().toLocaleDateString("zh-TW")}</div>
<div className="text-lg font-bold">收支明細</div>
</div>
{ledger.length===0&&<div className="text-center text-stone-400 py-8 text-sm">尚無帳本資料</div>}
{ledger.map(i=>(
<div key={i.id} className="bg-white rounded-xl p-3 border border-stone-100 flex justify-between items-center">
<div><div className="text-sm text-stone-700">{i.category}</div><div className="text-xs text-stone-400">{i.project} · {i.date}</div></div>
<div className={`text-sm font-bold ${i.type==="收入"?"text-emerald-600":"text-red-500"}`}>{i.type==="收入"?"+":"-"}NT${Number(i.amount||0).toLocaleString()}</div>
</div>
))}
</div>
)}

{selected==="project"&&(
<div className="space-y-3">
<Sel label="選擇專案" options={["",...projects.map(p=>p.name)]} value={projectFilter} onChange={e=>setProjectFilter(e.target.value)}/>
{projectFilter&&(()=>{
const p=projects.find(x=>x.name===projectFilter);
if(!p)return null;
const pLedger=ledger.filter(i=>i.project===p.name);
const pIncome=pLedger.filter(i=>i.type==="收入").reduce((s,i)=>s+Number(i.amount||0),0);
const pExpense=pLedger.filter(i=>i.type==="支出").reduce((s,i)=>s+Number(i.amount||0),0);
return(
<div className="space-y-3">
<div className="bg-stone-800 text-white rounded-2xl p-4">
<div className="text-xs opacity-60 mb-1">專案報告</div>
<div className="text-lg font-bold">{p.name}</div>
<Badge color={{施工中:"blue",設計中:"yellow",驗收中:"green",完工:"green"}[p.status]||"gray"}>{p.status}</Badge>
</div>
<div className="bg-white rounded-2xl p-4 border border-stone-100 space-y-2">
<div className="text-xs font-medium text-stone-400 mb-2">基本資料</div>
{[["客戶",p.client],["地址",p.address],["預算",p.budget],["進度",`${p.progress||0}%`]].filter(([,v])=>v).map(([l,v])=>(
<div key={l} className="flex justify-between text-sm"><span className="text-stone-400">{l}</span><span className="text-stone-700">{v}</span></div>
))}
</div>
<div className="grid grid-cols-2 gap-3">
<div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-100"><div className="text-xs text-emerald-600">收入</div><div className="text-base font-bold text-emerald-700">NT${pIncome.toLocaleString()}</div></div>
<div className="bg-red-50 rounded-2xl p-3 border border-red-100"><div className="text-xs text-red-500">支出</div><div className="text-base font-bold text-red-600">NT${pExpense.toLocaleString()}</div></div>
</div>
<div className="bg-white rounded-2xl p-3 border border-stone-100">
<div className="text-xs font-medium text-stone-400 mb-2">相關任務</div>
{tasks.filter(t=>t.project===p.name).map(t=>(
<div key={t.id} className="flex items-center gap-2 mb-1">
<span className={`text-xs ${t.done?"text-emerald-500":"text-stone-400"}`}>{t.done?"✓":"○"}</span>
<span className={`text-sm ${t.done?"line-through text-stone-400":"text-stone-700"}`}>{t.title}</span>
</div>
))}
</div>
</div>
);
})()}
</div>
)}

{selected==="client"&&(
<div className="space-y-3">
<div className="bg-stone-800 text-white rounded-2xl p-4">
<div className="text-xs opacity-60 mb-1">客戶報告 · {new Date().toLocaleDateString("zh-TW")}</div>
<div className="text-lg font-bold">共 {clients.length} 位客戶</div>
</div>
{clients.map(c=>(
<div key={c.id} className="bg-white rounded-xl p-3 border border-stone-100">
<div className="flex justify-between items-center">
<div className="text-sm font-medium text-stone-800">{c.name}</div>
<Badge color={{潛在客戶:"yellow",進行中:"blue",已完工:"green",長期客戶:"green",不合適:"gray"}[c.status]||"gray"}>{c.status}</Badge>
</div>
<div className="text-xs text-stone-400 mt-0.5">{c.phone} · {c.style}</div>
</div>
))}
</div>
)}

<button onClick={printReport} className="w-full bg-stone-800 text-white rounded-xl py-3 text-sm font-medium mt-2">🖨️ 列印 / 儲存 PDF</button>
<div className="text-xs text-stone-400 text-center">按下後選擇「儲存為 PDF」即可匯出</div>
</div>
)}
</div>
);
}


// ─── Notification System ─────────────────────────────────────────
function useNotifications(tasks, projects, inventory, tracking, leave, overtime, acceptance, pending, quotes) {
const today = new Date();
const todayStr = today.toISOString().split("T")[0];
const notes = [];

// Overdue tasks
tasks.filter(t => !t.done && t.due).forEach(t => {
const due = new Date(t.due);
if (due < today) notes.push({ type: "warning", category: "任務逾期", text: `「${t.title}」已逾期`, id: `task-${t.id}` });
else if ((due - today) / 86400000 <= 1) notes.push({ type: "info", category: "任務提醒", text: `「${t.title}」今日截止`, id: `task-due-${t.id}` });
});

// Low inventory
inventory.filter(i => Number(i.qty||0) <= Number(i.minQty||0)).forEach(i => {
notes.push({ type: "warning", category: "庫存不足", text: `「${i.name}」庫存剩 ${i.qty} ${i.unit}，低於安全庫存`, id: `inv-${i.id}` });
});

// Delayed tracking
tracking.filter(i => i.status === "延誤").forEach(i => {
notes.push({ type: "warning", category: "備料延誤", text: `「${i.material}」備料延誤`, id: `track-${i.id}` });
});

// Pending leave/overtime awaiting approval
leave.filter(i => i.status === "待審").forEach(i => {
notes.push({ type: "info", category: "假單待審", text: `${i.name} 申請 ${i.type}（${i.days}天）待審核`, id: `leave-${i.id}` });
});
overtime.filter(i => i.status === "待審").forEach(i => {
notes.push({ type: "info", category: "加班待審", text: `${i.name} 加班申請待審核`, id: `ot-${i.id}` });
});

// Pending acceptance
acceptance.filter(i => i.status === "待驗收").forEach(i => {
notes.push({ type: "info", category: "待驗收", text: `「${i.project}」等待驗收`, id: `acc-${i.id}` });
});

// Pending client confirmation
pending.filter(i => i.status === "待確認").forEach(i => {
notes.push({ type: "warning", category: "待客戶確認", text: `「${i.project}」${i.type}待客戶確認`, id: `pend-${i.id}` });
});

// Quotes expiring soon
quotes.filter(i => i.validUntil && i.status !== "已核准").forEach(i => {
const exp = new Date(i.validUntil);
const diff = (exp - today) / 86400000;
if (diff >= 0 && diff <= 3) notes.push({ type: "warning", category: "報價即將到期", text: `「${i.project}」報價 ${Math.ceil(diff)} 天後到期`, id: `quote-${i.id}` });
else if (diff < 0) notes.push({ type: "warning", category: "報價已到期", text: `「${i.project}」報價已到期`, id: `quote-exp-${i.id}` });
});

// Projects with no progress update (progress = 0 and status is 施工中)
projects.filter(p => p.status === "施工中" && (p.progress||0) === 0).forEach(p => {
notes.push({ type: "info", category: "專案提醒", text: `「${p.name}」施工中但進度未更新`, id: `proj-${p.id}` });
});

return notes;
}

function NotificationPanel({ notifications, onClose, onClearAll }) {
const typeColor = { warning: "bg-amber-50 border-amber-200 text-amber-800", info: "bg-blue-50 border-blue-200 text-blue-800" };
const typeIcon = { warning: "⚠️", info: "ℹ️" };
return (
<div className="fixed inset-0 z-50 flex flex-col" style={{maxWidth:430,margin:"0 auto"}}>
<div className="absolute inset-0 bg-black/40" onClick={onClose}/>
<div className="relative mt-16 bg-white rounded-t-3xl flex-1 overflow-y-auto shadow-2xl">
<div className="sticky top-0 bg-white px-5 pt-5 pb-3 border-b border-stone-100 flex justify-between items-center">
<div>
<h2 className="text-base font-semibold text-stone-800">通知中心</h2>
<div className="text-xs text-stone-400">{notifications.length} 則通知</div>
</div>
<div className="flex gap-2">
{notifications.length > 0 && <button onClick={onClearAll} className="text-xs text-red-400 px-3 py-1.5 rounded-lg bg-red-50">全部清除</button>}
<button onClick={onClose} className="text-stone-400 text-xl w-8 h-8 flex items-center justify-center">✕</button>
</div>
</div>
<div className="p-4 space-y-2">
{notifications.length === 0 && (
<div className="text-center py-16">
<div className="text-4xl mb-3">🎉</div>
<div className="text-stone-400 text-sm">目前沒有通知</div>
</div>
)}
{notifications.map(n => (
<div key={n.id} className={`flex items-start gap-3 rounded-xl px-4 py-3 text-sm border ${typeColor[n.type]}`}>
<span className="flex-shrink-0 mt-0.5">{typeIcon[n.type]}</span>
<div>
<div className="font-medium text-xs mb-0.5">{n.category}</div>
<div>{n.text}</div>
</div>
</div>
))}
</div>
<div className="h-8"/>
</div>
</div>
);
}


// ─── Permission System ──────────────────────────────────────────
const PROTECTED_PAGES = {
clients: { label:"客戶管理", icon:"👥" },
ledger: { label:"公司帳本", icon:"📒" },
purchase: { label:"採購申請單", icon:"💵" },
expense: { label:"報銷申請", icon:"🧾" },
payroll: { label:"薪資計算", icon:"💳" },
monthly: { label:"月度支出", icon:"🐷" },
forecast: { label:"財務預測", icon:"📈" },
profit: { label:"利潤分析", icon:"📈" },
losses: { label:"異常損失", icon:"⚠" },
settings: { label:"系統設定", icon:"⚙" },
};

function LockScreen({ pageId, onUnlock, onCancel, savedPassword }) {
const [input, setInput] = useState("");
const [error, setError] = useState(false);
const [showPw, setShowPw] = useState(false);
const page = PROTECTED_PAGES[pageId];

const tryUnlock = () => {
const pw = savedPassword || "1234";
if (input === pw) {
onUnlock(pageId);
setInput("");
setError(false);
} else {
setError(true);
setInput("");
setTimeout(() => setError(false), 1500);
}
};

return (
<div className="flex flex-col items-center justify-center py-16 px-6 space-y-6">
<div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${error ? "bg-red-100 animate-pulse" : "bg-stone-100"}`}>
{error ? "❌" : "🔒"}
</div>
<div className="text-center">
<div className="text-base font-semibold text-stone-800">{page?.icon} {page?.label}</div>
<div className="text-sm text-stone-400 mt-1">此功能需要密碼才能存取</div>
</div>
<div className="w-full space-y-3">
<div className="relative">
<input
type={showPw ? "text" : "password"}
className={`w-full border-2 rounded-2xl px-4 py-3.5 text-center text-lg tracking-widest focus:outline-none transition-colors ${error ? "border-red-400 bg-red-50" : "border-stone-200 focus:border-stone-400"}`}
placeholder="輸入密碼"
value={input}
onChange={e => setInput(e.target.value)}
onKeyDown={e => e.key === "Enter" && tryUnlock()}
autoFocus
/>
<button onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm">
{showPw ? "隱藏" : "顯示"}
</button>
</div>
{error && <div className="text-center text-red-500 text-sm font-medium">密碼錯誤，請再試一次</div>}
<button onClick={tryUnlock} className="w-full bg-stone-800 text-white rounded-2xl py-3.5 font-medium text-sm">
解鎖
</button>
<button onClick={onCancel} className="w-full text-stone-400 text-sm py-2">
返回
</button>
</div>
<div className="text-xs text-stone-300 text-center">預設密碼可在系統設定中更改</div>
</div>
);
}

export default function App() {
const [activeId, setActiveId] = useState("dashboard");
const [sidebarOpen, setSidebarOpen] = useState(false);
const [notifOpen, setNotifOpen] = useState(false);
const [dismissed, setDismissed] = useCloudSync("dismissed_notifs", []);
const [unlockedPages, setUnlockedPages] = useState([]);
const [pendingPageId, setPendingPageId] = useState(null);
const [appPassword, setAppPassword] = useCloudSync("appPassword", "1234");
const [tasks, setTasks] = useCloudSync("tasks", []);
const [projects, setProjects] = useCloudSync("projects", []);
const [inquiries, setInquiries] = useCloudSync("inquiries", []);
const [contracts, setContracts] = useCloudSync("contracts", []);
const [quotes, setQuotes] = useCloudSync("quotes", []);
const [inspection, setInspection] = useCloudSync("inspection", []);
const [acceptance, setAcceptance] = useCloudSync("acceptance", []);
const [pending, setPending] = useCloudSync("pending", []);
const [knowledge, setKnowledge] = useCloudSync("knowledge", []);
const [lighting, setLighting] = useCloudSync("lighting", []);
const [design, setDesign] = useCloudSync("design", []);
const [ledger, setLedger] = useCloudSync("ledger", []);
const [purchase, setPurchase] = useCloudSync("purchase", []);
const [expense, setExpense] = useCloudSync("expense", []);
const [payroll, setPayroll] = useCloudSync("payroll", []);
const [monthly, setMonthly] = useCloudSync("monthly", []);
const [attendance, setAttendance] = useCloudSync("attendance", []);
const [leave, setLeave] = useCloudSync("leave", []);
const [overtime, setOvertime] = useCloudSync("overtime", []);
const [materials, setMaterials] = useCloudSync("materials", []);
const [inventory, setInventory] = useCloudSync("inventory", []);
const [tracking, setTracking] = useCloudSync("tracking", []);
const [losses, setLosses] = useCloudSync("losses", []);
const [appointments, setAppointments] = useCloudSync("appointments", []);
const [clients, setClients] = useCloudSync("clients", []);
const [quickquotes, setQuickquotes] = useCloudSync("quickquotes", []);
const [schedule, setSchedule] = useCloudSync("schedule", []);
const [album, setAlbum] = useCloudSync("album", []);
const [companyInfo, setCompanyInfo] = useCloudSync("companyInfo", {});
const [notifSettings, setNotifSettings] = useCloudSync("notifSettings", {taskOverdue:true,taskDueToday:true,lowInventory:true,pendingApproval:true,quoteExpiry:true,projectNoUpdate:true});
const [menuCustom, setMenuCustom] = useCloudSync("menuCustom", {});

const allNotifs = useNotifications(tasks, projects, inventory, tracking, leave, overtime, acceptance, pending, quotes);
const notifications = allNotifs.filter(n => !dismissed.includes(n.id));

const [syncStatus, setSyncStatus] = useState("idle"); // idle, syncing, synced, error

// Global sync indicator
useEffect(() => {
const orig = sb.replaceAll.bind(sb);
sb.replaceAll = async (table, items) => {
setSyncStatus("syncing");
try {
await orig(table, items);
setSyncStatus("synced");
setTimeout(() => setSyncStatus("idle"), 2000);
} catch(e) {
setSyncStatus("error");
setTimeout(() => setSyncStatus("idle"), 3000);
}
};
}, []);

const clearAll=()=>{
["tasks","projects","inquiries","contracts","quotes","inspection","acceptance","pending",
"knowledge","lighting","design","ledger","purchase","expense","payroll","monthly",
"attendance","leave","overtime","materials","inventory","tracking","losses","appointments",
"companyInfo","notifSettings","dismissed_notifs","menuCustom","clients","schedule","album","quickquotes"
].forEach(k=>localStorage.removeItem(k));
window.location.reload();
};

const activeItem=NAV_SECTIONS.flatMap(s=>s.items).find(i=>i.id===activeId);

const renderPage=()=>{
switch(activeId){
case "dashboard": return <Dashboard tasks={tasks} projects={projects} attendance={attendance} setActiveId={setActiveId}/>;
case "tasks": return <Tasks tasks={tasks} setTasks={setTasks}/>;
case "calendar": return <Calendar tasks={tasks}/>;
case "quickquote": return <QuickQuote items={quickquotes} setItems={setQuickquotes}/>;
case "clients": return <Clients items={clients} setItems={setClients}/>;
case "schedule": return <Schedule items={schedule} setItems={setSchedule} projects={projects}/>;
case "album": return <Album items={album} setItems={setAlbum}/>;
case "reports": return <Reports projects={projects} tasks={tasks} ledger={ledger} clients={clients} quotes={quotes} contracts={contracts} attendance={attendance}/>;
case "appointments": return <Appointments2 items={appointments} setItems={setAppointments}/>;
case "inquiries": return <Inquiries items={inquiries} setItems={setInquiries}/>;
case "projects": return <Projects items={projects} setItems={setProjects}/>;
case "contracts": return <Contracts items={contracts} setItems={setContracts}/>;
case "quotes": return <Quotes items={quotes} setItems={setQuotes}/>;
case "inspection": return <Inspection items={inspection} setItems={setInspection}/>;
case "acceptance": return <Acceptance items={acceptance} setItems={setAcceptance}/>;
case "pending": return <Pending items={pending} setItems={setPending}/>;
case "knowledge": return <Knowledge items={knowledge} setItems={setKnowledge}/>;
case "lighting": return <Lighting items={lighting} setItems={setLighting}/>;
case "design": return <Design items={design} setItems={setDesign}/>;
case "tiles": return <TilesCalc/>;
case "ledger": return <Ledger items={ledger} setItems={setLedger}/>;
case "purchase": return <Purchase items={purchase} setItems={setPurchase}/>;
case "expense": return <Expense items={expense} setItems={setExpense}/>;
case "payroll": return <Payroll items={payroll} setItems={setPayroll}/>;
case "monthly": return <Monthly items={monthly} setItems={setMonthly}/>;
case "forecast": return <Forecast ledger={ledger} projects={projects}/>;
case "attendance": return <Attendance items={attendance} setItems={setAttendance}/>;
case "leave": return <Leave items={leave} setItems={setLeave}/>;
case "overtime": return <Overtime items={overtime} setItems={setOvertime}/>;
case "materials": return <Materials items={materials} setItems={setMaterials}/>;
case "inventory": return <Inventory items={inventory} setItems={setInventory}/>;
case "tracking": return <Tracking items={tracking} setItems={setTracking}/>;
case "profit": return <Profit ledger={ledger} projects={projects}/>;
case "losses": return <Losses items={losses} setItems={setLosses}/>;
case "settings": return <Settings onClearAll={clearAll} companyInfo={companyInfo} setCompanyInfo={setCompanyInfo} notifSettings={notifSettings} setNotifSettings={setNotifSettings} menuCustom={menuCustom} setMenuCustom={setMenuCustom} appPassword={appPassword} setAppPassword={setAppPassword}/>;
default: return <div className="text-center text-stone-400 py-16 text-sm">🔧 功能開發中</div>;
}
};

return(
<div style={{fontFamily:"'Noto Sans TC', sans-serif",maxWidth:430,margin:"0 auto",minHeight:"100vh"}} className="bg-stone-50">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<div className="bg-white border-b border-stone-100 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
<button onClick={()=>setSidebarOpen(true)} className="w-9 h-9 flex flex-col justify-center gap-1.5 items-center">
<span className="block w-5 h-0.5 bg-stone-600"/><span className="block w-5 h-0.5 bg-stone-600"/><span className="block w-3 h-0.5 bg-stone-600"/>
</button>
<span className="text-sm font-semibold text-stone-700">{activeItem?(menuCustom[activeItem.id]?.label||activeItem.label):"工作面板"}</span>
<div className="flex items-center gap-1">
{syncStatus==="syncing"&&<span className="text-xs text-blue-400 animate-pulse">同步中</span>}
{syncStatus==="synced"&&<span className="text-xs text-emerald-500">✓ 已同步</span>}
{syncStatus==="error"&&<span className="text-xs text-red-400">同步失敗</span>}
</div>
<button onClick={()=>setNotifOpen(true)} className="w-9 h-9 flex items-center justify-center relative">
<span className="text-xl">🔔</span>
{notifications.length>0&&<span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"><span className="text-white text-[9px] font-bold">{notifications.length}</span></span>}
</button>
</div>
{sidebarOpen&&(
<div className="fixed inset-0 z-40 flex" style={{maxWidth:430,margin:"0 auto"}}>
<div className="absolute inset-0 bg-black/30" onClick={()=>setSidebarOpen(false)}/>
<div className="relative z-50 bg-white w-72 h-full overflow-y-auto shadow-2xl">
<div className="px-5 pt-5 pb-2"><div className="text-xs font-semibold tracking-widest text-stone-400">MENU</div></div>
{NAV_SECTIONS.map((section,si)=>(
<div key={si} className="mb-2">
{section.label!=="DASHBOARD"&&<div className="px-5 pt-4 pb-1 text-xs text-stone-400 tracking-wider">{section.label}</div>}
{section.items.map(item=>(
<button key={item.id} onClick={()=>{ const isProtected = Object.keys(PROTECTED_PAGES).includes(item.id) && !unlockedPages.includes(item.id); if(isProtected){setPendingPageId(item.id);setSidebarOpen(false);}else{setActiveId(item.id);setSidebarOpen(false);}; }}
className={`w-full flex items-center gap-3 px-5 py-3 text-sm text-left ${activeId===item.id?"bg-stone-100 font-semibold text-stone-900 rounded-xl mx-2 w-[calc(100%-16px)]":"text-stone-600 hover:bg-stone-50"}`}>
<span>{(menuCustom[item.id]?.icon!==undefined?menuCustom[item.id].icon:item.icon)}</span>
<span>{(menuCustom[item.id]?.label!==undefined?menuCustom[item.id].label:item.label)}</span>
{Object.keys(PROTECTED_PAGES).includes(item.id)&&!unlockedPages.includes(item.id)&&<span className="ml-auto text-stone-300 text-xs">🔒</span>}
</button>
))}
</div>
))}
<div className="h-8"/>
</div>
</div>
)}
{pendingPageId&&<LockScreen pageId={pendingPageId} savedPassword={appPassword} onUnlock={(id)=>{setUnlockedPages(p=>[...p,id]);setActiveId(id);setPendingPageId(null);}} onCancel={()=>setPendingPageId(null)}/>}
{notifOpen&&<NotificationPanel notifications={notifications} onClose={()=>setNotifOpen(false)} onClearAll={()=>{setDismissed(allNotifs.map(n=>n.id));setNotifOpen(false);}}/>}
<div className="px-4 pt-4 pb-24">{renderPage()}</div>
<div className="fixed bottom-0 bg-white border-t border-stone-100 flex items-center justify-around py-2 z-30" style={{maxWidth:430,left:"50%",transform:"translateX(-50%)",width:"100%"}}>
{[{id:"dashboard",icon:"🏠",label:"主頁"},{id:"tasks",icon:"📋",label:"任務"},{id:"projects",icon:"🏠",label:"專案"},{id:"schedule",icon:"🗓",label:"排程"}].map(tab=>{
const customIcon = menuCustom[tab.id]?.icon !== undefined ? menuCustom[tab.id].icon : tab.icon;
const customLabel = menuCustom[tab.id]?.label !== undefined ? menuCustom[tab.id].label.slice(0,4) : tab.label;
return (
<button key={tab.id} onClick={()=>{ const isProtected=Object.keys(PROTECTED_PAGES).includes(tab.id)&&!unlockedPages.includes(tab.id); if(isProtected)setPendingPageId(tab.id); else setActiveId(tab.id); }} className={`flex flex-col items-center gap-0.5 px-4 py-1 ${activeId===tab.id?"text-stone-900":"text-stone-400"}`}>
<span className="text-lg">{customIcon}</span>
<span className="text-xs">{customLabel}</span>
{activeId===tab.id&&<span className="w-1 h-1 bg-stone-800 rounded-full"/>}
</button>
);
})}
</div>
</div>
);
}