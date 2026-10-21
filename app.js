/* DAFTAR ISI app.js
   1 Data: struct Tiket, array tiket[]        5 Pemesanan: modal, kursi, calc, linked list pesanan (LL)
   2 Filter, kelompok nasional/internasional  6 Log per tindakan: pushLog, aLog, anim
   3 Sorting: SORT (5 algoritma), sortRun     7 Pencarian: searchRun (linear, binary), runForm
   4 Perbandingan: bench                      8 Konsep Data: memo (array, pointer), drawLL */
const $=id=>document.getElementById(id);
/** Konstanta konfigurasi: tidak ada angka "ajaib" yang tersebar di kode. */
const CFG={pageSize:24,logLines:150,sortFrames:140,sortRecord:400,cellFrames:150,animMs:1600,structBytes:128,base:0x7A00};
const IDR=new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}),COL=new Intl.Collator('id');   // dibuat sekali, dipakai berulang
const raw=RAW;

/* STRUCT: satu baris JSON dipetakan menjadi satu record Tiket */
class Tiket{constructor(r,i){this.id=i;[this.tipe,this.lingkup,this.nama,this.asal,this.tujuan,this.harga,this.durasi,this.rating]=r}}
/* ARRAY: kumpulan struct berurutan */
const tiket=raw.baris.map((r,i)=>Object.freeze(new Tiket(r,i)));

const CATS=[['semua','Semua'],['pesawat','Pesawat'],['kereta','Kereta'],['bus','Bus'],['kapal','Kapal'],['hotel','Hotel'],['hiburan','Hiburan'],['mobil','Sewa Mobil'],['wisata','Paket Wisata']];
const TN=Object.fromEntries(CATS);
const SC=[['semua','Semua'],['nasional','Nasional'],['internasional','Internasional']];
let cat='semua',scope='semua',view=[],hits=new Set(),unread=0;
const rp=n=>IDR.format(n);
const dur=m=>m>=60?`${Math.floor(m/60)}j ${m%60?m%60+'m':''}`:`${m}m`;
const F={h:0,r:0};   // filter harga maksimum dan rating minimum
const base=(sc=scope)=>tiket.filter(t=>(cat=='semua'||t.tipe==cat)&&(sc=='semua'||t.lingkup==sc)&&(!F.h||t.harga<=F.h)&&t.rating>=F.r);

function tabs(){
  $('cats').innerHTML=CATS.map(([k,l])=>`<button data-c="${k}" class="${k==cat?'on':''}">${ICON[k]}${l}</button>`).join('');
  $('chips').innerHTML=SC.map(([k,l])=>`<button data-s="${k}" class="${k==scope?'on':''}">${l}<small>${base(k).length}</small></button>`).join('');
}
const freshPages=()=>({nasional:CFG.pageSize,internasional:CFG.pageSize});
let PGS=freshPages(),SHOWN=new Set(),KEEP=false;
/* KARTU PER RUTE: tiket dengan rute sama (jenis, asal, tujuan) digabung menjadi satu kartu.
   Kartu utama = tiket pertama menurut urutan view saat ini, jadi pengurutan tetap menentukan siapa yang tampil di depan. */
const rl=r=>r>=4.8?'Luar biasa':r>=4.5?'Sangat baik':r>=4.2?'Baik':'Cukup';
const PIN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>';
const gkey=t=>t.tujuan===''?'#'+t.id:`${t.tipe}|${t.asal}|${t.tujuan}`;
/** Mengelompokkan tiket berdasarkan rute (Map menjaga urutan kemunculan pertama). */
function groups(list){const m=new Map();list.forEach(t=>{const k=gkey(t);if(!m.has(k))m.set(k,[]);m.get(k).push(t)});return[...m.entries()]}   // Map menjaga urutan kemunculan pertama
const card=(t,i,n,k)=>{const h=t.tujuan==='';
  return `<article class="t ${hits.has(t.id)?'hit':''} ${KEEP&&SHOWN.has(t.id)?'still':''}" data-k="${t.tipe}" style="--i:${Math.min(i,24)}">
  <div class="top"><div class="ic">${ICON[t.tipe]}</div><div><h3>${t.nama.replace(/-(?=\d)/g,'\u2011')}</h3><div class="mini">${TN[t.tipe]} ${t.lingkup=='internasional'?'<span class="badge">Internasional</span>':'· Nasional'}</div></div><div class="rt">★ ${t.rating.toFixed(1)}</div></div>
  ${h?`<div class="loc"><span class="pin">${PIN}</span><div><b>${t.asal}</b><small>${rl(t.rating)}</small></div></div>`:`<div class="route"><b>${t.asal}<small>${jam(t,0)}</small></b><i><u>${dur(t.durasi)}</u></i><b>${t.tujuan}<small>${jam(t,1)}</small></b></div>`}
  ${n>1?`<button class="opt" data-a="op:${esc(k)}">+${n-1} pilihan lain · lihat semua</button>`:''}
  <div class="foot"><div class="pr">${rp(t.harga)}<small>${h?(t.tipe=='hotel'?'per malam':t.tipe=='mobil'?'per hari':'per orang'):'per orang'}</small></div><button class="go" data-b="${t.id}">Pesan</button></div></article>`};
/** Menggambar daftar kartu per rute, dikelompokkan nasional/internasional. keep=true: kartu lama tidak beranimasi ulang. */
function render(keep){
  KEEP=!!keep;const NX=new Set();
  $('cnt').textContent=`${view.length} tiket`;
  if(!view.length){
    const o=scope=='nasional'?'internasional':scope=='internasional'?'nasional':null,n2=o?base(o).filter(qm).length:0;
    $('grid').innerHTML=`<div class="empty">Tidak ada tiket ${scope=='semua'?'':scope+' '}yang cocok.${n2?`<br><br>Ada <b>${n2}</b> tiket ${o} yang cocok.<br><br><button class="go" data-a="sc:${o}">Lihat tiket ${o}</button>`:''}</div>`;SHOWN=NX;return}
  const G=scope=='semua'?['nasional','internasional']:[scope];
  $('grid').innerHTML=G.map(g=>{
    const L=view.filter(t=>t.lingkup==g);if(!L.length)return '';
    const gr=groups(L),sh=gr.slice(0,PGS[g]);sh.forEach(([k,a])=>NX.add(a[0].id));
    return (scope=='semua'?`<div class="gh"><b>${g=='nasional'?'Nasional':'Internasional'}</b><span>${L.length} tiket · ${g=='nasional'?'dalam negeri':'luar negeri'}</span></div>`:'')
      +sh.map(([k,a],i)=>card(a[0],i,a.length,k)).join('')
      +(gr.length>sh.length?`<div class="more"><button class="go ghost" data-a="more:${g}">Tampilkan lebih banyak (${gr.length-sh.length})</button></div>`:'')}).join('');
  SHOWN=NX;
}
/** Menampilkan ulang daftar dari filter aktif (urutan awal = rekomendasi). Bila form rute terisi, pencariannya dijalankan lagi. */
function reset(why){
  $('so').value='rek';$('slog').hidden=true;PGS=freshPages();
  view=mix(base());hits=new Set();$('stat').textContent='Urutan awal: rekomendasi';
  tabs();kotaList();hero();
  if($('fa').value.trim()||$('fb').value.trim())return runForm(why);
  Q={a:'',b:''};render();
  if(why){
    const syarat=[cat!='semua'&&'tipe='+cat,scope!='semua'&&'lingkup='+scope,F.h&&'harga≤'+F.h,F.r&&'rating≥'+F.r].filter(Boolean).join(' · ')||'tanpa syarat',nn=view.filter(t=>t.lingkup=='nasional').length;
    aLog(why,[{t:`Traversal <b>tiket[0..${tiket.length-1}]</b> · O(n), ${tiket.length} elemen diperiksa`},{t:`Syarat: ${syarat}`},{t:`Lolos: <b>${view.length}</b> elemen · nasional ${nn} · internasional ${view.length-nn}`,y:1}]);
  }
}

/* ---------- LOG ---------- */
const MAXL=CFG.logLines;
/** Menulis satu entri log (menggantikan yang lama). meta = {feat, why, stats, total} membuat kartu penjelasan algoritma. */
function pushLog(title,lines,quiet,meta){
  const box=$('log'),total=meta&&meta.total!=null?meta.total:lines.length,fmt=n=>n.toLocaleString('id-ID');
  const rows=lines.slice(0,MAXL).map(l=>`<div class="l ${l.y?'y':''}">${l.t}</div>`).join('')+(total>MAXL?`<div class="l mt">… ${fmt(total-MAXL)} baris lainnya tidak ditampilkan</div>`:'');
  box.innerHTML=meta
    ?`<div class="card"><div class="ct">${title}</div><div class="feat"><span>Fitur yang dipakai</span><b>${meta.feat}</b></div><p class="why">${meta.why}</p><div class="chips2">${meta.stats.map(([v,l],i)=>`<div style="--n:${i}"><b>${v}</b><span>${l}</span></div>`).join('')}</div></div><details class="steps"><summary>Lihat langkah detail (${fmt(total)})</summary>${rows}</details>`
    :`<div class="card"><div class="ct">${title}</div>${rows}</div>`;
  box.scrollTop=0;
  $('lt').textContent='Log · '+new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  if(meta)$('slog').hidden=false;
  const fab=$('fab');fab.classList.remove('ping');void fab.offsetWidth;fab.classList.add('ping');
  if(!quiet&&$('auto').checked)$('dr').classList.add('open');
  else if(!$('dr').classList.contains('open')){unread++;badge()}   // entri baru yang belum dilihat
}

/* ---------- SORTING ---------- */
/* ---------- PENGURUTAN: satu implementasi per algoritma, dipakai sortRun (dengan log) dan bench (senyap) ---------- */
const lessFn=(k,d)=>(x,y)=>(typeof x[k]=='string'?COL.compare(x[k],y[k]):x[k]-y[k])*d<0;
/** Hook pencatat. Mode log (fr diberikan) menyimpan teks dan frame animasi, tetapi hanya MAXL baris pertama yang disimpan
 *  (sisanya cukup dihitung); mode senyap hanya menghitung perbandingan (c) dan pertukaran (s). */
function hooks(fr){
  const H={c:0,s:0,nl:0,L:[],
    log(msg,y){H.nl++;if(H.L.length<MAXL)H.L.push({t:typeof msg=='function'?msg():msg,y})},
    swap(a,i,j,msg){[a[i],a[j]]=[a[j],a[i]];H.s++;if(fr){fr(i,j);if(msg)H.log(()=>msg(a))}},
    note(m,y){if(fr)H.log(m,y)},
    frame(i,j){if(fr)fr(i,j)}};
  return H;
}
const SORT={
  bubble(a,less,H){const n=a.length;
    for(let i=0;i<n-1;i++){let f=0;
      for(let j=0;j<n-1-i;j++){H.c++;if(less(a[j+1],a[j])){H.swap(a,j,j+1,a=>`Pass ${i+1} · tukar <b>${a[j+1].nama}</b> ⇄ <b>${a[j].nama}</b>`);f=1}}
      H.note(`Pass ${i+1} selesai`,1);if(!f){H.note('Tidak ada pertukaran, berhenti lebih awal.',1);break}}},
  selection(a,less,H){const n=a.length;
    for(let i=0;i<n-1;i++){let m=i;
      for(let j=i+1;j<n;j++){H.c++;if(less(a[j],a[m]))m=j}
      if(m!=i)H.swap(a,i,m,a=>`Pass ${i+1} · terkecil <b>${a[i].nama}</b> → indeks ${i}`);else H.note(`Pass ${i+1} · indeks ${i} sudah benar`)}},
  insertion(a,less,H){
    for(let i=1;i<a.length;i++){const x=a[i];let j=i-1;
      while(j>=0){H.c++;if(!less(x,a[j]))break;a[j+1]=a[j];H.s++;j--}
      a[j+1]=x;if(j+1!=i){H.frame(j+1,i);H.note(`Sisip <b>${x.nama}</b> dari indeks ${i} ke ${j+1}`)}else H.note(`<b>${x.nama}</b> sudah di tempatnya`)}},
  merge(a,less,H){
    const ms=(lo,hi)=>{if(hi-lo<2)return;const mid=(lo+hi)>>1;ms(lo,mid);ms(mid,hi);
      const l=a.slice(lo,mid),r=a.slice(mid,hi);let i=0,j=0,k=lo;
      while(i<l.length&&j<r.length){H.c++;a[k++]=less(r[j],l[i])?r[j++]:l[i++]}
      while(i<l.length)a[k++]=l[i++];while(j<r.length)a[k++]=r[j++];
      H.s+=hi-lo;H.frame(lo,hi-1);H.note(`Gabung [${lo}..${hi-1}] dari dua bagian terurut (${mid-lo} + ${hi-mid} elemen)`)};
    ms(0,a.length)},
  quick(a,less,H){
    const qs=(lo,hi)=>{if(lo>=hi)return;const pv=a[hi];let i=lo;
      for(let j=lo;j<hi;j++){H.c++;if(less(a[j],pv)){if(i!=j)H.swap(a,i,j);i++}}
      if(i!=hi)H.swap(a,i,hi);H.note(`Partisi [${lo}..${hi}] · pivot <b>${pv.nama}</b> → indeks ${i}`);qs(lo,i-1);qs(i+1,hi)};
    qs(0,a.length-1)}
};
/** Mengurutkan view dengan algoritma terpilih, mencatat log dan frame animasi, lalu menampilkannya. */
function sortRun(){
  const k=$('sk').value,d=+$('sd').value,alg=$('sa').value;let note='';
  if(k=='durasi'&&view.some(t=>!t.durasi)){const k0=view.length;view=view.filter(t=>t.durasi>0);note=`${k0-view.length} tiket tanpa durasi (hotel dan hiburan) dikeluarkan dari urutan`}
  const a=[...view],orig=a.map(t=>t.id);let FR=[],sc=0,stride=1;
  const fr=(i,j)=>{if(sc++%stride)return;FR.push([a.map(t=>t.id),i,j]);if(FR.length>=CFG.sortRecord){FR=FR.filter((_,q)=>q%2==0);stride*=2}};  // rekam frame secara adaptif
  const H=hooks(fr),t0=performance.now();SORT[alg](a,lessFn(k,d),H);const ms=(performance.now()-t0).toFixed(1),L=H.L;
  if(note)L.unshift({t:note,y:1});
  if(k=='harga'&&cat=='semua')L.unshift({t:'Catatan: harga hotel per malam, tiket lain per orang. Perbandingan lintas kategori bersifat indikatif.'});
  view=a;hits=new Set();render();play([[orig,-1,-1],...FR,[a.map(t=>t.id),-1,-1]],k,`${alg} · ${k} ${d>0?'↑':'↓'}`);
  pushLog(`Urutkan: ${$('so').selectedOptions[0].text}`,L,false,{feat:ALG[alg][0],why:ALG[alg][2],total:H.nl,stats:[[a.length,'data'],[H.c.toLocaleString('id-ID'),'perbandingan'],[H.s.toLocaleString('id-ID'),alg=='merge'?'penulisan':alg=='insertion'?'penggeseran':'pertukaran'],[ms,'milidetik'],[ALG[alg][1],'kompleksitas']]});
  $('stat').textContent=`Diurutkan: ${$('so').selectedOptions[0].text}`;
}

