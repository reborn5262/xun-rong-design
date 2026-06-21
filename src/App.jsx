import React, { useState, useEffect, useMemo, useRef } from "react";


// ─── Supabase Client ─────────────────────────────────────────────
const SUPABASE_URL = "https://yzdglmopwhjgknusjchn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6ZGdsbW9wd2hqZ2tudXNqY2huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwODEwNzUsImV4cCI6MjA5NjY1NzA3NX0.Tuc-Ee0cgocjhJUyV1Qey8D8Qj5LG9gJqNAkXzPn95g";

const HEADERS = {
"apikey": SUPABASE_KEY,
"Authorization": "Bearer "+SUPABASE_KEY,
"Content-Type": "application/json",
"Prefer": "return=minimal"
};

const sb = {
async getAll(table) {
const res = await fetch(SUPABASE_URL+"/rest/v1/"+table+"?select=*&order=id.asc", {
headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer "+SUPABASE_KEY }
});
if (!res.ok) return [];
const rows = await res.json();
return rows.map(r => r.data).filter(Boolean);
},
async replaceAll(table, items) {
// Delete all existing rows
await fetch(SUPABASE_URL+"/rest/v1/"+table+"?id=gt.0", {
method: "DELETE",
headers: HEADERS
});
// Insert new rows
if (items.length > 0) {
const rows = items.map(data => ({ data }));
await fetch(SUPABASE_URL+"/rest/v1/"+table, {
method: "POST",
headers: HEADERS,
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
const [value, setValue] = useState(() => {
try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : defaultValue; }
catch { return defaultValue; }
});
const [loaded, setLoaded] = useState(false);
const saveTimer = useState({})[0];

// Load from cloud on mount
useEffect(() => {
if (!tableName) { setLoaded(true); return; }
sb.getAll(tableName).then(rows => {
if (rows && rows.length > 0) {
setValue(rows);
localStorage.setItem(key, JSON.stringify(rows));
}
setLoaded(true);
}).catch(() => setLoaded(true));
}, []);

// Auto-refresh every 30 seconds to get updates from other devices
useEffect(() => {
if (!tableName) return;
const interval = setInterval(() => {
sb.getAll(tableName).then(rows => {
if (rows && rows.length >= 0) {
setValue(rows);
localStorage.setItem(key, JSON.stringify(rows));
}
}).catch(() => {});
}, 30000);
return () => clearInterval(interval);
}, []);

// Debounced save to cloud when value changes
const setValueAndSync = (newVal) => {
const v = typeof newVal === "function" ? newVal(value) : newVal;
setValue(v);
localStorage.setItem(key, JSON.stringify(v));
if (!tableName || !loaded) return;
clearTimeout(saveTimer[key]);
saveTimer[key] = setTimeout(() => {
sb.replaceAll(tableName, v).catch(console.error);
}, 800);
};

return [value, setValueAndSync];
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
{ icon: "🎨", label: "色板管理", id: "palette" },
{ icon: "📊", label: "工程進度圖", id: "gantt" },
]},
{ label: "客戶服務", items: [
{ icon: "👷", label: "師傅通訊錄", id: "workers" },
{ icon: "💬", label: "客戶溝通紀錄", id: "comms" },
{ icon: "🔔", label: "生日/週年提醒", id: "reminders" },
{ icon: "🔗", label: "客戶進度頁", id: "clientprogress" },
]},
{ label: "估價與案例", items: [
{ icon: "📦", label: "材料比價", id: "pricecompare" },
{ icon: "🧮", label: "估價計算機", id: "estimator" },
{ icon: "⭐", label: "完工案例庫", id: "caselibrary" },
]},
{ label: "財務管理", items: [
{ icon: "📒", label: "公司帳本", id: "ledger" },
{ icon: "💵", label: "採購申請單", id: "purchase" },
{ icon: "🧾", label: "報銷申請", id: "expense" },
{ icon: "💳", label: "薪資計算", id: "payroll" },
{ icon: "🐷", label: "月度支出", id: "monthly" },
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
{ icon: "⚠", label: "異常損失", id: "losses" },
]},
{ label: "分析與管理", items: [
{ icon: "📊", label: "視覺化儀表板", id: "visualdash" },
{ icon: "🗺", label: "工地地圖", id: "sitemap" },
{ icon: "🏢", label: "廠商管理", id: "suppliers" },
{ icon: "📋", label: "標準工程清單", id: "checklist" },
{ icon: "💳", label: "收款追蹤", id: "paymenttrack" },
]},
{ label: "系統設定", items: [
{ icon: "⚙", label: "系統設定", id: "settings" },
]},
];

const PROJECT_LIST = ["公司內部"];
function getProjectOpts(projects) {
const names = (projects||[]).map(p=>p.name).filter(Boolean);
const merged = [...new Set([...names, "公司內部"])];
return ["", ...merged];
}
// 統一計算公司整體資金狀況：彙整帳本(ledger)收支 + 已發薪資 + 已核准/已撥款報銷 + 已採購/已到貨的採購單 + 每月固定支出
function getCompanyFinance({ ledger=[], payroll=[], expense=[], purchase=[], monthly=[] }) {
const ledgerIncome = ledger.filter(i=>i.type==="收入").reduce((s,i)=>s+Number(i.amount||0),0);
const ledgerExpense = ledger.filter(i=>i.type==="支出").reduce((s,i)=>s+Number(i.amount||0),0);
const payrollExpense = payroll.filter(i=>i.status==="已發").reduce((s,i)=>s+(Number(i.baseSalary||0)+Number(i.bonus||0)-Number(i.deduction||0)),0);
const expenseExpense = expense.filter(i=>i.status==="已核准"||i.status==="已撥款").reduce((s,i)=>s+Number(i.amount||0),0);
const purchaseExpense = purchase.filter(i=>i.status==="已採購"||i.status==="已到貨").reduce((s,i)=>s+Number(i.qty||1)*Number(i.price||0),0);
const monthlyExpenseTotal = monthly.reduce((s,i)=>s+Number(i.amount||0),0);
const totalIncome = ledgerIncome;
const totalExpense = ledgerExpense + payrollExpense + expenseExpense + purchaseExpense + monthlyExpenseTotal;
const profit = totalIncome - totalExpense;
const margin = totalIncome>0 ? ((profit/totalIncome)*100).toFixed(1) : 0;
return {
totalIncome, totalExpense, profit, margin,
breakdown: {
ledgerIncome, ledgerExpense, payrollExpense, expenseExpense, purchaseExpense, monthlyExpenseTotal,
}
};
}
const SC = { "施工中":"blue","設計中":"yellow","驗收中":"green","報價中":"gray","完工":"green","待審":"yellow","已核准":"green","已拒絕":"red","進行中":"blue","已完成":"green","草稿":"gray","確認中":"blue","已確認":"green","取消":"red" };

function Badge({ color, children }) {
const c = { red:"bg-red-100 text-red-700", green:"bg-green-100 text-green-700", yellow:"bg-yellow-100 text-yellow-700", blue:"bg-blue-100 text-blue-700", gray:"bg-gray-100 text-gray-600" };
return <span className={"text-xs px-2 py-0.5 rounded-full font-medium "+(c[color]||c.gray)}>{children}</span>;
}

function Modal({ title, onClose, children }) {
return (
<div className="fixed inset-0 z-50 flex items-end justify-center" style={{maxWidth:430,margin:"0 auto"}}>
<div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
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
return <div>{label&&<label className="text-xs text-stone-400 mb-1 block">{label}</label>}<input className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-stone-400" spellCheck={false} autoCorrect="off" autoCapitalize="off" {...p}/></div>;
}
function Sel({ label, options, ...p }) {
return <div>{label&&<label className="text-xs text-stone-400 mb-1 block">{label}</label>}<select className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-stone-400 bg-white" {...p}>{options.map(o=><option key={o} value={o}>{o}</option>)}</select></div>;
}
function Txt({ label, ...p }) {
return <div>{label&&<label className="text-xs text-stone-400 mb-1 block">{label}</label>}<textarea className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-stone-400 resize-none" rows={3} spellCheck={false} autoCorrect="off" {...p}></textarea></div>;
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
<div className="absolute inset-0 bg-black/40" onClick={()=>setDelId(null)}></div>
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
<div className={"w-2 h-2 rounded-full flex-shrink-0 "+(t.priority==="高"?"bg-red-400":t.priority==="中"?"bg-yellow-400":"bg-green-400")}></div>
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
<div className="bg-emerald-500 h-1.5 rounded-full" style={{width:(p.progress||0)+"%" }}></div>
</div>
</div>
))}
</div>
)}
</div>
);
}

function Tasks({ tasks, setTasks, projects }) {
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
<button key={f} onClick={()=>setFilter(f)} className={"text-xs px-3 py-1.5 rounded-lg font-medium "+(filter===f?"bg-stone-800 text-white":"bg-stone-100 text-stone-500")}>{f}</button>
))}
</div>
<button onClick={()=>open()} className="text-xs bg-stone-800 text-white px-3 py-1.5 rounded-lg">＋ 新增</button>
</div>
{filtered.length===0&&<div className="text-center text-stone-400 py-12 text-sm">沒有任務</div>}
{filtered.map(t=>(
<div key={t.id} className={"bg-white rounded-2xl p-4 shadow-sm border border-stone-100 "+(t.done?"opacity-50":"")}>
<div className="flex items-start gap-3">
<button onClick={()=>setTasks(p=>p.map(x=>x.id===t.id?{...x,done:!x.done}:x))} className={"mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 "+(t.done?"bg-stone-800 border-stone-800 text-white":"border-stone-300")}>
{t.done&&<span className="text-xs">✓</span>}
</button>
<div className="flex-1 min-w-0">
<div className={"text-sm font-medium "+(t.done?"line-through text-stone-400":"text-stone-800")}>{t.title}</div>
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
<Sel label="所屬專案" options={getProjectOpts(projects)} value={form.project} onChange={e=>setForm({...form,project:e.target.value})}/>
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
<Modal title={edit?"編輯"+addLabel:addLabel} onClose={()=>setModal(false)}>
<div className="space-y-3">
{fields.map(f=>{
if(f.type==="select")return<Sel key={f.key} label={f.label} options={f.options} value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})}/>;
if(f.type==="textarea")return<Txt key={f.key} label={f.label} value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})}/>;
if(f.type==="grid")return<div key={f.key} className={"grid grid-cols-"+(f.cols||2)+" gap-3"}>{f.children.map(c=>c.type==="select"?<Sel key={c.key} label={c.label} options={c.options} value={form[c.key]} onChange={e=>setForm({...form,[c.key]:e.target.value})}/>:<Inp key={c.key} label={c.label} type={c.inputType||"text"} placeholder={c.placeholder||""} value={form[c.key]} onChange={e=>setForm({...form,[c.key]:e.target.value})}/>)}</div>;
return<Inp key={f.key} label={f.label} type={f.inputType||"text"} placeholder={f.placeholder||""} value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})}/>;
})}
</div>
<Btn onClick={save} label={edit?"儲存變更":"新增"+addLabel}/>
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
{key:"project",label:"所屬專案",type:"select",options:[""]},
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

function Appointments2({ items, setItems, projects }) {
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
)}/>
{modal&&<Modal title={edit?"編輯預約":"新增預約"} onClose={()=>setModal(false)}>
<div className="space-y-3">
<Inp label="標題 *" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
<Inp label="客戶" value={form.client} onChange={e=>setForm({...form,client:e.target.value})}/>
<Sel label="類型" options={["現場勘查","設計討論","簽約","驗收","其他"]} value={form.type} onChange={e=>setForm({...form,type:e.target.value})}/>
<div className="grid grid-cols-2 gap-3"><Inp label="日期" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/><Inp label="時間" type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/></div>
<Inp label="地點" value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/>
<Sel label="所屬專案" options={getProjectOpts(projects)} value={form.project} onChange={e=>setForm({...form,project:e.target.value})}/>
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
<div className="flex-1 bg-stone-100 rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full" style={{width:(p.progress||0)+"%" }}></div></div>
<span className="text-xs text-emerald-600 font-semibold">{p.progress||0}%</span>
</div>
</>
)}/>
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

function FormField({ f, form, setForm }) {
if(f.type==="sel")return<Sel label={f.label} options={f.opts} value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})}/>;
if(f.type==="txt")return<Txt label={f.label} placeholder={f.ph||""} value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})}/>;
if(f.type==="range")return<div><label className="text-xs text-stone-400 mb-1 block">{f.label} {form[f.key]}%</label><input type="range" min="0" max="100" className="w-full" value={form[f.key]} onChange={e=>setForm({...form,[f.key]:Number(e.target.value)})}/></div>;
return<Inp label={f.label} type={f.it||"text"} placeholder={f.ph||""} value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})}/>;
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
return(
<>
<ListPage items={items} onAdd={()=>open()} onEdit={open} onDelete={id=>setItems(p=>p.filter(i=>i.id!==id))} addLabel={addLabel} renderItem={renderItem}/>
{modal&&<Modal title={edit?"編輯":addLabel} onClose={()=>setModal(false)}>
<div className="space-y-3">
{fields.map((f,i)=>{
if(f.grid)return<div key={i} className={"grid grid-cols-"+(f.grid)+" gap-2"}>{f.children.map((c,j)=><FormField key={j} f={c} form={form} setForm={setForm}/>)}</div>;
return<FormField key={i} f={f} form={form} setForm={setForm}/>;
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
)}/>;
}

function Contracts({ items, setItems, projects }) {
return <SimpleForm addLabel="新增合約" items={items} setItems={setItems}
fields={[
{key:"project",label:"所屬專案 *",req:true,type:"sel",opts:getProjectOpts(projects)},
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
)}/>;
}

function Quotes({ items, setItems, projects }) {
return <SimpleForm addLabel="新增報價" items={items} setItems={setItems}
fields={[
{key:"project",label:"所屬專案 *",req:true,type:"sel",opts:getProjectOpts(projects)},
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
)}/>;
}

function Inspection({ items, setItems, projects }) {
return <SimpleForm addLabel="新增檢核" items={items} setItems={setItems}
fields={[
{key:"project",label:"所屬專案 *",req:true,type:"sel",opts:getProjectOpts(projects)},
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
)}/>;
}

function Acceptance({ items, setItems, projects }) {
return <SimpleForm addLabel="新增驗收" items={items} setItems={setItems}
fields={[
{key:"project",label:"所屬專案 *",req:true,type:"sel",opts:getProjectOpts(projects)},
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
)}/>;
}

function Pending({ items, setItems, projects }) {
return <SimpleForm addLabel="新增待確認" items={items} setItems={setItems}
fields={[
{key:"project",label:"所屬專案 *",req:true,type:"sel",opts:getProjectOpts(projects)},
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
)}/>;
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
)}/>
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
{[["地坪面積",res.area+" m²"],["基本用量",res.base+" 片"],["建議採購",res.total+" 片"]].map(([l,v])=>(
<div key={l}><div className="text-xs text-stone-400 mb-1">{l}</div><div className="text-lg font-bold text-stone-800">{v.split(" ")[0]}</div><div className="text-xs text-stone-400">{v.split(" ")[1]}</div></div>
))}
</div>
</div>}
</div>
);
}

function Lighting({ items, setItems, projects }) {
return <SimpleForm addLabel="新增燈具" items={items} setItems={setItems}
fields={[
{key:"project",label:"所屬專案 *",req:true,type:"sel",opts:getProjectOpts(projects)},
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
)}/>;
}

function Design({ items, setItems, projects }) {
return <SimpleForm addLabel="新增提案" items={items} setItems={setItems}
fields={[
{key:"project",label:"所屬專案 *",req:true,type:"sel",opts:getProjectOpts(projects)},
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
)}/>;
}

function Ledger({ items, setItems, projects }) {
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
<div className={"text-xl font-bold "+(income-expense>=0?"text-emerald-600":"text-red-500")}>NT${(income-expense).toLocaleString()}</div>
</div>
<ListPage items={items} onAdd={()=>open()} onEdit={open} onDelete={id=>setItems(p=>p.filter(i=>i.id!==id))} addLabel="新增記錄"
renderItem={i=>(
<div className="flex justify-between items-start">
<div><div className="text-sm font-medium text-stone-800">{i.category}</div><div className="text-xs text-stone-400">{i.project} · {i.date}</div>{i.note&&<div className="text-xs text-stone-400">{i.note}</div>}</div>
<div className={"text-base font-bold "+(i.type==="收入"?"text-emerald-600":"text-red-500")}>{i.type==="收入"?"+":"-"}NT${Number(i.amount||0).toLocaleString()}</div>
</div>
)}/>
{modal&&<Modal title={edit?"編輯記錄":"新增帳本記錄"} onClose={()=>setModal(false)}>
<div className="space-y-3">
<div className="grid grid-cols-2 gap-3">
<Sel label="類型" options={["收入","支出"]} value={form.type} onChange={e=>setForm({...form,type:e.target.value})}/>
<Inp label="金額 *" type="number" placeholder="0" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/>
</div>
<Sel label="類別" options={["工程款","設計費","材料費","人工費","管銷費","其他"]} value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/>
<Sel label="所屬專案" options={getProjectOpts(projects)} value={form.project} onChange={e=>setForm({...form,project:e.target.value})}/>
<Inp label="日期" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
<Txt label="備註" value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/>
</div>
<Btn onClick={save}/>
</Modal>}
</>
);
}

function Purchase({ items, setItems, projects }) {
return <SimpleForm addLabel="新增採購" items={items} setItems={setItems}
fields={[
{key:"item",label:"採購品項 *",req:true},
{key:"project",label:"所屬專案",type:"sel",opts:getProjectOpts(projects)},
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
)}/>;
}

function Expense({ items, setItems, projects }) {
return <SimpleForm addLabel="新增報銷" items={items} setItems={setItems}
fields={[
{key:"name",label:"申請人"},
{key:"category",label:"費用類別",type:"sel",opts:["交通費","餐費","住宿費","材料費","工具費","其他"]},
{key:"amount",label:"金額 *",req:true,it:"number"},
{key:"date",label:"費用日期",it:"date"},
{key:"project",label:"所屬專案",type:"sel",opts:getProjectOpts(projects)},
{key:"status",label:"狀態",type:"sel",opts:["待審","已核准","已拒絕","已撥款"],default:"待審"},
{key:"note",label:"說明",type:"txt"},
]}
renderItem={i=>(
<>
<div className="flex justify-between items-start mb-1"><div className="font-semibold text-stone-800 text-sm">{i.category}</div><Badge color={SC[i.status]}>{i.status}</Badge></div>
<div className="text-xs text-stone-400">{i.name} · {i.date}</div>
<div className="text-base font-bold text-stone-700 mt-1">NT${Number(i.amount||0).toLocaleString()}</div>
</>
)}/>;
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
)}/>;
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
<div><div className="text-sm font-medium text-stone-800">{i.category}</div><div className="text-xs text-stone-400">{i.month}{i.note?" · "+(i.note):""}</div></div>
<div className="text-base font-bold text-red-500">NT${Number(i.amount||0).toLocaleString()}</div>
</div>
)}/>
</>
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
setItems(p=>p.map(i=>i.date===todayStr?{...i,clockOut:t,hours:hrs.toFixed(1)+"h"}:i));
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
<button onClick={clockIn} disabled={!!rec?.clockIn} className={"rounded-xl py-3 text-sm font-medium "+(rec?.clockIn?"bg-stone-100 text-stone-400":"bg-stone-800 text-white")}>
{rec?.clockIn?"✓ "+rec.clockIn:"上班打卡"}
</button>
<button onClick={clockOut} disabled={!rec?.clockIn||!!rec?.clockOut} className={"rounded-xl py-3 text-sm font-medium "+(!rec?.clockIn||rec?.clockOut?"bg-stone-100 text-stone-400":"bg-red-500 text-white")}>
{rec?.clockOut?"✓ "+rec.clockOut:"下班打卡"}
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
)}/>;
}

function Overtime({ items, setItems, projects }) {
return <SimpleForm addLabel="新增加班" items={items} setItems={setItems}
fields={[
{key:"name",label:"員工姓名 *",req:true},
{key:"date",label:"加班日期",it:"date"},
{grid:3,children:[{key:"startTime",label:"開始",it:"time"},{key:"endTime",label:"結束",it:"time"},{key:"hours",label:"時數",it:"number"}]},
{key:"project",label:"所屬專案",type:"sel",opts:getProjectOpts(projects)},
{key:"reason",label:"加班原因",type:"txt"},
{key:"status",label:"狀態",type:"sel",opts:["待審","已核准","已拒絕"],default:"待審"},
]}
renderItem={i=>(
<>
<div className="flex justify-between items-start mb-1"><div className="font-semibold text-stone-800 text-sm">{i.name}</div><Badge color={i.status==="已核准"?"green":i.status==="已拒絕"?"red":"yellow"}>{i.status}</Badge></div>
<div className="text-xs text-stone-400">{i.date} · {i.startTime}～{i.endTime}</div>
<div className="text-xs text-stone-500">{i.project} · {i.hours} 小時</div>
</>
)}/>;
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
<div className="text-xs text-stone-500 mt-1">{i.supplier} · NT${i.price}｜{i.unit}</div>
</>
)}/>;
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
)}/>
</>
);
}

