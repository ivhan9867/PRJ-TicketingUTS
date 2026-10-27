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
/* Gambar sampul: beberapa variasi per jenis, dipilih dari id tiket; merek khusus memakai gambar yang cocok */
const IMGN={pesawat:4,kereta:2,bus:3,kapal:2,hotel:3,hiburan:3,wisata:3,mobil:2};
const cover=t=>{const N=IMGN[t.tipe];if(!N)return '';const m=t.nama,sp=/garuda/i.test(m)?'garuda':/whoosh/i.test(m)?'whoosh':/commuter|krl/i.test(m)?'commuter':'';
  return `<img class="cvr" src="img/${t.tipe}-${(t.tipe=='pesawat'&&sp=='garuda'||t.tipe=='kereta'&&sp)?sp:((t.id*2654435761>>>0)%N)+1}.jpg" alt="" width="720" height="315" loading="lazy" decoding="async">`};
const card=(t,i,n,k)=>{const h=t.tujuan==='';
  return `<article class="t ${hits.has(t.id)?'hit':''} ${KEEP&&SHOWN.has(t.id)?'still':''}" data-k="${t.tipe}" style="--i:${Math.min(i,24)}">${cover(t)}
  <div class="top"><div class="ic">${ICON[t.tipe]}</div><div><h3>${t.nama.replace(/-(?=\d)/g,'\u2011')}</h3><div class="mini">${TN[t.tipe]} ${t.lingkup=='internasional'?'<span class="badge">Internasional</span>':'· Nasional'}</div></div><div class="rt">★ ${t.rating.toFixed(1)}</div></div>
  ${h?`<div class="loc"><span class="pin">${PIN}</span><div><b>${t.asal}</b><small>${rl(t.rating)}</small></div></div>`:`<div class="route"><b>${t.asal}<small>${jam(t,0)}</small></b><i><u>${dur(t.durasi)}</u></i><b>${t.tujuan}<small>${jam(t,1)}</small></b></div>`}
  ${n>1?`<button class="opt" data-a="op:${esc(k)}">+${n-1} pilihan lain · lihat semua</button>`:''}
  <div class="foot"><div class="pr">${rp(t.harga)}<small>${h?(t.tipe=='hotel'?'per malam':t.tipe=='mobil'?'per hari':'per orang'):'per orang'}</small></div><div class="acts"><button class="fav ${FAV.includes(t.id)?'on':''}" data-f="${t.id}" aria-pressed="${FAV.includes(t.id)}" aria-label="Simpan tiket">♥</button><button class="go" data-b="${t.id}">Pesan</button></div></div></article>`};
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
/* Tiket tersimpan: array FAV berisi id tiket, disimpan di localStorage */
let FAV=[];try{FAV=(JSON.parse(localStorage.getItem('psnf')||'[]')||[]).filter(x=>Number.isInteger(x)&&tiket[x]).slice(0,60)}catch(e){}
const favN=()=>{$('fc').textContent=FAV.length;$('fc').hidden=!FAV.length};
function renderSaved(){$('sg').innerHTML=FAV.length?FAV.map((id,i)=>card(tiket[id],i,1,'')).join(''):'<div class="empty">Belum ada tiket tersimpan.<br>Tekan ♥ di kartu tiket untuk menyimpannya di sini.</div>'}
document.addEventListener('click',e=>{const f=e.target.closest('[data-f]');if(!f)return;const id=+f.dataset.f,on=!FAV.includes(id);
  FAV=on?[id,...FAV]:FAV.filter(x=>x!=id);try{localStorage.setItem('psnf',JSON.stringify(FAV))}catch(x){}
  document.querySelectorAll(`[data-f="${id}"]`).forEach(b=>{b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)});favN();
  if($('simpan').style.display=='block')renderSaved();
  aLog(on?'Simpan tiket':'Hapus simpanan',[{t:`${on?'Sisipkan':'Buang'} id <b>${id}</b> (${esc(tiket[id].nama)}) ${on?'di awal':'dari'} array FAV[]`},{t:`FAV.length = ${FAV.length}`,y:1}])});
document.addEventListener('error',e=>{if(e.target.tagName=='IMG'&&e.target.classList.contains('cvr'))e.target.remove()},true);
function show(n){
  document.querySelectorAll('.nav button').forEach(x=>x.classList.toggle('on',x.dataset.v==n));
  ['tiket','pesanan','simpan'].forEach(m=>$(m).style.display=m==n?'block':'none');const sec=$(n);sec.classList.remove('vin');void sec.offsetWidth;sec.classList.add('vin');
  if(n=='pesanan')renderOrders();if(n=='simpan')renderSaved();scrollTo(0,0);aLog('Pindah tampilan · '+n,[{t:`Tampilan aktif: <b>${n}</b>`},{t:n=='pesanan'?`Traversal linked list dari head, ${LL.size} node`:'Data array tiket[] tidak berubah',y:1}]);
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
tabs();reset();memo();favN();cxu();upd();pushLog('Siap digunakan',[{t:'Setiap tindakanmu dicatat di sini dan diganti otomatis saat ada tindakan baru. Ganti metode pengurutan dan pencarian lewat bagian atas panel ini.'},{t:`${tiket.length} struct Tiket dimuat ke array <b>tiket[]</b>`,y:1}],true); unread=0;badge();