/* ---------- SEARCHING ---------- */
/** Linear Search: periksa setiap tiket dari awal sampai akhir.
 *  @param {Array} src data yang dicari
 *  @param {(t:Object)=>[boolean,string]} test mengembalikan [cocok?, keterangan HTML untuk log]
 *  @returns {{found:Array, L:Array, FRs:Array}} hasil, baris log, dan frame animasi */
function linearScan(src,test){
  const st=src.map(()=>0),found=[],L=[],FRs=[],skip=Math.ceil(src.length/CFG.cellFrames);
  src.forEach((t,i)=>{
    const[ok,detail]=test(t);if(ok)found.push(t);st[i]=ok?2:4;
    if(i%skip==0||i==src.length-1){const snap=st.slice();FRs.push({h:()=>snap.map((v,p)=>`<i class="q s${p==i?1:v}"></i>`).join(''),t:`indeks ${i} · ${ok?'cocok':'tidak cocok'}`})}
    L.push({t:`<span class="ix">${i}</span><b>${t.nama}</b>${detail}<span class="rs ${ok?'ok':'no'}">${ok?'cocok':'tidak'}</span>`,y:ok});
  });
  return{found,L,FRs};
}
/** Binary Search (batas bawah): indeks pertama yang memenuhi syarat pada data yang sudah terurut. */
function lowerBound(a,test,describe,target,L,FRb){
  let lo=0,hi=a.length,step=0;
  while(lo<hi){
    const mid=(lo+hi)>>1,ok=test(a[mid]);step++;
    FRb.push(cellF(a.length,lo,hi,mid,'langkah '+step));
    L.push({t:`Langkah ${step} · lo=${lo} hi=${hi} mid=${mid} · <b>${describe(a[mid])}</b> ${ok?'≥':'<'} ${target} → ${ok?'ke kiri':'ke kanan'}`});
    if(ok)hi=mid;else lo=mid+1;
  }
  return{lo,step};
}
/** Titik masuk kolom cari: angka = harga mulai dari (Binary Search); teks mengikuti metode yang dipilih di panel Log. */
function searchRun(){
  const raw=$('q').value.trim();if(!raw)return toast('Isi kata kunci dulu');
  const src=base(),isPrice=/\d/.test(raw)&&/^[\d.\s]{3,}$/.test(raw);
  if(isPrice)return searchBinary(raw,src,false);
  return $('sm').value=='binname'?searchBinary(raw,src,true):searchLinear(raw,src);
}
function searchLinear(raw,src){
  const q=raw.toLowerCase(),{found,L,FRs}=linearScan(src,t=>[(t.nama+' '+t.asal+' '+t.tujuan).toLowerCase().includes(q),'']);
  view=found;hits=new Set(found.map(t=>t.id));$('stat').textContent=`Hasil pencarian: ${found.length}`;render();
  anim(FRs,'Linear Search',1);
  searchLog(`Cari: "${esc(raw)}"`,L,'linear',[[src.length,'data diperiksa'],[found.length,'ditemukan']],'Di sini dicocokkan ke nama, asal, dan tujuan tiket.');
}
function searchBinary(raw,src,byName){
  const L=[],FRb=[],a=[...src],q=raw.toLowerCase(),v=parseInt(raw.replace(/\D/g,''),10),nm=t=>t.nama.toLowerCase(),what=byName?'nama':'harga';
  SORT.insertion(a,byName?(x,y)=>nm(x)<nm(y):lessFn('harga',1),hooks());   // syarat Binary Search: data terurut
  L.push({t:`Data diurutkan menurut ${what} (Insertion Sort), syarat binary search.`,y:1});
  const{lo,step}=lowerBound(a,byName?t=>nm(t)>=q:t=>t.harga>=v,byName?t=>t.nama:t=>rp(t.harga),byName?`"${esc(raw)}"`:rp(v),L,FRb);
  let end=a.length;if(byName){end=lo;while(end<a.length&&nm(a[end]).startsWith(q))end++}
  const found=a.slice(lo,end);
  L.push({t:`Batas bawah di indeks ${lo}: ${found.length} ${byName?`nama diawali "${esc(raw)}"`:`tiket dengan harga ≥ ${rp(v)}`}`,y:1});
  FRb.push(cellEnd(a.length,lo,found.length,'hasil'));
  view=found;hits=new Set(byName?found.map(t=>t.id):[]);$('stat').textContent=`Hasil pencarian: ${found.length}`;render();
  anim(FRb,'Binary Search · '+what,1);
  searchLog(byName?`Cari nama diawali "${esc(raw)}"`:`Cari harga mulai ${rp(v)}`,L,'binary',[[a.length,'data'],[step,'langkah'],[found.length,'ditemukan']],`Data diurutkan menurut ${what} lebih dulu (Insertion Sort), lalu dibelah dua berulang.`);
}

/* ---------- POINTER (simulasi) ---------- */
let ptr=0;const BASE=CFG.base,SZ=CFG.structBytes,addr=i=>'0x'+(BASE+i*SZ).toString(16).toUpperCase();
const mv=d=>{ptr=(ptr+d+tiket.length)%tiket.length;memo();aLog(`ptr ${d>0?'++':'--'}`,[{t:`ptr = ${addr(ptr)} → tiket[${ptr}]`},{t:`*ptr = ${tiket[ptr].nama}`,y:1}])};

function toast(m){const e=$('toast');e.textContent=m;e.classList.add('on');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('on'),1800)}

/* ---------- EVENTS ---------- */
document.addEventListener('click',e=>{
  const c=e.target.closest('[data-c]'),s=e.target.closest('[data-s]'),b=e.target.closest('[data-b]'),v=e.target.closest('[data-v]');
  if(c){cat=c.dataset.c;tabs();reset('Filter kategori · '+c.textContent.trim())}
  if(s){scope=s.dataset.s;tabs();reset('Filter lingkup · '+s.dataset.s)}
  if(b)openM(+b.dataset.b);
  if(v)show(v.dataset.v);
});
$('so').onchange=sortChoice;$('bs').onclick=searchRun;$('br').onclick=()=>{$('q').value='';$('fa').value='';$('fb').value='';reset('Reset hasil pencarian')};
$('q').onkeydown=e=>{if(e.key=='Enter')searchRun()};
$('sm').onchange=()=>{cxu();if($('q').value.trim())searchRun()};$('sa').onchange=()=>{cxu();if($('so').value!='rek')sortRun()};
$('fab').onclick=()=>$('dr').classList.toggle('open');$('lh').onclick=()=>$('dr').classList.remove('open');
$('lx').onclick=()=>{$('log').innerHTML='<div class="none">Log dibersihkan.</div>'};
$('pp').onclick=()=>mv(1);$('pm').onclick=()=>mv(-1);