function Tracking({ items, setItems, projects }) {
return <SimpleForm addLabel="新增備料" items={items} setItems={setItems}
fields={[
{key:"material",label:"材料名稱 *",req:true},
{key:"project",label:"所屬專案",type:"sel",opts:getProjectOpts(projects)},
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
)}/>;
}

function Losses({ items, setItems, projects }) {
const total=items.reduce((s,i)=>s+Number(i.amount||0),0);
return(
<>
<div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-3">
<div className="text-xs text-red-500 mb-1">累計異常損失</div>
<div className="text-2xl font-bold text-red-600">NT${total.toLocaleString()}</div>
</div>
<SimpleForm addLabel="新增損失" items={items} setItems={setItems}
fields={[
{key:"project",label:"所屬專案 *",req:true,type:"sel",opts:getProjectOpts(projects)},
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
)}/>
</>
);
}

function Settings({ onClearAll, appPassword, setAppPassword, companyInfo, setCompanyInfo, notifSettings, setNotifSettings, menuCustom, setMenuCustom, rolePasswords, setRolePasswords, customRoles, setCustomRoles, hiddenPages, setHiddenPages }) {
const [confirm, setConfirm] = useState(false);
const [pwForm, setPwForm] = useState({current:"",newPw:"",confirm:""});
const [pwError, setPwError] = useState("");
const [pwSuccess, setPwSuccess] = useState(false);
const [company, setCompany] = useState(companyInfo || {name:"",phone:"",address:"",taxId:"",bank:"",bankAccount:""});
const [notif, setNotif] = useState(notifSettings || {taskOverdue:true,taskDueToday:true,lowInventory:true,pendingApproval:true,quoteExpiry:true,projectNoUpdate:true});

const displayRoles = customRoles || ROLES;

const changePassword = () => {
if (pwForm.current !== (appPassword||"1234")) { setPwError("目前密碼錯誤"); return; }
if (pwForm.newPw.length < 4) { setPwError("新密碼至少需要 4 位"); return; }
if (pwForm.newPw !== pwForm.confirm) { setPwError("兩次密碼不一致"); return; }
setAppPassword(pwForm.newPw);
setPwForm({current:"",newPw:"",confirm:""});
setPwError("");
setPwSuccess(true);
setTimeout(() => setPwSuccess(false), 2000);
};
const saveCompany = () => { setCompanyInfo(company); alert("✅ 公司資料已儲存"); };
const saveNotif = () => { setNotifSettings(notif); alert("✅ 通知設定已儲存"); };

return(
<div className="space-y-3">

{/* Role Passwords */}
<SettingsSection title="角色密碼管理" icon="👥">
<div className="mt-3 space-y-3">
<div className="text-xs text-stone-400">設定各角色的登入密碼</div>
{Object.entries(displayRoles).map(([key, role]) => (
<div key={key} className="flex items-center gap-3">
<div className={"w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0 "+(role.color)}>{role.icon}</div>
<span className="text-sm text-stone-700 w-16 flex-shrink-0">{role.label}</span>
<input type="password" className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
placeholder="設定密碼" value={rolePasswords[key]||""}
onChange={e=>setRolePasswords(p=>({...p,[key]:e.target.value}))}/>
</div>
))}
<button onClick={()=>alert("✅ 角色密碼已儲存")} className="w-full bg-stone-800 text-white rounded-xl py-2.5 text-sm font-medium">儲存角色密碼</button>
<div className="text-xs text-stone-300 text-center">預設：老闆1234｜設計師designer｜助理assistant｜工班worker</div>
</div>
</SettingsSection>

{/* Role Permissions Editor */}
<SettingsSection title="角色功能權限編輯" icon="🔧">
<RolePermissionEditor rolePasswords={rolePasswords} setRolePasswords={setRolePasswords} externalCustomRoles={customRoles} setExternalCustomRoles={setCustomRoles}/>
</SettingsSection>

{/* Password */}
<SettingsSection title="密碼與權限管理" icon="🔐" defaultOpen={true}>
<div className="mt-3 space-y-3">
<div className="bg-stone-50 rounded-xl p-3 text-xs text-stone-500">
<div className="font-medium text-stone-600 mb-2">🔒 以下功能需密碼存取：</div>
{Object.entries(PROTECTED_PAGES).map(([id,p])=>(
<div key={id} className="flex items-center gap-2 mb-1"><span>{p.icon}</span><span>{p.label}</span></div>
))}
</div>
<input type="password" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm" placeholder="目前密碼" value={pwForm.current} onChange={e=>setPwForm({...pwForm,current:e.target.value})}/>
<input type="password" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm" placeholder="新密碼（至少4位）" value={pwForm.newPw} onChange={e=>setPwForm({...pwForm,newPw:e.target.value})}/>
<input type="password" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm" placeholder="確認新密碼" value={pwForm.confirm} onChange={e=>setPwForm({...pwForm,confirm:e.target.value})}/>
{pwError && <div className="text-xs text-red-500 text-center">{pwError}</div>}
{pwSuccess && <div className="text-xs text-emerald-500 text-center">✅ 密碼已更新！</div>}
<button onClick={changePassword} className="w-full bg-stone-800 text-white rounded-xl py-2.5 text-sm font-medium">更新密碼</button>
<div className="text-xs text-stone-300 text-center">預設密碼：1234</div>
</div>
</SettingsSection>

{/* Company Info */}
<SettingsSection title="公司基本資料" icon="🏢">
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
className={"w-11 h-6 rounded-full transition-colors relative "+(notif[key]?"bg-stone-800":"bg-stone-200")}>
<span className={"absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all "+(notif[key]?"left-5":"left-0.5")}></span>
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
onChange={e=>setMenuCustom(prev=>({...prev,[item.id]:{...(prev[item.id]||{}),icon:e.target.value}}))}/>
<input
className="flex-1 border border-stone-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-stone-400"
value={custom.label !== undefined ? custom.label : item.label}
onChange={e=>setMenuCustom(prev=>({...prev,[item.id]:{...(prev[item.id]||{}),label:e.target.value}}))}/>
{(custom.label !== undefined || custom.icon !== undefined) && (
<button onClick={()=>setMenuCustom(prev=>{const n={...prev};delete n[item.id];return n;})} className="text-xs text-red-400 px-2 py-1.5 rounded-lg bg-red-50 flex-shrink-0">還原</button>
)}
</div>
);
})}
<div className="text-xs text-stone-400 mt-2 text-center">修改後即時套用到選單</div>
</div>
</SettingsSection>

{/* Hide Pages */}
<SettingsSection title="功能顯示管理" icon="👁">
<div className="mt-3 space-y-2">
<div className="text-xs text-stone-400 mb-3">關閉的功能將從選單隱藏，資料不會刪除</div>
{PAGE_GROUPS.map(group => (
<div key={group}>
<div className="text-xs font-semibold text-stone-400 mb-1.5 mt-2">{group}</div>
<div className="grid grid-cols-2 gap-1.5">
{ALL_PAGES.filter(p=>p.group===group).map(page => {
const hidden = (hiddenPages||[]).includes(page.id);
return (
<button key={page.id} onClick={()=>setHiddenPages(prev=>{
const h = prev||[];
return h.includes(page.id) ? h.filter(x=>x!==page.id) : [...h, page.id];
})}
className={"flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-left transition-colors border "+(hidden?"border-stone-200 bg-stone-50 text-stone-300":"border-stone-200 bg-white text-stone-700")}>
<span className={"w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center text-[9px] "+(!hidden?"bg-stone-800 border-stone-800 text-white":"border-stone-300")}>{!hidden?"✓":""}</span>
<span className="truncate">{page.label}</span>
</button>
);
})}
</div>
</div>
))}
<button onClick={()=>setHiddenPages([])} className="w-full mt-3 bg-stone-100 text-stone-600 rounded-xl py-2.5 text-sm">全部顯示</button>
</div>
</SettingsSection>

{/* About */}
<SettingsSection title="關於系統" icon="ℹ️">
<div className="mt-3 text-xs text-stone-400 space-y-1.5">
<div className="flex justify-between"><span>版本</span><span>1.0.0</span></div>
<div className="flex justify-between"><span>資料儲存</span><span>Supabase 雲端</span></div>
<div className="flex justify-between"><span>自動同步</span><span>每30秒</span></div>
<div className="flex justify-between"><span>建議瀏覽器</span><span>Safari｜Chrome</span></div>
</div>
</SettingsSection>

{/* Data Management */}
<SettingsSection title="資料管理" icon="🗄️">
<div className="mt-3 space-y-2">
<div className="bg-stone-50 rounded-xl p-3 text-xs text-stone-400">⚠️ 清除資料後無法復原，請謹慎操作。</div>
<button onClick={()=>setConfirm(true)} className="w-full bg-red-50 text-red-500 rounded-xl py-3 text-sm font-medium">🗑 清除所有資料</button>
</div>
</SettingsSection>

{confirm&&(
<div className="fixed inset-0 z-50 flex items-center justify-center" style={{maxWidth:430,margin:"0 auto"}}>
<div className="absolute inset-0 bg-black/40" onClick={()=>setConfirm(false)}></div>
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


function QuickQuote({ items, setItems }) { const savedQuotes=items; const setSavedQuotes=setItems;
const [step, setStep] = useState(1); // step1=基本資訊 step2=選空間 step3=調整項目 step4=總覽
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
...item, id: roomKey+"-"+i+"-"+Date.now(),
roomKey, enabled: true
}))
]);
}
};

const addExtraItem = (item) => {
setLineItems(prev => [...prev, {...item, id:"extra-"+Date.now(), roomKey:"extra", enabled:true}]);
};

const updateItem = (id, field, val) => {
setLineItems(prev => prev.map(i => i.id===id ? {...i,[field]:val} : i));
};

const removeItem = (id) => setLineItems(prev => prev.filter(i => i.id!==id));

