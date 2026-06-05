import { useState, useEffect } from "react";

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
{ label: "專案管理", items: [
{ icon: "📝", label: "諮詢單管理", id: "inquiries" },
{ icon: "🏠", label: "專案總覽", id: "projects" },
{ icon: "📄", label: "合約管理", id: "contracts" },
{ icon: "💰", label: "報價單", id: "quotes" },
{ icon: "🔍", label: "工程檢核", id: "inspection" },
{ icon: "✅", label: "工程驗收", id: "acceptance" },
{ icon: "👤", label: "待客戶確認", id: "pending" },
{ icon: "📚", label: "知識文件庫", id: "knowledge" },
]},
{ label: "工具", items: [
{ icon: "💡", label: "燈光設計", id: "lighting" },
{ icon: "🖥", label: "設計提案", id: "design" },
{ icon: "⊞", label: "磁磚計算", id: "tiles" },
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

const PROJECT_LIST = ["台北大安區 林宅","信義區 陳宅翻修","中山區 王宅","松山區 商辦空間","內湖 科技公司","公司內部"];
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

接收 projectList，若無資料則預設為空陣列
function Tasks({ tasks, setTasks, projectList = [] }) { 
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
      {/* 中間省略項目列表的 render ... */}
      
      {modal&&(
        <Modal title={edit?"編輯任務":"新增任務"} onClose={()=>setModal(false)}>
          <div className="space-y-3">
            <Inp label="任務名稱 *" placeholder="輸入任務名稱" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
            
            {/* 這裡原本是 PROJECT_LIST，請改成 projectList */}
            <Sel label="所屬專案" options={["", ...projectList]} value={form.project} onChange={e=>setForm({...form,project:e.target.value})}/>
            
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
{key:"project",label:"所屬專案",type:"select",options:["",...PROJECT_LIST]},
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
<Sel label="所屬專案" options={["",...PROJECT_LIST]} value={form.project} onChange={e=>setForm({...form,project:e.target.value})}/>
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

function Contracts({ items, setItems, projectList = [] }) {
  return <SimpleForm addLabel="新增合約" items={items} setItems={setItems}
    fields={[
      // 這裡改用傳進來的 projectList
      {key:"project",label:"所屬專案 *",req:true,type:"sel",opts:["", ...projectList]}, 
      {key:"client",label:"客戶"},{key:"amount",label:"合約金額",ph:"NT$"},
      // 以下省略...
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
{key:"project",label:"所屬專案 *",req:true,type:"sel",opts:["",...PROJECT_LIST]},
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
{key:"project",label:"所屬專案 *",req:true,type:"sel",opts:["",...PROJECT_LIST]},
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
{key:"project",label:"所屬專案 *",req:true,type:"sel",opts:["",...PROJECT_LIST]},
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
{key:"project",label:"所屬專案 *",req:true,type:"sel",opts:["",...PROJECT_LIST]},
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
{key:"project",label:"所屬專案 *",req:true,type:"sel",opts:["",...PROJECT_LIST]},
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
{key:"project",label:"所屬專案 *",req:true,type:"sel",opts:["",...PROJECT_LIST]},
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
<Sel label="所屬專案" options={["",...PROJECT_LIST]} value={form.project} onChange={e=>setForm({...form,project:e.target.value})}/>
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
{key:"project",label:"所屬專案",type:"sel",opts:["",...PROJECT_LIST]},
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
{key:"project",label:"所屬專案",type:"sel",opts:["",...PROJECT_LIST]},
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
{key:"project",label:"所屬專案",type:"sel",opts:["",...PROJECT_LIST]},
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
{key:"project",label:"所屬專案",type:"sel",opts:["",...PROJECT_LIST]},
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
const byProject=PROJECT_LIST.map(name=>{
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
{key:"project",label:"所屬專案 *",req:true,type:"sel",opts:["",...PROJECT_LIST]},
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

function Settings({ onClearAll }) {
const [confirm, setConfirm] = useState(false);
return(
<div className="space-y-4">
<div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
<div className="text-sm font-semibold text-stone-700 mb-3">關於系統</div>
<div className="text-xs text-stone-400 space-y-1">
<div>版本：1.0.0</div><div>資料儲存：瀏覽器本機</div><div>所有資料儲存在您的裝置上</div>
</div>
</div>
<div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
<div className="text-sm font-semibold text-stone-700 mb-3">資料管理</div>
<button onClick={()=>setConfirm(true)} className="w-full bg-red-50 text-red-500 rounded-xl py-3 text-sm font-medium">🗑 清除所有資料</button>
</div>
{confirm&&(
<div className="fixed inset-0 z-50 flex items-center justify-center" style={{maxWidth:430,margin:"0 auto"}}>
<div className="absolute inset-0 bg-black/40" onClick={()=>setConfirm(false)}/>
<div className="relative bg-white rounded-2xl p-6 mx-4 shadow-2xl">
<div className="text-base font-semibold text-stone-800 mb-2">確認清除所有資料？</div>
<div className="text-sm text-stone-400 mb-5">此操作無法復原。</div>
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
export default function App() {
const [activeId, setActiveId] = useState("dashboard");
const [sidebarOpen, setSidebarOpen] = useState(false);
const [tasks, setTasks] = useLocalStorage("tasks", []);
const [projects, setProjects] = useLocalStorage("projects", []);
const [inquiries, setInquiries] = useLocalStorage("inquiries", []);
const [contracts, setContracts] = useLocalStorage("contracts", []);
const [quotes, setQuotes] = useLocalStorage("quotes", []);
const [inspection, setInspection] = useLocalStorage("inspection", []);
const [acceptance, setAcceptance] = useLocalStorage("acceptance", []);
const [pending, setPending] = useLocalStorage("pending", []);
const [knowledge, setKnowledge] = useLocalStorage("knowledge", []);
const [lighting, setLighting] = useLocalStorage("lighting", []);
const [design, setDesign] = useLocalStorage("design", []);
const [ledger, setLedger] = useLocalStorage("ledger", []);
const [purchase, setPurchase] = useLocalStorage("purchase", []);
const [expense, setExpense] = useLocalStorage("expense", []);
const [payroll, setPayroll] = useLocalStorage("payroll", []);
const [monthly, setMonthly] = useLocalStorage("monthly", []);
const [attendance, setAttendance] = useLocalStorage("attendance", []);
const [leave, setLeave] = useLocalStorage("leave", []);
const [overtime, setOvertime] = useLocalStorage("overtime", []);
const [materials, setMaterials] = useLocalStorage("materials", []);
const [inventory, setInventory] = useLocalStorage("inventory", []);
const [tracking, setTracking] = useLocalStorage("tracking", []);
const [losses, setLosses] = useLocalStorage("losses", []);
const [appointments, setAppointments] = useLocalStorage("appointments", []);

const clearAll=()=>{
["tasks","projects","inquiries","contracts","quotes","inspection","acceptance","pending",
"knowledge","lighting","design","ledger","purchase","expense","payroll","monthly",
"attendance","leave","overtime","materials","inventory","tracking","losses","appointments"
].forEach(k=>localStorage.removeItem(k));
window.location.reload();
};

const activeItem=NAV_SECTIONS.flatMap(s=>s.items).find(i=>i.id===activeId);

const renderPage=()=>{
    switch(activeId){
      case "dashboard": return <Dashboard tasks={tasks} projects={projects} attendance={attendance} setActiveId={setActiveId}/>;
      // 1. 傳入動態清單
      case "tasks": return <Tasks tasks={tasks} setTasks={setTasks} projectList={currentProjectList}/>; 
      case "calendar": return <Calendar tasks={tasks}/>;
      // 2. 傳入動態清單
      case "appointments": return <Appointments2 items={appointments} setItems={setAppointments} projectList={currentProjectList}/>;
      case "inquiries": return <Inquiries items={inquiries} setItems={setInquiries}/>;
      case "projects": return <Projects items={projects} setItems={setProjects}/>;
      // 3. 傳入動態清單（以此類推修改下方所有需要專案選單的組件）
      case "contracts": return <Contracts items={contracts} setItems={setContracts} projectList={currentProjectList}/>;
      case "quotes": return <Quotes items={quotes} setItems={setQuotes} projectList={currentProjectList}/>;
      case "inspection": return <Inspection items={inspection} setItems={setInspection} projectList={currentProjectList}/>;
      case "acceptance": return <Acceptance items={acceptance} setItems={setAcceptance} projectList={currentProjectList}/>;
      case "pending": return <Pending items={pending} setItems={setPending} projectList={currentProjectList}/>;
      case "knowledge": return <Knowledge items={knowledge} setItems={setKnowledge}/>;
      case "lighting": return <Lighting items={lighting} setItems={setLighting} projectList={currentProjectList}/>;
      case "design": return <Design items={design} setItems={setDesign} projectList={currentProjectList}/>;
      case "tiles": return <TilesCalc/>;
      case "ledger": return <Ledger items={ledger} setItems={setLedger} projectList={currentProjectList}/>;
      case "purchase": return <Purchase items={purchase} setItems={setPurchase} projectList={currentProjectList}/>;
      case "expense": return <Expense items={expense} setItems={setExpense} projectList={currentProjectList}/>;
      case "payroll": return <Payroll items={payroll} setItems={setPayroll}/>;
      case "monthly": return <Monthly items={monthly} setItems={setMonthly}/>;
      case "forecast": return <Forecast ledger={ledger} projects={projects}/>;
      case "attendance": return <Attendance items={attendance} setItems={setAttendance}/>;
      case "leave": return <Leave items={leave} setItems={setLeave}/>;
      case "overtime": return <Overtime items={overtime} setItems={setOvertime} projectList={currentProjectList}/>;
      case "materials": return <Materials items={materials} setItems={setMaterials}/>;
      case "inventory": return <Inventory items={inventory} setItems={setInventory}/>;
      case "tracking": return <Tracking items={tracking} setItems={setTracking} projectList={currentProjectList}/>;
      case "profit": return <Profit ledger={ledger} projects={projects}/>;
      case "losses": return <Losses items={losses} setItems={setLosses} projectList={currentProjectList}/>;
      case "settings": return <Settings onClearAll={clearAll}/>;
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
<span className="text-sm font-semibold text-stone-700">{activeItem?.label||"工作面板"}</span>
<button className="w-9 h-9 flex items-center justify-center relative">
<span className="text-xl">🔔</span>
{tasks.filter(t=>!t.done).length>0&&<span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"/>}
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
<button key={item.id} onClick={()=>{setActiveId(item.id);setSidebarOpen(false);}}
className={`w-full flex items-center gap-3 px-5 py-3 text-sm text-left ${activeId===item.id?"bg-stone-100 font-semibold text-stone-900 rounded-xl mx-2 w-[calc(100%-16px)]":"text-stone-600 hover:bg-stone-50"}`}>
<span>{item.icon}</span><span>{item.label}</span>
</button>
))}
</div>
))}
<div className="h-8"/>
</div>
</div>
)}
<div className="px-4 pt-4 pb-24">{renderPage()}</div>
<div className="fixed bottom-0 bg-white border-t border-stone-100 flex items-center justify-around py-2 z-30" style={{maxWidth:430,left:"50%",transform:"translateX(-50%)",width:"100%"}}>
{[{id:"dashboard",icon:"⊞",label:"面板"},{id:"tasks",icon:"✓",label:"任務"},{id:"projects",icon:"🏠",label:"專案"},{id:"ledger",icon:"💰",label:"財務"}].map(tab=>(
<button key={tab.id} onClick={()=>setActiveId(tab.id)} className={`flex flex-col items-center gap-0.5 px-4 py-1 ${activeId===tab.id?"text-stone-900":"text-stone-400"}`}>
<span className="text-lg">{tab.icon}</span>
<span className="text-xs">{tab.label}</span>
{activeId===tab.id&&<span className="w-1 h-1 bg-stone-800 rounded-full"/>}
</button>
))}
</div>
</div>
);
}