/* ---------- TAMPILAN & ALUR PESAN ---------- */
const svg=p=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const ICONP={semua:'<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
pesawat:'<path d="M21 3L3 10.5l7 2.5 2.5 7L21 3z"/>',
kereta:'<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M8 21l2-4M16 21l-2-4"/><circle cx="9" cy="14" r=".8"/><circle cx="15" cy="14" r=".8"/>',
bus:'<rect x="3" y="4" width="18" height="13" rx="3"/><path d="M3 11h18M7 20v-3M17 20v-3"/>',
kapal:'<path d="M3 16h18l-2 4H5l-2-4zM12 3v9M12 5l5 7H7z"/>',
hotel:'<path d="M3 20V8l9-5 9 5v12M9 20v-6h6v6"/>',
mobil:'<path d="M4 16v-3l2-5h12l2 5v3M4 16h16M4 16v3h3v-3M17 16v3h3v-3"/><circle cx="8" cy="13" r=".8"/><circle cx="16" cy="13" r=".8"/>',
wisata:'<path d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
hiburan:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'};
const ICON=Object.fromEntries(Object.entries(ICONP).map(([k,v])=>[k,svg(v)]));
const LOCT=['hotel','hiburan','mobil','wisata'],STAY=['hotel','mobil'];
const H={semua:['Jelajah','Ke mana kita pergi?','Satu tempat untuk semua perjalananmu.'],pesawat:['Pesawat','Terbang lebih dekat.','Penerbangan domestik dan mancanegara.'],kereta:['Kereta','Menyusuri rel, menikmati jalan.','Dari Sancaka hingga Shinkansen.'],bus:['Bus','Santai di jalur darat.','Antarkota dan lintas negara.'],kapal:['Kapal','Menyeberang dengan tenang.','Pelni, feri, dan jalur ke Singapura.'],hotel:['Hotel','Istirahat yang layak.','Dari hotel bersejarah hingga resor tepi pantai.'],hiburan:['Hiburan','Liburan jadi lebih seru.','Taman bermain, festival, dan wahana dunia.'],mobil:['Sewa Mobil','Bebas atur perjalananmu.','Mobil harian, lepas kunci atau dengan sopir.'],wisata:['Paket Wisata','Satu paket, semua beres.','Tur terpandu dalam dan luar negeri.']};
/** Memperbarui hero (teks, ikon, statistik) sesuai kategori aktif. */
function hero(){
  document.body.dataset.k=cat;const loc=LOCT.includes(cat);$('la').textContent=loc?'Lokasi':'Dari';$('lb').textContent=loc?'Nama (opsional)':'Ke';$('fb').placeholder=loc?'mis. Hilton, Avanza':'Tujuan atau lokasi';const[a,b,c]=H[cat],bs=base(),fx=[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}];
  $('hk').textContent=a;$('h1').textContent=b;$('hs').textContent=c;$('hbg').innerHTML=ICONP[cat];
  $('stats').innerHTML=bs.length?`<div><b data-n="${bs.length}">${bs.length}</b><span>pilihan</span></div>`+(cat=='semua'?'':`<div><b data-n="${Math.min(...bs.map(t=>t.harga))}" data-f="rp">${rp(Math.min(...bs.map(t=>t.harga)))}</b><span>termurah</span></div><div><b data-n="${Math.max(...bs.map(t=>t.rating))}" data-f="r">★ ${Math.max(...bs.map(t=>t.rating)).toFixed(1)}</b><span>rating tertinggi</span></div>`):'';countUp();
  ['h1','hs','stats'].forEach(i=>$(i).animate(fx,{duration:480,easing:'ease-out'}));
}
function show(n){
  document.querySelectorAll('.nav button').forEach(x=>x.classList.toggle('on',x.dataset.v==n));
  ['tiket','pesanan','konsep'].forEach(m=>$(m).style.display=m==n?'block':'none');const sec=$(n);sec.classList.remove('vin');void sec.offsetWidth;sec.classList.add('vin');
  if(n=='pesanan')renderOrders();scrollTo(0,0);aLog('Pindah tampilan · '+n,[{t:`Tampilan aktif: <b>${n}</b>`},{t:n=='pesanan'?`Traversal linked list dari head, ${LL.size} node`:'Data array tiket[] tidak berubah',y:1}]);
}
const esc=s=>String(s).replace(/[<>&"]/g,c=>'&#'+c.charCodeAt(0)+';');
/* POINTER NYATA: linked list, tiap node menyimpan referensi next */
const LL={head:null,size:0,
  push(d){this.head={data:d,next:this.head};this.size++},
  remove(code){let p=null,c=this.head;while(c){if(c.data.code==code){if(p)p.next=c.next;else this.head=c.next;this.size--;return}p=c;c=c.next}},
  all(){const r=[];for(let c=this.head;c;c=c.next)r.push(c.data);return r}};
const save=()=>{try{localStorage.setItem('psn',JSON.stringify(LL.all().map(o=>({code:o.code,id:o.t.id,qty:o.qty,dt:o.dt,total:o.total,nama:o.nama,info:o.info,rv:o.rv}))))}catch(e){}};
const CODE_CHARS='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // 32 karakter: tidak ada bias saat memakai sisa bagi dari byte acak
/** Kode booking dari generator acak kriptografis (bukan Math.random yang bisa ditebak). */
const newCode=()=>'PSN-'+Array.from(crypto.getRandomValues(new Uint8Array(6)),b=>CODE_CHARS[b%32]).join('');
/** Memulihkan pesanan dari localStorage. Data diperiksa bentuknya; entri yang salah atau diubah manual dibuang. */
function restoreOrders(){
  try{
    const saved=JSON.parse(localStorage.getItem('psn')||'[]'),isDate=d=>/^\d{4}-\d{2}-\d{2}$/.test(d);
    if(!Array.isArray(saved))return;
    const valid=o=>o&&/^PSN-[A-Z0-9]{6}$/.test(o.code)&&Number.isInteger(o.id)&&tiket[o.id]&&Number.isInteger(o.qty)&&o.qty>=1&&o.qty<=9&&Number.isFinite(o.total)&&o.total>=0&&o.total<1e11&&isDate(o.dt)&&(!o.rv||isDate(o.rv))&&typeof o.nama=='string';
    saved.filter(valid).reverse().forEach(o=>LL.push({code:o.code,t:tiket[o.id],qty:o.qty,dt:o.dt,rv:o.rv||'',total:o.total,nama:o.nama.slice(0,60),info:String(o.info||'').slice(0,160)}));
  }catch(e){}
}
restoreOrders();
let cur=null,qty=1,dtv='',NM='',PM='Transfer Bank',rtv='',rt=false,SEAT=[],SEATB=[],ST='pergi';
const today=()=>new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
function upd(){$('oc').textContent=LL.size;$('oc').hidden=!LL.size;$('oc').classList.remove('bump');void $('oc').offsetWidth;$('oc').classList.add('bump');save();drawLL()}
function openM(id){cur=tiket[id];qty=+$('fp').value||1;dtv=$('fd').value||today();rt=false;SEAT=[];SEATB=[];ST='pergi';rtv=addDays(dtv,cur.tipe=='hotel'?1:cur.tipe=='mobil'?2:3);$('md').dataset.k=cur.tipe;drawM();$('md').setAttribute('role','dialog');$('md').setAttribute('aria-modal','true');$('md').tabIndex=-1;$('md').focus();$('ov').classList.add('on');aLog(`Buka detail · ${cur.nama}`,[{t:`Akses langsung <b>tiket[${id}]</b> lewat indeks · O(1)`},{t:`Struct: tipe=${cur.tipe}, lingkup=${cur.lingkup}, harga=${cur.harga}, rating=${cur.rating}`,y:1}])}
function closeM(){$('ov').classList.remove('on')}
/** Menggambar jendela pemesanan (tanggal, jumlah, kursi, nama, pembayaran, total). */
function drawM(){
  SEAT=SEAT.slice(0,qty);SEATB=SEATB.slice(0,qty);
  const t=cur,hot=STAY.includes(t.tipe),mob=t.tipe=='mobil',route=t.tujuan!=='',sea=SEATED(),c=calc();
  const row=(l,r)=>`<div class="row"><span>${l}</span>${r}</div>`;
  const inp=(id,v,mn)=>`<input type="date" id="${id}" min="${mn}" value="${v}" style="flex:none;width:150px">`;
  $('md').innerHTML=`<div class="top" style="padding:0 0 12px"><div class="ic">${ICON[t.tipe]}</div><div><h3 style="margin:0">${t.nama}</h3><div class="mini">${route?t.asal+' → '+t.tujuan:t.asal}</div></div></div>
  ${route?`<div class="seg"><button class="${rt?'':'on'}" data-a="rt0">Sekali jalan</button><button class="${rt?'on':''}" data-a="rt1">Pulang-pergi</button></div>`:''}
  ${row(mob?'Ambil mobil':hot?'Check-in':route?'Berangkat':'Tanggal kunjungan',inp('dt',dtv,today()))}
  ${hot?row(mob?'Kembali':'Check-out',inp('rv',rtv,addDays(dtv,1))):rt?row('Pulang',inp('rv',rtv,dtv)):''}
  ${row(mob?'Mobil':hot?'Kamar':route?'Penumpang':'Tiket',`<div class="qty"><button data-a="m">−</button><b>${qty}</b><button data-a="p">+</button></div>`)}
  ${sea?`<div class="mini" style="margin-top:12px;text-align:center">${rt?`<div class="seg" style="margin-bottom:6px"><button class="${ST=='pergi'?'on':''}" data-a="st0">Kursi pergi ${SEAT.length}/${qty}</button><button class="${ST=='pulang'?'on':''}" data-a="st1">Kursi pulang ${SEATB.length}/${qty}</button></div>`:`Pilih kursi (${SEAT.length}/${qty})`} · ${LAY[t.tipe].t}</div>${seatMap()}<div class="lg"><span>Kosong</span><span>Dipilih</span><span>Terisi</span></div>`:''}
  ${row('Nama pemesan',`<input id="nm" maxlength="60" autocomplete="name" value="${esc(NM)}" placeholder="Sesuai identitas" style="flex:none;width:170px">`)}
  ${row('Pembayaran',`<select id="pay_m" style="flex:none;width:170px">${['Transfer Bank','E-Wallet','Kartu Kredit'].map(x=>`<option ${x==PM?'selected':''}>${x}</option>`).join('')}</select>`)}
  <div class="row"><span class="mini">${hot?`${rp(t.harga)} × ${c.nights} ${mob?'hari':'malam'} × ${qty} ${mob?'mobil':'kamar'}`:`${rp(t.harga)} × ${c.m}`}</span></div>
  <div class="row" style="border:0"><b>Total</b><b style="font-size:20px">${rp(c.total)}</b></div>
  <div style="display:flex;gap:8px;margin-top:10px"><button class="go ghost" data-a="x">Batal</button><button class="go" style="flex:1;background:var(--a);color:#fff" data-a="ok">Pesan sekarang</button></div>`;
  const min=hot?addDays(dtv,1):dtv;
  $('dt').onchange=e=>{dtv=e.target.value||today();const m2=hot?addDays(dtv,1):dtv;if(rtv<m2)rtv=m2;drawM();aLog('Tanggal diubah',[{t:`berangkat / check-in = ${dtv}`},{t:`calc(): total <b>${rp(calc().total)}</b>`,y:1}])};
  if($('rv'))$('rv').onchange=e=>{rtv=e.target.value>=min?e.target.value:min;drawM();aLog('Tanggal kembali diubah',[{t:`pulang / check-out = ${rtv}`},{t:`calc(): total <b>${rp(calc().total)}</b>`,y:1}])};
  $('nm').oninput=e=>NM=e.target.value;$('nm').onchange=()=>aLog('Nama pemesan diisi',[{t:`NM = "${esc(NM)}"`}]);$('pay_m').onchange=e=>PM=e.target.value;
}
/** Menyimpan pesanan ke linked list (LL.push) lalu menampilkan layar sukses. */
function book(){
  const code=newCode();
  const cc=calc();LL.push({code,t:cur,qty,dt:dtv,total:cc.total,nama:NM,info:cc.info,rv:STAY.includes(cur.tipe)||(rt&&cur.tujuan!=='')?rtv:''});upd();aLog(`Pesanan ${code}`,[{t:'<b>LL.push()</b>: node baru dibuat, <b>next</b> menunjuk head lama'},{t:'head dipindah ke node baru · O(1)'},{t:`Ukuran list = ${LL.size} node`,y:1}]);
  $('md').innerHTML=`<div class="ok"><div class="chk">${svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>')}${conf()}</div><h3>Pesanan berhasil</h3><div class="code">${code}</div><p class="mini">${cur.nama}<br>a.n. ${esc(NM)} · ${PM}<br>${dtv} · ${esc(cc.info)}<br><b style="font-size:16px;color:var(--ink)">${rp(cc.total)}</b></p>
  <div style="display:flex;gap:8px;justify-content:center;margin-top:14px"><button class="go ghost" data-a="x">Lanjut jelajah</button><button class="go" style="background:var(--a);color:#fff" data-a="go">Lihat pesanan</button></div></div>`;
}
function renderOrders(){
  const all=LL.all();
  $('ol').innerHTML=all.length?all.map((o,i)=>{const t=o.t,ch=(o.info||'').split(' · ').filter(Boolean);
    return `<div class="oc" data-k="${t.tipe}" style="--i:${i}"><div class="oc-m"><div class="oc-h"><div class="ic">${ICON[t.tipe]}</div><div><strong>${nb(t.nama)}</strong><div class="mini">${TN[t.tipe]} · ${t.tujuan===''?t.asal:t.asal+' → '+t.tujuan}</div></div><span class="st">Terkonfirmasi</span></div>
      <div class="oc-c"><span>${o.code}</span><span>${o.dt}${o.rv?' → '+o.rv:''}</span>${ch.map(c=>`<span>${esc(c)}</span>`).join('')}<span>a.n. ${esc(o.nama)}</span></div></div>
      <div class="oc-r"><div class="mini">Total</div><strong class="tot">${rp(o.total)}</strong><div class="oc-b"><button class="go ghost" data-a="tk:${o.code}">E-tiket</button><button class="go ghost" data-x="${o.code}">Batalkan</button></div></div></div>`}).join('')
    +`<div class="row ord-total"><b>Total pesanan</b><b>${rp(all.reduce((a,o)=>a+o.total,0))}</b></div>`
    :`<div class="empty-o"><div class="ic big">${ICON.pesawat}</div><h3>Belum ada pesanan</h3><p>Pilih tiket favoritmu, lalu pesananmu muncul di sini.</p><button class="go" data-a="back">Jelajahi tiket</button></div>`;
}
function act(a){
  if(a=='m'){qty=Math.max(1,qty-1);drawM()}else if(a=='p'){qty=Math.min(9,qty+1);drawM()}
  else if(a=='x')closeM();else if(a=='ok')pay();
  else if(a=='go'){closeM();show('pesanan')}else if(a=='back')show('tiket');else if(a=='rt0'||a=='rt1'){rt=a=='rt1';if(!rt)ST='pergi';drawM()}else if(a.startsWith('op:'))showOptions(a.slice(3));else if(a.startsWith('tk:'))showTicket(a.slice(3));else if(a=='print')window.print();else if(a=='st0'||a=='st1'){ST=a=='st1'?'pulang':'pergi';drawM()}else if(a.startsWith('s:')){const S=cs(),x=a.slice(2),i=S.indexOf(x);if(i>=0)S.splice(i,1);else if(S.length<qty)S.push(x);else toast(`Maksimal ${qty} kursi`);drawM()}else if(a.startsWith('more:')){PGS[a.slice(5)]+=CFG.pageSize;render(true)}else if(a.startsWith('sc:')){scope=a.slice(3);tabs();kotaList();reset('Pindah ke tiket '+scope)}
}
document.addEventListener('click',e=>{
  const a=e.target.closest('[data-a]'),x=e.target.closest('[data-x]');
  if(a)act(a.dataset.a);
  if(x){LL.remove(x.dataset.x);aLog('Batalkan '+x.dataset.x,[{t:'<b>LL.remove()</b>: telusuri node dengan pointer prev dan curr · O(n)'},{t:'prev.next dilewatkan ke curr.next, node dilepas',y:1},{t:`Ukuran list = ${LL.size} node`}]);upd();renderOrders();toast('Pesanan dibatalkan')}
  if(e.target==$('ov'))closeM();
});
document.addEventListener('keydown',e=>{if(e.key=='Escape')closeM()});

/* ---------- PENCARIAN, FILTER, ANIMASI SORTING ---------- */
const jam=(t,e)=>{const m=((6+t.id*7%16)*60+t.id*13%4*15+(e?t.durasi:0))%1440;return String(m/60|0).padStart(2,'0')+':'+String(m%60).padStart(2,'0')};
/** Memvalidasi nama dan kursi, lalu mensimulasikan pembayaran. */
function pay(){
  if(!NM.trim()){$('nm').focus();return toast('Isi nama pemesan dulu')}
  if(SEATED()&&(SEAT.length!=qty||(rt&&SEATB.length!=qty)))return toast(`Pilih ${qty} kursi pergi${rt?` dan ${qty} kursi pulang`:''} dulu`);
  $('md').innerHTML=`<div class="ok"><div class="spin"></div><h3>Memproses pembayaran</h3><p class="mini">${PM}</p></div>`;setTimeout(book,1300);
}
let vt;
/** Animasi batang pengurutan. Frame dipilih merata dari seluruh proses; HTML tiap frame dibuat saat diputar (lazy). */
function play(fr,k,lab){
  const tot=fr.length-1,N=CFG.sortFrames;fr=fr.map((f,j)=>[...f,j]);
  if(fr.length>N){const st=tot/(N-1);fr=Array.from({length:N},(_,i)=>fr[Math.round(i*st)])}
  const num=typeof tiket[0][k]=='number',mx=Math.max(...tiket.map(t=>t[k]));
  const rk=num?null:new Map([...tiket].sort((x,y)=>COL.compare(x[k],y[k])).map((t,i)=>[t.id,i+1]));
  const val=id=>num?tiket[id][k]/mx:rk.get(id)/tiket.length;
  anim(fr.map(([ids,x,y,j])=>({h:()=>ids.map((id,p)=>`<i class="${j==tot?'ok':p==x||p==y?'sw':''}" style="height:${Math.max(6,val(id)*100)}%"></i>`).join(''),t:j==0?'data awal':j==tot?'selesai':`tahap ${j}/${tot-1}`})),lab,0);
}
/** Tooltip dan ringkasan metode yang sedang dipilih di panel Log. */
function cxu(){
  $('sa').title=ALG[$('sa').value][2];$('sm').title=ALG[$('sm').value=='binname'?'binary':$('sm').value][2];
  $('cfgs').textContent='Metode: '+$('sa').selectedOptions[0].text+' · '+$('sm').selectedOptions[0].text;
}
$('kota').innerHTML=[...new Set(tiket.flatMap(t=>[t.asal,t.tujuan]).filter(Boolean))].sort().map(c=>`<option value="${c}">`).join('');
$('fd').value=today();$('fd').min=today();
$('fs').onclick=()=>{runForm('');$('cnt').scrollIntoView({behavior:'smooth',block:'start'})};
$('fh').onchange=()=>{F.h=+$('fh').value;reset('Filter harga maksimum')};$('fr').onchange=()=>{F.r=+$('fr').value;reset('Filter rating minimum')};

/* ---------- PERBANDINGAN ALGORITMA ---------- */
function bench(){
  vizOff();const k=$('sk').value,d=+$('sd').value,n=view.length,less=lessFn(k,d),out=[];
  for(const alg of Object.keys(SORT)){const a=[...view],H=hooks(),t0=performance.now();SORT[alg](a,less,H);out.push([alg,H.c,H.s,(performance.now()-t0).toFixed(2)])}
  const best=Math.min(...out.map(o=>o[1]));
  pushLog(`Perbandingan algoritma · ${k} ${d>0?'naik':'turun'}<br><span style="font-weight:400">${n} data pada urutan saat ini</span>`,
    [{t:`<table class="bt"><tr><th>Metode</th><th>Banding</th><th>Tukar/geser</th><th>ms</th></tr>${out.map(o=>`<tr class="${o[1]==best?'best':''}"><td>${o[0]}</td><td>${o[1]}</td><td>${o[2]}</td><td>${o[3]}</td></tr>`).join('')}</table>`},
     {t:'Baris hijau: perbandingan paling sedikit. Coba urutkan dulu, lalu bandingkan lagi pada data yang sudah terurut.'}]);
}
$('bb').onclick=bench;

/* ---------- KURSI, PULANG-PERGI, HARGA HOTEL ---------- */
const addDays=(d,n)=>{const x=new Date(d);x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10)};
const cs=()=>rt&&ST=='pulang'?SEATB:SEAT;
const SEATED=()=>['pesawat','kereta','bus'].includes(cur.tipe);
/** Menghitung total pesanan: tarif x penumpang x (2 bila pulang-pergi); hotel/mobil: tarif x malam/hari x jumlah. */
function calc(){
  const t=cur,hot=STAY.includes(t.tipe),nights=Math.max(1,Math.round((new Date(rtv)-new Date(dtv))/864e5));let m,info;
  if(hot){m=nights*qty;info=t.tipe=='mobil'?`${nights} hari · ${qty} mobil`:`${nights} malam · ${qty} kamar`}
  else if(t.tujuan===''){m=qty;info=`${qty} tiket`}
  else{m=qty*(rt?2:1);info=`${rt?'Pulang-pergi':'Sekali jalan'} · ${qty} penumpang`+(SEAT.length?` · kursi ${SEAT.join(', ')}${rt&&SEATB.length?' / pulang '+SEATB.join(', '):''}`:'')}
  return{m,nights,info,total:t.harga*m};
}
const LAY={pesawat:{g:['ABC','DEF'],r:8,t:'kabin ekonomi, hidung pesawat di atas'},kereta:{g:['AB','CD'],r:8,t:'gerbong 1, arah laju di atas'},bus:{g:['AB','C'],r:7,t:'sopir di bagian atas'}};
/** Denah kursi sesuai kendaraan (lihat LAY); kursi terisi ditentukan tetap per tiket. */
function seatMap(){
  const L=LAY[cur.tipe];let ci=0,h='<div class="seats">'+(cur.tipe=='bus'?'<div class="drv">Sopir</div>':'');
  for(let r=1;r<=L.r;r++){ci=0;h+='<div class="sr">'+L.g.map((g,gi)=>(gi?'<span class="gap"></span>':'')+[...g].map(c=>{
    const id=c+r,occ=(cur.id*31+r*7+(ci++)*13+(rt&&ST=='pulang'?3:0))%5===0,on=cs().includes(id);
    return `<button class="seat ${occ?'occ':''} ${on?'on':''}" ${occ?'disabled':''} data-a="s:${id}">${id}</button>`}).join('')).join('')+'</div>'}
  return h+'</div>';
}

/* ---------- LOG PER TINDAKAN & PEMUTAR ANIMASI ---------- */
let lastA=null;
const vizOff=()=>{clearTimeout(vt);$('vz').classList.remove('on');$('viz').classList.remove('on')};
const aLog=(t,l)=>{vizOff();pushLog(t,l,true)};
/** Memutar frame animasi di panel Log. Frame = {h, t}: h = HTML atau fungsi penghasil HTML, t = keterangan. */
function anim(frames,lab,cells){
  clearTimeout(vt);lastA=[frames,lab,cells];
  const V=$('viz'),html=f=>typeof f.h=='function'?f.h():f.h,n=(html(frames[0]).match(/<i/g)||[]).length;
  V.style.gap=cells?(n>200?'2px':'3px'):(n>90?'0':'2px');V.style.setProperty('--q',(n>500?3:n>250?4:n>120?6:9)+'px');
  V.classList.toggle('cells',!!cells);V.classList.add('on');$('vz').classList.add('on');
  let i=0;const step=()=>{const f=frames[i];V.innerHTML=html(f);$('vs').textContent=`${lab} · ${f.t}`;if(++i<frames.length)vt=setTimeout(step,Math.max(14,CFG.animMs/frames.length))};step();
}
$('vr').onclick=()=>lastA&&anim(...lastA);
const cellF=(n,lo,hi,mid,t)=>({h:()=>Array.from({length:n},(_,p)=>`<i class="q s${p==mid?1:p<lo||p>=hi?3:0}"></i>`).join(''),t});
const cellEnd=(n,lo,k,t)=>({h:()=>Array.from({length:n},(_,p)=>`<i class="q s${p>=lo&&p<lo+k?2:3}"></i>`).join(''),t});
const _act=act;
act=a=>{_act(a);
  if(a=='m'||a=='p')aLog('Jumlah diubah',[{t:`qty = ${qty}`},{t:`calc(): ${rp(cur.harga)} × ${calc().m} = <b>${rp(calc().total)}</b>`,y:1}]);
  else if(a=='rt0'||a=='rt1')aLog('Jenis perjalanan',[{t:rt?'Pulang-pergi: pengali tarif = 2':'Sekali jalan: pengali tarif = 1'},{t:`Total: <b>${rp(calc().total)}</b>`,y:1}]);
  else if(a.startsWith('s:'))aLog('Pilih kursi',[{t:`kursi ${rt?ST:'pergi'} = [${cs().join(', ')}] (${cs().length}/${qty})`,y:cs().length==qty}]);
  else if(a.startsWith('tk:'))aLog('Lihat e-tiket '+a.slice(3),[{t:'Telusuri linked list dari head sampai kode cocok · O(n)'},{t:`Node ditemukan, ${LL.size} node di dalam list`,y:1}]);
  else if(a=='x')aLog('Modal ditutup',[{t:'Tidak ada node baru ditambahkan ke linked list'}]);
  else if(a.startsWith('more:'))aLog('Tampilkan lebih banyak',[{t:`slice(0, ${PGS[a.slice(5)]}) pada kelompok ${a.slice(5)}`,y:1}]);
};
function drawLL(){
  const a=LL.all();
  $('ll').innerHTML=a.length?`<div class="lln"><div class="nd hd"><div><b>head</b></div></div>`+a.slice(0,8).map((o,i)=>`<span class="ar">→</span><div class="nd" style="--n:${i+1}"><div><b>${o.code}</b></div><div>${esc(o.t.nama.slice(0,16))}</div></div>`).join('')+(a.length>8?'<span class="ar">…</span>':'<span class="ar">→</span><div class="nd"><div>null</div></div>')+'</div>'
  :'<div class="lln"><div class="nd hd"><div><b>head</b></div></div><span class="ar">→</span><div class="nd"><div>null</div></div></div><p class="mini" style="margin:8px 0 0">Belum ada pesanan. Pesan tiket untuk menambah node.</p>';
}
/** Menggambar blok array dan tabel ptr-> pada tab Konsep Data. */
function memo(){
  const s=Math.max(0,Math.min(ptr-3,tiket.length-8)),t=tiket[ptr];
  $('mem').innerHTML='<div class="blocks">'+tiket.slice(s,s+8).map(x=>`<div class="blk ${x.id==ptr?'cur':''}"><em>${x.id==ptr?'▼ ptr':''}</em><b>[${x.id}] ${addr(x.id)}</b><span title="${esc(x.nama)}">${x.nama.replace(/-(?=\d)/g,'\u2011')}</span></div>`).join('')+'</div>';
  $('pv').innerHTML=`<div style="font:600 15px ui-monospace,monospace;margin-bottom:8px">ptr = ${addr(ptr)}</div><table class="ft">${[['id','+0',t.id],['tipe','+4',t.tipe],['lingkup','+16',t.lingkup],['nama','+30',t.nama],['asal','+70',t.asal],['tujuan','+90',t.tujuan||'—'],['harga','+112',t.harga],['durasi','+120',t.durasi],['rating','+124',t.rating]].map((r,i)=>`<tr style="--r:${i}"><td>ptr->${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</table>`;
}
document.addEventListener('keydown',e=>{
  if(e.key!='Tab'||!$('ov').classList.contains('on'))return;
  const f=[...$('md').querySelectorAll('button:not(:disabled),input,select')];if(!f.length)return;
  const a=f[0],z=f[f.length-1],cur2=document.activeElement;
  if(!$('md').contains(cur2)||cur2==$('md')){e.preventDefault();(e.shiftKey?z:a).focus()}
  else if(e.shiftKey&&cur2==a){e.preventDefault();z.focus()}
  else if(!e.shiftKey&&cur2==z){e.preventDefault();a.focus()}
});
function kotaList(){
  $('kota').innerHTML=[...new Set(tiket.filter(t=>(scope=='semua'||t.lingkup==scope)&&(cat=='semua'||t.tipe==cat)).flatMap(t=>[t.asal,t.tujuan]).filter(Boolean))].sort().map(c=>`<option value="${c}">`).join('');
}
/* form Dari/Ke = Linear Search pada hasil filter kategori, lingkup, harga, rating */
let Q={a:'',b:''};
const tb=t=>t.tujuan===''?t.nama+' '+t.asal:t.tujuan;   // kolom 'Ke': tujuan, atau nama untuk tiket berbasis lokasi
const qm=t=>(!Q.a||t.asal.toLowerCase().includes(Q.a))&&(!Q.b||tb(t).toLowerCase().includes(Q.b));
/** Form Dari/Ke: Linear Search pada hasil filter kategori, lingkup, harga, dan rating. */
function runForm(why){
  const A=$('fa').value.trim(),B=$('fb').value.trim();Q={a:A.toLowerCase(),b:B.toLowerCase()};
  if(!A&&!B){reset(why||'Form pencarian dikosongkan');return}
  const src=base(),{found,L,FRs}=linearScan(src,t=>{
    const oa=!Q.a||t.asal.toLowerCase().includes(Q.a),ob=!Q.b||tb(t).toLowerCase().includes(Q.b);
    return[oa&&ob,`<span class="mt">asal ${oa?'✓':'✗'} · tujuan ${ob?'✓':'✗'}</span>`];
  });
  view=mix(found);hits=new Set();PGS=freshPages();$('stat').textContent=`Hasil rute: ${found.length}`;render();
  if(why&&why!='Form pencarian rute')L.unshift({t:`Dipicu oleh: ${esc(why)}`});
  anim(FRs,'Linear Search · rute',1);
  pushLog(`Cari rute: ${esc(A)||'semua'} → ${esc(B)||'semua'}`,L,!!why,{feat:ALG.linear[0],why:ALG.linear[2]+' Di sini dipakai untuk mencocokkan kota asal dan tujuan.',stats:[[src.length,'data diperiksa'],[found.length,'ditemukan'],[ALG.linear[1],'kompleksitas']]});
  toast(found.length?`${found.length} tiket ditemukan`:'Tidak ada tiket yang cocok');
}
new MutationObserver(()=>{const open=$('dr').classList.contains('open');document.body.classList.toggle('logopen',open);if(open){unread=0;badge()}}).observe($('dr'),{attributes:true,attributeFilter:['class']});   // pengganti :has()
const badge=()=>{$('lc').textContent=unread;$('lc').hidden=!unread};
/* ---------- PILIHAN PER RUTE ---------- */
function showOptions(k){
  const items=view.filter(t=>gkey(t)==k);if(!items.length)return;const t0=items[0];
  $('md').dataset.k=t0.tipe;
  $('md').innerHTML=`<div class="top" style="padding:0 0 10px"><div class="ic">${ICON[t0.tipe]}</div><div><h3 style="margin:0">${t0.asal} → ${t0.tujuan}</h3><div class="mini">${TN[t0.tipe]} · ${items.length} pilihan · urutan mengikuti pengurutan aktif</div></div></div>
  <div class="opts">${items.map(x=>`<div class="opt-r"><div><b>${nb(x.nama)}</b><div class="mini">${jam(x,0)} → ${jam(x,1)} · ${dur(x.durasi)} · ★ ${x.rating.toFixed(1)}</div></div><div style="text-align:right"><b>${rp(x.harga)}</b><br><button class="go" style="background:var(--a);color:#fff;margin-top:4px" data-b="${x.id}">Pesan</button></div></div>`).join('')}</div>
  <button class="go ghost" style="width:100%;margin-top:12px" data-a="x">Tutup</button>`;
  $('md').setAttribute('role','dialog');$('md').setAttribute('aria-modal','true');$('ov').classList.add('on');
  aLog(`Pilihan rute ${t0.asal} → ${t0.tujuan}`,[{t:`groups(): kelompokkan view[] dengan kunci "${k}" · O(n)`},{t:`${items.length} pilihan, mengikuti urutan view saat ini`,y:1}]);
}
/* ---------- E-TIKET ---------- */
const barcode=c=>{let x=0,h='';for(const ch of c+c){const n=ch.charCodeAt(0);for(let b=0;b<4;b++){const w=1+((n>>b)&1)+(b%2);if(b%2==0)h+=`<rect x="${x}" y="0" width="${w}" height="46"/>`;x+=w}}return `<svg viewBox="0 0 ${x} 46" preserveAspectRatio="none" style="width:100%;height:46px;fill:currentColor">${h}</svg>`};
/** Menampilkan e-tiket satu pesanan lengkap dengan barcode dari kode booking. */
function showTicket(code){
  const o=LL.all().find(x=>x.code==code);if(!o)return;const t=o.t,route=t.tujuan!=='';
  $('md').dataset.k=t.tipe;
  $('md').innerHTML=`<div class="et"><div class="et-h"><div class="ic">${ICON[t.tipe]}</div><div><b>${nb(t.nama)}</b><div class="mini">${TN[t.tipe]} · ${t.lingkup=='internasional'?'Internasional':'Nasional'}</div></div></div>
  ${route?`<div class="route"><b>${t.asal}<small>${jam(t,0)}</small></b><i><u>${dur(t.durasi)}</u></i><b>${t.tujuan}<small>${jam(t,1)}</small></b></div>`:`<div class="loc" style="padding:0 0 10px">${t.asal}</div>`}
  <div class="et-g"><div><span>Tanggal</span>${o.dt}${o.rv?' → '+o.rv:''}</div><div><span>Pemesan</span>${esc(o.nama)}</div><div style="grid-column:1/-1"><span>Rincian</span>${esc(o.info||'')}</div><div><span>Total</span><b>${rp(o.total)}</b></div></div>
  <div class="et-b">${barcode(o.code)}<div class="code">${o.code}</div></div>
  <div style="display:flex;gap:8px"><button class="go ghost" data-a="x">Tutup</button><button class="go" style="flex:1;background:var(--a);color:#fff" data-a="print">Cetak</button></div></div>`;
  $('ov').classList.add('on');
}
const ALG={bubble:['Bubble Sort','O(n²)','Membandingkan dua tiket yang bersebelahan, lalu menukarnya bila salah urutan. Diulang sampai tidak ada yang perlu ditukar.'],
  selection:['Selection Sort','O(n²)','Mencari tiket yang paling tepat dari sisa data, lalu menaruhnya di posisi berikutnya.'],
  insertion:['Insertion Sort','O(n²)','Mengambil satu tiket lalu menyisipkannya ke tempat yang tepat di antara tiket yang sudah rapi.'],
  merge:['Merge Sort','O(n log n)','Membagi data menjadi dua bagian, mengurutkan masing-masing, lalu menggabungkannya kembali.'],
  quick:['Quick Sort','O(n log n) rata-rata','Memilih satu tiket sebagai pivot, memisahkan yang lebih kecil dan lebih besar, lalu mengulanginya di tiap bagian.'],
  linear:['Linear Search','O(n)','Memeriksa tiket satu per satu dari awal sampai akhir. Cocok untuk data yang belum terurut.'],
  binary:['Binary Search','O(log n)','Membelah data yang sudah terurut menjadi dua berulang kali, sehingga hanya perlu sekitar log₂(n) langkah.']};
const SOMAP={'harga-asc':['harga',1],'harga-desc':['harga',-1],'durasi-asc':['durasi',1],'rating-desc':['rating',-1],'nama-asc':['nama',1]};
function sortChoice(){const v=$('so').value;if(v=='rek'){reset('Urutan: rekomendasi');return}const[k,d]=SOMAP[v];$('sk').value=k;$('sd').value=String(d);sortRun()}
function searchLog(title,L,key,stats,note){pushLog(title,L,false,{feat:ALG[key][0],why:ALG[key][2]+' '+note,stats:[...stats,[ALG[key][1],'kompleksitas']]})}
$('slog').onclick=()=>$('dr').classList.add('open');$('auto').checked=innerWidth>=1280;   // layar sempit: log tidak membuka sendiri agar tidak menutupi kontrol

let CXA={};
/* urutan awal tampilan ("rekomendasi"): rating tertinggi dulu; pada kategori Semua selang-seling antar jenis.
   Memakai sort bawaan JavaScript hanya untuk tampilan awal, bukan bagian algoritma tugas. */
const mix=a=>{
  const by=(x,y)=>y.rating-x.rating||x.id-y.id;
  if(cat!='semua')return[...a].sort(by);
  const g={};a.forEach(t=>(g[t.tipe]=g[t.tipe]||[]).push(t));const ks=Object.keys(g);ks.forEach(k=>g[k].sort(by));
  const out=[];for(let i=0;out.length<a.length;i++)ks.forEach(k=>{if(g[k][i])out.push(g[k][i])});return out;
};
/* ---------- EFEK GERAK ---------- */
const nb=n=>n.replace(/-(?=\d)/g,'\u2011');   // tanda hubung tak terputus pada kode penerbangan
const calm=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
/** Animasi angka statistik hero menghitung naik (dimatikan bila pengguna meminta kurangi gerakan). */
function countUp(){   // angka di hero menghitung naik
  document.querySelectorAll('#stats b[data-n]').forEach(b=>{
    const to=+b.dataset.n,f=b.dataset.f,t0=performance.now();
    const fmt=v=>f=='rp'?rp(Math.round(v)):f=='r'?'★ '+v.toFixed(1):Math.round(v).toLocaleString('id-ID');
    if(calm()){b.textContent=fmt(to);return}
    const step=t=>{const k=Math.min(1,(t-t0)/700),e=1-Math.pow(1-k,3);b.textContent=fmt(to*e);if(k<1)requestAnimationFrame(step)};requestAnimationFrame(step);
  });
}
const conf=()=>Array.from({length:14},(_,i)=>{const a=i/14*6.283,d=46+Math.random()*26;return `<i class="cf" style="--dx:${Math.cos(a)*d|0}px;--dy:${Math.sin(a)*d|0}px;--r:${Math.random()*360|0}deg;--d:${(i%4)*40}ms"></i>`}).join('');
addEventListener('scroll',()=>document.querySelector('header').classList.toggle('scrolled',scrollY>8),{passive:true});
/* ---------- PETA MEMORI STRUCT ---------- */
function drawStruct(){
  const F=[['int','id',4,0],['char','tipe[12]',12,4],['char','lingkup[14]',14,16],['char','nama[40]',40,30],['char','asal[20]',20,70],['char','tujuan[20]',20,90],['pad','(isi penyelaras)',2,110],['long','harga',8,112],['int','durasi',4,120],['float','rating',4,124]];
  $('st').innerHTML=`<div class="mmap">${F.map((f,i)=>`<i class="${f[0]=='pad'?'pad':''}" style="width:${f[2]/128*100}%" title="${f[1]} · ${f[2]} byte"></i>`).join('')}</div>
  <table class="ft sh"><tr><td>tipe</td><td>field</td><td>ukuran</td><td>offset</td></tr>${F.map((f,i)=>`<tr data-i="${i}"><td>${f[0]}</td><td>${f[1]}</td><td>${f[2]} B</td><td>+${f[3]}</td></tr>`).join('')}<tr><td colspan="2"><b>Total (sizeof Tiket)</b></td><td colspan="2"><b>128 B</b></td></tr></table>`;
  $('st').onmouseover=e=>{const tr=e.target.closest('tr[data-i]');document.querySelectorAll('#st .mmap i').forEach((el,j)=>el.classList.toggle('on',!!tr&&+tr.dataset.i==j))};
}
drawStruct();
tabs();reset();memo();cxu();upd();pushLog('Siap digunakan',[{t:'Setiap tindakanmu dicatat di sini dan diganti otomatis saat ada tindakan baru. Ganti metode pengurutan dan pencarian lewat bagian atas panel ini.'},{t:`${tiket.length} struct Tiket dimuat ke array <b>tiket[]</b>`,y:1}],true); unread=0;badge();

/* =====================================================================
   V2 · EFEK TAMBAHAN (hanya tampilan; logika tugas di atas tidak diubah)
   ===================================================================== */
{
  /* 1. Indikator geser pada navigasi: pil bergerak mengikuti tab aktif */
  const nav=document.querySelector('.nav'),ind=document.createElement('span');ind.className='ind';nav.prepend(ind);
  const moveInd=()=>{const b=nav.querySelector('button.on');if(!b)return;ind.style.width=b.offsetWidth+'px';ind.style.transform=`translateX(${b.offsetLeft}px)`};
  const _show=show;show=n=>{_show(n);moveInd()};
  moveInd();addEventListener('resize',moveInd);if(document.fonts)document.fonts.ready.then(moveInd);

  /* 2. Spotlight kartu: cahaya halus mengikuti kursor */
  $('grid').addEventListener('pointermove',e=>{
    const c=e.target.closest('.t');if(!c)return;const r=c.getBoundingClientRect();
    c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px');
  },{passive:true});

  /* 3. Pemutar animasi baru: jeda, langkah maju/mundur, slider, kecepatan, dan pseudocode yang menyala */
  const PC={
    bubble:['untuk i dari 0 sampai n-2','  untuk j dari 0 sampai n-2-i','    jika a[j+1] < a[j]','      tukar a[j] dengan a[j+1]','selesai: data terurut'],
    selection:['untuk i dari 0 sampai n-2','  m = i','  cari j > i dengan nilai terkecil, simpan di m','  jika m != i: tukar a[i] dengan a[m]','selesai: data terurut'],
    insertion:['untuk i dari 1 sampai n-1','  x = a[i]','  selama j >= 0 dan x < a[j]: geser a[j] ke kanan','  taruh x di a[j+1]','selesai: data terurut'],
    merge:['mergeSort(lo, hi): jika hi-lo < 2 kembali','  mid = (lo + hi) / 2','  mergeSort(lo, mid); mergeSort(mid, hi)','  gabung dua bagian yang sudah terurut','selesai: data terurut'],
    quick:['quickSort(lo, hi): jika lo >= hi kembali','  pivot = a[hi]','  partisi: elemen lebih kecil ke kiri pivot','  quickSort(kiri); quickSort(kanan)','selesai: data terurut'],
    linear:['untuk i dari 0 sampai n-1','  jika a[i] cocok dengan kata kunci','    simpan a[i] ke hasil','kembalikan hasil'],
    binary:['urutkan data (Insertion Sort)','lo = 0, hi = n','selama lo < hi: mid = (lo + hi) / 2','  jika a[mid] >= target: hi = mid, selain itu lo = mid + 1','kembalikan lo (batas bawah)']};
  const SORTLINE={bubble:3,selection:3,insertion:3,merge:3,quick:2};
  const algKey=lab=>{const l=String(lab).toLowerCase();return['bubble','selection','insertion','merge','quick'].find(k=>l.startsWith(k))||(l.startsWith('linear')?'linear':l.startsWith('binary')?'binary':null)};
  const PL={fr:[],i:0,on:false,mult:1,key:null};
  const frameHtml=f=>typeof f.h=='function'?f.h():f.h;
  /** Baris pseudocode yang sesuai aksi pada frame saat ini (frame terakhir = baris penutup). */
  const codeLine=f=>{
    const last=PC[PL.key].length-1,k=PL.key;
    if(PL.i>=PL.fr.length-1)return last;
    if(f.t=='data awal')return 0;
    if(k=='linear')return /tidak cocok/.test(f.t)?1:2;
    if(k=='binary')return 3;
    return SORTLINE[k];
  };
  const codeHi=f=>{if(!PL.key)return;const on=codeLine(f);document.querySelectorAll('#code .cl').forEach((el,n)=>el.classList.toggle('on',n==on))};
  const codeSet=lab=>{
    PL.key=algKey(lab);const c=$('code');
    c.innerHTML=PL.key?PC[PL.key].map((t,n)=>`<div class="cl"><span>${n+1}</span>${esc(t)}</div>`).join(''):'';
  };
  const plState=on=>{PL.on=on;$('cpl').textContent=on?'❚❚':'▶'};
  function plShow(i){
    const f=PL.fr[i];PL.i=i;$('viz').innerHTML=frameHtml(f);
    $('vs').textContent=`${lastA[1]} · ${f.t}`;$('csl').value=i;
    $('prog').firstElementChild.style.transform=`scaleX(${PL.fr.length>1?i/(PL.fr.length-1):1})`;codeHi(f);
  }
  function plTick(){
    clearTimeout(vt);if(!PL.on)return;
    if(PL.i>=PL.fr.length-1){plState(false);return}
    vt=setTimeout(()=>{plShow(PL.i+1);plTick()},Math.max(14,CFG.animMs/PL.fr.length)*PL.mult);
  }
  const plPause=()=>{plState(false);clearTimeout(vt)};
  anim=function(frames,lab,cells){
    clearTimeout(vt);lastA=[frames,lab,cells];
    const V=$('viz'),n=(frameHtml(frames[0]).match(/<i/g)||[]).length;
    V.style.gap=cells?(n>200?'2px':'3px'):(n>90?'0':'2px');V.style.setProperty('--q',(n>500?3:n>250?4:n>120?6:9)+'px');
    V.classList.toggle('cells',!!cells);V.classList.add('on');$('vz').classList.add('on');
    PL.fr=frames;$('csl').max=frames.length-1;codeSet(lab);plShow(0);plState(true);plTick();
  };
  $('cpl').onclick=()=>{if(PL.on)return plPause();if(PL.i>=PL.fr.length-1)plShow(0);plState(true);plTick()};
  $('cb').onclick=()=>{plPause();plShow(Math.max(0,PL.i-1))};
  $('cf').onclick=()=>{plPause();plShow(Math.min(PL.fr.length-1,PL.i+1))};
  $('csl').oninput=e=>{plPause();plShow(+e.target.value)};
  $('csp').onchange=e=>{PL.mult=+e.target.value};
  $('ck').onclick=()=>{$('ck').classList.toggle('on',$('vz').classList.toggle('showcode'))};
  if(innerWidth>=1280){$('vz').classList.add('showcode');$('ck').classList.add('on')}

  /* 4. Log beranimasi: baris muncul berurutan, angka statistik menghitung naik, log tindakan jadi linimasa */
  const lg=$('log');
  const parse=t=>{                       // "1.234" (ribuan id-ID) | "12.3" (desimal) | "57"
    if(/^\d{1,3}(\.\d{3})+$/.test(t))return{v:+t.replace(/\./g,''),d:0,k:1};
    if(/^\d+\.\d+$/.test(t))return{v:+t,d:t.split('.')[1].length,k:0};
    if(/^\d+$/.test(t))return{v:+t,d:0,k:0};
    return null;
  };
  const countB=b=>{
    const p=parse(b.textContent.trim());if(!p||p.v===0)return;const t0=performance.now();
    const fmt=v=>p.k?Math.round(v).toLocaleString('id-ID'):v.toFixed(p.d);
    const step=t=>{const k=Math.min(1,(t-t0)/750),e=1-Math.pow(1-k,3);b.textContent=fmt(p.v*e);if(k<1)requestAnimationFrame(step)};
    requestAnimationFrame(step);
  };
  new MutationObserver(()=>{
    lg.querySelectorAll('.l').forEach((l,i)=>l.style.setProperty('--n',Math.min(i,14)));
    lg.querySelectorAll('.card').forEach(c=>{if(!c.querySelector('.feat')&&!c.querySelector('.bt'))c.classList.add('tl')});
    if(!calm())lg.querySelectorAll('.chips2 b').forEach(countB);
  }).observe(lg,{childList:true});

  /* 5. Grafik batang animasi untuk "Bandingkan semua" (tabel asli tetap ada di bawahnya) */
  const _bench=bench;
  bench=function(){
    _bench();
    const rows=[...lg.querySelectorAll('.bt tr')].slice(1).map(tr=>[...tr.cells].map(c=>c.textContent));
    if(!rows.length)return;
    const mk=(title,idx,fmt)=>{
      const v=r=>+r[idx],mx=Math.max(...rows.map(v))||1,mn=Math.min(...rows.map(v));
      return `<div class="bc"><div class="bct">${title}</div>${rows.map((r,n)=>`<div class="bcr${v(r)==mn?' best':''}" style="--w:${Math.max(2,v(r)/mx*100)}%;--n:${n}"><span>${r[0]}</span><div class="bk"><i></i></div><b>${fmt(v(r))}</b></div>`).join('')}</div>`;
    };
    lg.querySelector('.card .ct').insertAdjacentHTML('afterend',mk('Jumlah perbandingan',1,x=>x.toLocaleString('id-ID'))+mk('Waktu (ms)',3,x=>x.toFixed(2)));
  };
  $('bb').onclick=()=>bench();

  /* ===== V2.2 ===== */
  /* 6. Tombol header baru + mode gelap manual */
  const root=document.documentElement,hr=document.querySelector('.hdr-r');
  const SUN='<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M5 19l1.4-1.4M17.6 6.4L19 5"/>',MOON='<path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z"/>';
  const mkb=(id,cls,html,title)=>{const b=document.createElement('button');b.id=id;b.className=cls;b.innerHTML=html;b.title=title;b.setAttribute('aria-label',title);hr.insertBefore(b,$('fab'));return b};
  mkb('dbtn','hlog dbtn',svg('<path d="M8 5v14l11-7z"/>')+'<b>Demo</b>','Jalankan demo otomatis');
  mkb('kbtn','hlog hico',svg('<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.2-4.2"/>'),'Perintah cepat (Ctrl+K)');
  mkb('thm','hlog hico','','Ganti tema');
  try{const s=localStorage.getItem('psn-theme');if(s=='dark'||s=='light')root.dataset.theme=s}catch(e){}
  const isDark=()=>root.dataset.theme?root.dataset.theme=='dark':matchMedia('(prefers-color-scheme:dark)').matches;
  const paintTheme=()=>{const t=$('thm'),d=isDark();t.innerHTML=svg(d?SUN:MOON);t.title=d?'Mode terang':'Mode gelap';t.setAttribute('aria-label',t.title)};
  const toggleTheme=()=>{root.classList.add('tx');setTimeout(()=>root.classList.remove('tx'),550);const t=isDark()?'light':'dark';root.dataset.theme=t;try{localStorage.setItem('psn-theme',t)}catch(e){}paintTheme()};
  $('thm').onclick=toggleTheme;paintTheme();

  /* 1. Mode demo otomatis dengan narasi */
  const dm=document.createElement('div');dm.id='dmo';dm.innerHTML='<span class="dn"></span><span class="dt"></span><button class="dx">Berhenti</button><i></i>';document.body.appendChild(dm);
  let demoId=0,demoOn=false;const DEMO_NAME='Demo Presentasi';
  const sleep=ms=>new Promise(r=>setTimeout(r,ms)),clickSel=s=>{const e=document.querySelector(s);if(e)e.click()};
  const pulse=s=>document.querySelectorAll(s).forEach(e=>{e.classList.remove('dpulse');void e.offsetWidth;e.classList.add('dpulse');setTimeout(()=>e.classList.remove('dpulse'),2800)});
  const cleanDemo=()=>{const d=LL.all().filter(o=>o.nama==DEMO_NAME);if(!d.length)return;d.forEach(o=>LL.remove(o.code));upd();renderOrders()};
  const stopDemo=()=>{document.body.classList.remove('demoing');demoOn=false;demoId++;dm.classList.remove('on');$('dbtn').classList.remove('run');$('dbtn').querySelector('b').textContent='Demo';cleanDemo();closeM()};
  async function startDemo(){
    if(demoOn)return stopDemo();
    cleanDemo();const id=++demoId;demoOn=true;document.body.classList.add('demoing');dm.classList.add('on');$('dbtn').classList.add('run');$('dbtn').querySelector('b').textContent='Stop';
    const S=[
      [2600,'Mulai: 1.176 struct Tiket tersimpan berurutan di array tiket[].',()=>{closeM();clickSel('[data-v=tiket]');$('br').click();scrollTo({top:0,behavior:'smooth'})}],
      [3000,'Pilih kategori Pesawat. Array tiket[] ditelusuri dan difilter, O(n).',()=>{pulse('[data-c="pesawat"]');clickSel('[data-c="pesawat"]')}],
      [5200,'Urutkan harga termurah dengan Merge Sort. Lihat batang bergerak dan baris pseudocode yang menyala di panel Log.',()=>{pulse('#so');$('auto').checked=true;$('sa').value='merge';cxu();$('so').value='harga-asc';sortChoice();$('dr').classList.add('open')}],
      [4200,'Cari "jakarta" dengan Linear Search: tiket diperiksa satu per satu mulai indeks 0.',()=>{pulse('#q');$('sm').value='linear';$('q').value='jakarta';searchRun()}],
      [3600,'Buka detail tiket. Akses langsung tiket[id] lewat indeks, O(1).',()=>clickSel('#grid [data-b]')],
      [4000,'Isi nama pemesan dan pilih kursi dari denah (array dua dimensi).',()=>{NM=DEMO_NAME;drawM();const s=document.querySelector('#md .seat:not(:disabled)');if(s)s.click();pulse('#md .seat.on')}],
      [4200,'Bayar: LL.push() membuat node baru dan memindahkan head ke node itu, O(1).',()=>{pulse('[data-a="ok"]');act('ok')}],
      [4600,'Tab Konsep Data: node pesanan baru terbang masuk sebagai head linked list.',async()=>{closeM();clickSel('[data-v=konsep]');await sleep(500);$('ll').scrollIntoView({behavior:'smooth',block:'center'})}],
      [5200,'Pointer: ptr++ menggeser alamat 128 byte, dan nilai ptr->field ikut berubah.',async()=>{$('pv').scrollIntoView({behavior:'smooth',block:'center'});pulse('#pv');for(let i=0;i<3;i++){await sleep(900);if(!demoOn||id!==demoId)return;$('pp').click()}}],
      [2600,'Selesai. Pesanan demo dihapus otomatis dari linked list.',()=>clickSel('[data-v=tiket]')]
    ];
    for(let n=0;n<S.length;n++){
      if(!demoOn||id!==demoId)return;
      const[ms,tx,fn]=S[n];dm.querySelector('.dn').textContent=`${n+1}/${S.length}`;dm.querySelector('.dt').textContent=tx;dm.querySelector('i').style.transform=`scaleX(${(n+1)/S.length})`;
      try{await fn()}catch(e){}
      await sleep(ms);
    }
    if(demoOn&&id===demoId)stopDemo();
  }
  $('dbtn').onclick=startDemo;dm.querySelector('.dx').onclick=stopDemo;
  document.addEventListener('keydown',e=>{if(e.key=='Escape'&&demoOn)stopDemo()});

  /* 3. Kartu tiket: tombol "Memori" membuka struct itu di tab Konsep Data */
  const _render=render;
  render=function(keep){_render(keep);document.querySelectorAll('#grid .t').forEach(t=>{const b=t.querySelector('.foot [data-b]');if(!b||t.querySelector('.mem'))return;b.insertAdjacentHTML('beforebegin',`<button class="mem" data-id="${b.dataset.b}" title="Lihat struct ini di memori">⌗ Memori</button>`)})};
  const sweep=()=>{[...document.querySelectorAll('#st .mmap i')].forEach((el,i)=>{setTimeout(()=>el.classList.add('on'),i*140);setTimeout(()=>el.classList.remove('on'),i*140+260)})};
  document.addEventListener('click',e=>{
    const m=e.target.closest('.mem');if(!m)return;
    ptr=+m.dataset.id;show('konsep');memo();
    aLog(`Lihat di memori · tiket[${ptr}]`,[{t:`ptr = ${addr(ptr)} → <b>tiket[${ptr}]</b>`},{t:`Alamat = 0x7A00 + ${ptr} × 128, tiap field dibaca lewat offset byte`,y:1}]);
    setTimeout(()=>{$('pv').scrollIntoView({behavior:'smooth',block:'center'});pulse('#pv, #mem');sweep()},250);
  });

  /* 4. Animasi linked list: node baru terbang masuk, node dibatalkan terlepas */
  let prevCodes=LL.all().map(o=>o.code);const _drawLL=drawLL;
  drawLL=function(){
    const before=prevCodes;_drawLL();const now=LL.all().map(o=>o.code);prevCodes=now;const box=$('ll');
    box.querySelectorAll('.nd:not(.hd) b').forEach(b=>{if(!before.includes(b.textContent)){const n=b.closest('.nd');n.classList.add('fly');n.addEventListener('animationend',()=>n.classList.remove('fly'),{once:true})}});
    const gone=before.filter(c=>!now.includes(c));
    if(gone.length){
      box.querySelectorAll('.ar').forEach(x=>{x.classList.add('relink');x.addEventListener('animationend',()=>x.classList.remove('relink'),{once:true})});
      const hd=box.querySelector('.nd.hd');
      if(hd)hd.insertAdjacentHTML('afterend',gone.map(c=>`<span class="ar gone">→</span><div class="nd gone"><div><b>${esc(c)}</b></div><div>dilepas</div></div>`).join(''));
      setTimeout(()=>box.querySelectorAll('.gone').forEach(x=>x.remove()),1400);
    }
  };

  /* 5. Peta rute mini di modal pemesanan */
  let mapId=null;const _drawM=drawM,_closeM=closeM;
  drawM=function(){
    _drawM();const t=cur;if(!t||t.tujuan==='')return;
    const h=Math.min(66,22+t.durasi/9),path=`M30 70 Q160 ${(70-h*1.9).toFixed(1)} 290 70`,lab=s=>esc(s.length>16?s.slice(0,15)+'…':s);
    const plane=calm()?'':`<g fill="var(--a)"><path d="M-7 -5 L8 0 L-7 5 L-4 0Z"/><animateMotion dur="3.2s" repeatCount="indefinite" rotate="auto" path="${path}"/></g>`;
    $('md').querySelector('.top').insertAdjacentHTML('afterend',`<div class="rmap${mapId===t.id?' still':''}"><svg viewBox="0 0 320 96" fill="none" aria-hidden="true"><path class="arc" d="${path}" stroke="var(--a)" stroke-width="2" stroke-linecap="round"/><circle cx="30" cy="70" r="5" fill="var(--a)"/><circle cx="290" cy="70" r="5" fill="var(--card)" stroke="var(--a)" stroke-width="2.5"/>${plane}<text x="30" y="90" text-anchor="middle">${lab(t.asal)}</text><text x="290" y="90" text-anchor="middle">${lab(t.tujuan)}</text><text class="mt" x="160" y="${(70-h*.95-5).toFixed(1)}" text-anchor="middle">${dur(t.durasi)}</text></svg></div>`);
    mapId=t.id;
  };
  closeM=function(){mapId=null;_closeM()};

  /* 8. E-tiket jadi boarding pass yang bisa dibalik (3D) */
  const _showTicket=showTicket;
  showTicket=function(code){
    _showTicket(code);const et=$('md').querySelector('.et');if(!et||et.querySelector('.flipw'))return;
    const[hd,rt,gr,bc,bt]=et.children;if(!bc||!bt)return;
    const w=document.createElement('div');w.className='flipw';w.title='Ketuk untuk membalik';w.innerHTML='<div class="flipc"><div class="face front"></div><div class="face back"></div></div>';
    const f=w.querySelector('.front'),b=w.querySelector('.back');[hd,rt,gr].forEach(x=>f.appendChild(x));
    b.appendChild(bc);b.insertAdjacentHTML('afterbegin','<div class="bph">Boarding pass</div>');b.insertAdjacentHTML('beforeend','<div class="mini">Tunjukkan barcode ini saat check-in</div>');
    et.insertBefore(w,bt);bt.children[0].insertAdjacentHTML('afterend','<button class="go ghost" data-flip>Balik ↻</button>');
  };
  document.addEventListener('click',e=>{if(e.target.closest('[data-flip]')||e.target.closest('.flipw')){const c=$('md').querySelector('.flipc');if(c)c.classList.toggle('back')}});

  /* 7. Command palette (Ctrl+K) */
  const cm=document.createElement('div');cm.id='cmk';
  cm.innerHTML='<div class="pal" role="dialog" aria-modal="true" aria-label="Perintah cepat"><input id="cmi" placeholder="Ketik perintah, mis. bubble, hotel, gelap, demo" autocomplete="off" aria-label="Cari perintah"><div id="cml" role="listbox"></div><div class="cmf"><span><kbd>↑</kbd><kbd>↓</kbd> pilih</span><span><kbd>Enter</kbd> jalankan</span><span><kbd>Esc</kbd> tutup</span></div></div>';
  document.body.appendChild(cm);
  const CM=[],addC=(g,t,k,run)=>CM.push({g,t,k:(t+' '+k).toLowerCase(),run});
  CATS.forEach(([k,l])=>addC('Kategori','Kategori: '+l,k,()=>clickSel(`[data-c="${k}"]`)));
  SC.forEach(([k,l])=>addC('Lingkup','Lingkup: '+l,k,()=>clickSel(`[data-s="${k}"]`)));
  [...$('so').options].forEach(o=>addC('Urutkan','Urutkan: '+o.text,'sort urut '+o.value,()=>{$('so').value=o.value;sortChoice()}));
  ['bubble','selection','insertion','merge','quick'].forEach(k=>addC('Metode','Metode urut: '+ALG[k][0],ALG[k][1],()=>{$('sa').value=k;$('sa').onchange()}));
  addC('Metode','Metode cari: Linear Search','linear',()=>{$('sm').value='linear';$('sm').onchange()});
  addC('Metode','Metode cari: Binary Search (awalan nama)','binary binname',()=>{$('sm').value='binname';$('sm').onchange()});
  [['tiket','Tiket'],['pesanan','Pesanan saya'],['konsep','Konsep Data']].forEach(([v,l])=>addC('Halaman','Buka: '+l,v,()=>clickSel(`[data-v=${v}]`)));
  addC('Aksi','Buka / tutup panel Log','log proses',()=>$('fab').click());
  addC('Aksi','Bandingkan semua algoritma','bench banding grafik',()=>{$('dr').classList.add('open');$('bb').click()});
  addC('Aksi','Jalankan / hentikan demo otomatis','demo presentasi',startDemo);
  addC('Aksi','Ganti mode terang / gelap','tema dark light gelap terang',toggleTheme);
  addC('Aksi','Reset pencarian','reset bersihkan',()=>$('br').click());
  let cmSel=0,cmList=[],cmPrev=null;
  const cmDraw=()=>{
    const q=$('cmi').value.trim().toLowerCase();cmList=CM.filter(c=>!q||q.split(/\s+/).every(w=>c.k.includes(w))).slice(0,12);cmSel=Math.min(cmSel,Math.max(0,cmList.length-1));let g='';
    $('cml').innerHTML=cmList.length?cmList.map((c,i)=>{const h=c.g!=g?`<div class="cg">${c.g}</div>`:'';g=c.g;return`${h}<div class="ci${i==cmSel?' on':''}" role="option" data-i="${i}">${esc(c.t)}</div>`}).join(''):'<div class="cg">Tidak ada perintah yang cocok</div>';
    const on=$('cml').querySelector('.ci.on');if(on)on.scrollIntoView({block:'nearest'});
  };
  const cmOpen=()=>{cmPrev=document.activeElement;cm.classList.add('on');$('cmi').value='';cmSel=0;cmDraw();setTimeout(()=>$('cmi').focus(),30)};
  const cmClose=()=>{cm.classList.remove('on');if(cmPrev&&cmPrev.focus)cmPrev.focus()};
  const cmRun=i=>{const c=cmList[i];if(!c)return;cmClose();setTimeout(c.run,90)};
  $('cmi').oninput=()=>{cmSel=0;cmDraw()};
  $('cmi').onkeydown=e=>{
    const n=cmList.length;
    if(e.key=='ArrowDown'){e.preventDefault();cmSel=(cmSel+1)%Math.max(1,n);cmDraw()}
    else if(e.key=='ArrowUp'){e.preventDefault();cmSel=(cmSel-1+Math.max(1,n))%Math.max(1,n);cmDraw()}
    else if(e.key=='Enter'){e.preventDefault();cmRun(cmSel)}
    else if(e.key=='Escape'){e.stopPropagation();cmClose()}
    else if(e.key=='Tab')e.preventDefault();
  };
  cm.addEventListener('click',e=>{const c=e.target.closest('.ci');if(c)cmRun(+c.dataset.i);else if(e.target==cm)cmClose()});
  $('kbtn').onclick=cmOpen;
  addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()=='k'){e.preventDefault();cm.classList.contains('on')?cmClose():cmOpen()}});

  /* 9. Sorting Race: dua algoritma, data yang sama, jam bersama berbasis jumlah operasi */
  const RN={bubble:'Bubble Sort',selection:'Selection Sort',insertion:'Insertion Sort',merge:'Merge Sort',quick:'Quick Sort'};
  const rOpts=Object.entries(RN).map(([k,v])=>`<option value="${k}">${v}</option>`).join('');
  const laneHtml=(id,c)=>`<div class="lane ${c}" id="${id}"><div class="lh"><b></b><em></em><i class="bd">Selesai</i></div><div class="bars"></div><div class="rst"><span><b>0</b> perbandingan</span><span><b>0</b> <u>pertukaran</u></span><span><b>0</b> total langkah</span></div></div>`;
  const rc=document.createElement('div');rc.id='rcv';
  rc.innerHTML=`<div class="rp" role="dialog" aria-modal="true" aria-label="Sorting Race"><div class="rh"><b>Sorting Race</b><span>Dua algoritma mengurutkan data yang sama</span><button class="go ghost" id="rcX">Tutup</button></div>
<div class="rctl"><select id="rcA" aria-label="Algoritma kiri">${rOpts}</select><select id="rcB" aria-label="Algoritma kanan">${rOpts}</select><select id="rcM" aria-label="Jenis data"><option value="acak">Data acak</option><option value="hampir">Hampir terurut</option><option value="mundur">Terbalik</option></select><select id="rcN" aria-label="Jumlah data"><option value="30">30 data</option><option value="60" selected>60 data</option><option value="100">100 data</option></select><select id="rcS" aria-label="Kecepatan"><option value="14000">Lambat</option><option value="8000" selected>Normal</option><option value="3500">Cepat</option></select><button class="go" id="rcGo">Mulai lagi</button></div>
<div class="lanes">${laneHtml('lnA','')}${laneHtml('lnB','b')}</div><div id="rcSum" aria-live="polite"></div><div class="rnote">Lomba memakai jam bersama berdasarkan jumlah operasi (perbandingan + pertukaran atau penulisan), bukan milidetik, supaya adil dan terlihat jelas di layar.</div></div>`;
  document.body.appendChild(rc);$('rcA').value='bubble';$('rcB').value='merge';
  const mkData=(n,mode)=>{
    const d=Array.from({length:n},(_,i)=>i+1);
    if(mode=='acak')for(let i=n-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]]}
    else if(mode=='mundur')d.reverse();
    else for(let k=0;k<Math.max(2,n/12|0);k++){const i=Math.floor(Math.random()*(n-1));[d[i],d[i+1]]=[d[i+1],d[i]]}
    return d;
  };
  /** Menjalankan SORT[alg] asli pada data, merekam tiap frame beserta biaya (perbandingan + penulisan). */
  const rRecord=(alg,data)=>{
    const a=data.map(v=>({nama:'',v})),F=[];let H;
    const snap=(i,j)=>F.push({v:Uint8Array.from(a,x=>x.v),i,j,c:H.c,s:H.s,k:H.c+H.s});
    H=hooks(snap);F.push({v:Uint8Array.from(a,x=>x.v),i:-1,j:-1,c:0,s:0,k:0});
    SORT[alg](a,(x,y)=>x.v<y.v,H);
    const end={v:Uint8Array.from(a,x=>x.v),i:-1,j:-1,c:H.c,s:H.s,k:H.c+H.s};F.push(end);
    return{F,total:end.k,label:alg=='merge'?'penulisan':alg=='insertion'?'penggeseran':'pertukaran'};
  };
  const RZ={raf:0},fmt=x=>x.toLocaleString('id-ID');
  const rPaint=(id,alg,f)=>{
    const L=$(id),bars=L.querySelectorAll('.bars i'),n=bars.length;
    bars.forEach((el,x)=>{el.style.height=(f.v[x]/n*100)+'%';el.classList.toggle('hi',alg=='merge'?(f.i>=0&&x>=f.i&&x<=f.j):(x==f.i||x==f.j))});
    const s=L.querySelectorAll('.rst b');s[0].textContent=fmt(f.c);s[1].textContent=fmt(f.s);
  };
  const raceEnd=P=>{
    const[a,b]=[P[0][2],P[1][2]];let t;
    if(a.total==b.total){P.forEach(p=>$(p[0]).querySelector('.bd').textContent='Seri');t=`Seri: keduanya butuh ${fmt(a.total)} langkah.`}
    else{
      const w=a.total<b.total?0:1,W=P[w],Z=P[1-w];$(W[0]).classList.add('win');$(W[0]).querySelector('.bd').textContent='Tercepat';
      t=`<b>${RN[W[1]]}</b> selesai lebih dulu dengan ${fmt(W[2].total)} langkah. <b>${RN[Z[1]]}</b> butuh ${fmt(Z[2].total)} langkah (${(Z[2].total/W[2].total).toFixed(1)}× lebih banyak).`;
    }
    const hint={acak:'Data acak menggambarkan perilaku rata-rata tiap algoritma.',
      mundur:'Data terbalik adalah kasus terburuk untuk Bubble, Insertion, dan Quick Sort (pivot diambil dari elemen terakhir).',
      hampir:'Pada data hampir terurut, Bubble dan Insertion mendekati O(n), sedangkan Quick Sort dengan pivot terakhir justru melambat.'}[$('rcM').value];
    $('rcSum').innerHTML=`${t}<br><span class="rh2">${hint}</span>`;
  };
  function raceStart(){
    cancelAnimationFrame(RZ.raf);
    const n=+$('rcN').value,data=mkData(n,$('rcM').value),aA=$('rcA').value,aB=$('rcB').value;
    const P=[['lnA',aA,rRecord(aA,data)],['lnB',aB,rRecord(aB,data)]];
    P.forEach(([id,alg,r])=>{const L=$(id);L.classList.remove('done','win');L.querySelector('.bd').textContent='Selesai';L.querySelector('.lh b').textContent=RN[alg];L.querySelector('.lh em').textContent=ALG[alg][1];L.querySelector('.rst u').textContent=r.label;L.querySelector('.bars').innerHTML='<i></i>'.repeat(n)});
    $('rcSum').textContent='';
    const max=Math.max(P[0][2].total,P[1][2].total),dur=+$('rcS').value,t0=performance.now(),idx=[0,0];
    const step=now=>{
      const clock=calm()?max:Math.min(max,(now-t0)/dur*max);
      P.forEach(([id,alg,r],p)=>{
        const F=r.F;let q=idx[p];while(q+1<F.length&&F[q+1].k<=clock)q++;idx[p]=q;
        rPaint(id,alg,F[q]);const L=$(id);L.querySelectorAll('.rst b')[2].textContent=fmt(Math.round(Math.min(clock,r.total)));
        if(q==F.length-1)L.classList.add('done');
      });
      if(idx.every((q,p)=>q==P[p][2].F.length-1))raceEnd(P);else RZ.raf=requestAnimationFrame(step);
    };
    RZ.raf=requestAnimationFrame(step);
  }
  const raceOpen=()=>{rc.classList.add('on');raceStart();setTimeout(()=>$('rcGo').focus(),50)};
  const raceClose=()=>{cancelAnimationFrame(RZ.raf);rc.classList.remove('on')};
  $('rcGo').onclick=raceStart;$('rcX').onclick=raceClose;
  ['rcA','rcB','rcM','rcN'].forEach(i=>$(i).onchange=raceStart);
  rc.addEventListener('click',e=>{if(e.target==rc)raceClose()});
  document.addEventListener('keydown',e=>{if(e.key=='Escape'&&rc.classList.contains('on'))raceClose()});
  $('bb').insertAdjacentHTML('afterend','<button class="go ghost" id="rcBtn">Sorting Race</button>');$('rcBtn').onclick=raceOpen;
  addC('Aksi','Sorting Race: adu dua algoritma','race balapan adu bandingkan',raceOpen);

  /* 10. Padanan kode C (salinan potongan tiket.c) berdampingan dengan versi web */
  const CSRC={"struct": "typedef struct {                       /* STRUCT */\n    int id; char tipe[12], lingkup[14], nama[40], asal[20], tujuan[20];\n    long harga; int durasi; float rating;\n} Tiket;\n\nstatic Tiket tiket[] = {               /* ARRAY of struct */\n    {0,\"pesawat\",\"nasional\",\"Garuda Indonesia GA-312\",\"Jakarta\",\"Surabaya\",1450000,95,4.7f},\n    {1,\"pesawat\",\"nasional\",\"Citilink QG-826\",\"Jakarta\",\"Surabaya\",780000,100,4.2f},\n    {2,\"pesawat\",\"internasional\",\"Scoot TR-281\",\"Denpasar\",\"Singapura\",1600000,175,4.2f},\n    /* ... baris tiket lainnya ... */\n};\n#define N ((int)(sizeof tiket / sizeof tiket[0]))\n", "pointer": "static void tampil_array(void) {\n    puts(\"== ARRAY + POINTER ==\");\n    for (Tiket *p = tiket; p < tiket + N; p++)             /* aritmetika pointer */\n        printf(\"p=%p  offset=+%-4ld  %-24s Rp%ld\\n\", (void *)p, (long)((char *)p - (char *)tiket), p->nama, p->harga);\n}\n", "bubble": "static void bubble_sort(Tiket *a[], int n) {               /* mengurutkan array POINTER, struct tidak dipindah */\n    int cmp = 0, swp = 0;\n    puts(\"\\n== BUBBLE SORT (harga naik) ==\");\n    for (int i = 0; i < n - 1; i++) {\n        int tukar = 0;\n        for (int j = 0; j < n - 1 - i; j++) {\n            cmp++;\n            if (a[j + 1]->harga < a[j]->harga) {\n                Tiket *tmp = a[j]; a[j] = a[j + 1]; a[j + 1] = tmp; swp++; tukar = 1;\n                printf(\"Pass %d: tukar %s <-> %s\\n\", i + 1, a[j + 1]->nama, a[j]->nama);\n            }\n        }\n        if (!tukar) { puts(\"Tidak ada pertukaran, berhenti lebih awal.\"); break; }\n    }\n    printf(\"%d perbandingan, %d pertukaran\\n\", cmp, swp);\n}\n", "linear": "static void linear_search(Tiket *a[], int n, const char *kata) {\n    int ketemu = 0;\n    printf(\"\\n== LINEAR SEARCH \\\"%s\\\" ==\\n\", kata);\n    for (int i = 0; i < n; i++) {\n        int ok = strstr(a[i]->nama, kata) || strstr(a[i]->asal, kata) || strstr(a[i]->tujuan, kata);\n        printf(\"[%d] %-24s -> %s\\n\", i, a[i]->nama, ok ? \"cocok\" : \"tidak\");\n        ketemu += ok;\n    }\n    printf(\"%d ditemukan\\n\", ketemu);\n}\n", "binary": "static int binary_search_harga(Tiket *a[], int n, long target) {   /* a harus terurut naik */\n    int lo = 0, hi = n, langkah = 0;\n    printf(\"\\n== BINARY SEARCH harga >= %ld ==\\n\", target);\n    while (lo < hi) {\n        int mid = (lo + hi) / 2; langkah++;\n        printf(\"Langkah %d: lo=%d hi=%d mid=%d harga=%ld -> %s\\n\", langkah, lo, hi, mid, a[mid]->harga, a[mid]->harga >= target ? \"kiri\" : \"kanan\");\n        if (a[mid]->harga >= target) hi = mid; else lo = mid + 1;\n    }\n    printf(\"Batas bawah di indeks %d (%d tiket)\\n\", lo, n - lo);\n    return lo;\n}\n", "list": "typedef struct Node {                  /* LINKED LIST pesanan */\n    char kode[12]; Tiket *t; struct Node *next;   /* next = pointer ke node berikutnya */\n} Node;\n\nstatic void push(Node **head, Node *baru) { baru->next = *head; *head = baru; }   /* sisip di depan, O(1) */\n\nstatic void hapus(Node **head, const char *kode) {         /* pointer ke pointer: tidak perlu kasus khusus head */\n    for (Node **pp = head; *pp; pp = &(*pp)->next)\n        if (strcmp((*pp)->kode, kode) == 0) { *pp = (*pp)->next; printf(\"Node %s dilepas\\n\", kode); return; }\n}\n\nstatic void cetak(const Node *head) {\n    printf(\"head\");\n    for (const Node *c = head; c; c = c->next) printf(\" -> [%s %s]\", c->kode, c->t->nama);\n    puts(\" -> NULL\");\n}\n"};
  const goK=sel=>{clickSel('[data-v=konsep]');setTimeout(()=>{const e=document.querySelector(sel);if(e)e.scrollIntoView({behavior:'smooth',block:'center'});pulse(sel)},350)};
  const openLog=()=>{$('auto').checked=true;$('dr').classList.add('open')};
  const CI=[
    {t:'Struct dan Array',src:CSRC.struct,btn:'Lihat struct di Konsep Data',run:()=>goK('#st'),
     w:[['Di web','class Tiket (app.js) dan array tiket[] dari data.js.'],['Beda','Di C, sizeof(Tiket) nyata dan field tersusun di memori. Di web, 128 byte hanyalah simulasi (CFG.structBytes) untuk visualisasi.']]},
    {t:'Pointer',src:CSRC.pointer,btn:'Coba ptr++ di web',run:()=>{goK('#pv');setTimeout(()=>$('pp').click(),900)},
     w:[['Di web','ptr (indeks aktif) dan memo() menghitung alamat dengan rumus base + ptr × 128.'],['Beda','Pointer C menyimpan alamat sungguhan dan p++ bergeser sebesar sizeof(Tiket). Di web, ptr berupa indeks dan alamatnya dihitung dari rumus yang sama.']]},
    {t:'Bubble Sort',src:CSRC.bubble,btn:'Jalankan Bubble Sort di web',run:()=>{clickSel('[data-v=tiket]');openLog();$('sa').value='bubble';cxu();$('so').value='harga-asc';sortChoice()},
     w:[['Di web','SORT.bubble di app.js.'],['Sama','Dua loop bersarang, perbandingan a[j+1] < a[j], dan berhenti lebih awal bila satu putaran tanpa pertukaran.'],['Beda','Versi JS menerima fungsi pembanding dan objek H (hooks) untuk mencatat log serta frame animasi; versi C langsung mencetak.']]},
    {t:'Linear Search',src:CSRC.linear,btn:'Cari "Jakarta" di web',run:()=>{clickSel('[data-v=tiket]');openLog();$('sm').value='linear';$('q').value='Jakarta';searchRun()},
     w:[['Di web','linearScan / searchLinear di app.js.'],['Sama','Tiket diperiksa satu per satu dari indeks 0 sampai akhir, O(n).'],['Beda','C memeriksa nama, asal, dan tujuan dengan strstr. Di JS, kondisi cocok dikirim sebagai fungsi uji (test) yang juga menghasilkan keterangan untuk log.']]},
    {t:'Binary Search',src:CSRC.binary,btn:'Cari harga 500000 di web',run:()=>{clickSel('[data-v=tiket]');openLog();$('q').value='500000';searchRun()},
     w:[['Di web','lowerBound di app.js.'],['Sama','Mencari batas bawah dengan lo, hi, dan mid = (lo + hi) / 2, tiap langkah membuang separuh data, O(log n).'],['Syarat','Data harus terurut naik (di kode C ditulis sebagai komentar pada parameter a).']]},
    {t:'Linked List',src:CSRC.list,btn:'Lihat linked list di web',run:()=>goK('#ll'),
     w:[['Di web','LL.push, LL.remove, dan LL.all pada objek LL.'],['Sama','push menyisipkan node di depan: next diarahkan ke head lama, lalu head pindah ke node baru, O(1).'],['Beda','Hapus di C memakai pointer ke pointer (Node **pp) sehingga head tidak butuh kasus khusus. LL.remove di JS memakai variabel p (node sebelumnya) dan memeriksa head secara terpisah. Hasilnya sama.']]}
  ];
  const hlC=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/(\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\\n])*")|\b(typedef|struct|static|void|int|long|char|float|const|for|if|return|break|sizeof|define|include)\b|\b(\d+[fL]?)\b/g,(m,cm,st,kw,nu)=>cm?`<span class="c-cm">${cm}</span>`:st?`<span class="c-s">${st}</span>`:kw?`<span class="c-k">${kw}</span>`:`<span class="c-n">${nu}</span>`);
  const kb=document.createElement('div');kb.className='box';kb.id='cbox';kb.style.cssText='grid-column:1/-1;order:4';
  kb.innerHTML=`<h2>Padanan kode C</h2><p>Potongan dari <code>tiket.c</code> di samping versi web-nya. Klik tombol di kanan untuk menjalankan padanannya di halaman ini.</p><div class="cct" role="tablist">${CI.map((x,i)=>`<button role="tab" data-i="${i}">${x.t}</button>`).join('')}</div><div class="cc"><pre class="cv" tabindex="0" aria-label="Kode C"></pre><div class="cw"></div></div>`;
  document.querySelector('#konsep .k').appendChild(kb);
  const cShow=i=>{
    const x=CI[i];kb.querySelectorAll('.cct button').forEach((b,n)=>{b.classList.toggle('on',n==i);b.setAttribute('aria-selected',n==i)});
    const pre=kb.querySelector('.cv');pre.innerHTML=hlC(x.src);pre.style.animation='none';void pre.offsetWidth;pre.style.animation='';
    kb.querySelector('.cw').innerHTML=x.w.map(([h,t])=>`<div class="wi"><b>${h}</b>${esc(t)}</div>`).join('')+`<button class="go" id="cRun">${esc(x.btn)}</button>`;
    $('cRun').onclick=x.run;
  };
  kb.querySelector('.cct').addEventListener('click',e=>{const b=e.target.closest('button');if(b)cShow(+b.dataset.i)});
  cShow(0);
  addC('Halaman','Buka: Padanan kode C (tiket.c)','c kode tiket.c struct pointer',()=>goK('#cbox'));
}
