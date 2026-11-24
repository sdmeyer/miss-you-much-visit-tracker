// ===== CONFIG: paste from Supabase > Project Settings > API =====
const SUPABASE_URL = "https://mevdcxltwbssatzspdlj.supabase.co";
const SUPABASE_KEY = "sb_publishable_lbCQ1Z9NYII6EcjL4yxPsg_hMKC9uJI";   // publishable key only, never a secret key or service_role
// =================================================================

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const val=id=>document.getElementById(id).value;
const PW_KEY="mymm_passcode";
const store=v=>{try{v?localStorage.setItem(PW_KEY,v):localStorage.removeItem(PW_KEY)}catch(e){}};
const stored=()=>{try{return localStorage.getItem(PW_KEY)||""}catch(e){return ""}};
const S={loading:true,tab:"dash",sub:"vol",psub:"vol",editing:null,editingVisit:null,types:[],counts:{},contacts:{},vcontacts:{},user:null,admin:false,unlocked:false,pass:stored(),pwSet:false,vols:[],people:[],vd:{},pd:{},visits:[],admins:[],fv:"",fp:"",days:30};

const IC={
  hist:'<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/>',
  cal:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4"/>',
  users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  trash:'<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  lock:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'
};
const ic=(n,c="")=>`<svg class="ic ${c}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;
const hash=s=>{let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))>>>0;return h};
const initials=n=>String(n).trim().split(/\s+/).slice(0,2).map(w=>w[0]||"").join("").toUpperCase()||"?";
const ymd=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const todayLocal=()=>ymd(new Date());
// Icon for a visit type, chosen by keywords in its name. First match wins; anything else gets a heart.
const TYPE_ICONS=[[/birthday|bday|cake/i,"🎂"],[/hospital|surgery|clinic|emergency/i,"🏥"],[/nursing|assisted|rehab|facility/i,"🏢"],[/\b(home|house)/i,"🏠"],[/phone|\bcall|\btext\b/i,"📞"],[/pray/i,"🙏"],[/\bcard|letter|mail|\bnote/i,"💌"],[/meal|food|lunch|dinner|breakfast|cook|\bbak(e|ing)|casserole/i,"🍲"],[/errand|shop|grocer|pick ?up|deliver/i,"🛒"],[/\bride\b|\bdrive|transport/i,"🚗"],[/flower/i,"💐"],[/gift/i,"🎁"],[/church|service|worship|communion/i,"⛪"]];
const typeIcon=n=>{const s=String(n||"");for(const [re,i] of TYPE_ICONS)if(re.test(s))return i;return "💛"};
const typeText=n=>typeIcon(n)+" "+n;
const fmtPhone=s=>{const raw=String(s||"").trim(),d=raw.replace(/\D/g,""),n=d.length===11&&d[0]==="1"?d.slice(1):d;return n.length===10?n.slice(0,3)+"-"+n.slice(3,6)+"-"+n.slice(6):raw};
const typePhone=s=>{if(/[a-z]/i.test(s))return s;let d=s.replace(/\D/g,"");if(d.length>10&&d[0]==="1")d=d.slice(1);d=d.slice(0,10);return d.length>6?d.slice(0,3)+"-"+d.slice(3,6)+"-"+d.slice(6):d.length>3?d.slice(0,3)+"-"+d.slice(3):d};
const dparts=s=>{const x=new Date(s+"T12:00:00");return isNaN(x)?{mon:"",day:s,month:""}:{mon:x.toLocaleString("en-US",{month:"short"}),day:x.getDate(),month:x.toLocaleString("en-US",{month:"long",year:"numeric"})}};

function toast(t,err){
  const el=document.createElement("div");el.className="toast"+(err?" err":"");el.textContent=t;
  document.getElementById("toasts").appendChild(el);setTimeout(()=>el.remove(),err?7000:4000);
}
function ask(title,msg,ok,danger){
  return new Promise(res=>{
    const d=document.getElementById("dlg"),b=document.getElementById("dok");
    document.getElementById("dtitle").textContent=title;document.getElementById("dmsg").textContent=msg;
    b.textContent=ok;b.className="btn "+(danger?"danger-fill":"pri");
    d.returnValue="";d.onclose=()=>res(d.returnValue==="ok");d.showModal();
  });
}

async function load(){
  let admin=false,admins=[],unlocked=false,vols=[],people=[],visits=[],types=[],counts={},contacts={},vcontacts={},vd={},pd={},pwSet=false,note=null;
  if(S.user){
    const a=await sb.from("admins").select("email").order("email");
    admins=a.data||[];admin=admins.length>0;
  }
  if(admin){
    const [v,p,vdr,pdr,vis,pw,vt,vc]=await Promise.all([
      sb.from("volunteers").select("id,name").order("name"),
      sb.from("people").select("id,name").order("name"),
      sb.from("volunteer_details").select("*"),
      sb.from("person_details").select("*"),
      sb.from("visits").select("*").order("visit_date",{ascending:false}).limit(500),
      sb.rpc("passcode_is_set"),
      sb.from("visit_types").select("id,name"),
      sb.rpc("get_visit_counts",{p:""})]);
    vols=v.data||[];people=p.data||[];visits=vis.data||[];pwSet=pw.data===true;types=vt.data||[];counts=vc.data||{};
    (vdr.data||[]).forEach(r=>vd[r.volunteer_id]=r);
    (pdr.data||[]).forEach(r=>pd[r.person_id]=r);
  }else if(S.pass){
    const [l,vis,vc,pc,vcon]=await Promise.all([sb.rpc("get_lists",{p:S.pass}),sb.rpc("get_visits",{p:S.pass}),sb.rpc("get_visit_counts",{p:S.pass}),sb.rpc("get_person_contacts",{p:S.pass}),sb.rpc("get_volunteer_contacts",{p:S.pass})]);
    if(l.error||vis.error){
      if(/Incorrect passcode/i.test((l.error||vis.error).message||"")){S.pass="";store("");note="The passcode has changed. Enter the new one to continue."}
    }else{
      unlocked=true;vols=(l.data&&l.data.volunteers)||[];people=(l.data&&l.data.people)||[];visits=vis.data||[];types=(l.data&&l.data.types)||[];counts=vc.data||{};contacts=pc.data||{};vcontacts=vcon.data||{};
    }
  }
  if(admin){
    Object.keys(pd).forEach(id=>{contacts[id]={phone:pd[id].phone,address:pd[id].address}});
    Object.keys(vd).forEach(id=>{vcontacts[id]={phone:vd[id].phone,email:vd[id].email,address:vd[id].address}});
  }
  types=[...types].sort((a,b)=>a.name.localeCompare(b.name,undefined,{sensitivity:"base"}));
  Object.assign(S,{loading:false,admin,admins,unlocked,vols,people,visits,types,counts,contacts,vcontacts,vd,pd,pwSet});
  render();
  if(note)toast(note,true);
}

function render(){
  const locked=!S.admin&&!S.unlocked;
  const tabs=[];
  if(!locked){tabs.push(["dash","Recent","hist"],["sched","Connect","cal"],["people","People","users"]);if(S.admin)tabs.push(["admin","Admin","shield"])}
  if(S.tab!=="login"&&!locked&&!tabs.some(t=>t[0]===S.tab))S.tab="dash";
  document.body.classList.toggle("hasnav",tabs.length>0);
  document.getElementById("nav").innerHTML=tabs.map(([k,l,i])=>`<button data-t="${k}" class="${S.tab===k?"on":""}" ${S.tab===k?'aria-current="page"':""}>${ic(i)}<span>${l}</span></button>`).join("");
  document.getElementById("status").innerHTML=S.user&&!S.admin&&!S.loading?`<div class="banner">You’re signed in as ${esc(S.user.email)}, but that email isn’t on the admin list. Ask an admin to add it.</div>`:"";
  const foot=[];
  foot.push(S.user?`<span>${esc(S.user.email)}</span><a href="#" id="signout">Sign out</a>`:`<a href="#" id="gologin">Admin sign in</a>`);
  document.getElementById("foot").innerHTML=foot.join("");
  document.getElementById("main").innerHTML=S.tab==="login"?login():S.loading?skeleton():locked?unlock():S.tab==="sched"?sched():S.tab==="dash"?dash():S.tab==="people"?people():admin();
}

function people(){
  const isV=S.psub==="vol",list=isV?S.vols:S.people;
  const seg=`<div class="seg">${[["vol","Volunteers"],["per","People to visit"]].map(([k,l])=>`<button class="btn sm ${S.psub===k?"on":""}" data-psub="${k}">${l}</button>`).join("")}</div>`;
  const empty=isV?"No volunteers yet.":"No one to visit yet.";
  const hint=S.admin?" Add them from the Admin tab.":" An admin can add them.";
  return seg+`<div class="panel flush"><div class="panel-h"><h2>${isV?"Volunteers":"People to visit"} (${list.length})</h2></div>
  ${list.length?list.map(o=>{const n=isV?0:Number(S.counts[o.id])||0,c=(isV?S.vcontacts:S.contacts)[o.id]||{},addr=String(c.address||"").trim(),email=String(c.email||"").trim(),digits=String(c.phone||"").replace(/\D/g,"");
  return `<div class="item people"><span class="av">${esc(initials(o.name))}</span><div class="pname"><b>${esc(o.name)}</b>${n?`<div class="note love">God’s love has been shared ${n} ${n===1?"time":"times"}</div>`:""}`
  +(addr?`<div class="note"><span class="ci" aria-hidden="true">🏠</span><a href="https://maps.google.com/?q=${encodeURIComponent(addr)}" target="_blank" rel="noopener">${esc(addr)}</a></div>`:"")
  +(email?`<div class="note"><span class="ci" aria-hidden="true">✉️</span><a href="mailto:${esc(email)}">${esc(email)}</a></div>`:"")
  +(digits?`<div class="note"><span class="ci" aria-hidden="true">📞</span><a href="tel:${esc(digits)}">${esc(fmtPhone(c.phone))}</a></div>`:"")
  +`</div></div>`}).join(""):`<div class="empty">${empty}${hint}</div>`}</div>`;
}

function skeleton(){return `<div class="panel" aria-busy="true"><div class="sk" style="width:38%"></div><div class="sk"></div><div class="sk" style="width:72%"></div></div>`}

function login(){return `<div class="panel"><h2>Admin sign in</h2><p class="sum">Enter your admin email and we’ll send you a sign-in link.</p>
<div class="field" style="margin-top:16px"><label for="le">Email</label><input id="le" type="email" autocomplete="email" inputmode="email"></div>
<div class="actions"><button class="btn pri" id="sendlink">Send sign-in link</button><button class="btn quiet" id="cancellogin">Cancel</button></div></div>`}

function unlock(){return `<div class="panel"><div class="lockrow"><span class="av">${ic("lock")}</span><div><h2>Volunteer access</h2>
<p class="sum">Enter the passcode from your ministry leader to see recent visits and connect with someone.</p></div></div>
<div class="field" style="margin-top:18px"><label for="pw">Passcode</label><input id="pw" type="password" autocomplete="current-password"></div>
<div class="actions"><button class="btn pri" id="unlock">Unlock</button></div></div>`}

function sched(){
  const opt=a=>`<option value="">Choose…</option>`+a.map(o=>`<option value="${esc(o.id)}">${esc(o.name)}</option>`).join("");
  const none=!S.vols.length||!S.people.length;
  return `<div class="panel"><h2>Connect</h2>
  ${none?`<div class="banner" style="margin:14px 0 0">An admin needs to add at least one volunteer and one person to visit before you can connect.</div>`:""}
  <div class="field" style="margin-top:16px"><label for="sv">Volunteer</label><select id="sv">${opt(S.vols)}</select></div>
  <div class="field"><label for="sp">Person to visit</label><select id="sp">${opt(S.people)}</select></div>
  ${S.types.length?`<div class="field"><label for="st">Sharing God’s love with</label><select id="st"><option value="">Choose…</option>${S.types.map(o=>`<option value="${esc(o.id)}">${esc(typeText(o.name))}</option>`).join("")}</select></div>`:""}
  <div class="field"><label for="sd">Date</label><input type="date" id="sd" value="${todayLocal()}"></div>
  <div class="field"><label for="sc">Notes</label><textarea id="sc" maxlength="1000" placeholder="Anything worth remembering (optional)"></textarea></div>
  <div class="actions"><button class="btn pri" id="savevisit">Save</button></div></div>`;
}

// Admin editor for one visit. Keeps a removed volunteer, person or type selectable so saving never forces a change.
const withCurrent=(list,id,name)=>(!id||list.some(o=>o.id===id))?list:[...list,{id,name:name||"Removed"}];
function visitEditor(x){
  const vols=withCurrent(S.vols,x.volunteer_id,x.volunteer_name),ppl=withCurrent(S.people,x.person_id,x.person_name);
  const types=x.visit_type&&!S.types.some(t=>t.name===x.visit_type)?[...S.types,{id:x.visit_type,name:x.visit_type}]:S.types;
  const opts=(a,sel,key)=>a.map(o=>{const v=key?o.name:o.id;return `<option value="${esc(v)}" ${v===sel?"selected":""}>${esc(o.name)}</option>`}).join("");
  return `<div class="visit editing"><h3>Edit this visit</h3>
  <div class="field" style="margin-top:0"><label for="evv">Volunteer</label><select id="evv">${opts(vols,x.volunteer_id)}</select></div>
  <div class="field"><label for="evp">Person to visit</label><select id="evp">${opts(ppl,x.person_id)}</select></div>
  ${types.length?`<div class="field"><label for="evt">Sharing God’s love with</label><select id="evt"><option value="">None</option>${types.map(o=>`<option value="${esc(o.name)}" ${o.name===(x.visit_type||"")?"selected":""}>${esc(typeText(o.name))}</option>`).join("")}</select></div>`:""}
  <div class="field"><label for="evd">Date</label><input type="date" id="evd" value="${esc(x.visit_date)}"></div>
  <div class="field"><label for="evn">Notes</label><textarea id="evn" maxlength="1000">${esc(x.comment)}</textarea></div>
  <div class="actions"><button class="btn pri" data-savevisit="${esc(x.id)}">Save changes</button><button class="btn quiet" id="canceledit">Cancel</button></div></div>`;
}

function cutoff(){if(!S.days)return"";const c=new Date();c.setDate(c.getDate()-S.days);return ymd(c)}
function stats(){
  const cut=cutoff();
  const r=S.visits.filter(v=>v.visit_date>=cut);
  return{n:r.length,vols:new Set(r.map(v=>v.volunteer_id||v.volunteer_name)).size,ppl:new Set(r.map(v=>v.person_id||v.person_name)).size};
}
function dash(){
  let v=S.visits;
  const cut=cutoff(),when=S.days?`in the last ${S.days} days`:"so far";
  if(cut)v=v.filter(x=>x.visit_date>=cut);
  if(S.fv)v=v.filter(x=>x.volunteer_id===S.fv);
  if(S.fp)v=v.filter(x=>x.person_id===S.fp);
  const s=stats(),plural=(n,a,b)=>n===1?a:b;
  const sum=s.n?`${s.n} ${plural(s.n,"visit","visits")} ${when}. ${s.vols} ${plural(s.vols,"volunteer","volunteers")} reached ${s.ppl} ${plural(s.ppl,"person","people")}.`:`No visits ${when}.`;
  const opt=(arr,sel)=>`<option value="">Everyone</option>`+arr.map(o=>`<option value="${esc(o.id)}" ${o.id===sel?"selected":""}>${esc(o.name)}</option>`).join("");
  let body="";
  if(!v.length){
    body=(S.fv||S.fp)?`<div class="empty">No visits match these filters.<br><button class="btn" id="clearf">Clear filters</button></div>`
      :S.visits.length?`<div class="empty">No visits ${when}.<br><button class="btn" data-days="0">Show all</button></div>`
      :`<div class="empty">No visits yet.<br><button class="btn pri" data-t="sched">Connect</button></div>`;
  }else{
    let last="";
    body=v.map(x=>{
      const d=dparts(x.visit_date),head=d.month!==last?`<div class="month">${esc(d.month)}</div>`:"";last=d.month;
      if(S.admin&&S.editingVisit===x.id)return head+visitEditor(x);
      return head+`<div class="visit"><div class="dchip" aria-hidden="true"><div><i>${esc(d.mon)}</i><b>${esc(d.day)}</b></div></div>
      <div><div class="who"><b>${esc(x.volunteer_name)}</b> shared God’s love with <b>${esc(x.person_name)}</b></div>${x.visit_type||x.comment?`<div class="note">${x.visit_type?`<span class="vtype"><span aria-hidden="true">${typeIcon(x.visit_type)}</span> ${esc(x.visit_type)}</span> `:""}${x.comment?esc(x.comment):""}</div>`:""}</div>
      ${S.admin?`<div class="acts"><button class="btn quiet sm" data-editvisit="${esc(x.id)}" aria-label="Edit this visit" title="Edit">${ic("edit")}</button>
      <button class="btn quiet danger sm" data-delvisit="${esc(x.id)}" aria-label="Delete this visit" title="Delete">${ic("trash")}</button></div>`:"<span></span>"}</div>`;
    }).join("");
  }
  return `<div class="panel flush"><div class="panel-h"><h2>Recent visits</h2><p class="sum">${esc(sum)}</p></div>
  <div class="seg" role="group" aria-label="Time period" style="padding:16px 20px 0;margin:0">${[[30,"30 days"],[60,"60 days"],[90,"90 days"],[0,"All"]].map(([d,l])=>`<button class="btn sm ${S.days===d?"on":""}" data-days="${d}" aria-pressed="${S.days===d}">${l}</button>`).join("")}</div>
  <div class="filters"><div><label for="fv">Volunteer</label><select id="fv">${opt(S.vols,S.fv)}</select></div>
  <div><label for="fp">Person visited</label><select id="fp">${opt(S.people,S.fp)}</select></div>
  ${S.fv||S.fp?`<button class="btn quiet" id="clearf">Clear</button>`:"<span></span>"}</div>${body}</div>`;
}

function admin(){
  const sub=`<div class="seg">${[["vol","Volunteers"],["per","People to visit"],["types","Visit types"],["adm","Admins"],["pw","Passcode"]].map(([k,l])=>`<button class="btn sm ${S.sub===k?"on":""}" data-sub="${k}">${l}</button>`).join("")}</div>`;
  if(S.sub==="types")return sub+`<div class="panel"><h2>Add a visit type</h2>
  <p class="sum">Volunteers choose from these on the Connect form, for example Hospital visit or Phone call.</p>
  <div class="field" style="margin-top:16px"><label for="nt">Name</label><input id="nt" maxlength="80" autocomplete="off"></div>
  <div class="actions"><button class="btn pri" id="addtype">Add visit type</button></div></div>
  <div class="panel flush"><div class="panel-h"><h2>Visit types (${S.types.length})</h2></div>
  ${S.types.length?S.types.map(o=>S.editing===o.id?`<div class="item editing"><h3>Edit visit type</h3>
  <div class="field" style="margin-top:0"><label for="etn">Name</label><input id="etn" maxlength="80" autocomplete="off" value="${esc(o.name)}"></div>
  <div class="actions"><button class="btn pri" data-savetype="${esc(o.id)}">Save changes</button><button class="btn quiet" id="canceledit">Cancel</button></div></div>`
  :`<div class="item typ"><div><b><span aria-hidden="true">${typeIcon(o.name)}</span> ${esc(o.name)}</b></div>
  <div class="acts"><button class="btn quiet sm" data-edit="${esc(o.id)}" aria-label="Edit ${esc(o.name)}" title="Edit">${ic("edit")}</button>
  <button class="btn quiet danger sm" data-deltype="${esc(o.id)}" aria-label="Remove ${esc(o.name)}" title="Remove">${ic("trash")}</button></div></div>`).join("")
  :`<div class="empty">No visit types yet. Until you add one, the “Sharing God’s love with” menu stays hidden on the Connect form.</div>`}</div>`;
  if(S.sub==="pw")return sub+`<div class="panel"><h2>Volunteer passcode</h2>
  <p class="sum">${S.pwSet?"Volunteers enter this passcode to see visits and connect with someone. Changing it asks them to enter the new one.":"No passcode is set yet, so only admins can use the site. Set one to give volunteers access."}</p>
  <div class="field" style="margin-top:16px"><label for="npw">New passcode</label><input id="npw" type="text" autocomplete="off"><p class="hint">Use at least 4 characters. Avoid names and birthdays.</p></div>
  <div class="actions"><button class="btn pri" id="setpw">Save passcode</button></div></div>`;
  if(S.sub==="adm"){
    const me=(S.user.email||"").toLowerCase();
    return sub+`<div class="panel"><h2>Add an admin</h2><p class="sum">They’ll sign in with this email using a link we send them.</p>
    <div class="field" style="margin-top:16px"><label for="nae">Email</label><input id="nae" type="email" inputmode="email"></div>
    <div class="actions"><button class="btn pri" id="addadmin">Add admin</button></div></div>
    <div class="panel flush"><div class="panel-h"><h2>Admins (${S.admins.length})</h2></div>${S.admins.map(a=>`<div class="item"><span class="av">${esc(initials(a.email))}</span>
    <div><b>${esc(a.email)}</b>${a.email===me?`<div class="note">You</div>`:""}</div>
    ${a.email===me?"<span></span>":`<button class="btn quiet danger sm" data-deladmin="${esc(a.email)}" aria-label="Remove admin ${esc(a.email)}">${ic("trash")}</button>`}</div>`).join("")}</div>`;
  }
  const isV=S.sub==="vol",list=isV?S.vols:S.people,det=isV?S.vd:S.pd;
  return sub+`<div class="panel"><h2>${isV?"Add a volunteer":"Add a person to visit"}</h2>
  <div class="field" style="margin-top:16px"><label for="an">Name</label><input id="an" autocomplete="off"></div>
  <div class="row field"><div><label for="ae">Email</label><input id="ae" type="email" inputmode="email"></div><div><label for="ap">Phone</label><input id="ap" type="tel"></div></div>
  <div class="field"><label for="aa">Address</label><input id="aa" autocomplete="off"></div>
  <div class="field"><label for="ac">Comments</label><textarea id="ac"></textarea></div>
  <div class="actions"><button class="btn pri" id="addent">${isV?"Add volunteer":"Add person"}</button></div></div>
  <div class="panel flush"><div class="panel-h"><h2>${isV?"Volunteers":"People to visit"} (${list.length})</h2></div>
  ${list.length?list.map(o=>{const p=det[o.id]||{};
  if(S.editing===o.id)return `<div class="item editing"><h3>Edit ${esc(o.name)}</h3>
  <div class="field" style="margin-top:0"><label for="en">Name</label><input id="en" autocomplete="off" value="${esc(o.name)}"></div>
  <div class="row field"><div><label for="ee">Email</label><input id="ee" type="email" inputmode="email" value="${esc(p.email)}"></div><div><label for="ep">Phone</label><input id="ep" type="tel" value="${esc(fmtPhone(p.phone))}"></div></div>
  <div class="field"><label for="ea">Address</label><input id="ea" autocomplete="off" value="${esc(p.address)}"></div>
  <div class="field"><label for="ec">Comments</label><textarea id="ec">${esc(p.comments)}</textarea></div>
  <div class="actions"><button class="btn pri" data-saveent="${esc(o.id)}">Save changes</button><button class="btn quiet" id="canceledit">Cancel</button></div></div>`;
  const contact=[p.email,fmtPhone(p.phone)].filter(Boolean).map(esc).join(", ");return `<div class="item"><span class="av">${esc(initials(o.name))}</span>
  <div><b>${esc(o.name)}</b>${contact?`<div class="note">${contact}</div>`:""}${p.address?`<div class="note">${esc(p.address)}</div>`:""}${p.comments?`<div class="note">${esc(p.comments)}</div>`:""}</div>
  <div class="acts"><button class="btn quiet sm" data-edit="${esc(o.id)}" aria-label="Edit ${esc(o.name)}" title="Edit">${ic("edit")}</button>
  <button class="btn quiet danger sm" data-delent="${esc(o.id)}" aria-label="Remove ${esc(o.name)}" title="Remove">${ic("trash")}</button></div></div>`}).join(""):`<div class="empty">${isV?"No volunteers yet. Add the first one above.":"No one to visit yet. Add the first person above."}</div>`}</div>`;
}

document.addEventListener("click",async e=>{
  if(e.target.id==="sd"&&e.target.showPicker){try{e.target.showPicker()}catch(_){}}
  const a=e.target.closest("a");
  if(a&&a.id==="gologin"){e.preventDefault();S.tab="login";return render()}
  if(a&&a.id==="signout"){e.preventDefault();await sb.auth.signOut();return}
  const t=e.target.closest("button");if(!t)return;
  if(t.id==="cancellogin"){S.tab="dash";return render()}
  if(t.id==="clearf"){S.fv="";S.fp="";return render()}
  if(t.dataset.days!==undefined){S.days=Number(t.dataset.days);return render()}
  if(t.dataset.t){S.tab=t.dataset.t;S.editing=null;S.editingVisit=null;return render()}
  if(t.dataset.sub){S.sub=t.dataset.sub;S.editing=null;return render()}
  if(t.dataset.edit){S.editing=t.dataset.edit;render();const f=document.getElementById("en")||document.getElementById("etn");if(f)f.focus();return}
  if(t.dataset.editvisit){S.editingVisit=t.dataset.editvisit;return render()}
  if(t.id==="canceledit"){S.editing=null;S.editingVisit=null;return render()}
  if(t.dataset.psub){S.psub=t.dataset.psub;return render()}
  try{
    let r;
    if(t.id==="sendlink"){
      const email=val("le").trim().toLowerCase();if(!email)return toast("Enter your email address.",true);
      r=await sb.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname}});
      if(r.error)throw r.error;return toast("Check your email for the sign-in link.");
    }
    if(t.id==="unlock"){
      const pw=val("pw");if(!pw)return toast("Enter the passcode.",true);
      r=await sb.rpc("get_lists",{p:pw});
      if(r.error)return toast(/Incorrect passcode/i.test(r.error.message||"")?"That passcode isn’t right. Check it and try again.":"Couldn’t unlock: "+r.error.message,true);
      S.pass=pw;store(pw);return load();
    }
    if(t.id==="savevisit"){
      const v=S.vols.find(x=>x.id===val("sv")),p=S.people.find(x=>x.id===val("sp")),d=val("sd");
      if(!v||!p||!d)return toast("Choose a volunteer, a person and a date.",true);
      const stEl=document.getElementById("st");
      r=await sb.rpc("submit_visit",{p:S.pass||"",v_id:v.id,pe_id:p.id,d,c:val("sc").trim(),t_id:stEl&&stEl.value?stEl.value:null});
      if(r.error)throw r.error;
      S.tab="dash";await load();toast("Saved. Thank you for serving.");
    }else if(t.id==="setpw"){
      const pw=val("npw").trim();if(pw.length<4)return toast("The passcode needs at least 4 characters.",true);
      r=await sb.rpc("set_passcode",{p:pw});if(r.error)throw r.error;
      await load();toast("Passcode saved. Share it with your volunteers.");
    }else if(t.id==="addent"){
      const name=val("an").trim();if(!name)return toast("Enter a name.",true);
      const isV=S.sub==="vol";
      r=await sb.from(isV?"volunteers":"people").insert({name}).select("id").single();
      if(r.error)throw r.error;
      const d=isV?{volunteer_id:r.data.id,address:val("aa").trim()}:{person_id:r.data.id,address:val("aa").trim()};
      Object.assign(d,{email:val("ae").trim(),phone:val("ap").trim(),comments:val("ac").trim()});
      r=await sb.from(isV?"volunteer_details":"person_details").insert(d);
      if(r.error)throw r.error;
      await load();toast(name+" added.");
    }else if(t.id==="addtype"){
      const name=val("nt").trim();if(!name)return toast("Enter a name for the visit type.",true);
      if(S.types.some(o=>o.name.toLowerCase()===name.toLowerCase()))return toast("“"+name+"” is already on the list.",true);
      r=await sb.from("visit_types").insert({name});
      if(r.error)throw r.error;
      await load();toast("“"+name+"” added.");
    }else if(t.dataset.savetype){
      const id=t.dataset.savetype,name=val("etn").trim(),old=S.types.find(o=>o.id===id);
      if(!name)return toast("Enter a name for the visit type.",true);
      if(S.types.some(o=>o.id!==id&&o.name.toLowerCase()===name.toLowerCase()))return toast("“"+name+"” is already on the list.",true);
      r=await sb.from("visit_types").update({name}).eq("id",id);
      if(r.error)throw r.error;
      if(old&&old.name!==name){r=await sb.from("visits").update({visit_type:name}).eq("visit_type",old.name);if(r.error)throw r.error}
      S.editing=null;await load();toast("Changes saved.");
    }else if(t.dataset.deltype){
      const who=S.types.find(o=>o.id===t.dataset.deltype);
      if(!await ask("Remove "+(who?who.name:"this visit type")+"?","Past visits keep this label. It just won’t be offered for new visits.","Remove",true))return;
      r=await sb.from("visit_types").delete().eq("id",t.dataset.deltype);
      if(r.error)throw r.error;await load();toast("Removed.");
    }else if(t.dataset.savevisit){
      const id=t.dataset.savevisit,x=S.visits.find(o=>o.id===id);if(!x)return;
      const vols=withCurrent(S.vols,x.volunteer_id,x.volunteer_name),ppl=withCurrent(S.people,x.person_id,x.person_name);
      const v=vols.find(o=>o.id===val("evv")),p=ppl.find(o=>o.id===val("evp")),d=val("evd"),tEl=document.getElementById("evt");
      if(!v||!p||!d)return toast("Choose a volunteer, a person and a date.",true);
      r=await sb.from("visits").update({volunteer_id:v.id,volunteer_name:v.name,person_id:p.id,person_name:p.name,visit_date:d,visit_type:tEl&&tEl.value?tEl.value:null,comment:val("evn").trim()||null}).eq("id",id);
      if(r.error)throw r.error;
      S.editingVisit=null;await load();toast("Changes saved.");
    }else if(t.dataset.saveent){
      const id=t.dataset.saveent,isV=S.sub==="vol",name=val("en").trim();
      if(!name)return toast("Enter a name.",true);
      const old=(isV?S.vols:S.people).find(x=>x.id===id);
      r=await sb.from(isV?"volunteers":"people").update({name}).eq("id",id);
      if(r.error)throw r.error;
      const d=isV?{volunteer_id:id,address:val("ea").trim()}:{person_id:id,address:val("ea").trim()};
      Object.assign(d,{email:val("ee").trim(),phone:fmtPhone(val("ep")),comments:val("ec").trim()});
      r=await sb.from(isV?"volunteer_details":"person_details").upsert(d,{onConflict:isV?"volunteer_id":"person_id"});
      if(r.error)throw r.error;
      if(old&&old.name!==name){
        r=await sb.from("visits").update(isV?{volunteer_name:name}:{person_name:name}).eq(isV?"volunteer_id":"person_id",id);
        if(r.error)throw r.error;
      }
      S.editing=null;await load();toast("Changes saved.");
    }else if(t.dataset.delent){
      const isV=S.sub==="vol",who=(isV?S.vols:S.people).find(x=>x.id===t.dataset.delent);
      if(!await ask("Remove "+(who?who.name:"this entry")+"?","Their past visits stay on the Recent tab.","Remove",true))return;
      r=await sb.from(isV?"volunteers":"people").delete().eq("id",t.dataset.delent);
      if(r.error)throw r.error;await load();toast("Removed.");
    }else if(t.dataset.delvisit){
      if(!await ask("Delete this visit?","The record is removed for everyone.","Delete visit",true))return;
      r=await sb.from("visits").delete().eq("id",t.dataset.delvisit);
      if(r.error)throw r.error;await load();toast("Visit deleted.");
    }else if(t.id==="addadmin"){
      const email=val("nae").trim().toLowerCase();if(!email)return toast("Enter an email address.",true);
      r=await sb.from("admins").insert({email});if(r.error)throw r.error;
      await load();toast(email+" is now an admin.");
    }else if(t.dataset.deladmin){
      if(!await ask("Remove admin access?",t.dataset.deladmin+" will no longer be able to manage the ministry.","Remove admin",true))return;
      r=await sb.from("admins").delete().eq("email",t.dataset.deladmin);
      if(r.error)throw r.error;await load();toast("Admin removed.");
    }
  }catch(err){toast("That didn’t work: "+(err.message||"unknown error")+". Check your connection and try again.",true)}
});
document.addEventListener("change",e=>{
  if(e.target.id==="fv"){S.fv=e.target.value;render()}
  if(e.target.id==="fp"){S.fp=e.target.value;render()}
});
document.addEventListener("input",e=>{
  if(e.target.id==="ap"||e.target.id==="ep"){const v=typePhone(e.target.value);if(v!==e.target.value)e.target.value=v}
});
document.addEventListener("keydown",e=>{
  if(e.key!=="Enter")return;
  if(e.target.id==="en"){e.preventDefault();const b=document.querySelector("[data-saveent]");if(b)b.click()}
  if(e.target.id==="etn"){e.preventDefault();const b=document.querySelector("[data-savetype]");if(b)b.click()}
  if(e.target.id==="nt"){e.preventDefault();document.getElementById("addtype").click()}
  if(e.target.id==="pw"){e.preventDefault();document.getElementById("unlock").click()}
  if(e.target.id==="le"){e.preventDefault();document.getElementById("sendlink").click()}
});

sb.auth.onAuthStateChange((_ev,session)=>{
  S.user=session?session.user:null;
  if(S.user&&S.tab==="login")S.tab="dash";
  setTimeout(load,0);
});
render();