const addCustomItem = () => {
setLineItems(prev => [...prev, {
id:"custom-"+Date.now(), name:"自訂項目", unit:"式", qty:1, price:0,
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
<button onClick={function(){window.print();}} className="w-full bg-stone-800 text-white rounded-xl py-3 text-sm font-medium">🖨️ 列印｜儲存 PDF</button>
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
<div key={s} className={"w-8 h-1.5 rounded-full "+(step>=s?"bg-stone-800":"bg-stone-200")}></div>
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
<div className="text-xs opacity-60 mb-1">步驟 1｜4</div>
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
<div className="text-xs opacity-60 mb-1">步驟 2｜4</div>
<div className="text-base font-bold">選擇施作空間</div>
<div className="text-xs opacity-60 mt-1">可多選，系統自動帶入建議項目</div>
</div>
<div className="grid grid-cols-3 gap-2">
{Object.entries(QUOTE_TEMPLATES).map(([key,tmpl])=>(
<button key={key} onClick={()=>toggleRoom(key)}
className={"rounded-2xl p-3 text-center border-2 transition-all "+(selectedRooms[key]?"border-stone-800 bg-stone-800 text-white":"border-stone-200 bg-white text-stone-600")}>
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
<button onClick={()=>setStep(3)} disabled={Object.keys(selectedRooms).length===0} className={"flex-1 rounded-xl py-3 text-sm font-medium "+(Object.keys(selectedRooms).length>0?"bg-stone-800 text-white":"bg-stone-200 text-stone-400")}>下一步 →</button>
</div>
</div>
)}

{/* Step 3: 調整項目 */}
{step===3&&(
<div className="space-y-3">
<div className="bg-stone-800 text-white rounded-2xl p-4">
<div className="text-xs opacity-60 mb-1">步驟 3｜4</div>
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
<div key={item.id} className={"border-t border-stone-50 px-3 py-2 "+(!item.enabled?"opacity-40":"")}>
<div className="flex items-center gap-2 mb-1">
<button onClick={()=>updateItem(item.id,"enabled",!item.enabled)} className={"w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-[10px] "+(item.enabled?"bg-stone-800 border-stone-800 text-white":"border-stone-300")}>{item.enabled?"✓":""}</button>
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
<div key={item.id} className={"border-t border-stone-50 px-3 py-2 "+(!item.enabled?"opacity-40":"")}>
<div className="flex items-center gap-2 mb-1">
<button onClick={()=>updateItem(item.id,"enabled",!item.enabled)} className={"w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-[10px] "+(item.enabled?"bg-stone-800 border-stone-800 text-white":"border-stone-300")}>{item.enabled?"✓":""}</button>
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
<div className="text-xs opacity-60 mb-1">步驟 4｜4</div>
<div className="text-base font-bold">報價總覽</div>
<div className="text-xs opacity-60 mt-1">確認後可儲存或列印</div>
</div>

<div className="bg-white rounded-2xl p-4 border border-stone-100">
<div className="text-xs text-stone-400 mb-3 font-medium">報價資訊</div>
{[["客戶",quoteInfo.client],["專案",quoteInfo.projectName],["日期",quoteInfo.date],["坪數",quoteInfo.size?quoteInfo.size+" 坪":""],["風格",quoteInfo.style]].filter(([,v])=>v).map(([l,v])=>(
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
<button onClick={function(){window.print();}} className="w-full bg-stone-800 text-white rounded-xl py-3 text-sm font-medium">🖨️ 列印｜PDF</button>
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
<div className={"text-lg font-bold "+(c==="blue"?"text-blue-500":c==="green"?"text-emerald-500":"text-stone-700")}>{v}</div>
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
<div className="text-xs text-stone-400">{i.phone}{i.email?" · "+i.email:""}</div>
<div className="text-xs text-stone-400 mt-0.5">{i.style}{i.budget?" · 預算 "+i.budget:""}</div>
{i.note&&<div className="text-xs text-stone-500 mt-1 line-clamp-1">{i.note}</div>}
<button onClick={e=>{e.stopPropagation();setView(i);}} className="text-xs text-blue-500 mt-1">查看詳情 →</button>
</>
)}/>
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
const today=new Date();
const [viewMonth, setViewMonth] = useState(today.getMonth());
const [viewYear, setViewYear] = useState(today.getFullYear());
const todayStr = today.getFullYear()+"-"+String(today.getMonth()+1).padStart(2,"0")+"-"+String(today.getDate()).padStart(2,"0");
const [selectedDate, setSelectedDate] = useState(todayStr);
const open=(item=null)=>{setEdit(item);setForm(item||{...blank,startDate:selectedDate,endDate:selectedDate});setModal(true);};
const save=()=>{
if(!form.title.trim())return;
if(edit)setItems(p=>p.map(i=>i.id===edit.id?{...i,...form}:i));
else setItems(p=>[{...form,id:Date.now()},...p]);
setModal(false);
};

const firstDay=new Date(viewYear,viewMonth,1).getDay();
const daysInMonth=new Date(viewYear,viewMonth+1,0).getDate();
const mNames=["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];

const getEventsForDay=(day)=>{
const dateStr=viewYear+"-"+String(viewMonth+1).padStart(2,"0")+"-"+String(day).padStart(2,"0");
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

const selectedItems = items.filter(i=>i.startDate<=selectedDate&&i.endDate>=selectedDate);
const selectedDateLabel = (() => {
const [y,m,d] = selectedDate.split("-").map(Number);
return y+"年"+m+"月"+d+"日"+(selectedDate===todayStr?"（今天）":"");
})();

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
{Array(firstDay).fill(null).map((_,i)=><div key={"e"+(i)}></div>)}
{Array(daysInMonth).fill(null).map((_,i)=>{
const day=i+1;
const dateStr=viewYear+"-"+String(viewMonth+1).padStart(2,"0")+"-"+String(day).padStart(2,"0");
const isToday=dateStr===todayStr;
const isSelected=dateStr===selectedDate;
const evts=getEventsForDay(day);
return(
<button key={day} onClick={()=>setSelectedDate(dateStr)} className="flex flex-col items-center">
<div className={"w-7 h-7 flex items-center justify-center rounded-full text-xs "+(isSelected?"bg-stone-800 text-white font-bold":isToday?"bg-stone-200 text-stone-800 font-bold":"")}>{day}</div>
{evts.length>0&&<div className="w-1 h-1 bg-red-400 rounded-full mt-0.5"></div>}
</button>
);
})}
</div>
</div>
<div className="flex justify-between items-center">
<span className="text-sm font-medium text-stone-600">{selectedDateLabel}</span>
<button onClick={()=>open()} className="text-xs bg-stone-800 text-white px-3 py-1.5 rounded-lg">＋ 新增排程</button>
</div>
{selectedItems.length===0&&<div className="text-center text-stone-400 py-12 text-sm">這天沒有排程</div>}
{selectedItems.sort((a,b)=>a.startDate>b.startDate?1:-1).map(i=>(
<div key={i.id} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
<div className="flex justify-between items-start mb-1">
<div className="font-semibold text-stone-800 text-sm">{i.title}</div>
<span className={"text-xs px-2 py-0.5 rounded-full "+(typeColor[i.type]||"bg-stone-100")}>{i.type}</span>
</div>
<div className="text-xs text-stone-400">{i.project}{i.worker?" · 負責："+i.worker:""}</div>
<div className="text-xs text-stone-500 mt-1">📅 {i.startDate}{i.endDate!==i.startDate?" ～ "+i.endDate:""} {i.startTime}{i.endTime?"～"+i.endTime:""}</div>
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
<div className={"absolute top-1 left-1 text-[9px] px-1.5 py-0.5 rounded-full text-white "+(stageColor[img.stage]==="blue"?"bg-blue-500":stageColor[img.stage]==="green"?"bg-emerald-500":stageColor[img.stage]==="purple"?"bg-purple-500":"bg-stone-500")}>{img.stage}</div>
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
<div className="bg-white rounded-2xl p-4 border border-stone-100"><div className="text-xs text-stone-400 mb-1">淨利潤</div><div className={"text-lg font-bold "+(profit>=0?"text-stone-800":"text-red-500")}>NT${profit.toLocaleString()}</div></div>
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
<div className="bg-emerald-500 h-3 rounded-full" style={{width:(tasks.length>0?((tasks.filter(t=>t.done).length/tasks.length)*100).toFixed(0):"0")+"%"}}></div>
</div>
<span className="text-sm font-bold">{tasks.length>0?((tasks.filter(t=>t.done).length/tasks.length)*100).toFixed(0):0}%</span>
</div>
<div className="text-xs text-stone-400 mt-1">{tasks.filter(t=>t.done).length}｜{tasks.length} 已完成</div>
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
<div className={"text-sm font-bold "+(i.type==="收入"?"text-emerald-600":"text-red-500")}>{i.type==="收入"?"+":"-"}NT${Number(i.amount||0).toLocaleString()}</div>
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
{[["客戶",p.client],["地址",p.address],["預算",p.budget],["進度",(p.progress||0)+"%"]].filter(([,v])=>v).map(([l,v])=>(
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
<span className={"text-xs "+(t.done?"text-emerald-500":"text-stone-400")}>{t.done?"✓":"○"}</span>
<span className={"text-sm "+(t.done?"line-through text-stone-400":"text-stone-700")}>{t.title}</span>
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

<button onClick={printReport} className="w-full bg-stone-800 text-white rounded-xl py-3 text-sm font-medium mt-2">🖨️ 列印｜儲存 PDF</button>
<div className="text-xs text-stone-400 text-center">按下後選擇「儲存為 PDF」即可匯出</div>
</div>
)}
</div>
);
}



function getProjectList() {
try {
const p = JSON.parse(localStorage.getItem("projects") || "[]");
const names = p.map(x => x.name).filter(Boolean);
return [...new Set([...names, "公司內部"])];
} catch { return ["公司內部"]; }
}



// ─── Color Palette ───────────────────────────────────────────────
function ColorPalette({ items, setItems }) {
const [modal, setModal] = useState(false);
const [edit, setEdit] = useState(null);
const blank = {project:"",space:"客廳",type:"油漆",brand:"",code:"",color:"#ffffff",name:"",note:""};
const [form, setForm] = useState(blank);
const open=(item=null)=>{setEdit(item);setForm(item||blank);setModal(true);};
const save=()=>{
if(!form.code.trim()&&!form.name.trim())return;
if(edit)setItems(p=>p.map(i=>i.id===edit.id?{...i,...form}:i));
else setItems(p=>[{...form,id:Date.now()},...p]);
setModal(false);
};
const byProject={};
items.forEach(i=>{if(!byProject[i.project])byProject[i.project]=[];byProject[i.project].push(i);});
const typeIcon={油漆:"🎨",磁磚:"⬛",木皮:"🪵",石材:"🪨",壁紙:"📜",布料:"🧵",其他:"📦"};
return(
<>
<div className="flex justify-between items-center mb-3">
<span className="text-sm text-stone-400">共 {items.length} 筆</span>
<button onClick={()=>open()} className="text-xs bg-stone-800 text-white px-3 py-1.5 rounded-lg">＋ 新增色板</button>
</div>
{Object.keys(byProject).length===0&&<div className="text-center text-stone-400 py-12 text-sm">尚無色板資料</div>}
{Object.entries(byProject).map(([proj,list])=>(
<div key={proj} className="mb-4">
<div className="text-xs font-semibold text-stone-500 mb-2 px-1">🏠 {proj||"未分類"}</div>
<div className="grid grid-cols-3 gap-2">
{list.map(item=>(
<div key={item.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
<div className="h-16 w-full relative" style={{backgroundColor:item.color||"#f5f5f4"}}>
<span className="absolute top-1 left-1 text-base">{typeIcon[item.type]||"📦"}</span>
</div>
<div className="p-2">
<div className="text-xs font-medium text-stone-700 truncate">{item.name||item.code}</div>
<div className="text-xs text-stone-400 truncate">{item.brand} {item.code}</div>
<div className="text-xs text-stone-400">{item.space}</div>
<div className="flex gap-1 mt-1.5">
<button onClick={()=>open(item)} className="flex-1 text-[10px] text-stone-500 py-1 rounded-lg bg-stone-50">✏️</button>
<button onClick={()=>setItems(p=>p.filter(x=>x.id!==item.id))} className="flex-1 text-[10px] text-red-400 py-1 rounded-lg bg-red-50">🗑</button>
</div>
</div>
</div>
))}
</div>
</div>
))}
{modal&&<Modal title={edit?"編輯色板":"新增色板"} onClose={()=>setModal(false)}>
<div className="space-y-3">
<Sel label="所屬專案" options={["",...getProjectList()]} value={form.project} onChange={e=>setForm({...form,project:e.target.value})}/>
<div className="grid grid-cols-2 gap-3">
<Sel label="空間" options={["客廳","臥室","廚房","浴室","餐廳","書房","走廊","全室","其他"]} value={form.space} onChange={e=>setForm({...form,space:e.target.value})}/>
<Sel label="材料類型" options={["油漆","磁磚","木皮","石材","壁紙","布料","其他"]} value={form.type} onChange={e=>setForm({...form,type:e.target.value})}/>
</div>
<Inp label="品牌" placeholder="例：得利、關西" value={form.brand} onChange={e=>setForm({...form,brand:e.target.value})}/>
<Inp label="色號/編號 *" placeholder="例：50YY 83/073" value={form.code} onChange={e=>setForm({...form,code:e.target.value})}/>
<Inp label="色板名稱" placeholder="例：象牙白、北歐灰" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
<div>
<label className="text-xs text-stone-400 mb-1 block">顏色預覽</label>
<div className="flex items-center gap-3">
<input type="color" className="w-12 h-10 rounded-lg border border-stone-200 cursor-pointer" value={form.color} onChange={e=>setForm({...form,color:e.target.value})}/>
<span className="text-sm text-stone-500">{form.color}</span>
</div>
</div>
<Txt label="備註" value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/>
</div>
<Btn onClick={save}/>
</Modal>}
</>
);
}

// ─── Workers (師傅通訊錄) ─────────────────────────────────────────
function Workers({ items, setItems }) {
const [modal, setModal] = useState(false);
const [edit, setEdit] = useState(null);
const [view, setView] = useState(null);
const blank = {name:"",trade:"木作",phone:"",line:"",address:"",rate:"",unit:"天",rating:5,note:"",tags:""};
const [form, setForm] = useState(blank);
const open=(item=null)=>{setEdit(item);setForm(item||blank);setModal(true);};
const save=()=>{
if(!form.name.trim())return;
if(edit)setItems(p=>p.map(i=>i.id===edit.id?{...i,...form}:i));
else setItems(p=>[{...form,id:Date.now()},...p]);
setModal(false);
};
const tradeColor={木作:"blue",泥作:"yellow",水電:"green",油漆:"red",鐵件:"gray",拆除:"gray",清潔:"blue",其他:"gray"};
return(
<>
<div className="grid grid-cols-3 gap-2 mb-3">
{["木作","泥作","水電","油漆","鐵件","其他"].map(t=>(
<div key={t} className="bg-white rounded-xl p-2 text-center border border-stone-100">
<div className="text-sm font-bold text-stone-700">{items.filter(i=>i.trade===t).length}</div>
<div className="text-xs text-stone-400">{t}</div>
</div>
))}
</div>
<ListPage items={items} onAdd={()=>open()} onEdit={open} onDelete={id=>setItems(p=>p.filter(i=>i.id!==id))} addLabel="新增師傅"
renderItem={i=>(
<>
<div className="flex justify-between items-start mb-1">
<div className="font-semibold text-stone-800 text-sm">{i.name}</div>
<Badge color={tradeColor[i.trade]||"gray"}>{i.trade}</Badge>
</div>
<div className="text-xs text-stone-400">{i.phone}{i.line?" · LINE: "+i.line:""}</div>
{i.rate&&<div className="text-xs text-stone-500 mt-0.5">💰 {i.rate}｜{i.unit}</div>}
<div className="flex items-center gap-1 mt-1">
{[1,2,3,4,5].map(s=><span key={s} className={"text-xs "+(Number(i.rating)>=s?"text-yellow-400":"text-stone-200")}>★</span>)}
<span className="text-xs text-stone-400 ml-1">{i.rating}｜5</span>
</div>
<button onClick={e=>{e.stopPropagation();setView(i);}} className="text-xs text-blue-500 mt-1">查看詳情 →</button>
</>
)}/>
{modal&&<Modal title={edit?"編輯師傅":"新增師傅"} onClose={()=>setModal(false)}>
<div className="space-y-3">
<Inp label="師傅姓名 *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
<Sel label="工種" options={["木作","泥作","水電","油漆","鐵件","拆除","清潔","其他"]} value={form.trade} onChange={e=>setForm({...form,trade:e.target.value})}/>
<div className="grid grid-cols-2 gap-3">
<Inp label="電話" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/>
<Inp label="LINE ID" value={form.line} onChange={e=>setForm({...form,line:e.target.value})}/>
</div>
<div className="grid grid-cols-2 gap-3">
<Inp label="日薪/工資" placeholder="NT$" value={form.rate} onChange={e=>setForm({...form,rate:e.target.value})}/>
<Sel label="單位" options={["天","式","坪","才","m²"]} value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})}/>
</div>
<Inp label="地址" value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/>
<div>
<label className="text-xs text-stone-400 mb-1 block">評分 {form.rating}｜5</label>
<input type="range" min="1" max="5" className="w-full" value={form.rating} onChange={e=>setForm({...form,rating:e.target.value})}/>
</div>
<Inp label="標籤" placeholder="例：可靠、快速、CP值高" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})}/>
<Txt label="備註" value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/>
</div>
<Btn onClick={save}/>
</Modal>}
{view&&<Modal title={view.name} onClose={()=>setView(null)}>
<div className="space-y-3">
<Badge color={tradeColor[view.trade]||"gray"}>{view.trade}</Badge>
<div className="flex items-center gap-1">
{[1,2,3,4,5].map(s=><span key={s} className={"text-lg "+(Number(view.rating)>=s?"text-yellow-400":"text-stone-200")}>★</span>)}
</div>
{[["📞 電話",view.phone],["💬 LINE",view.line],["📍 地址",view.address],["💰 工資",view.rate?(view.rate+"｜"+view.unit):""]].filter(([,v])=>v).map(([l,v])=>(
<div key={l} className="flex gap-2 text-sm"><span className="text-stone-400">{l}</span><span className="text-stone-700">{v}</span></div>
))}
{view.tags&&<div className="text-xs text-stone-400 bg-stone-50 rounded-xl p-2">{view.tags}</div>}
{view.note&&<div className="text-sm text-stone-600 whitespace-pre-wrap">{view.note}</div>}
<div className="flex gap-2 mt-2">
<a href={"tel:"+(view.phone)} className="flex-1 bg-emerald-600 text-white rounded-xl py-2.5 text-sm text-center font-medium">📞 撥打電話</a>
<button onClick={()=>{setView(null);open(view);}} className="flex-1 bg-stone-800 text-white rounded-xl py-2.5 text-sm">✏️ 編輯</button>
</div>
</div>
</Modal>}
</>
);
}

// ─── Gantt Chart ─────────────────────────────────────────────────
function GanttChart({ projects, schedules }) {
const [selectedProject, setSelectedProject] = useState("");
const today = new Date();

const projectSchedules = schedules.filter(s =>
selectedProject ? s.project === selectedProject : true
).filter(s => s.startDate && s.endDate);

const allDates = projectSchedules.flatMap(s => [new Date(s.startDate), new Date(s.endDate)]);
const minDate = allDates.length > 0 ? new Date(Math.min(...allDates)) : today;
const maxDate = allDates.length > 0 ? new Date(Math.max(...allDates)) : new Date(today.getTime() + 30*86400000);
const totalDays = Math.max(1, (maxDate - minDate) / 86400000) + 2;

const typeColor = {施工:"bg-blue-400",設計:"bg-purple-400",驗收:"bg-emerald-400",會議:"bg-yellow-400",其他:"bg-stone-400"};

const getLeft = (dateStr) => {
const d = new Date(dateStr);
return Math.max(0, (d - minDate) / 86400000 / totalDays * 100);
};
const getWidth = (startStr, endStr) => {
const s = new Date(startStr), e = new Date(endStr);
return Math.max(2, (e - s) / 86400000 / totalDays * 100);
};

return (
<div className="space-y-3">
<div className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm">
<Sel label="篩選專案" options={["",...projects.map(p=>p.name)]} value={selectedProject} onChange={e=>setSelectedProject(e.target.value)}/>
</div>

{projectSchedules.length === 0 && (
<div className="text-center text-stone-400 py-12 text-sm">
<div className="text-4xl mb-3">📊</div>
請先在「智慧排程」新增排程資料
</div>
)}

{projectSchedules.length > 0 && (
<div className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm overflow-x-auto">
<div className="text-xs text-stone-400 mb-3 font-medium">工程進度甘特圖</div>
{/* Today indicator */}
<div className="relative" style={{minWidth:300}}>
{/* Today line */}
{today >= minDate && today <= maxDate && (
<div className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10"
style={{left:(getLeft(today.toISOString().split("T")[0]))+"%" }}>
<div className="absolute -top-4 -translate-x-1/2 text-[9px] text-red-400 whitespace-nowrap">今天</div>
</div>
)}
<div className="space-y-2">
{projectSchedules.map(s=>(
<div key={s.id} className="flex items-center gap-2">
<div className="w-20 flex-shrink-0 text-xs text-stone-600 truncate">{s.title}</div>
<div className="flex-1 relative h-6 bg-stone-100 rounded-full overflow-hidden">
<div
className={"absolute top-0.5 bottom-0.5 rounded-full "+(typeColor[s.type]||"bg-stone-400")+" flex items-center px-1"}
style={{left:(getLeft(s.startDate))+"%", width:(getWidth(s.startDate,s.endDate))+"%", minWidth:8}}
>
<span className="text-[9px] text-white truncate">{s.worker}</span>
</div>
</div>
</div>
))}
</div>
</div>
<div className="flex justify-between text-[9px] text-stone-300 mt-2">
<span>{minDate.toLocaleDateString("zh-TW",{month:"short",day:"numeric"})}</span>
<span>{maxDate.toLocaleDateString("zh-TW",{month:"short",day:"numeric"})}</span>
</div>
<div className="flex flex-wrap gap-2 mt-3">
{Object.entries(typeColor).map(([t,c])=>(
<div key={t} className="flex items-center gap-1">
<div className={"w-3 h-3 rounded-full "+(c)}></div>
<span className="text-xs text-stone-400">{t}</span>
</div>
))}
</div>
</div>
)}

{/* Project progress overview */}
<div className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm">
<div className="text-xs text-stone-400 mb-3 font-medium">各專案進度</div>
{projects.filter(p=>selectedProject?p.name===selectedProject:true).map(p=>(
<div key={p.id} className="mb-3 last:mb-0">
<div className="flex justify-between text-xs mb-1">
<span className="text-stone-600 truncate max-w-[60%]">{p.name}</span>
<div className="flex items-center gap-2">
<Badge color={{施工中:"blue",設計中:"yellow",驗收中:"green",完工:"green",報價中:"gray"}[p.status]||"gray"}>{p.status}</Badge>
<span className="text-stone-500 font-medium">{p.progress||0}%</span>
</div>
</div>
<div className="bg-stone-100 rounded-full h-2">
<div className={"h-2 rounded-full transition-all "+((p.progress||0)>=80?"bg-emerald-500":(p.progress||0)>=40?"bg-blue-400":"bg-yellow-400")}
style={{width:(p.progress||0)+"%" }}/>
</div>
</div>
))}
{projects.length===0&&<div className="text-center text-stone-400 text-sm py-4">尚無專案資料</div>}
</div>
</div>
);
}

// ─── Client Communications ────────────────────────────────────────
function ClientComms({ items, setItems, clients }) {
const [modal, setModal] = useState(false);
const [edit, setEdit] = useState(null);
const blank = {client:"",project:"",date:new Date().toISOString().split("T")[0],type:"電話",summary:"",decisions:"",nextAction:"",nextDate:""};
const [form, setForm] = useState(blank);
const [filterClient, setFilterClient] = useState("");
const open=(item=null)=>{setEdit(item);setForm(item||blank);setModal(true);};
const save=()=>{
if(!form.summary.trim())return;
if(edit)setItems(p=>p.map(i=>i.id===edit.id?{...i,...form}:i));
else setItems(p=>[{...form,id:Date.now()},...p]);
setModal(false);
};
const filtered = filterClient ? items.filter(i=>i.client===filterClient) : items;
const typeIcon={電話:"📞",會議:"🤝",Email:"📧",Line:"💬",現場:"📍",視訊:"💻",其他:"📝"};
return(
<>
<div className="space-y-3">
<div className="flex justify-between items-center">
<select className="text-xs border border-stone-200 rounded-xl px-3 py-2 bg-white focus:outline-none" value={filterClient} onChange={e=>setFilterClient(e.target.value)}>
<option value="">全部客戶</option>
{clients.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
</select>
<button onClick={()=>open()} className="text-xs bg-stone-800 text-white px-3 py-1.5 rounded-lg">＋ 新增紀錄</button>
</div>
{filtered.length===0&&<div className="text-center text-stone-400 py-12 text-sm">尚無溝通紀錄</div>}
{filtered.sort((a,b)=>b.date>a.date?1:-1).map(i=>(
<div key={i.id} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
<div className="flex justify-between items-start mb-2">
<div className="flex items-center gap-2">
<span className="text-lg">{typeIcon[i.type]||"📝"}</span>
<div>
<div className="text-sm font-semibold text-stone-800">{i.client}</div>
<div className="text-xs text-stone-400">{i.date} · {i.type}</div>
</div>
</div>
{i.project&&<Badge color="blue">{i.project.slice(0,6)}</Badge>}
</div>
<div className="text-sm text-stone-700 mb-2">{i.summary}</div>
{i.decisions&&<div className="bg-emerald-50 rounded-xl p-2 text-xs text-emerald-700 mb-2">✅ 決定：{i.decisions}</div>}
{i.nextAction&&<div className="bg-amber-50 rounded-xl p-2 text-xs text-amber-700">⏭ 下一步：{i.nextAction}{i.nextDate?" ("+i.nextDate+")":""}</div>}
<div className="flex gap-2 mt-3 pt-3 border-t border-stone-50">
<button onClick={()=>open(i)} className="flex-1 text-xs text-stone-500 py-1.5 rounded-lg bg-stone-50">✏️ 編輯</button>
<button onClick={()=>setItems(p=>p.filter(x=>x.id!==i.id))} className="flex-1 text-xs text-red-400 py-1.5 rounded-lg bg-red-50">🗑 刪除</button>
</div>
</div>
))}
</div>
{modal&&<Modal title={edit?"編輯溝通紀錄":"新增溝通紀錄"} onClose={()=>setModal(false)}>
<div className="space-y-3">
<div className="grid grid-cols-2 gap-3">
<div>
<label className="text-xs text-stone-400 mb-1 block">客戶</label>
<select className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none" value={form.client} onChange={e=>setForm({...form,client:e.target.value})}>
<option value="">選擇客戶</option>
{clients.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
</select>
</div>
<Sel label="溝通方式" options={["電話","會議","Email","Line","現場","視訊","其他"]} value={form.type} onChange={e=>setForm({...form,type:e.target.value})}/>
</div>
<div className="grid grid-cols-2 gap-3">
<Inp label="日期" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
<Sel label="所屬專案" options={["",...getProjectList()]} value={form.project} onChange={e=>setForm({...form,project:e.target.value})}/>
</div>
<Txt label="溝通摘要 *" placeholder="本次溝通的重點內容" value={form.summary} onChange={e=>setForm({...form,summary:e.target.value})}/>
<Txt label="決定事項" placeholder="雙方確認的決定" value={form.decisions} onChange={e=>setForm({...form,decisions:e.target.value})}/>
<Inp label="下一步行動" placeholder="需要跟進的事項" value={form.nextAction} onChange={e=>setForm({...form,nextAction:e.target.value})}/>
<Inp label="預計完成日" type="date" value={form.nextDate} onChange={e=>setForm({...form,nextDate:e.target.value})}/>
</div>
<Btn onClick={save}/>
</Modal>}
</>
);
}

// ─── Reminders (生日/週年提醒) ────────────────────────────────────
function Reminders({ items, setItems, clients }) {
const [modal, setModal] = useState(false);
const [edit, setEdit] = useState(null);
const blank = {name:"",client:"",type:"生日",date:"",repeat:"每年",note:""};
const [form, setForm] = useState(blank);
const open=(item=null)=>{setEdit(item);setForm(item||blank);setModal(true);};
const save=()=>{
if(!form.name.trim())return;
if(edit)setItems(p=>p.map(i=>i.id===edit.id?{...i,...form}:i));
else setItems(p=>[{...form,id:Date.now()},...p]);
setModal(false);
};

const today = new Date();
const getDaysUntil = (dateStr) => {
if(!dateStr) return 999;
const d = new Date(dateStr);
const thisYear = new Date(today.getFullYear(), d.getMonth(), d.getDate());
if(thisYear < today) thisYear.setFullYear(today.getFullYear()+1);
return Math.ceil((thisYear - today) / 86400000);
};

const sorted = [...items].sort((a,b)=>getDaysUntil(a.date)-getDaysUntil(b.date));
const upcoming = sorted.filter(i=>getDaysUntil(i.date)<=30);

// Auto-add birthdays from clients
const addClientBirthdays = () => {
const existing = new Set(items.map(i=>i.client+i.type));
const toAdd = clients.filter(c=>c.birthday&&!existing.has(c.name+"生日")).map(c=>({
id:Date.now()+Math.random(), name:c.name+" 生日", client:c.name,
type:"生日", date:c.birthday, repeat:"每年", note:""
}));
if(toAdd.length>0) { setItems(p=>[...p,...toAdd]); alert("✅ 已匯入 "+toAdd.length+" 筆客戶生日"); }
else alert("所有客戶生日都已存在或尚未設定");
};

return(
<>
{upcoming.length>0&&(
<div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-3">
<div className="text-xs text-amber-700 font-medium mb-2">🔔 近30天提醒</div>
{upcoming.map(i=>{
const days=getDaysUntil(i.date);
return(
<div key={i.id} className="flex justify-between items-center mb-1 last:mb-0">
<span className="text-sm text-amber-800">{i.name}</span>
<span className={"text-xs font-medium px-2 py-0.5 rounded-full "+(days===0?"bg-red-100 text-red-600":days<=7?"bg-orange-100 text-orange-600":"bg-amber-100 text-amber-600")}>
{days===0?"今天":days===1?"明天":days+"天後"}
</span>
</div>
);
})}
</div>
)}
<div className="flex justify-between items-center mb-3">
<span className="text-sm text-stone-400">共 {items.length} 筆</span>
<div className="flex gap-2">
<button onClick={addClientBirthdays} className="text-xs bg-stone-100 text-stone-600 px-3 py-1.5 rounded-lg">匯入客戶生日</button>
<button onClick={()=>open()} className="text-xs bg-stone-800 text-white px-3 py-1.5 rounded-lg">＋ 新增</button>
</div>
</div>
{sorted.length===0&&<div className="text-center text-stone-400 py-12 text-sm">尚無提醒設定</div>}
{sorted.map(i=>{
const days=getDaysUntil(i.date);
return(
<div key={i.id} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
<div className="flex justify-between items-start mb-1">
<div>
<div className="font-semibold text-stone-800 text-sm">{i.name}</div>
<div className="text-xs text-stone-400">{i.client} · {i.type} · {i.repeat}</div>
</div>
<span className={"text-xs font-medium px-2 py-0.5 rounded-full "+(days===0?"bg-red-100 text-red-600":days<=7?"bg-orange-100 text-orange-600":days<=30?"bg-amber-100 text-amber-600":"bg-stone-100 text-stone-500")}>
{days===0?"今天":days===1?"明天":days<=30?days+"天後":days+"天後"}
</span>
</div>
{i.date&&<div className="text-xs text-stone-400">📅 {i.date}</div>}
{i.note&&<div className="text-xs text-stone-500 mt-1">{i.note}</div>}
<div className="flex gap-2 mt-3 pt-3 border-t border-stone-50">
<button onClick={()=>open(i)} className="flex-1 text-xs text-stone-500 py-1.5 rounded-lg bg-stone-50">✏️ 編輯</button>
<button onClick={()=>setItems(p=>p.filter(x=>x.id!==i.id))} className="flex-1 text-xs text-red-400 py-1.5 rounded-lg bg-red-50">🗑 刪除</button>
</div>
</div>
);
})}
{modal&&<Modal title={edit?"編輯提醒":"新增提醒"} onClose={()=>setModal(false)}>
<div className="space-y-3">
<Inp label="提醒名稱 *" placeholder="例：陳先生生日" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
<div className="grid grid-cols-2 gap-3">
<div>
<label className="text-xs text-stone-400 mb-1 block">客戶</label>
<select className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none" value={form.client} onChange={e=>setForm({...form,client:e.target.value})}>
<option value="">選擇客戶</option>
{clients.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
</select>
</div>
<Sel label="類型" options={["生日","完工週年","合約到期","回訪","其他"]} value={form.type} onChange={e=>setForm({...form,type:e.target.value})}/>
</div>
<Inp label="日期" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
<Sel label="重複" options={["每年","每月","一次性"]} value={form.repeat} onChange={e=>setForm({...form,repeat:e.target.value})}/>
<Txt label="備註" placeholder="例：準備小禮物、傳送感謝訊息" value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/>
</div>
<Btn onClick={save}/>
</Modal>}
</>
);
}



// ─── Material Price Comparison ───────────────────────────────────
function PriceCompare({ items, setItems }) {
const [modal, setModal] = useState(false);
const [edit, setEdit] = useState(null);
const [viewId, setViewId] = useState(null);
const blank = {name:"",category:"磁磚",spec:"",unit:"片",quotes:[{supplier:"",price:"",note:""}]};
const [form, setForm] = useState(blank);

const open=(item=null)=>{
setEdit(item);
setForm(item ? {...item, quotes:[...item.quotes]} : blank);
setModal(true);
};
const save=()=>{
if(!form.name.trim())return;
const item = {...form, id: edit?.id||Date.now()};
if(edit) setItems(p=>p.map(i=>i.id===edit.id?item:i));
else setItems(p=>[item,...p]);
setModal(false);
};
const addQuote=()=>setForm(f=>({...f,quotes:[...f.quotes,{supplier:"",price:"",note:""}]}));
const updateQuote=(idx,field,val)=>setForm(f=>({...f,quotes:f.quotes.map((q,i)=>i===idx?{...q,[field]:val}:q)}));
const removeQuote=(idx)=>setForm(f=>({...f,quotes:f.quotes.filter((_,i)=>i!==idx)}));

const getBest=(item)=>{
const valid=item.quotes.filter(q=>q.price&&q.supplier);
if(!valid.length)return null;
return valid.reduce((a,b)=>Number(a.price)<Number(b.price)?a:b);
};

const viewItem = items.find(i=>i.id===viewId);

return(
<>
<div className="flex justify-between items-center mb-3">
<span className="text-sm text-stone-400">共 {items.length} 筆材料</span>
<button onClick={()=>open()} className="text-xs bg-stone-800 text-white px-3 py-1.5 rounded-lg">＋ 新增比價</button>
</div>
{items.length===0&&<div className="text-center text-stone-400 py-12 text-sm">尚無比價資料</div>}
{items.map(item=>{
const best=getBest(item);
return(
<div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
<div className="flex justify-between items-start mb-2">
<div>
<div className="font-semibold text-stone-800 text-sm">{item.name}</div>
<div className="text-xs text-stone-400">{item.category} · {item.spec} · 單位:{item.unit}</div>
</div>
{best&&<div className="text-right"><div className="text-xs text-stone-400">最低價</div><div className="text-sm font-bold text-emerald-600">NT${Number(best.price).toLocaleString()}</div><div className="text-xs text-stone-400">{best.supplier}</div></div>}
</div>
<div className="grid grid-cols-3 gap-1 mb-2">
{item.quotes.filter(q=>q.supplier).map((q,i)=>(
<div key={i} className={"rounded-xl p-2 text-center "+(best&&q.supplier===best.supplier?"bg-emerald-50 border border-emerald-200":"bg-stone-50")}>
<div className="text-xs text-stone-500 truncate">{q.supplier}</div>
<div className={"text-sm font-bold "+(best&&q.supplier===best.supplier?"text-emerald-600":"text-stone-700")}>
{q.price?"NT$"+Number(q.price).toLocaleString():"—"}
</div>
{best&&q.supplier===best.supplier&&<div className="text-[9px] text-emerald-500">最低</div>}
</div>
))}
</div>
<div className="flex gap-2 mt-2 pt-2 border-t border-stone-50">
<button onClick={()=>setViewId(item.id)} className="flex-1 text-xs text-stone-500 py-1.5 rounded-lg bg-stone-50">📊 詳細</button>
<button onClick={()=>open(item)} className="flex-1 text-xs text-stone-500 py-1.5 rounded-lg bg-stone-50">✏️ 編輯</button>
<button onClick={()=>setItems(p=>p.filter(i=>i.id!==item.id))} className="flex-1 text-xs text-red-400 py-1.5 rounded-lg bg-red-50">🗑</button>
</div>
</div>
);
})}
{modal&&(
<Modal title={edit?"編輯比價":"新增材料比價"} onClose={()=>setModal(false)}>
<div className="space-y-3">
<Inp label="材料名稱 *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
<div className="grid grid-cols-3 gap-2">
<Sel label="類別" options={["磁磚","木材","石材","油漆","鐵件","玻璃","燈具","衛浴","廚具","其他"]} value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/>
<Inp label="規格" placeholder="60x60" value={form.spec} onChange={e=>setForm({...form,spec:e.target.value})}/>
<Inp label="單位" placeholder="片/m²" value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})}/>
</div>
<div className="text-xs text-stone-400 font-medium mt-2">廠商報價</div>
{form.quotes.map((q,i)=>(
<div key={i} className="bg-stone-50 rounded-xl p-3 space-y-2">
<div className="flex justify-between items-center">
<span className="text-xs text-stone-500">廠商 {i+1}</span>
{form.quotes.length>1&&<button onClick={()=>removeQuote(i)} className="text-xs text-red-400">✕</button>}
</div>
<div className="grid grid-cols-2 gap-2">
<Inp label="廠商名稱" value={q.supplier} onChange={e=>updateQuote(i,"supplier",e.target.value)}/>
<Inp label="單價(NT$)" type="number" value={q.price} onChange={e=>updateQuote(i,"price",e.target.value)}/>
</div>
<Inp label="備註" placeholder="交期、最低訂量等" value={q.note} onChange={e=>updateQuote(i,"note",e.target.value)}/>
</div>
))}
<button onClick={addQuote} className="w-full text-xs text-stone-400 border border-dashed border-stone-200 rounded-xl py-2">＋ 新增廠商</button>
</div>
<Btn onClick={save}/>
</Modal>
)}
{viewItem&&(
<Modal title={viewItem.name} onClose={()=>setViewId(null)}>
<div className="space-y-3">
<div className="text-xs text-stone-400">{viewItem.category} · {viewItem.spec} · {viewItem.unit}</div>
{viewItem.quotes.filter(q=>q.supplier).map((q,i)=>{
const best=getBest(viewItem);
const isBest=best&&q.supplier===best.supplier;
return(
<div key={i} className={"rounded-2xl p-4 border "+(isBest?"border-emerald-300 bg-emerald-50":"border-stone-100 bg-stone-50")}>
<div className="flex justify-between items-center mb-1">
<div className="font-semibold text-sm text-stone-800">{q.supplier}</div>
{isBest&&<Badge color="green">最低價 🏆</Badge>}
</div>
<div className={"text-xl font-bold "+(isBest?"text-emerald-600":"text-stone-700")}>NT${Number(q.price||0).toLocaleString()}<span className="text-xs text-stone-400 font-normal">/{viewItem.unit}</span></div>
{q.note&&<div className="text-xs text-stone-500 mt-1">{q.note}</div>}
</div>
);
})}
{getBest(viewItem)&&viewItem.quotes.length>1&&(
<div className="bg-stone-800 text-white rounded-2xl p-3 text-center">
<div className="text-xs opacity-60 mb-1">最多可節省</div>
<div className="text-lg font-bold">
NT${(Math.max(...viewItem.quotes.filter(q=>q.price).map(q=>Number(q.price))) - Number(getBest(viewItem).price)).toLocaleString()}
</div>
<div className="text-xs opacity-60">選最低價 vs 最高價</div>
</div>
)}
</div>
</Modal>
)}
</>
);
}

// ─── Cost Estimator ───────────────────────────────────────────────
const ESTIMATE_RATES = {
拆除工程: { rate: 3500, unit: "坪", desc: "全室拆除含清運" },
保護工程: { rate: 1200, unit: "坪", desc: "地板、牆面保護" },
泥作工程: { rate: 8000, unit: "坪", desc: "地壁磚、粉光" },
木作工程: { rate: 15000, unit: "坪", desc: "天花板、造型牆" },
油漆工程: { rate: 3000, unit: "坪", desc: "全室批土上漆" },
水電工程: { rate: 5000, unit: "坪", desc: "配管配線" },
空調工程: { rate: 3500, unit: "坪", desc: "冷氣安裝含管線" },
地板工程: { rate: 4500, unit: "坪", desc: "超耐磨木地板" },
廚具工程: { rate: 80000, unit: "式", desc: "廚具含電器" },
衛浴工程: { rate: 120000, unit: "間", desc: "衛浴設備含施工" },
燈具工程: { rate: 2000, unit: "坪", desc: "燈具含配線安裝" },
窗簾工程: { rate: 1500, unit: "坪", desc: "窗簾布含軌道" },
系統家具: { rate: 25000, unit: "坪", desc: "系統櫃含安裝" },
設計費: { rate: 8000, unit: "坪", desc: "設計規劃費用" },
工程管理費: { rate: 0.08, unit: "%", desc: "工程總額8%" },
};

function CostEstimator() {
const [size, setSize] = useState("");
const [rooms, setRooms] = useState({bathroom:1, kitchen:1});
const [selected, setSelected] = useState(Object.fromEntries(Object.keys(ESTIMATE_RATES).map(k=>[k,true])));
const [customRates, setCustomRates] = useState({});
const [result, setResult] = useState(null);

const calculate = () => {
if(!size) return;
const sz = Number(size);
let subtotal = 0;
const breakdown = [];

Object.entries(ESTIMATE_RATES).forEach(([name, info]) => {
if(!selected[name]) return;
const rate = customRates[name] !== undefined ? Number(customRates[name]) : info.rate;
let qty, amount;
if(info.unit === "坪") { qty = sz; amount = rate * sz; }
else if(info.unit === "間") { qty = rooms.bathroom||1; amount = rate * (rooms.bathroom||1); }
else if(info.unit === "式") { qty = 1; amount = rate; }
else if(info.unit === "%") { qty = "-"; amount = 0; } // calculated after
else { qty = 1; amount = rate; }
if(info.unit !== "%") { subtotal += amount; breakdown.push({name, qty, unit:info.unit, rate, amount}); }
});

// Management fee
if(selected["工程管理費"]) {
const mgmt = Math.round(subtotal * 0.08);
subtotal += mgmt;
breakdown.push({name:"工程管理費", qty:"-", unit:"8%", rate:0.08, amount:mgmt});
}

setResult({breakdown, subtotal, lowEstimate: Math.round(subtotal*0.9), highEstimate: Math.round(subtotal*1.15)});
};

return(
<div className="space-y-4">
<div className="bg-stone-800 text-white rounded-2xl p-4">
<div className="text-xs opacity-60 mb-1">工程估價計算機</div>
<div className="text-sm opacity-80">依照室內坪數自動估算各項工程費用</div>
</div>

<div className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm space-y-3">
<Inp label="室內坪數 *" type="number" placeholder="例：30" value={size} onChange={e=>setSize(e.target.value)}/>
<div className="grid grid-cols-2 gap-3">
<div><label className="text-xs text-stone-400 mb-1 block">浴室間數</label>
<input type="number" min="0" max="5" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-center" value={rooms.bathroom} onChange={e=>setRooms({...rooms,bathroom:e.target.value})}/></div>
<div><label className="text-xs text-stone-400 mb-1 block">廚房間數</label>
<input type="number" min="0" max="3" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-center" value={rooms.kitchen} onChange={e=>setRooms({...rooms,kitchen:e.target.value})}/></div>
</div>
</div>

<div className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm">
<div className="text-xs text-stone-400 mb-3 font-medium">選擇工程項目 & 調整單價</div>
{Object.entries(ESTIMATE_RATES).map(([name, info])=>(
<div key={name} className="flex items-center gap-2 py-2 border-b border-stone-50 last:border-0">
<button onClick={()=>setSelected(p=>({...p,[name]:!p[name]}))} className={"w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center text-[10px] "+(selected[name]?"bg-stone-800 border-stone-800 text-white":"border-stone-300")}>{selected[name]?"✓":""}</button>
<div className="flex-1 min-w-0">
<div className="text-xs font-medium text-stone-700">{name}</div>
<div className="text-[10px] text-stone-400">{info.desc}</div>
</div>
<div className="flex items-center gap-1">
<input type="number" className="w-20 border border-stone-200 rounded-lg px-2 py-1 text-xs text-center" value={customRates[name]!==undefined?customRates[name]:info.rate} onChange={e=>setCustomRates(p=>({...p,[name]:e.target.value}))}/>
<span className="text-[10px] text-stone-400">｜{info.unit}</span>
</div>
</div>
))}
</div>

<button onClick={calculate} disabled={!size} className={"w-full rounded-xl py-3 text-sm font-medium "+(size?"bg-stone-800 text-white":"bg-stone-200 text-stone-400")}>計算估價</button>

{result&&(
<div className="space-y-3">
<div className="grid grid-cols-3 gap-2">
<div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-center">
<div className="text-xs text-blue-500 mb-1">保守估計</div>
<div className="text-sm font-bold text-blue-700">NT${result.lowEstimate.toLocaleString()}</div>
</div>
<div className="bg-stone-800 text-white rounded-2xl p-3 text-center">
<div className="text-xs opacity-60 mb-1">基準估價</div>
<div className="text-sm font-bold">NT${result.subtotal.toLocaleString()}</div>
</div>
<div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center">
<div className="text-xs text-amber-600 mb-1">含風險</div>
<div className="text-sm font-bold text-amber-700">NT${result.highEstimate.toLocaleString()}</div>
</div>
</div>
<div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
<div className="grid grid-cols-12 text-xs text-stone-400 px-3 py-2 bg-stone-50 font-medium">
<div className="col-span-5">項目</div><div className="col-span-2 text-center">數量</div><div className="col-span-2 text-center">單位</div><div className="col-span-3 text-right">金額</div>
</div>
{result.breakdown.map((b,i)=>(
<div key={i} className="grid grid-cols-12 text-xs px-3 py-2 border-t border-stone-50">
<div className="col-span-5 text-stone-700">{b.name}</div>
<div className="col-span-2 text-center text-stone-500">{b.qty}</div>
<div className="col-span-2 text-center text-stone-400">{b.unit}</div>
<div className="col-span-3 text-right text-stone-700">NT${b.amount.toLocaleString()}</div>
</div>
))}
</div>
<div className="text-xs text-stone-400 text-center">※ 此為粗估，實際費用依現場丈量及設計內容而定</div>
<button onClick={function(){window.print();}} className="w-full bg-stone-100 text-stone-600 rounded-xl py-2.5 text-sm">🖨️ 列印估價單</button>
</div>
)}
</div>
);
}

// ─── Case Library (完工案例庫) ─────────────────────────────────────
function CaseLibrary({ items, setItems }) {
const [modal, setModal] = useState(false);
const [edit, setEdit] = useState(null);
const [view, setView] = useState(null);
const [filter, setFilter] = useState("");
const blank = {name:"",style:"現代風",size:"",budget:"",duration:"",location:"",rooms:"",photos:"",highlights:"",note:"",tags:"",completedAt:""};
const [form, setForm] = useState(blank);
const open=(item=null)=>{setEdit(item);setForm(item||blank);setModal(true);};
const save=()=>{
if(!form.name.trim())return;
if(edit)setItems(p=>p.map(i=>i.id===edit.id?{...i,...form}:i));
else setItems(p=>[{...form,id:Date.now()},...p]);
setModal(false);
};
const styles=["現代風","北歐風","工業風","日式風","古典風","混搭風","其他"];
const filtered = filter ? items.filter(i=>i.style===filter||i.tags?.includes(filter)) : items;

return(
<>
<div className="flex gap-2 mb-3 overflow-x-auto pb-1">
<button onClick={()=>setFilter("")} className={"text-xs px-3 py-1.5 rounded-lg flex-shrink-0 "+(!filter?"bg-stone-800 text-white":"bg-stone-100 text-stone-500")}>全部</button>
{styles.map(s=><button key={s} onClick={()=>setFilter(f=>f===s?"":s)} className={"text-xs px-3 py-1.5 rounded-lg flex-shrink-0 "+(filter===s?"bg-stone-800 text-white":"bg-stone-100 text-stone-500")}>{s}</button>)}
</div>
<div className="flex justify-between items-center mb-3">
<span className="text-sm text-stone-400">共 {filtered.length} 個案例</span>
<button onClick={()=>open()} className="text-xs bg-stone-800 text-white px-3 py-1.5 rounded-lg">＋ 新增案例</button>
</div>
{filtered.length===0&&<div className="text-center text-stone-400 py-12 text-sm">尚無案例</div>}
<div className="grid grid-cols-2 gap-3">
{filtered.map(item=>(
<div key={item.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden cursor-pointer" onClick={()=>setView(item)}>
{item.photos?(
<img src={item.photos.split(",")[0].trim()} alt={item.name} className="w-full h-28 object-cover" onError={e=>e.target.style.display="none"}/>
):(
<div className="w-full h-28 bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center text-3xl">🏠</div>
)}
<div className="p-3">
<div className="text-sm font-semibold text-stone-800 truncate">{item.name}</div>
<div className="text-xs text-stone-400">{item.style}{item.size?" · "+item.size+"坪":""}</div>
{item.budget&&<div className="text-xs text-stone-500 font-medium mt-1">{item.budget}</div>}
</div>
</div>
))}
</div>
{modal&&<Modal title={edit?"編輯案例":"新增完工案例"} onClose={()=>setModal(false)}>
<div className="space-y-3">
<Inp label="案例名稱 *" placeholder="例：大安區陳宅 現代簡約" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
<div className="grid grid-cols-2 gap-3">
<Sel label="設計風格" options={styles} value={form.style} onChange={e=>setForm({...form,style:e.target.value})}/>
<Inp label="坪數" placeholder="30" value={form.size} onChange={e=>setForm({...form,size:e.target.value})}/>
</div>
<div className="grid grid-cols-2 gap-3">
<Inp label="工程預算" placeholder="NT$" value={form.budget} onChange={e=>setForm({...form,budget:e.target.value})}/>
<Inp label="施工天數" placeholder="60" value={form.duration} onChange={e=>setForm({...form,duration:e.target.value})}/>
</div>
<Inp label="地點" placeholder="例：台北大安區" value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/>
<Inp label="格局" placeholder="例：3房2廳2衛" value={form.rooms} onChange={e=>setForm({...form,rooms:e.target.value})}/>
<Inp label="完工日期" type="date" value={form.completedAt} onChange={e=>setForm({...form,completedAt:e.target.value})}/>
<Txt label="照片網址（多張用逗號分隔）" placeholder="https://..." value={form.photos} onChange={e=>setForm({...form,photos:e.target.value})}/>
<Txt label="設計亮點" placeholder="本案特色、創意設計說明" value={form.highlights} onChange={e=>setForm({...form,highlights:e.target.value})}/>
<Inp label="標籤" placeholder="例：開放式廚房、無隔間、大坪數" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})}/>
<Txt label="備註" value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/>
</div>
<Btn onClick={save}/>
</Modal>}
{view&&<Modal title={view.name} onClose={()=>setView(null)}>
<div className="space-y-3">
{view.photos&&view.photos.split(",").filter(p=>p.trim()).map((p,i)=>(
<img key={i} src={p.trim()} alt="" className="w-full rounded-xl object-cover max-h-48" onError={e=>e.target.style.display="none"}/>
))}
<div className="flex flex-wrap gap-2">
<Badge color="blue">{view.style}</Badge>
{view.size&&<Badge color="gray">{view.size}坪</Badge>}
{view.rooms&&<Badge color="gray">{view.rooms}</Badge>}
</div>
{[["📍 地點",view.location],["💰 預算",view.budget],["⏱ 施工天數",view.duration?view.duration+"天":""],["📅 完工日期",view.completedAt]].filter(([,v])=>v).map(([l,v])=>(
<div key={l} className="flex gap-2 text-sm"><span className="text-stone-400">{l}</span><span className="text-stone-700">{v}</span></div>
))}
{view.highlights&&<><div className="text-xs text-stone-400 font-medium">✨ 設計亮點</div><div className="text-sm text-stone-700 whitespace-pre-wrap bg-stone-50 rounded-xl p-3">{view.highlights}</div></>}
{view.tags&&<div className="text-xs text-stone-400 bg-stone-50 rounded-xl p-2">{view.tags}</div>}
<div className="flex gap-2 mt-2">
<button onClick={()=>{setView(null);open(view);}} className="flex-1 bg-stone-800 text-white rounded-xl py-2.5 text-sm">✏️ 編輯</button>
</div>
</div>
</Modal>}
</>
);
}

// ─── Client Progress Page ─────────────────────────────────────────
function ClientProgress({ projects, tasks, album, schedule }) {
const [selectedProject, setSelectedProject] = useState("");
const [copied, setCopied] = useState(false);

const proj = projects.find(p=>p.name===selectedProject);
const projTasks = tasks.filter(t=>t.project===selectedProject);
const projAlbum = album.filter(a=>a.project===selectedProject);
const projSchedule = schedule.filter(s=>s.project===selectedProject).sort((a,b)=>a.startDate>b.startDate?1:-1);

const completedTasks = projTasks.filter(t=>t.done).length;
const totalTasks = projTasks.length;

const generateLink = () => {
const data = {
name: proj?.name,
status: proj?.status,
progress: proj?.progress||0,
tasks: {done:completedTasks, total:totalTasks},
schedule: projSchedule.slice(0,5).map(s=>({title:s.title,date:s.startDate,type:s.type})),
photos: projAlbum.slice(0,6).map(a=>({url:a.url,stage:a.stage,title:a.title})),
updatedAt: new Date().toLocaleDateString("zh-TW")
};
const encoded = btoa(encodeURIComponent(JSON.stringify(data)));
return window.location.origin+window.location.pathname+"#client="+encoded;
};

const copyLink = () => {
navigator.clipboard.writeText(generateLink()).then(()=>{
setCopied(true);
setTimeout(()=>setCopied(false),2000);
});
};

return(
<div className="space-y-4">
<div className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm">
<div className="text-xs text-stone-400 mb-2 font-medium">選擇要分享的專案</div>
<select className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none" value={selectedProject} onChange={e=>setSelectedProject(e.target.value)}>
<option value="">選擇專案</option>
{projects.map(p=><option key={p.id} value={p.name}>{p.name}</option>)}
</select>
</div>

{proj&&(
<>
<div className="bg-stone-800 text-white rounded-2xl p-4">
<div className="text-xs opacity-60 mb-1">客戶進度預覽</div>
<div className="text-base font-bold">{proj.name}</div>
<div className="flex items-center gap-2 mt-2">
<Badge color={{施工中:"blue",設計中:"yellow",驗收中:"green",完工:"green"}[proj.status]||"gray"}>{proj.status}</Badge>
<span className="text-sm opacity-80">{proj.progress||0}% 完成</span>
</div>
</div>

<div className="grid grid-cols-3 gap-2">
<div className="bg-white rounded-2xl p-3 text-center border border-stone-100">
<div className="text-lg font-bold text-stone-800">{completedTasks}｜{totalTasks}</div>
<div className="text-xs text-stone-400">任務完成</div>
</div>
<div className="bg-white rounded-2xl p-3 text-center border border-stone-100">
<div className="text-lg font-bold text-stone-800">{projAlbum.length}</div>
<div className="text-xs text-stone-400">施工照片</div>
</div>
<div className="bg-white rounded-2xl p-3 text-center border border-stone-100">
<div className="text-lg font-bold text-stone-800">{projSchedule.length}</div>
<div className="text-xs text-stone-400">排程項目</div>
</div>
</div>

{projSchedule.length>0&&(
<div className="bg-white rounded-2xl p-4 border border-stone-100">
<div className="text-xs text-stone-400 mb-3 font-medium">近期施工排程</div>
{projSchedule.slice(0,4).map(s=>(
<div key={s.id} className="flex justify-between items-center mb-2 last:mb-0">
<span className="text-sm text-stone-700">{s.title}</span>
<span className="text-xs text-stone-400">{s.startDate}</span>
</div>
))}
</div>
)}

{projAlbum.length>0&&(
<div className="bg-white rounded-2xl p-4 border border-stone-100">
<div className="text-xs text-stone-400 mb-3 font-medium">施工照片</div>
<div className="grid grid-cols-3 gap-2">
{projAlbum.slice(0,6).map(a=>(
<div key={a.id} className="aspect-square rounded-xl overflow-hidden bg-stone-100">
{a.url?<img src={a.url} alt="" className="w-full h-full object-cover" onError={e=>e.target.style.display="none"}/>:<div className="w-full h-full flex items-center justify-center text-2xl">🖼️</div>}
</div>
))}
</div>
</div>
)}

<button onClick={copyLink} className={"w-full rounded-xl py-3 text-sm font-medium transition-colors "+(copied?"bg-emerald-600 text-white":"bg-stone-800 text-white")}>
{copied?"✅ 連結已複製！":"🔗 複製進度分享連結"}
</button>
<div className="text-xs text-stone-400 text-center">將連結傳給客戶，讓他們隨時查看工程進度</div>
</>
)}

{!proj&&<div className="text-center text-stone-400 py-12 text-sm">選擇專案後可產生客戶進度頁連結</div>}
</div>
);
}



// ─── Visual Dashboard ─────────────────────────────────────────────
function VisualDashboard({ projects, tasks, ledger, attendance, payroll=[], expense=[], purchase=[], monthly=[] }) {
const months = [];
for(let i=5;i>=0;i--){
const d = new Date();
d.setMonth(d.getMonth()-i);
months.push(d.toISOString().slice(0,7));
}
const monthLabel = m => m.slice(5)+"月";

const monthlyIncome = months.map(m =>
ledger.filter(i=>i.type==="收入"&&i.date?.slice(0,7)===m).reduce((s,i)=>s+Number(i.amount||0),0)
);
const monthlyExpense = months.map(m => {
const ledgerExp = ledger.filter(i=>i.type==="支出"&&i.date?.slice(0,7)===m).reduce((s,i)=>s+Number(i.amount||0),0);
const payrollExp = payroll.filter(i=>i.status==="已發"&&i.month===m).reduce((s,i)=>s+(Number(i.baseSalary||0)+Number(i.bonus||0)-Number(i.deduction||0)),0);
const expExp = expense.filter(i=>(i.status==="已核准"||i.status==="已撥款")&&i.date?.slice(0,7)===m).reduce((s,i)=>s+Number(i.amount||0),0);
const purExp = purchase.filter(i=>(i.status==="已採購"||i.status==="已到貨")&&i.date?.slice(0,7)===m).reduce((s,i)=>s+Number(i.qty||1)*Number(i.price||0),0);
const monExp = monthly.filter(i=>i.month===m).reduce((s,i)=>s+Number(i.amount||0),0);
return ledgerExp+payrollExp+expExp+purExp+monExp;
});

const statusCounts = {};
projects.forEach(p=>{ statusCounts[p.status]=(statusCounts[p.status]||0)+1; });
const statusColors = {施工中:"bg-blue-400",設計中:"bg-yellow-400",驗收中:"bg-emerald-400",報價中:"bg-stone-400",完工:"bg-green-600"};

const doneTasks = tasks.filter(t=>t.done).length;
const totalTasks = tasks.length;
const taskRate = totalTasks>0?Math.round(doneTasks/totalTasks*100):0;

const maxVal = Math.max(...monthlyIncome,...monthlyExpense,1);

const fin = getCompanyFinance({ ledger, payroll, expense, purchase, monthly });
const { totalIncome, totalExpense, profit, margin } = fin;

return(
<div className="space-y-4">
{/* KPI Cards */}
<div className="grid grid-cols-2 gap-3">
{[
["進行中專案", projects.filter(p=>p.status!=="完工").length+"個", "text-blue-500"],
["任務完成率", taskRate+"%", taskRate>=70?"text-emerald-500":"text-yellow-500"],
["累計收入", "NT$"+(totalIncome/10000).toFixed(0)+"萬", "text-emerald-600"],
["利潤率", margin+"%", Number(margin)>=20?"text-emerald-500":Number(margin)>=10?"text-yellow-500":"text-red-500"],
].map(([l,v,c])=>(
<div key={l} className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm">
<div className="text-xs text-stone-400 mb-1">{l}</div>
<div className={"text-2xl font-bold "+(c)}>{v}</div>
</div>
))}
</div>

{/* Company Finance Breakdown */}
<div className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm">
<div className="text-xs text-stone-400 mb-3 font-medium">公司整體資金狀況</div>
<div className="flex justify-between items-center mb-3">
<span className="text-sm text-stone-600">淨利潤</span>
<span className={"text-lg font-bold "+(profit>=0?"text-stone-800":"text-red-500")}>NT${profit.toLocaleString()}</span>
</div>
{[["帳本支出",fin.breakdown.ledgerExpense],["已發薪資",fin.breakdown.payrollExpense],["已核准報銷",fin.breakdown.expenseExpense],["已採購/到貨",fin.breakdown.purchaseExpense],["每月固定支出",fin.breakdown.monthlyExpenseTotal]].map(([l,v])=>(
<div key={l} className="flex justify-between items-center mb-1.5 last:mb-0">
<span className="text-xs text-stone-500">{l}</span><span className="text-xs font-medium text-stone-600">NT${v.toLocaleString()}</span>
</div>
))}
</div>

{/* Monthly Income/Expense Chart */}
<div className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm">
<div className="text-xs text-stone-400 mb-4 font-medium">近6個月收支</div>
<div className="flex items-end gap-2 h-32">
{months.map((m,i)=>(
<div key={m} className="flex-1 flex flex-col items-center gap-1">
<div className="w-full flex gap-0.5 items-end" style={{height:100}}>
<div className="flex-1 bg-emerald-400 rounded-t-sm transition-all" style={{height:String(Math.round(monthlyIncome[i]/maxVal*100))+"%", minHeight: monthlyIncome[i]>0?4:0}}/>
<div className="flex-1 bg-red-300 rounded-t-sm transition-all" style={{height:String(Math.round(monthlyExpense[i]/maxVal*100))+"%", minHeight: monthlyExpense[i]>0?4:0}}/>
</div>
<span className="text-[9px] text-stone-400">{monthLabel(m)}</span>
</div>
))}
</div>
<div className="flex gap-4 mt-2 justify-center">
<div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-emerald-400"></div><span className="text-xs text-stone-400">收入</span></div>
<div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-red-300"></div><span className="text-xs text-stone-400">支出</span></div>
</div>
</div>

{/* Project Status Pie */}
<div className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm">
<div className="text-xs text-stone-400 mb-3 font-medium">專案狀態分布</div>
{Object.keys(statusCounts).length===0&&<div className="text-center text-stone-400 text-sm py-4">尚無專案資料</div>}
<div className="space-y-2">
{Object.entries(statusCounts).map(([status,count])=>(
<div key={status} className="flex items-center gap-3">
<span className="text-xs text-stone-600 w-14 flex-shrink-0">{status}</span>
<div className="flex-1 bg-stone-100 rounded-full h-4 overflow-hidden">
<div className={"h-4 rounded-full "+(statusColors[status]||"bg-stone-400")}
style={{width:String(Math.round(count/projects.length*100))+"%"}}></div>
</div>
<span className="text-xs font-bold text-stone-700 w-6 text-right">{count}</span>
</div>
))}
</div>
</div>

{/* Task completion */}
<div className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm">
<div className="text-xs text-stone-400 mb-3 font-medium">任務完成率</div>
<div className="flex items-center gap-3 mb-2">
<div className="flex-1 bg-stone-100 rounded-full h-4 overflow-hidden">
<div className={"h-4 rounded-full transition-all "+(taskRate>=70?"bg-emerald-500":taskRate>=40?"bg-yellow-400":"bg-red-400")}
style={{width:(taskRate)+"%" }}/>
</div>
<span className="text-lg font-bold text-stone-800 w-12 text-right">{taskRate}%</span>
</div>
<div className="text-xs text-stone-400">{doneTasks}｜{totalTasks} 筆任務已完成</div>
<div className="grid grid-cols-3 gap-2 mt-3">
{["高","中","低"].map(p=>{
const cnt = tasks.filter(t=>t.priority===p&&!t.done).length;
return(
<div key={p} className="text-center bg-stone-50 rounded-xl p-2">
<div className={"text-lg font-bold "+(p==="高"?"text-red-500":p==="中"?"text-yellow-500":"text-green-500")}>{cnt}</div>
<div className="text-xs text-stone-400">{p}優先待辦</div>
</div>
);
})}
</div>
</div>

{/* Top projects by progress */}
{projects.length>0&&(
<div className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm">
<div className="text-xs text-stone-400 mb-3 font-medium">各專案進度</div>
{[...projects].sort((a,b)=>(b.progress||0)-(a.progress||0)).slice(0,5).map(p=>(
<div key={p.id} className="mb-3 last:mb-0">
<div className="flex justify-between text-xs mb-1">
<span className="text-stone-600 truncate max-w-[55%]">{p.name}</span>
<div className="flex items-center gap-1">
<Badge color={{施工中:"blue",設計中:"yellow",驗收中:"green",完工:"green",報價中:"gray"}[p.status]||"gray"}>{p.status}</Badge>
<span className="text-stone-500 font-medium">{p.progress||0}%</span>
</div>
</div>
<div className="bg-stone-100 rounded-full h-1.5">
<div className="bg-emerald-500 h-1.5 rounded-full" style={{width:(p.progress||0)+"%" }}></div>
</div>
</div>
))}
</div>
)}
{/* Per-project profit */}
{(() => {
const projectNames = [...new Set([
(projects||[]).map(p=>p.name),
ledger.map(i=>i.project),
expense.map(i=>i.project),
purchase.map(i=>i.project),
].flat().filter(Boolean))];
const byProject = projectNames.map(name=>{
const inc = ledger.filter(i=>i.project===name&&i.type==="收入").reduce((s,i)=>s+Number(i.amount||0),0);
const ledgerExp = ledger.filter(i=>i.project===name&&i.type==="支出").reduce((s,i)=>s+Number(i.amount||0),0);
const expExp = expense.filter(i=>i.project===name&&(i.status==="已核准"||i.status==="已撥款")).reduce((s,i)=>s+Number(i.amount||0),0);
const purExp = purchase.filter(i=>i.project===name&&(i.status==="已採購"||i.status==="已到貨")).reduce((s,i)=>s+Number(i.qty||1)*Number(i.price||0),0);
const exp = ledgerExp+expExp+purExp;
return{name,income:inc,expense:exp,profit:inc-exp};
}).filter(p=>p.income>0||p.expense>0);
return byProject.length>0 && (
<div className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm">
<div className="text-xs text-stone-400 mb-3 font-medium">各專案利潤</div>
<div className="space-y-3">
{byProject.map((p,i)=>(
<div key={i} className="border-b border-stone-100 pb-3 last:border-0 last:pb-0">
<div className="font-semibold text-stone-800 text-sm mb-2">{p.name}</div>
<div className="grid grid-cols-3 gap-2 text-center">
{[["收入","NT$"+p.income.toLocaleString(),"text-emerald-600"],["支出","NT$"+p.expense.toLocaleString(),"text-red-500"],["利潤","NT$"+p.profit.toLocaleString(),p.profit>=0?"text-stone-800":"text-red-500"]].map(([l,v,c])=>(
<div key={l}><div className="text-xs text-stone-400 mb-1">{l}</div><div className={"text-sm font-bold "+(c)}>{v}</div></div>
))}
</div>
</div>
))}
</div>
</div>
);
})()}

{/* Financial advice */}
<div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
<div className="text-xs text-amber-600 font-medium mb-1">💡 財務建議</div>
<div className="text-xs text-amber-700">
{Number(margin)<10?"利潤率偏低，建議檢視成本結構或提高報價。":Number(margin)<20?"利潤率尚可，持續監控各項支出。":"財務狀況健康，繼續保持！"}
</div>
</div>
</div>
);
}
function Suppliers({ items, setItems }) {
const [modal, setModal] = useState(false);
const [edit, setEdit] = useState(null);
const [view, setView] = useState(null);
const blank = {name:"",category:"建材",contact:"",phone:"",line:"",address:"",website:"",paymentTerm:"",leadTime:"",rating:5,tags:"",note:""};
const [form, setForm] = useState(blank);
const [filterCat, setFilterCat] = useState("");
const open=(item=null)=>{setEdit(item);setForm(item||blank);setModal(true);};
const save=()=>{
if(!form.name.trim())return;
if(edit)setItems(p=>p.map(i=>i.id===edit.id?{...i,...form}:i));
else setItems(p=>[{...form,id:Date.now()},...p]);
setModal(false);
};
const cats=["建材","磁磚","木材","油漆","燈具","衛浴","廚具","鐵件","玻璃","家具","軟裝","其他"];
const filtered = filterCat ? items.filter(i=>i.category===filterCat) : items;
return(
<>
<div className="flex gap-2 mb-3 overflow-x-auto pb-1">
<button onClick={()=>setFilterCat("")} className={"text-xs px-3 py-1.5 rounded-lg flex-shrink-0 "+(!filterCat?"bg-stone-800 text-white":"bg-stone-100 text-stone-500")}>全部</button>
{cats.map(c=><button key={c} onClick={()=>setFilterCat(f=>f===c?"":c)} className={"text-xs px-3 py-1.5 rounded-lg flex-shrink-0 "+(filterCat===c?"bg-stone-800 text-white":"bg-stone-100 text-stone-500")}>{c}</button>)}
</div>
<ListPage items={filtered} onAdd={()=>open()} onEdit={open} onDelete={id=>setItems(p=>p.filter(i=>i.id!==id))} addLabel="新增廠商"
renderItem={i=>(
<>
<div className="flex justify-between items-start mb-1">
<div className="font-semibold text-stone-800 text-sm">{i.name}</div>
<Badge color="blue">{i.category}</Badge>
</div>
<div className="text-xs text-stone-400">{i.contact}{i.phone?" · "+i.phone:""}</div>
{i.leadTime&&<div className="text-xs text-stone-400">交期：{i.leadTime}</div>}
<div className="flex items-center gap-1 mt-1">
{[1,2,3,4,5].map(s=><span key={s} className={"text-xs "+(Number(i.rating)>=s?"text-yellow-400":"text-stone-200")}>★</span>)}
</div>
<button onClick={e=>{e.stopPropagation();setView(i);}} className="text-xs text-blue-500 mt-1">查看詳情 →</button>
</>
)}/>
{modal&&<Modal title={edit?"編輯廠商":"新增廠商"} onClose={()=>setModal(false)}>
<div className="space-y-3">
<Inp label="廠商名稱 *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
<Sel label="類別" options={cats} value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/>
<div className="grid grid-cols-2 gap-3">
<Inp label="聯絡人" value={form.contact} onChange={e=>setForm({...form,contact:e.target.value})}/>
<Inp label="電話" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/>
</div>
<div className="grid grid-cols-2 gap-3">
<Inp label="LINE" value={form.line} onChange={e=>setForm({...form,line:e.target.value})}/>
<Inp label="付款條件" placeholder="月結30天" value={form.paymentTerm} onChange={e=>setForm({...form,paymentTerm:e.target.value})}/>
</div>
<Inp label="交貨天數" placeholder="例：7-14天" value={form.leadTime} onChange={e=>setForm({...form,leadTime:e.target.value})}/>
<Inp label="地址" value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/>
<Inp label="網站/目錄連結" value={form.website} onChange={e=>setForm({...form,website:e.target.value})}/>
<div><label className="text-xs text-stone-400 mb-1 block">評分 {form.rating}｜5</label>
<input type="range" min="1" max="5" className="w-full" value={form.rating} onChange={e=>setForm({...form,rating:e.target.value})}/></div>
<Inp label="標籤" placeholder="例：品質好、CP值高、配合度佳" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})}/>
<Txt label="備註" value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/>
</div>
<Btn onClick={save}/>
</Modal>}
{view&&<Modal title={view.name} onClose={()=>setView(null)}>
<div className="space-y-3">
<Badge color="blue">{view.category}</Badge>
<div className="flex items-center gap-1">{[1,2,3,4,5].map(s=><span key={s} className={"text-lg "+(Number(view.rating)>=s?"text-yellow-400":"text-stone-200")}>★</span>)}</div>
{[["👤 聯絡人",view.contact],["📞 電話",view.phone],["💬 LINE",view.line],["📍 地址",view.address],["💳 付款條件",view.paymentTerm],["🚚 交貨天數",view.leadTime],["🌐 網站",view.website]].filter(([,v])=>v).map(([l,v])=>(
<div key={l} className="flex gap-2 text-sm"><span className="text-stone-400 flex-shrink-0">{l}</span><span className="text-stone-700 break-all">{v}</span></div>
))}
{view.tags&&<div className="text-xs text-stone-400 bg-stone-50 rounded-xl p-2">{view.tags}</div>}
{view.note&&<div className="text-sm text-stone-600">{view.note}</div>}
<div className="flex gap-2">
<a href={"tel:"+(view.phone)} className="flex-1 bg-emerald-600 text-white rounded-xl py-2.5 text-sm text-center">📞 撥打</a>
<button onClick={()=>{setView(null);open(view);}} className="flex-1 bg-stone-800 text-white rounded-xl py-2.5 text-sm">✏️ 編輯</button>
</div>
</div>
</Modal>}
</>
);
}

// ─── Standard Checklist ───────────────────────────────────────────
const DEFAULT_CHECKLISTS = {
"新案開案清單": ["簽訂設計合約","收取訂金","取得屋況資料","安排現場丈量","確認設計風格與需求","建立專案資料夾","通知各相關師傅"],
"施工前準備": ["確認設計圖已審核","建材樣本客戶確認","施工合約簽訂","第一期款收取","保護工程準備","向管委會申請施工許可","排定施工進場時間"],
"木作工程驗收": ["天花板平整度","造型牆垂直度","門框密合度","抽屜順暢度","五金安裝確認","油漆前批土完成"],
"泥作工程驗收": ["磁磚平整度","填縫完整","防水測試（浴室）","地排水測試","牆面垂直確認"],
"完工驗收清單": ["全室清潔完成","所有燈具測試","插座開關測試","冷氣試運轉","水龍頭水壓測試","門窗開關順暢","向客戶說明保固事項","收取尾款","移交鑰匙"],
};

function StandardChecklist({ items, setItems }) {
const [modal, setModal] = useState(false);
const [edit, setEdit] = useState(null);
const [view, setView] = useState(null);
const [applyProject, setApplyProject] = useState("");
const blank = {name:"",project:"",items_list:[],note:""};
const [form, setForm] = useState(blank);
const [newItem, setNewItem] = useState("");
const open=(item=null)=>{setEdit(item);setForm(item?{...item,items_list:[...item.items_list]}:blank);setNewItem("");setModal(true);};

const loadTemplate=(tplName)=>{
const tpl=DEFAULT_CHECKLISTS[tplName];
if(tpl)setForm(f=>({...f,name:tplName,items_list:tpl.map(t=>({text:t,done:false}))}));
};
const save=()=>{
if(!form.name.trim())return;
if(edit)setItems(p=>p.map(i=>i.id===edit.id?{...i,...form}:i));
else setItems(p=>[{...form,id:Date.now(),createdAt:new Date().toLocaleDateString("zh-TW")},...p]);
setModal(false);
};
const toggleItem=(listId,idx)=>{
setItems(p=>p.map(i=>i.id===listId?{...i,items_list:i.items_list.map((x,j)=>j===idx?{...x,done:!x.done}:x)}:i));
};

return(
<>
<div className="flex justify-between items-center mb-3">
<span className="text-sm text-stone-400">共 {items.length} 份清單</span>
<button onClick={()=>open()} className="text-xs bg-stone-800 text-white px-3 py-1.5 rounded-lg">＋ 新增清單</button>
</div>
{/* Templates */}
<div className="bg-stone-50 rounded-2xl p-3 mb-3 border border-stone-200">
<div className="text-xs text-stone-500 font-medium mb-2">📋 系統範本</div>
<div className="flex flex-wrap gap-2">
{Object.keys(DEFAULT_CHECKLISTS).map(t=>(
<button key={t} onClick={()=>{
setItems(p=>[{id:Date.now(),name:t,project:"",items_list:DEFAULT_CHECKLISTS[t].map(x=>({text:x,done:false})),note:"",createdAt:new Date().toLocaleDateString("zh-TW")},...p]);
}} className="text-xs bg-white border border-stone-200 text-stone-600 px-2 py-1 rounded-lg">+ {t}</button>
))}
</div>
</div>
{items.length===0&&<div className="text-center text-stone-400 py-8 text-sm">點上方範本快速建立清單</div>}
{items.map(list=>{
const done=list.items_list.filter(i=>i.done).length;
const total=list.items_list.length;
const pct=total>0?Math.round(done/total*100):0;
return(
<div key={list.id} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
<div className="flex justify-between items-start mb-2">
<div>
<div className="font-semibold text-stone-800 text-sm">{list.name}</div>
{list.project&&<div className="text-xs text-stone-400">{list.project}</div>}
</div>
<span className={"text-xs font-bold "+(pct===100?"text-emerald-500":"text-stone-500")}>{pct}%</span>
</div>
<div className="bg-stone-100 rounded-full h-1.5 mb-3">
<div className={"h-1.5 rounded-full "+(pct===100?"bg-emerald-500":"bg-blue-400")} style={{width:(pct)+"%" }}></div>
</div>
<div className="space-y-1.5 max-h-40 overflow-y-auto">
{list.items_list.map((item,idx)=>(
<div key={idx} className="flex items-center gap-2">
<button onClick={()=>toggleItem(list.id,idx)} className={"w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center text-[10px] "+(item.done?"bg-stone-800 border-stone-800 text-white":"border-stone-300")}>{item.done?"✓":""}</button>
<span className={"text-xs "+(item.done?"line-through text-stone-400":"text-stone-700")}>{item.text}</span>
</div>
))}
</div>
<div className="flex gap-2 mt-3 pt-3 border-t border-stone-50">
<button onClick={()=>open(list)} className="flex-1 text-xs text-stone-500 py-1.5 rounded-lg bg-stone-50">✏️ 編輯</button>
<button onClick={()=>setItems(p=>p.filter(i=>i.id!==list.id))} className="flex-1 text-xs text-red-400 py-1.5 rounded-lg bg-red-50">🗑 刪除</button>
</div>
</div>
);
})}
{modal&&<Modal title={edit?"編輯清單":"新增工程清單"} onClose={()=>setModal(false)}>
<div className="space-y-3">
{!edit&&(
<div>
<label className="text-xs text-stone-400 mb-1 block">套用範本</label>
<select className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none" onChange={e=>e.target.value&&loadTemplate(e.target.value)}>
<option value="">選擇範本（可選）</option>
{Object.keys(DEFAULT_CHECKLISTS).map(t=><option key={t} value={t}>{t}</option>)}
</select>
</div>
)}
<Inp label="清單名稱 *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
<Sel label="所屬專案" options={["",...getProjectList()]} value={form.project} onChange={e=>setForm({...form,project:e.target.value})}/>
<div>
<label className="text-xs text-stone-400 mb-2 block">清單項目 ({form.items_list.length}項)</label>
<div className="space-y-1.5 max-h-48 overflow-y-auto mb-2">
{form.items_list.map((item,i)=>(
<div key={i} className="flex items-center gap-2">
<input className="flex-1 border border-stone-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none" value={item.text} onChange={e=>setForm(f=>({...f,items_list:f.items_list.map((x,j)=>j===i?{...x,text:e.target.value}:x)}))}/>
<button onClick={()=>setForm(f=>({...f,items_list:f.items_list.filter((_,j)=>j!==i)}))} className="text-red-300 text-xs">✕</button>
</div>
))}
</div>
<div className="flex gap-2">
<input className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none" placeholder="新增項目" value={newItem} onChange={e=>setNewItem(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&newItem.trim()){setForm(f=>({...f,items_list:[...f.items_list,{text:newItem.trim(),done:false}]}));setNewItem("");}}}/>
<button onClick={()=>{if(newItem.trim()){setForm(f=>({...f,items_list:[...f.items_list,{text:newItem.trim(),done:false}]}));setNewItem("");}}} className="bg-stone-800 text-white px-3 rounded-xl text-xs">＋</button>
</div>
</div>
</div>
<Btn onClick={save}/>
</Modal>}
</>
);
}

// ─── Payment Tracker ──────────────────────────────────────────────
function PaymentTracker({ items, setItems, projects, ledger }) {
const [modal, setModal] = useState(false);
const [edit, setEdit] = useState(null);
const blank = {project:"",client:"",totalAmount:"",stages:[
{name:"訂金",percent:30,amount:"",dueDate:"",status:"未收",paidDate:""},
{name:"期中款",percent:40,amount:"",dueDate:"",status:"未收",paidDate:""},
{name:"尾款",percent:30,amount:"",dueDate:"",status:"未收",paidDate:""},
],note:""};
const [form, setForm] = useState(blank);
const open=(item=null)=>{setEdit(item);setForm(item?JSON.parse(JSON.stringify(item)):JSON.parse(JSON.stringify(blank)));setModal(true);};
const save=()=>{
if(!form.project.trim())return;
const total=Number(form.totalAmount||0);
const updated={...form,stages:form.stages.map(s=>({...s,amount:s.amount||Math.round(total*s.percent/100)}))};
if(edit)setItems(p=>p.map(i=>i.id===edit.id?{...updated,id:edit.id}:i));
else setItems(p=>[{...updated,id:Date.now()},...p]);
setModal(false);
};
const toggleStage=(listId,idx)=>{
setItems(p=>p.map(contract=>contract.id===listId?{...contract,stages:contract.stages.map((s,i)=>i===idx?{...s,status:s.status==="已收"?"未收":"已收",paidDate:s.status==="已收"?"":new Date().toLocaleDateString("zh-TW")}:s)}:contract));
};
const today=new Date();
const overdueCount = items.reduce((cnt,contract)=>cnt+contract.stages.filter(s=>s.status!=="已收"&&s.dueDate&&new Date(s.dueDate)<today).length,0);

return(
<>
{overdueCount>0&&(
<div className="bg-red-50 border border-red-200 rounded-2xl p-3 mb-3">
<div className="text-xs text-red-600 font-medium">⚠️ 有 {overdueCount} 筆款項逾期未收！</div>
</div>
)}
<div className="flex justify-between items-center mb-3">
<span className="text-sm text-stone-400">共 {items.length} 份收款計畫</span>
<button onClick={()=>open()} className="text-xs bg-stone-800 text-white px-3 py-1.5 rounded-lg">＋ 新增收款</button>
</div>
{items.length===0&&<div className="text-center text-stone-400 py-12 text-sm">尚無收款計畫</div>}
{items.map(contract=>{
const collected=contract.stages.filter(s=>s.status==="已收").reduce((s,x)=>s+Number(x.amount||0),0);
const total=Number(contract.totalAmount||0);
const pct=total>0?Math.round(collected/total*100):0;
const hasOverdue=contract.stages.some(s=>s.status!=="已收"&&s.dueDate&&new Date(s.dueDate)<today);
return(
<div key={contract.id} className={"bg-white rounded-2xl p-4 shadow-sm border "+(hasOverdue?"border-red-200":"border-stone-100")}>
<div className="flex justify-between items-start mb-2">
<div>
<div className="font-semibold text-stone-800 text-sm">{contract.project}</div>
{contract.client&&<div className="text-xs text-stone-400">{contract.client}</div>}
</div>
<div className="text-right">
<div className="text-xs text-stone-400">已收</div>
<div className="text-sm font-bold text-emerald-600">{pct}%</div>
</div>
</div>
{total>0&&<div className="text-xs text-stone-500 mb-2">合約總額：NT${total.toLocaleString()}</div>}
<div className="bg-stone-100 rounded-full h-2 mb-3">
<div className="bg-emerald-500 h-2 rounded-full" style={{width:(pct)+"%" }}></div>
</div>
<div className="space-y-2">
{contract.stages.map((stage,i)=>{
const isOverdue=stage.status!=="已收"&&stage.dueDate&&new Date(stage.dueDate)<today;
return(
<div key={i} className={"flex items-center gap-2 rounded-xl p-2 "+(isOverdue?"bg-red-50":stage.status==="已收"?"bg-emerald-50":"bg-stone-50")}>
<button onClick={()=>toggleStage(contract.id,i)} className={"w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-[10px] "+(stage.status==="已收"?"bg-emerald-500 border-emerald-500 text-white":"border-stone-300")}>{stage.status==="已收"?"✓":""}</button>
<div className="flex-1 min-w-0">
<div className={"text-xs font-medium "+(isOverdue?"text-red-600":stage.status==="已收"?"text-emerald-600":"text-stone-700")}>{stage.name}</div>
{stage.dueDate&&<div className={"text-[10px] "+(isOverdue?"text-red-400":"text-stone-400")}>{isOverdue?"⚠️ 逾期 ":"到期："}{stage.dueDate}</div>}
{stage.paidDate&&<div className="text-[10px] text-emerald-400">收款：{stage.paidDate}</div>}
</div>
<div className="text-xs font-semibold text-stone-700">NT${Number(stage.amount||0).toLocaleString()}</div>
</div>
);
})}
</div>
<div className="flex gap-2 mt-3 pt-3 border-t border-stone-50">
<button onClick={()=>open(contract)} className="flex-1 text-xs text-stone-500 py-1.5 rounded-lg bg-stone-50">✏️ 編輯</button>
<button onClick={()=>setItems(p=>p.filter(i=>i.id!==contract.id))} className="flex-1 text-xs text-red-400 py-1.5 rounded-lg bg-red-50">🗑 刪除</button>
</div>
</div>
);
})}
{modal&&<Modal title={edit?"編輯收款計畫":"新增收款計畫"} onClose={()=>setModal(false)}>
<div className="space-y-3">
<Sel label="所屬專案 *" options={["",...getProjectList()]} value={form.project} onChange={e=>setForm({...form,project:e.target.value})}/>
<Inp label="客戶" value={form.client} onChange={e=>setForm({...form,client:e.target.value})}/>
<Inp label="合約總額" type="number" placeholder="NT$" value={form.totalAmount} onChange={e=>setForm({...form,totalAmount:e.target.value})}/>
<div className="text-xs text-stone-400 font-medium mt-2">收款階段</div>
{form.stages.map((stage,i)=>(
<div key={i} className="bg-stone-50 rounded-xl p-3 space-y-2">
<div className="flex justify-between items-center">
<input className="text-xs font-medium text-stone-700 bg-transparent border-none outline-none w-24" value={stage.name} onChange={e=>setForm(f=>({...f,stages:f.stages.map((s,j)=>j===i?{...s,name:e.target.value}:s)}))}/>
<button onClick={()=>setForm(f=>({...f,stages:f.stages.filter((_,j)=>j!==i)}))} className="text-red-300 text-xs">✕</button>
</div>
<div className="grid grid-cols-2 gap-2">
<Inp label="金額" type="number" value={stage.amount} onChange={e=>setForm(f=>({...f,stages:f.stages.map((s,j)=>j===i?{...s,amount:e.target.value}:s)}))}/>
<Inp label="到期日" type="date" value={stage.dueDate} onChange={e=>setForm(f=>({...f,stages:f.stages.map((s,j)=>j===i?{...s,dueDate:e.target.value}:s)}))}/>
</div>
</div>
))}
<button onClick={()=>setForm(f=>({...f,stages:[...f.stages,{name:"第"+(f.stages.length+1)+"期",percent:0,amount:"",dueDate:"",status:"未收",paidDate:""}]}))} className="w-full text-xs text-stone-400 border border-dashed border-stone-200 rounded-xl py-2">＋ 新增階段</button>
<Txt label="備註" value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/>
</div>
<Btn onClick={save}/>
</Modal>}
</>
);
}



// ─── Dark Mode ────────────────────────────────────────────────────

// ─── Global Search ────────────────────────────────────────────────
function GlobalSearch({ allData, setActiveId, onClose }) {
const [query, setQuery] = useState("");
const inputRef = React.useRef(null);

React.useEffect(() => { inputRef.current?.focus(); }, []);

const results = React.useMemo(() => {
if (!query.trim() || query.length < 1) return [];
const q = query.toLowerCase();
const found = [];

const search = (items, type, icon, getLabel, getDetail, pageId) => {
if (!Array.isArray(items)) return;
items.forEach(item => {
const label = getLabel(item) || "";
const detail = getDetail(item) || "";
if (label.toLowerCase().includes(q) || detail.toLowerCase().includes(q)) {
found.push({ id: item.id, type, icon, label, detail, pageId });
}
});
};

search(allData.tasks, "任務", "📋", i=>i.title, i=>i.project, "tasks");
search(allData.projects, "專案", "🏠", i=>i.name, i=>i.client, "projects");
search(allData.clients, "客戶", "👥", i=>i.name, i=>i.phone, "clients");
search(allData.workers, "師傅", "👷", i=>i.name, i=>i.trade, "workers");
search(allData.suppliers,"廠商", "🏢", i=>i.name, i=>i.category, "suppliers");
search(allData.quotes, "報價", "💰", i=>i.project, i=>i.total, "quotes");
search(allData.contracts,"合約", "📄", i=>i.project, i=>i.client, "contracts");
search(allData.ledger, "帳本", "📒", i=>i.category,i=>"NT$"+i.amount, "ledger");
search(allData.knowledge,"文件", "📚", i=>i.title, i=>i.category, "knowledge");
search(allData.caselibrary,"案例","⭐", i=>i.name, i=>i.style, "caselibrary");
search(allData.schedule, "排程", "🗓", i=>i.title, i=>i.project, "schedule");
search(allData.inquiries,"諮詢", "📝", i=>i.name, i=>i.phone, "inquiries");

return found.slice(0, 20);
}, [query, allData]);

const dark = false;

return (
<div className="fixed inset-0 z-50 flex flex-col" style={{maxWidth:430,margin:"0 auto"}}>
<div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
<div className={"relative mt-12 rounded-t-3xl flex-1 flex flex-col shadow-2xl "+(dark?"bg-stone-900":"bg-white")}>
<div className={"px-4 pt-4 pb-2 border-b "+(dark?"border-stone-700":"border-stone-100")}>
<div className="flex items-center gap-3">
<span className="text-stone-400 text-lg">🔍</span>
<input ref={inputRef}
className={"flex-1 text-base focus:outline-none bg-transparent "+(dark?"text-white placeholder-stone-500":"text-stone-800")}
placeholder="搜尋任務、客戶、專案、師傅..."
value={query} onChange={e=>setQuery(e.target.value)}
spellCheck={false} autoCorrect="off"/>
<button onClick={onClose} className="text-stone-400 text-xl">✕</button>
</div>
</div>
<div className="flex-1 overflow-y-auto p-3">
{query && results.length === 0 && (
<div className="text-center text-stone-400 py-12 text-sm">找不到「{query}」相關資料</div>
)}
{!query && (
<div className="text-center text-stone-400 py-12 text-sm">輸入關鍵字開始搜尋</div>
)}
{results.map((r, i) => (
<button key={i} onClick={() => { setActiveId(r.pageId); onClose(); }}
className={"w-full flex items-center gap-3 rounded-xl px-3 py-3 mb-1 text-left transition-colors "+(dark?"hover:bg-stone-800":"hover:bg-stone-50")}>
<span className="text-xl flex-shrink-0">{r.icon}</span>
<div className="flex-1 min-w-0">
<div className={"text-sm font-medium truncate "+(dark?"text-white":"text-stone-800")}>{r.label}</div>
{r.detail && <div className="text-xs text-stone-400 truncate">{r.detail}</div>}
</div>
<Badge color="gray">{r.type}</Badge>
</button>
))}
</div>
</div>
</div>
);
}

// ─── Quick Actions ────────────────────────────────────────────────
function QuickActions({ tasks, setTasks, ledger, setLedger, attendance, setAttendance, setActiveId, onClose }) {
const [mode, setMode] = useState(null);
const [taskForm, setTaskForm] = useState({title:"",priority:"高",due:""});
const [ledgerForm, setLedgerForm] = useState({type:"收入",amount:"",category:"工程款",date:new Date().toISOString().split("T")[0]});
const dark = false;

const todayStr = new Date().toLocaleDateString("zh-TW");
const todayRec = attendance.find(a=>a.date===todayStr);

const clockIn = () => {
const t = new Date().toLocaleTimeString("zh-TW",{hour:"2-digit",minute:"2-digit"});
if (todayRec) setAttendance(p=>p.map(a=>a.date===todayStr?{...a,clockIn:t}:a));
else setAttendance(p=>[{id:Date.now(),date:todayStr,clockIn:t,clockOut:"",hours:""},...p]);
onClose();
};
const clockOut = () => {
const t = new Date().toLocaleTimeString("zh-TW",{hour:"2-digit",minute:"2-digit"});
if (todayRec?.clockIn) {
const [ih,im]=todayRec.clockIn.split(":").map(Number);
const [oh,om]=t.split(":").map(Number);
const hrs=((oh*60+om)-(ih*60+im))/60;
setAttendance(p=>p.map(a=>a.date===todayStr?{...a,clockOut:t,hours:hrs.toFixed(1)+"h"}:a));
}
onClose();
};
const addTask = () => {
if (!taskForm.title.trim()) return;
setTasks(p=>[{...taskForm,id:Date.now(),done:false,project:""},...p]);
onClose();
};
const addLedger = () => {
if (!ledgerForm.amount) return;
setLedger(p=>[{...ledgerForm,id:Date.now()},...p]);
onClose();
};

const bg = dark ? "bg-stone-900" : "bg-white";
const text = dark ? "text-white" : "text-stone-800";
const sub = dark ? "text-stone-400" : "text-stone-500";
const border = dark ? "border-stone-700" : "border-stone-100";

const actions = [
{ icon:"✅", label:"新增任務", color:"bg-blue-500", onClick:()=>setMode("task") },
{ icon:"📒", label:"記帳", color:"bg-emerald-500", onClick:()=>setMode("ledger") },
{ icon: todayRec?.clockIn?"🔴":"🟢", label: todayRec?.clockIn?(todayRec?.clockOut?"已打卡":"下班打卡"):"上班打卡",
color: todayRec?.clockIn?"bg-red-500":"bg-stone-800",
onClick: todayRec?.clockIn&&!todayRec?.clockOut ? clockOut : clockIn },
{ icon:"📊", label:"儀表板", color:"bg-purple-500", onClick:()=>{ setActiveId("visualdash"); onClose(); } },
{ icon:"🗓", label:"智慧排程", color:"bg-amber-500", onClick:()=>{ setActiveId("schedule"); onClose(); } },
{ icon:"👥", label:"客戶管理", color:"bg-pink-500", onClick:()=>{ setActiveId("clients"); onClose(); } },
];

return (
<div className="fixed inset-0 z-50 flex items-end justify-center" style={{maxWidth:430,margin:"0 auto"}}>
<div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
<div className={"relative w-full rounded-t-3xl p-5 shadow-2xl "+(bg)}>
<div className={"flex justify-between items-center mb-4 "+(text)}>
<span className="text-base font-semibold">快速操作</span>
<button onClick={onClose} className="text-stone-400 text-xl">✕</button>
</div>

{!mode && (
<div className="grid grid-cols-3 gap-3 mb-4">
{actions.map((a,i)=>(
<button key={i} onClick={a.onClick}
className="flex flex-col items-center gap-2 rounded-2xl p-4 bg-stone-50 dark:bg-stone-800 hover:scale-105 transition-transform">
<div className={"w-12 h-12 "+(a.color)+" rounded-2xl flex items-center justify-center text-2xl"}>{a.icon}</div>
<span className={"text-xs font-medium "+(sub)}>{a.label}</span>
</button>
))}
</div>
)}

{mode === "task" && (
<div className="space-y-3 mb-4">
<div className={"text-sm font-medium "+(text)+" flex items-center gap-2"}>
<button onClick={()=>setMode(null)} className="text-stone-400">‹</button> 快速新增任務
</div>
<input className={"w-full border "+(border)+" rounded-xl px-3 py-3 text-sm focus:outline-none bg-transparent "+(text)}
placeholder="任務名稱" value={taskForm.title} onChange={e=>setTaskForm({...taskForm,title:e.target.value})}
spellCheck={false} autoCorrect="off" autoFocus/>
<div className="grid grid-cols-2 gap-3">
<select className={"border "+(border)+" rounded-xl px-3 py-2.5 text-sm bg-transparent "+(text)+" focus:outline-none"}
value={taskForm.priority} onChange={e=>setTaskForm({...taskForm,priority:e.target.value})}>
{["高","中","低"].map(p=><option key={p} value={p}>{p}優先</option>)}
</select>
<input type="date" className={"border "+(border)+" rounded-xl px-3 py-2.5 text-sm bg-transparent "+(text)+" focus:outline-none"}
value={taskForm.due} onChange={e=>setTaskForm({...taskForm,due:e.target.value})}/>
</div>
<button onClick={addTask} className="w-full bg-blue-500 text-white rounded-xl py-3 text-sm font-medium">新增任務</button>
</div>
)}

{mode === "ledger" && (
<div className="space-y-3 mb-4">
<div className={"text-sm font-medium "+(text)+" flex items-center gap-2"}>
<button onClick={()=>setMode(null)} className="text-stone-400">‹</button> 快速記帳
</div>
<div className="grid grid-cols-2 gap-3">
<select className={"border "+(border)+" rounded-xl px-3 py-2.5 text-sm bg-transparent "+(text)+" focus:outline-none"}
value={ledgerForm.type} onChange={e=>setLedgerForm({...ledgerForm,type:e.target.value})}>
<option value="收入">收入</option><option value="支出">支出</option>
</select>
<select className={"border "+(border)+" rounded-xl px-3 py-2.5 text-sm bg-transparent "+(text)+" focus:outline-none"}
value={ledgerForm.category} onChange={e=>setLedgerForm({...ledgerForm,category:e.target.value})}>
{["工程款","設計費","材料費","人工費","管銷費","其他"].map(c=><option key={c}>{c}</option>)}
</select>
</div>
<input type="number" className={"w-full border "+(border)+" rounded-xl px-3 py-3 text-sm focus:outline-none bg-transparent "+(text)}
placeholder="金額 NT$" value={ledgerForm.amount} onChange={e=>setLedgerForm({...ledgerForm,amount:e.target.value})} autoFocus/>
<button onClick={addLedger} className="w-full bg-emerald-500 text-white rounded-xl py-3 text-sm font-medium">記帳</button>
</div>
)}
</div>
</div>
);
}

// ─── Data Export ──────────────────────────────────────────────────
function DataExport({ allData }) {
const [exporting, setExporting] = useState(null);
const dark = false;

const toCSV = (rows, headers) => {
const escape = v => { const s = String(v||""); return '"' + s.split('"').join('""') + '"'; };
return [headers.join(","), ...rows.map(r=>headers.map(h=>escape(r[h]||"")).join(","))].join("\n");
};

const download = (filename, content) => {
const BOM = "\uFEFF";
const blob = new Blob([BOM+content], {type:"text/csv;charset=utf-8;"});
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url; a.download = filename; a.click();
URL.revokeObjectURL(url);
};

const exports = [
{ id:"tasks", icon:"📋", label:"所有任務", desc:(allData.tasks?.length||0)+" 筆",
action:()=>{ download("任務.csv", toCSV(allData.tasks||[], ["title","project","priority","due","done"])); }},
{ id:"projects", icon:"🏠", label:"專案總覽", desc:(allData.projects?.length||0)+" 個",
action:()=>{ download("專案.csv", toCSV(allData.projects||[], ["name","client","address","budget","status","progress"])); }},
{ id:"clients", icon:"👥", label:"客戶名單", desc:(allData.clients?.length||0)+" 位",
action:()=>{ download("客戶.csv", toCSV(allData.clients||[], ["name","phone","email","style","budget","status"])); }},
{ id:"ledger", icon:"📒", label:"帳本明細", desc:(allData.ledger?.length||0)+" 筆",
action:()=>{ download("帳本.csv", toCSV(allData.ledger||[], ["date","type","category","project","amount","note"])); }},
{ id:"workers", icon:"👷", label:"師傅通訊錄", desc:(allData.workers?.length||0)+" 位",
action:()=>{ download("師傅.csv", toCSV(allData.workers||[], ["name","trade","phone","line","rate","unit","rating"])); }},
{ id:"attendance", icon:"⏱", label:"出勤記錄", desc:(allData.attendance?.length||0)+" 筆",
action:()=>{ download("出勤.csv", toCSV(allData.attendance||[], ["date","clockIn","clockOut","hours"])); }},
{ id:"suppliers", icon:"🏢", label:"廠商名單", desc:(allData.suppliers?.length||0)+" 家",
action:()=>{ download("廠商.csv", toCSV(allData.suppliers||[], ["name","category","contact","phone","paymentTerm","leadTime","rating"])); }},
{ id:"quotes", icon:"💰", label:"報價單", desc:(allData.quotes?.length||0)+" 筆",
action:()=>{ download("報價單.csv", toCSV(allData.quotes||[], ["project","client","total","date","status"])); }},
];

const exportAll = async () => {
setExporting("all");
for (const exp of exports) { exp.action(); await new Promise(r=>setTimeout(r,300)); }
setExporting(null);
};

return (
<div className="space-y-3">
<div className={"rounded-2xl p-4 "+(dark?"bg-stone-800 text-white":"bg-stone-800 text-white")}>
<div className="text-xs opacity-60 mb-1">資料匯出</div>
<div className="text-sm opacity-80">將資料匯出為 CSV 格式，可用 Excel 開啟</div>
</div>
<div className="space-y-2">
{exports.map(exp=>(
<div key={exp.id} className={"rounded-2xl p-4 border shadow-sm flex items-center gap-3 "+(dark?"bg-stone-800 border-stone-700":"bg-white border-stone-100")}>
<span className="text-2xl">{exp.icon}</span>
<div className="flex-1">
<div className={"text-sm font-medium "+(dark?"text-white":"text-stone-800")}>{exp.label}</div>
<div className="text-xs text-stone-400">{exp.desc}</div>
</div>
<button onClick={()=>{setExporting(exp.id);exp.action();setTimeout(()=>setExporting(null),1000);}}
className={"px-4 py-2 rounded-xl text-xs font-medium transition-colors "+(exporting===exp.id?"bg-emerald-500 text-white":"bg-stone-800 text-white")}>
{exporting===exp.id?"✓ 匯出":"匯出"}
</button>
</div>
))}
</div>
<button onClick={exportAll} className={"w-full rounded-xl py-3 text-sm font-medium "+(exporting==="all"?"bg-emerald-500 text-white":"bg-stone-800 text-white")}>
{exporting==="all"?"正在匯出...":"⬇️ 一次匯出所有資料"}
</button>
<div className="text-xs text-stone-400 text-center">CSV 格式可直接用 Excel 或 Numbers 開啟</div>
</div>
);
}


// ─── Notification System ─────────────────────────────────────────
function useNotifications(tasks, projects, inventory, tracking, leave, overtime, acceptance, pending, quotes) {
const today = new Date();
const notes = [];
tasks.filter(t => !t.done && t.due).forEach(t => {
const due = new Date(t.due);
if (due < today) notes.push({ type: "warning", category: "任務逾期", text: "「"+t.title+"」已逾期", id: "task-"+t.id });
else if ((due - today) / 86400000 <= 1) notes.push({ type: "info", category: "任務提醒", text: "「"+t.title+"」今日截止", id: "task-due-"+t.id });
});
inventory.filter(i => Number(i.qty||0) <= Number(i.minQty||0)).forEach(i => {
notes.push({ type: "warning", category: "庫存不足", text: "「"+i.name+"」庫存剩 "+i.qty+" "+i.unit, id: "inv-"+i.id });
});
tracking.filter(i => i.status === "延誤").forEach(i => {
notes.push({ type: "warning", category: "備料延誤", text: "「"+i.material+"」備料延誤", id: "track-"+i.id });
});
leave.filter(i => i.status === "待審").forEach(i => {
notes.push({ type: "info", category: "假單待審", text: i.name+" 申請 "+i.type+" 待審核", id: "leave-"+i.id });
});
overtime.filter(i => i.status === "待審").forEach(i => {
notes.push({ type: "info", category: "加班待審", text: i.name+" 加班申請待審核", id: "ot-"+i.id });
});
acceptance.filter(i => i.status === "待驗收").forEach(i => {
notes.push({ type: "info", category: "待驗收", text: "「"+i.project+"」等待驗收", id: "acc-"+i.id });
});
pending.filter(i => i.status === "待確認").forEach(i => {
notes.push({ type: "warning", category: "待客戶確認", text: "「"+i.project+"」"+i.type+"待客戶確認", id: "pend-"+i.id });
});
quotes.filter(i => i.validUntil && i.status !== "已核准").forEach(i => {
const exp = new Date(i.validUntil);
const diff = (exp - today) / 86400000;
if (diff >= 0 && diff <= 3) notes.push({ type: "warning", category: "報價即將到期", text: "「"+i.project+"」報價 "+Math.ceil(diff)+" 天後到期", id: "quote-"+i.id });
});
return notes;
}

function NotificationPanel({ notifications, onClose, onClearAll }) {
const typeColor = { warning: "bg-amber-50 border-amber-200 text-amber-800", info: "bg-blue-50 border-blue-200 text-blue-800" };
const typeIcon = { warning: "⚠️", info: "ℹ️" };
return (
<div className="fixed inset-0 z-50 flex flex-col" style={{maxWidth:430,margin:"0 auto"}}>
<div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
<div className="relative mt-16 bg-white rounded-t-3xl flex-1 overflow-y-auto shadow-2xl">
<div className="sticky top-0 bg-white px-5 pt-5 pb-3 border-b border-stone-100 flex justify-between items-center">
<div><h2 className="text-base font-semibold text-stone-800">通知中心</h2><div className="text-xs text-stone-400">{notifications.length} 則通知</div></div>
<div className="flex gap-2">
{notifications.length > 0 && <button onClick={onClearAll} className="text-xs text-red-400 px-3 py-1.5 rounded-lg bg-red-50">全部清除</button>}
<button onClick={onClose} className="text-stone-400 text-xl w-8 h-8 flex items-center justify-center">✕</button>
</div>
</div>
<div className="p-4 space-y-2">
{notifications.length === 0 && <div className="text-center py-16"><div className="text-4xl mb-3">🎉</div><div className="text-stone-400 text-sm">目前沒有通知</div></div>}
{notifications.map(n => (
<div key={n.id} className={"flex items-start gap-3 rounded-xl px-4 py-3 text-sm border "+(typeColor[n.type])}>
<span className="flex-shrink-0 mt-0.5">{typeIcon[n.type]}</span>
<div><div className="font-medium text-xs mb-0.5">{n.category}</div><div>{n.text}</div></div>
</div>
))}
</div>
<div className="h-8"></div>
</div>
</div>
);
}

function SettingsSection({ title, icon, children, defaultOpen=false }) {
const [open, setOpen] = useState(defaultOpen);
return (
<div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
<button onClick={()=>setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3.5">
<div className="flex items-center gap-2"><span className="text-base">{icon}</span><span className="text-sm font-semibold text-stone-700">{title}</span></div>
<span className={"text-stone-400 text-xs "+(open?"rotate-180":"")}>▼</span>
</button>
{open && <div className="px-4 pb-4 border-t border-stone-50">{children}</div>}
</div>
);
}


// ─── Multi-Role Permission System ────────────────────────────────
const ROLES = {
owner: {
label: "老闆",
icon: "👔",
color: "bg-stone-800 text-white",
pages: "all", // can access everything
},
designer: {
label: "設計師",
icon: "🎨",
color: "bg-purple-600 text-white",
pages: ["dashboard","tasks","appointments","clients","schedule",
"inquiries","projects","album","contracts","quotes","quickquote",
"inspection","acceptance","pending","knowledge","lighting","design",
"tiles","reports","palette","gantt","comms","reminders","clientprogress",
"pricecompare","estimator","caselibrary","workers","sitemap","checklist"],
},
assistant: {
label: "助理",
icon: "📋",
color: "bg-blue-600 text-white",
pages: ["dashboard","tasks","appointments","schedule",
"inquiries","projects","album","inspection","acceptance","pending",
"attendance","leave","overtime","materials","inventory","tracking",
"purchase","expense","checklist","paymenttrack","sitemap"],
},
worker: {
label: "工班",
icon: "👷",
color: "bg-amber-600 text-white",
pages: ["dashboard","tasks","schedule","projects","inspection","attendance","sitemap"],
},
};

// ─── Site Map ─────────────────────────────────────────────────────
function SiteMap({ projects }) {
const [selected, setSelected] = useState(null);

const getMapUrl = (address) => {
const encoded = encodeURIComponent(address);
return "https://maps.google.com/maps?q="+encoded+"&output=embed&z=15";
};
const getDirectionUrl = (address) => {
const encoded = encodeURIComponent(address);
return "https://www.google.com/maps/search/?api=1&query="+encoded;
};

return (
<div className="space-y-3">
{projects.filter(p=>p.address).length === 0 && (
<div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700">
⚠️ 尚無專案設定地址，請先到「專案總覽」為各專案填入地址。
</div>
)}
{projects.map(p => (
<button key={p.id} onClick={() => setSelected(selected?.id === p.id ? null : p)}
className={"w-full text-left rounded-2xl p-4 border shadow-sm transition-all "+(selected?.id === p.id ? "border-stone-800 bg-stone-50" : "border-stone-100 bg-white")}>
<div className="flex justify-between items-start">
<div className="flex-1 min-w-0">
<div className="font-semibold text-stone-800 text-sm truncate">{p.name}</div>
<div className="text-xs text-stone-400 mt-0.5">{p.address || "📍 尚未設定地址"}</div>
</div>
<Badge color={{施工中:"blue",設計中:"yellow",驗收中:"green",完工:"green",報價中:"gray"}[p.status]||"gray"}>{p.status}</Badge>
</div>
{selected?.id === p.id && p.address && (
<div className="mt-3 space-y-2" onClick={e=>e.stopPropagation()}>
<iframe src={getMapUrl(p.address)} width="100%" height="200"
className="rounded-xl border border-stone-200" loading="lazy"
referrerPolicy="no-referrer-when-downgrade" title={p.name}></iframe>
<a href={getDirectionUrl(p.address)} target="_blank" rel="noreferrer"
className="flex items-center justify-center gap-2 w-full bg-stone-800 text-white rounded-xl py-2.5 text-sm font-medium">
🗺 在 Google Maps 開啟導航
</a>
</div>
)}
{selected?.id === p.id && !p.address && (
<div className="mt-2 text-xs text-stone-400">請先在專案總覽填入地址</div>
)}
</button>
))}
{projects.length === 0 && <div className="text-center text-stone-400 py-12 text-sm">尚無專案資料</div>}
</div>
);
}

// ─── Role Login Screen ────────────────────────────────────────────
function RoleLoginScreen({ onLogin, passwords, roles }) {
const displayRoles = roles || ROLES;
const [selectedRole, setSelectedRole] = useState(null);
const [input, setInput] = useState("");
const [error, setError] = useState(false);
const [showPw, setShowPw] = useState(false);

const tryLogin = () => {
if (!selectedRole) return;
const correctPw = passwords[selectedRole] || (selectedRole === "owner" ? "1234" : selectedRole);
if (input === correctPw) {
onLogin(selectedRole);
setInput("");
setError(false);
} else {
setError(true);
setInput("");
setTimeout(() => setError(false), 1500);
}
};

return (
<div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-6 py-12" style={{maxWidth:430,margin:"0 auto"}}>
<div className="text-4xl mb-3">🏗️</div>
<div className="text-xl font-bold text-stone-800 mb-1">工程管理系統</div>
<div className="text-sm text-stone-400 mb-8">請選擇您的身份登入</div>

{!selectedRole ? (
<div className="w-full space-y-3">
{Object.entries(ROLES).map(([key, role]) => (
<button key={key} onClick={() => setSelectedRole(key)}
className="w-full bg-white border border-stone-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:border-stone-400 transition-colors">
<div className={"w-12 h-12 rounded-xl flex items-center justify-center text-2xl "+(role.color)}>
{role.icon}
</div>
<div className="text-left">
<div className="font-semibold text-stone-800">{role.label}</div>
<div className="text-xs text-stone-400">
{key === "owner" ? "完整存取所有功能" :
key === "designer" ? "設計與專案相關功能" :
key === "assistant" ? "行政與庶務功能" : "施工與打卡功能"}
</div>
</div>
<span className="ml-auto text-stone-300">›</span>
</button>
))}
</div>
) : (
<div className="w-full space-y-4">
<button onClick={() => { setSelectedRole(null); setInput(""); }} className="flex items-center gap-2 text-sm text-stone-400">
‹ 返回選擇身份
</button>
<div className={"rounded-2xl p-4 flex items-center gap-3 "+(ROLES[selectedRole].color)}>
<span className="text-2xl">{ROLES[selectedRole].icon}</span>
<div>
<div className="font-semibold">{ROLES[selectedRole].label}</div>
<div className="text-xs opacity-70">請輸入密碼</div>
</div>
</div>
<div className="relative">
<input
type={showPw ? "text" : "password"}
className={"w-full border-2 rounded-2xl px-4 py-4 text-center text-lg tracking-widest focus:outline-none transition-colors "+(error ? "border-red-400 bg-red-50" : "border-stone-200 focus:border-stone-400")}
placeholder="輸入密碼"
value={input}
onChange={e => setInput(e.target.value)}
onKeyDown={e => e.key === "Enter" && tryLogin()}
autoFocus/>
<button onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm">
{showPw ? "隱藏" : "顯示"}
</button>
</div>
{error && <div className="text-center text-red-500 text-sm font-medium">密碼錯誤，請再試一次</div>}
<button onClick={tryLogin} className="w-full bg-stone-800 text-white rounded-2xl py-4 font-medium text-sm">
登入
</button>
<div className="text-xs text-stone-300 text-center">
{selectedRole === "owner" ? "預設密碼：1234" :
selectedRole === "designer" ? "預設密碼：designer" :
selectedRole === "assistant" ? "預設密碼：assistant" : "預設密碼：worker"}
</div>
</div>
)}
</div>
);
}


// ─── Role Permission Editor ───────────────────────────────────────
const ALL_PAGES = [
{ id:"dashboard", label:"工作面板", group:"主要" },
{ id:"tasks", label:"所有任務", group:"主要" },
{ id:"appointments", label:"預約總覽", group:"主要" },
{ id:"clients", label:"客戶管理", group:"客戶與排程" },
{ id:"schedule", label:"智慧排程", group:"客戶與排程" },
{ id:"inquiries", label:"諮詢單管理", group:"專案管理" },
{ id:"projects", label:"專案總覽", group:"專案管理" },
{ id:"album", label:"專案相簿", group:"專案管理" },
{ id:"contracts", label:"合約管理", group:"專案管理" },
{ id:"quotes", label:"報價單", group:"專案管理" },
{ id:"quickquote", label:"初步報價", group:"專案管理" },
{ id:"inspection", label:"工程檢核", group:"專案管理" },
{ id:"acceptance", label:"工程驗收", group:"專案管理" },
{ id:"pending", label:"待客戶確認", group:"專案管理" },
{ id:"knowledge", label:"知識文件庫", group:"專案管理" },
{ id:"lighting", label:"燈光設計", group:"工具" },
{ id:"design", label:"設計提案", group:"工具" },
{ id:"tiles", label:"磁磚計算", group:"工具" },
{ id:"reports", label:"報表輸出", group:"工具" },
{ id:"palette", label:"色板管理", group:"工具" },
{ id:"gantt", label:"工程進度圖", group:"工具" },
{ id:"estimator", label:"估價計算機", group:"估價與案例" },
{ id:"pricecompare", label:"材料比價", group:"估價與案例" },
{ id:"caselibrary", label:"完工案例庫", group:"估價與案例" },
{ id:"ledger", label:"公司帳本", group:"財務管理" },
{ id:"purchase", label:"採購申請單", group:"財務管理" },
{ id:"expense", label:"報銷申請", group:"財務管理" },
{ id:"payroll", label:"薪資計算", group:"財務管理" },
{ id:"monthly", label:"月度支出", group:"財務管理" },
{ id:"paymenttrack", label:"收款追蹤", group:"財務管理" },
{ id:"attendance", label:"出勤記錄", group:"人事管理" },
{ id:"leave", label:"假單管理", group:"人事管理" },
{ id:"overtime", label:"加班申請", group:"人事管理" },
{ id:"materials", label:"建材庫", group:"材料資源" },
{ id:"inventory", label:"物料庫存", group:"材料資源" },
{ id:"tracking", label:"備料追蹤", group:"材料資源" },
{ id:"workers", label:"師傅通訊錄", group:"客戶服務" },
{ id:"comms", label:"客戶溝通紀錄", group:"客戶服務" },
{ id:"reminders", label:"生日/週年提醒", group:"客戶服務" },
{ id:"clientprogress", label:"客戶進度頁", group:"客戶服務" },
{ id:"visualdash", label:"視覺化儀表板", group:"分析與管理" },
{ id:"sitemap", label:"工地地圖", group:"分析與管理" },
{ id:"suppliers", label:"廠商管理", group:"分析與管理" },
{ id:"checklist", label:"標準工程清單", group:"分析與管理" },
{ id:"losses", label:"異常損失", group:"經營分析" },
{ id:"settings", label:"系統設定", group:"系統" },
];

const PAGE_GROUPS = [...new Set(ALL_PAGES.map(p=>p.group))];

function RolePermissionEditor({ rolePasswords, setRolePasswords, externalCustomRoles, setExternalCustomRoles }) {
const [localCustomRoles, setLocalCustomRoles] = useLocalStorage("customRoles", null);
const customRoles = externalCustomRoles !== undefined ? externalCustomRoles : localCustomRoles;
const setCustomRoles = setExternalCustomRoles || setLocalCustomRoles;
const [editRole, setEditRole] = useState(null);
const [newRoleName, setNewRoleName] = useState("");
const [newRoleIcon, setNewRoleIcon] = useState("👤");
const [saved, setSaved] = useState(false);

// Merge default ROLES with custom overrides
const effectiveRoles = customRoles || Object.fromEntries(
Object.entries(ROLES).map(([k,v])=>[k,{
label: v.label,
icon: v.icon,
pages: v.pages === "all" ? ALL_PAGES.map(p=>p.id) : v.pages
}])
);

const togglePage = (roleKey, pageId) => {
setCustomRoles(prev => {
const roles = prev || effectiveRoles;
const role = roles[roleKey];
const pages = Array.isArray(role.pages) ? role.pages : ALL_PAGES.map(p=>p.id);
const newPages = pages.includes(pageId)
? pages.filter(p=>p!==pageId)
: [...pages, pageId];
return { ...roles, [roleKey]: { ...role, pages: newPages } };
});
};

const toggleGroup = (roleKey, group) => {
const groupPages = ALL_PAGES.filter(p=>p.group===group).map(p=>p.id);
const role = effectiveRoles[roleKey];
const pages = Array.isArray(role.pages) ? role.pages : ALL_PAGES.map(p=>p.id);
const allOn = groupPages.every(p=>pages.includes(p));
setCustomRoles(prev => {
const roles = prev || effectiveRoles;
const newPages = allOn
? pages.filter(p=>!groupPages.includes(p))
: [...new Set([...pages, ...groupPages])];
return { ...roles, [roleKey]: { ...role, pages: newPages } };
});
};

const selectAll = (roleKey) => {
setCustomRoles(prev => ({
...(prev || effectiveRoles),
[roleKey]: { ...effectiveRoles[roleKey], pages: ALL_PAGES.map(p=>p.id) }
}));
};

const clearAll = (roleKey) => {
setCustomRoles(prev => ({
...(prev || effectiveRoles),
[roleKey]: { ...effectiveRoles[roleKey], pages: [] }
}));
};

const addRole = () => {
if (!newRoleName.trim()) return;
const key = "custom_" + Date.now();
setCustomRoles(prev => ({
...(prev || effectiveRoles),
[key]: { label: newRoleName.trim(), icon: newRoleIcon, pages: [] }
}));
setRolePasswords(p => ({ ...p, [key]: "1234" }));
setNewRoleName("");
setNewRoleIcon("👤");
};

const deleteRole = (roleKey) => {
if (roleKey === "owner") { alert("老闆角色不可刪除"); return; }
setCustomRoles(prev => {
const roles = { ...(prev || effectiveRoles) };
delete roles[roleKey];
return roles;
});
setRolePasswords(p => { const n={...p}; delete n[roleKey]; return n; });
};

const saveAll = () => {
setSaved(true);
setTimeout(() => setSaved(false), 2000);
};

return (
<div className="mt-3 space-y-4">
<div className="text-xs text-stone-400">點選角色查看並編輯其可存取的功能頁面</div>

{/* Role tabs */}
<div className="flex flex-wrap gap-2">
{Object.entries(effectiveRoles).map(([key, role]) => (
<button key={key} onClick={() => setEditRole(editRole===key?null:key)}
className={"flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all "+(editRole===key?"bg-stone-800 text-white":"bg-stone-100 text-stone-600")}>
<span>{role.icon}</span><span>{role.label}</span>
<span className="opacity-60">({Array.isArray(role.pages)?role.pages.length:"全部"})</span>
</button>
))}
</div>

{/* Edit panel */}
{editRole && effectiveRoles[editRole] && (
<div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3">
<div className="flex justify-between items-center">
<div className="flex items-center gap-2">
<span className="text-lg">{effectiveRoles[editRole].icon}</span>
<span className="text-sm font-semibold text-stone-800">{effectiveRoles[editRole].label}</span>
<span className="text-xs text-stone-400">
{Array.isArray(effectiveRoles[editRole].pages)
? (effectiveRoles[editRole].pages.length+"｜"+ALL_PAGES.length+" 個功能")
: "全部功能"}
</span>
</div>
<div className="flex gap-2">
<button onClick={()=>selectAll(editRole)} className="text-xs text-blue-500 px-2 py-1 bg-blue-50 rounded-lg">全選</button>
<button onClick={()=>clearAll(editRole)} className="text-xs text-red-400 px-2 py-1 bg-red-50 rounded-lg">全清</button>
{editRole !== "owner" && (
<button onClick={()=>{deleteRole(editRole);setEditRole(null);}} className="text-xs text-red-500 px-2 py-1 bg-red-50 rounded-lg">🗑 刪除角色</button>
)}
</div>
</div>

{PAGE_GROUPS.map(group => {
const groupPages = ALL_PAGES.filter(p=>p.group===group);
const rolePages = Array.isArray(effectiveRoles[editRole].pages)
? effectiveRoles[editRole].pages
: ALL_PAGES.map(p=>p.id);
const allOn = groupPages.every(p=>rolePages.includes(p.id));
const someOn = groupPages.some(p=>rolePages.includes(p.id));
return (
<div key={group}>
<div className="flex items-center gap-2 mb-1.5">
<button onClick={()=>toggleGroup(editRole,group)}
className={"w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center text-[10px] "+(allOn?"bg-stone-800 border-stone-800 text-white":someOn?"bg-stone-400 border-stone-400 text-white":"border-stone-300")}>
{allOn?"✓":someOn?"—":""}
</button>
<span className="text-xs font-semibold text-stone-500">{group}</span>
</div>
<div className="grid grid-cols-2 gap-1 ml-6">
{groupPages.map(page => {
const on = rolePages.includes(page.id);
return (
<button key={page.id} onClick={()=>togglePage(editRole,page.id)}
className={"flex items-center gap-1.5 text-left rounded-lg px-2 py-1.5 text-xs transition-colors "+(on?"bg-stone-200 text-stone-800":"bg-white text-stone-400 border border-stone-100")}>
<span className={"w-3 h-3 rounded border flex-shrink-0 flex items-center justify-center text-[8px] "+(on?"bg-stone-800 border-stone-800 text-white":"border-stone-300")}>{on?"✓":""}</span>
{page.label}
</button>
);
})}
</div>
</div>
);
})}
</div>
)}

{/* Add new role */}
<div className="bg-white rounded-2xl p-4 border border-stone-100">
<div className="text-xs text-stone-400 mb-3 font-medium">新增自訂角色</div>
<div className="flex gap-2 mb-2">
<input className="w-12 border border-stone-200 rounded-xl px-2 py-2 text-center text-base focus:outline-none"
placeholder="圖示" value={newRoleIcon} onChange={e=>setNewRoleIcon(e.target.value)}/>
<input className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-stone-400"
placeholder="角色名稱，例：工地主任" value={newRoleName} onChange={e=>setNewRoleName(e.target.value)}/>
<button onClick={addRole} className="bg-stone-800 text-white rounded-xl px-3 py-2 text-sm font-medium">新增</button>
</div>
<div className="text-xs text-stone-300">新增後可在上方點選該角色設定可用功能</div>
</div>

<button onClick={saveAll} className={"w-full rounded-xl py-3 text-sm font-medium transition-colors "+(saved?"bg-emerald-600 text-white":"bg-stone-800 text-white")}>
{saved?"✅ 已儲存！":"儲存所有權限設定"}
</button>
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
<div className={"w-16 h-16 rounded-2xl flex items-center justify-center text-3xl "+(error ? "bg-red-100 animate-pulse" : "bg-stone-100")}>
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
className={"w-full border-2 rounded-2xl px-4 py-3.5 text-center text-lg tracking-widest focus:outline-none transition-colors "+(error ? "border-red-400 bg-red-50" : "border-stone-200 focus:border-stone-400")}
placeholder="輸入密碼"
value={input}
onChange={e => setInput(e.target.value)}
onKeyDown={e => e.key === "Enter" && tryUnlock()}
autoFocus/>
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
const [hiddenPages, setHiddenPages] = useLocalStorage("hiddenPages", []);
const [currentRole, setCurrentRole] = useState(() => {
try { return sessionStorage.getItem("currentRole") || null; } catch { return null; }
});
const [customRoles, setCustomRoles] = useLocalStorage("customRoles", null);
const [rolePasswords, setRolePasswords] = useLocalStorage("rolePasswords", {
owner:"1234", designer:"designer", assistant:"assistant", worker:"worker"
});
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
const [palette, setPalette] = useCloudSync("palette", []);
const [workers, setWorkers] = useCloudSync("workers", []);
const [comms, setComms] = useCloudSync("comms", []);
const [reminders, setReminders] = useCloudSync("reminders", []);
const [pricecompare, setPricecompare] = useCloudSync("pricecompare", []);
const [caselibrary, setCaselibrary] = useCloudSync("caselibrary", []);
const [suppliers, setSuppliers] = useCloudSync("suppliers", []);
const [checklist, setChecklist] = useCloudSync("checklist", []);
const [paymenttrack, setPaymenttrack] = useCloudSync("paymenttrack", []);
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
"companyInfo","notifSettings","dismissed_notifs","menuCustom","clients","schedule","album","quickquotes","palette","workers","comms","reminders","pricecompare","caselibrary","suppliers","checklist","paymenttrack","hiddenPages","customRoles","rolePasswords"
].forEach(k=>localStorage.removeItem(k));
window.location.reload();
};

const activeItem=NAV_SECTIONS.flatMap(s=>s.items).find(i=>i.id===activeId);

const renderPage=()=>{
switch(activeId){
case "dashboard": return (<Dashboard tasks={tasks} projects={projects} attendance={attendance} setActiveId={setActiveId}/>);
case "tasks": return (<Tasks tasks={tasks} setTasks={setTasks} projects={projects}/>);
case "quickquote": return (<QuickQuote items={quickquotes} setItems={setQuickquotes}/>);
case "clients": return (<Clients items={clients} setItems={setClients}/>);
case "schedule": return (<Schedule items={schedule} setItems={setSchedule} projects={projects}/>);
case "album": return (<Album items={album} setItems={setAlbum}/>);
case "palette": return (<ColorPalette items={palette} setItems={setPalette}/>);
case "gantt": return (<GanttChart projects={projects} schedules={schedule}/>);
case "workers": return (<Workers items={workers} setItems={setWorkers}/>);
case "comms": return (<ClientComms items={comms} setItems={setComms} clients={clients}/>);
case "reminders": return (<Reminders items={reminders} setItems={setReminders} clients={clients}/>);
case "pricecompare": return (<PriceCompare items={pricecompare} setItems={setPricecompare}/>);
case "estimator": return (<CostEstimator/>);
case "caselibrary": return (<CaseLibrary items={caselibrary} setItems={setCaselibrary}/>);
case "clientprogress": return (<ClientProgress projects={projects} tasks={tasks} album={album} schedule={schedule}/>);
case "visualdash": return (<VisualDashboard projects={projects} tasks={tasks} ledger={ledger} attendance={attendance} payroll={payroll} expense={expense} purchase={purchase} monthly={monthly}/>);
case "suppliers": return (<Suppliers items={suppliers} setItems={setSuppliers}/>);
case "checklist": return (<StandardChecklist items={checklist} setItems={setChecklist}/>);
case "paymenttrack": return (<PaymentTracker items={paymenttrack} setItems={setPaymenttrack} projects={projects} ledger={ledger}/>);
case "sitemap": return (<SiteMap projects={projects}/>);
case "reports": return (<Reports projects={projects} tasks={tasks} ledger={ledger} clients={clients} quotes={quotes} contracts={contracts} attendance={attendance}/>);
case "appointments": return (<Appointments2 items={appointments} setItems={setAppointments} projects={projects}/>);
case "inquiries": return (<Inquiries items={inquiries} setItems={setInquiries}/>);
case "projects": return (<Projects items={projects} setItems={setProjects}/>);
case "contracts": return (<Contracts items={contracts} setItems={setContracts} projects={projects}/>);
case "quotes": return (<Quotes items={quotes} setItems={setQuotes} projects={projects}/>);
case "inspection": return (<Inspection items={inspection} setItems={setInspection} projects={projects}/>);
case "acceptance": return (<Acceptance items={acceptance} setItems={setAcceptance} projects={projects}/>);
case "pending": return (<Pending items={pending} setItems={setPending} projects={projects}/>);
case "knowledge": return (<Knowledge items={knowledge} setItems={setKnowledge}/>);
case "lighting": return (<Lighting items={lighting} setItems={setLighting} projects={projects}/>);
case "design": return (<Design items={design} setItems={setDesign} projects={projects}/>);
case "tiles": return (<TilesCalc/>);
case "ledger": return (<Ledger items={ledger} setItems={setLedger} projects={projects}/>);
case "purchase": return (<Purchase items={purchase} setItems={setPurchase} projects={projects}/>);
case "expense": return (<Expense items={expense} setItems={setExpense} projects={projects}/>);
case "payroll": return (<Payroll items={payroll} setItems={setPayroll}/>);
case "monthly": return (<Monthly items={monthly} setItems={setMonthly}/>);
case "attendance": return (<Attendance items={attendance} setItems={setAttendance}/>);
case "leave": return (<Leave items={leave} setItems={setLeave}/>);
case "overtime": return (<Overtime items={overtime} setItems={setOvertime} projects={projects}/>);
case "materials": return (<Materials items={materials} setItems={setMaterials}/>);
case "inventory": return (<Inventory items={inventory} setItems={setInventory}/>);
case "tracking": return (<Tracking items={tracking} setItems={setTracking} projects={projects}/>);
case "losses": return (<Losses items={losses} setItems={setLosses} projects={projects}/>);
case "settings": return (<Settings onClearAll={clearAll} rolePasswords={rolePasswords} setRolePasswords={setRolePasswords} customRoles={customRoles} setCustomRoles={setCustomRoles} hiddenPages={hiddenPages} setHiddenPages={setHiddenPages} companyInfo={companyInfo} setCompanyInfo={setCompanyInfo} notifSettings={notifSettings} setNotifSettings={setNotifSettings} menuCustom={menuCustom} setMenuCustom={setMenuCustom} appPassword={appPassword} setAppPassword={setAppPassword}/>);
default: return (<div className="text-center text-stone-400 py-16 text-sm">🔧 功能開發中</div>);
}
};

// Handle login
const handleLogin = (role) => {
setCurrentRole(role);
try { sessionStorage.setItem("currentRole", role); } catch {}
setActiveId("dashboard");
};
const handleLogout = () => {
setCurrentRole(null);
try { sessionStorage.removeItem("currentRole"); } catch {}
};

// Check page access
const effectiveRoles = customRoles || Object.fromEntries(
Object.entries(ROLES).map(([k,v])=>[k,{
label: v.label, icon: v.icon,
pages: v.pages === "all" ? ALL_PAGES.map(p=>p.id) : v.pages
}])
);

const canAccess = (pageId) => {
if (!currentRole) return false;
const role = effectiveRoles[currentRole];
if (!role) return false;
if (role.pages === "all") return true;
return Array.isArray(role.pages) && role.pages.includes(pageId);
};

// Filter nav by role
const filteredNav = NAV_SECTIONS.map(section => ({
...section,
items: section.items.filter(item => canAccess(item.id) && !(hiddenPages||[]).includes(item.id))
})).filter(section => section.items.length > 0);

if (!currentRole) return (<RoleLoginScreen onLogin={handleLogin} passwords={rolePasswords} roles={effectiveRoles}/>);

return(
<div style={{fontFamily:"'Noto Sans TC', sans-serif",maxWidth:430,margin:"0 auto",minHeight:"100vh"}} className="bg-stone-50">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<div className="bg-white border-b border-stone-100 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
<button onClick={()=>setSidebarOpen(true)} className="w-9 h-9 flex flex-col justify-center gap-1.5 items-center">
<span className="block w-5 h-0.5 bg-stone-600"></span><span className="block w-5 h-0.5 bg-stone-600"></span><span className="block w-3 h-0.5 bg-stone-600"></span>
</button>
<div className="flex flex-col items-center">
<span className="text-sm font-semibold text-stone-700">{activeItem?(menuCustom[activeItem.id]?.label||activeItem.label):"工作面板"}</span>
{currentRole&&<span className="text-[10px] text-stone-400">{effectiveRoles[currentRole]?.icon} {effectiveRoles[currentRole]?.label}</span>}
</div>
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
<div className="absolute inset-0 bg-black/30" onClick={()=>setSidebarOpen(false)}></div>
<div className="relative z-50 bg-white w-72 h-full overflow-y-auto shadow-2xl">
<div className="px-5 pt-5 pb-2"><div className="text-xs font-semibold tracking-widest text-stone-400">MENU</div></div>
{filteredNav.map((section,si)=>(
<div key={si} className="mb-2">
{section.label!=="DASHBOARD"&&<div className="px-5 pt-4 pb-1 text-xs text-stone-400 tracking-wider">{section.label}</div>}
{section.items.map(item=>(
<button key={item.id} onClick={()=>{ const isProtected = Object.keys(PROTECTED_PAGES).includes(item.id) && !unlockedPages.includes(item.id); if(isProtected){setPendingPageId(item.id);setSidebarOpen(false);}else{setActiveId(item.id);setSidebarOpen(false);}; }}
className={"w-full flex items-center gap-3 px-5 py-3 text-sm text-left "+(activeId===item.id?"bg-stone-100 font-semibold text-stone-900 rounded-xl mx-2 px-3":"text-stone-600 hover:bg-stone-50")}>
<span>{(menuCustom[item.id]?.icon!==undefined?menuCustom[item.id].icon:item.icon)}</span>
<span>{(menuCustom[item.id]?.label!==undefined?menuCustom[item.id].label:item.label)}</span>
{Object.keys(PROTECTED_PAGES).includes(item.id)&&!unlockedPages.includes(item.id)&&<span className="ml-auto text-stone-300 text-xs">🔒</span>}
</button>
))}
</div>
))}
<div className="h-4"></div>
<div className="px-4 pb-4">
<button onClick={()=>{setSidebarOpen(false);handleLogout();}} className="w-full bg-red-50 text-red-500 rounded-xl py-2.5 text-sm font-medium">
🚪 登出（切換身份）
</button>
</div>
</div>
</div>
)}
{pendingPageId ? <LockScreen pageId={pendingPageId} savedPassword={appPassword} onUnlock={(id)=>{setUnlockedPages(p=>[...p,id]);setActiveId(id);setPendingPageId(null);}} onCancel={()=>setPendingPageId(null)}/> : null}
{notifOpen ? <NotificationPanel notifications={notifications} onClose={()=>setNotifOpen(false)} onClearAll={()=>{setDismissed(allNotifs.map(n=>n.id));setNotifOpen(false);}}/> : null}
<div className="px-4 pt-4 pb-24">{renderPage()}</div>

<div className="fixed bottom-0 bg-white border-t border-stone-100 flex items-center justify-around py-2 z-30" style={{maxWidth:430,left:"50%",transform:"translateX(-50%)",width:"100%"}}>
{[{id:"dashboard",icon:"🏠",label:"主頁"},{id:"tasks",icon:"📋",label:"任務"},{id:"projects",icon:"🏠",label:"專案"},{id:"schedule",icon:"🗓",label:"排程"}].map(tab=>{
const customIcon = menuCustom[tab.id]?.icon !== undefined ? menuCustom[tab.id].icon : tab.icon;
const customLabel = menuCustom[tab.id]?.label !== undefined ? menuCustom[tab.id].label.slice(0,4) : tab.label;
const isActive = activeId===tab.id;
const handleTab = ()=>{ const p=Object.keys(PROTECTED_PAGES).includes(tab.id)&&!unlockedPages.includes(tab.id); if(p)setPendingPageId(tab.id); else setActiveId(tab.id); };
return (
<button key={tab.id} onClick={handleTab} className={"flex flex-col items-center gap-0.5 px-4 py-1 "+(isActive?"text-stone-900":"text-stone-400")}>
<span className="text-lg">{customIcon}</span>
<span className="text-xs">{customLabel}</span>
{isActive ? <span className="w-1 h-1 bg-stone-800 rounded-full"></span> : null}
</button>
);
})}
</div>
</div>
);
}