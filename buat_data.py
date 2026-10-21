"""buat_data.py - pembuat data tiket simulasi (hasil: data.json dan data.js).
Jalankan: python3 buat_data.py
Bagian otomatis (pesawat, kereta antarkota, bus antarkota, hotel) dihitung dari jarak antarkota
(rumus haversine). Bagian tulisan tangan dibaca dari data_manual.json. Seed tetap, hasil selalu sama."""
import json,math,random,os
random.seed(11); HERE=os.path.dirname(os.path.abspath(__file__))
R=[]; seen=set()
def add(r):
    k=tuple(r[:5])
    if k not in seen: seen.add(k); R.append(r)
rd=lambda v:int(round(v/(1000 if v<100000 else 5000))*(1000 if v<100000 else 5000))
rt=lambda b:round(min(4.9,max(3.5,b+random.uniform(-.2,.2))),1)
jt=lambda a=.9,b=1.15:random.uniform(a,b)
def hv(x,y):  # jarak (km) antara dua koordinat
    la1,lo1,la2,lo2=map(math.radians,(x[0],x[1],y[0],y[1]))
    return 6371*2*math.asin(math.sqrt(math.sin((la2-la1)/2)**2+math.cos(la1)*math.cos(la2)*math.sin((lo2-lo1)/2)**2))
ID={"Jakarta":(-6.2,106.85),"Surabaya":(-7.25,112.75),"Bandung":(-6.9,107.6),"Yogyakarta":(-7.8,110.4),"Semarang":(-6.97,110.42),"Solo":(-7.57,110.82),"Malang":(-7.98,112.63),"Denpasar":(-8.65,115.2),"Medan":(3.6,98.67),"Palembang":(-2.99,104.76),"Padang":(-.95,100.35),"Pekanbaru":(.5,101.45),"Batam":(1.13,104.05),"Banda Aceh":(5.55,95.32),"Bandar Lampung":(-5.43,105.26),"Pontianak":(-.03,109.33),"Balikpapan":(-1.24,116.83),"Banjarmasin":(-3.32,114.59),"Samarinda":(-.5,117.15),"Makassar":(-5.15,119.43),"Manado":(1.49,124.84),"Kupang":(-10.17,123.6),"Mataram":(-8.58,116.1),"Labuan Bajo":(-8.5,119.88),"Ambon":(-3.7,128.18),"Jayapura":(-2.53,140.7),"Sorong":(-.88,131.26),"Palu":(-.9,119.87),"Kendari":(-3.97,122.51),"Banyuwangi":(-8.22,114.37),"Jember":(-8.17,113.7),"Cirebon":(-6.73,108.55),"Purwokerto":(-7.42,109.24),"Madiun":(-7.63,111.52),"Kediri":(-7.82,112.01),"Jambi":(-1.6,103.6),"Bengkulu":(-3.8,102.26),"Tanjung Pinang":(.92,104.45),"Bogor":(-6.6,106.8)}
FO={"Singapura":(1.35,103.82,'sea'),"Kuala Lumpur":(3.14,101.69,'sea'),"Bangkok":(13.75,100.5,'sea'),"Manila":(14.6,120.98,'sea'),"Ho Chi Minh":(10.82,106.63,'sea'),"Hanoi":(21.03,105.85,'sea'),"Penang":(5.41,100.33,'sea'),"Phuket":(7.88,98.39,'sea'),"Hong Kong":(22.3,114.17,'ea'),"Tokyo":(35.68,139.69,'ea'),"Osaka":(34.69,135.5,'ea'),"Seoul":(37.57,126.98,'ea'),"Taipei":(25.03,121.56,'ea'),"Shanghai":(31.23,121.47,'ea'),"Beijing":(39.9,116.4,'ea'),"Sydney":(-33.87,151.21,'oce'),"Melbourne":(-37.81,144.96,'oce'),"Perth":(-31.95,115.86,'oce'),"Auckland":(-36.85,174.76,'oce'),"Dubai":(25.2,55.27,'eu'),"Doha":(25.29,51.53,'eu'),"Jeddah":(21.54,39.17,'eu'),"Istanbul":(41.01,28.98,'eu'),"London":(51.5,-.13,'eu'),"Amsterdam":(52.37,4.9,'eu'),"Paris":(48.86,2.35,'eu'),"Mumbai":(19.08,72.88,'sa'),"Delhi":(28.61,77.21,'sa'),"Colombo":(6.93,79.86,'sa')}
AL={"Garuda Indonesia":("GA",1.35,4.7),"Citilink":("QG",.8,4.2),"Lion Air":("JT",.7,4.0),"Batik Air":("ID",1.05,4.4),"Super Air Jet":("IU",.75,4.1),"Wings Air":("IW",.65,3.9),"Pelita Air":("IP",.95,4.5),"TransNusa":("8B",.8,4.1),"Sriwijaya Air":("SJ",.85,4.0),"Singapore Airlines":("SQ",1.15,4.8),"AirAsia":("QZ",.65,4.1),"Scoot":("TR",.7,4.2),"Malaysia Airlines":("MH",.95,4.4),"Thai Airways":("TG",.95,4.5),"Vietnam Airlines":("VN",.85,4.3),"Philippine Airlines":("PR",.9,4.2),"Jetstar":("JQ",.65,4.0),"Japan Airlines":("JL",1.15,4.8),"ANA":("NH",1.15,4.8),"Korean Air":("KE",1.1,4.6),"Cathay Pacific":("CX",1.1,4.7),"China Airlines":("CI",1,4.5),"Qantas":("QF",1.1,4.6),"Virgin Australia":("VA",.9,4.3),"Emirates":("EK",1.25,4.9),"Qatar Airways":("QR",1.2,4.9),"Etihad":("EY",1.15,4.7),"Turkish Airlines":("TK",1,4.6),"KLM":("KL",1.1,4.6)}
REG={'sea':["Singapore Airlines","AirAsia","Scoot","Malaysia Airlines","Thai Airways","Garuda Indonesia","Vietnam Airlines","Philippine Airlines","Jetstar"],'ea':["Japan Airlines","ANA","Korean Air","Cathay Pacific","China Airlines","Garuda Indonesia","Singapore Airlines","Scoot"],'oce':["Qantas","Jetstar","Garuda Indonesia","Singapore Airlines","Virgin Australia"],'eu':["Emirates","Qatar Airways","Etihad","Turkish Airlines","Singapore Airlines","Garuda Indonesia","KLM"],'sa':["Singapore Airlines","Garuda Indonesia","Emirates","Qatar Airways","AirAsia","Scoot"]}
def fl(lg,a,b,d,base,per,al,dm,rev=True):  # harga = (dasar + jarak x tarif) x faktor maskapai; durasi = tetap + jarak/12 menit
    c,f,r=AL[al];add(["pesawat",lg,f"{al} {c}-{random.randint(100,899)}",a,b,rd((base+d*per)*f*jt()),int(dm+d/12)+random.randint(-4,9),rt(r)])
    if rev and random.random()<.5: fl(lg,b,a,d,base,per,al,dm,False)   # separuh rute ada arah sebaliknya
# 1. pesawat nasional
NAS=["Garuda Indonesia","Citilink","Lion Air","Batik Air","Super Air Jet","Wings Air","Pelita Air","TransNusa","Sriwijaya Air"]
AP=[c for c in ID if c not in('Bogor','Madiun','Kediri')];HUB={'Jakarta','Surabaya','Denpasar','Makassar','Medan','Balikpapan','Yogyakarta'}
cd=[(a,b) for a in AP for b in AP if a<b and (a in HUB or b in HUB) and 350<=hv(ID[a],ID[b])<=4200]
POP=[("Jakarta","Surabaya"),("Jakarta","Denpasar"),("Jakarta","Medan"),("Jakarta","Yogyakarta"),("Jakarta","Makassar"),("Jakarta","Balikpapan"),("Surabaya","Denpasar"),("Surabaya","Makassar"),("Jakarta","Semarang"),("Jakarta","Palembang"),("Bandung","Denpasar"),("Surabaya","Balikpapan")]
for a,b in POP:   # rute populer: dua arah, tiga maskapai
    for x,y in((a,b),(b,a)):
        for al in random.sample(NAS[:5],3): fl("nasional",x,y,hv(ID[x],ID[y]),350000,650,al,35,False)
for a,b in random.sample(cd,48):
    for al in random.sample(NAS,2):
        if random.random()<.5:a,b=b,a
        fl("nasional",a,b,hv(ID[a],ID[b]),350000,650,al,35)
# 2. pesawat internasional
ORI=['Jakarta','Surabaya','Denpasar','Medan','Makassar','Yogyakarta','Balikpapan','Batam']
for c in['Singapura','Kuala Lumpur','Bangkok','Tokyo','Hong Kong','Sydney','Dubai','Seoul']:   # hub populer: dua arah dari tiga kota besar
    la,lo,rg=FO[c]
    for o in['Jakarta','Surabaya','Denpasar']:
        for al in random.sample(REG[rg],2):
            for x,y in((o,c),(c,o)): fl("internasional",x,y,hv(ID[o],(la,lo)),700000,1100,al,45,False)
for c,(la,lo,rg) in FO.items():
    for o in random.sample(ORI,3 if rg=='sea' else 2):
        for al in random.sample(REG[rg],2): fl("internasional",o,c,hv(ID[o],(la,lo)),700000,1100,al,45)
# 3. kereta antarkota Jawa
J=["Jakarta","Bandung","Cirebon","Semarang","Yogyakarta","Solo","Surabaya","Malang","Jember","Banyuwangi","Purwokerto","Madiun","Kediri","Bogor"]
for n in ["Argo Parahyangan","Argo Dwipangga","Argo Muria","Argo Sindoro","Argo Semeru","Majapahit","Gaya Baru Malam Selatan","Matarmaja","Singasari","Kertajaya","Jayabaya","Brantas","Kahuripan","Pasundan","Kutojaya Selatan","Serayu","Mutiara Selatan","Logawa","Sritanjung","Tawang Alun","Ciremai","Cirebon Ekspres","Fajar Utama Yogya","Senja Utama Solo","Bangunkarta","Wijayakusuma","Probowangi","Mutiara Timur Premium"]:
    a,b=random.sample(J,2);d=hv(ID[a],ID[b])*1.25   # jarak jalan rel ~ 1,25 x garis lurus
    if d>=60: add(["kereta","nasional",f"KA {n}",a,b,rd((40000+d*420)*jt(.9,1.2)),int(d/58*60),rt(4.3)])
# 4. bus antarkota
G=[["Jakarta","Bandung","Cirebon","Semarang","Yogyakarta","Solo","Surabaya","Malang","Jember","Banyuwangi","Purwokerto","Madiun","Kediri","Bogor","Denpasar"],["Medan","Palembang","Padang","Pekanbaru","Banda Aceh","Bandar Lampung","Jambi","Bengkulu"],["Makassar","Manado","Palu","Kendari"],["Pontianak","Balikpapan","Banjarmasin","Samarinda"]]
OP=["Sinar Jaya","Harapan Jaya","Rosalia Indah","Lorena","Pahala Kencana","Gunung Harta","Pandawa 87","Haryanto","Efisiensi","Safari Dharma Raya","Putra Remaja","Handoyo","ALS","Damri","Sumber Alam","Agramas","Bejeu","Nusantara"]
for _ in range(60):
    a,b=random.sample(random.choice(G[:1]*3+G[1:]),2);d=hv(ID[a],ID[b])*1.3
    if 80<=d<=1800: add(["bus","nasional",random.choice(OP),a,b,rd((40000+d*300)*jt(.9,1.4)),int(d/48*60+20),rt(4.2)])
# 5. hotel: tiga kelas (premium, menengah, hemat) x faktor harga kota
def hot(lg,spec,PR,MD,BG):
    for e in spec.split(';'):
        loc,mu=e.rsplit(':',1);mu=float(mu);sh=loc.split('– ')[-1]
        tiers=[(random.choice(PR),1800000,4.7),(random.choice(MD),750000,4.3),(random.choice(BG),300000,4.0)]+([(random.choice(MD),900000,4.4)] if mu>=1.3 else [])
        for b,pr,r in tiers: add(["hotel",lg,f"{b} {sh}",loc,"",rd(pr*mu*jt(.85,1.25)),0,rt(r)])
hot("nasional","Jakarta:1.2;Surabaya:1;Bandung:.95;Yogyakarta:.9;Semarang:.85;Solo:.75;Malang:.8;Batu:.85;Bogor:.85;Cirebon:.7;Banyuwangi:.7;Medan:.9;Palembang:.8;Padang:.75;Pekanbaru:.8;Banda Aceh:.7;Bandar Lampung:.7;Batam:1;Bintan:1.3;Pontianak:.75;Balikpapan:1;Banjarmasin:.75;Samarinda:.8;Makassar:.9;Manado:.85;Palu:.7;Kendari:.7;Kupang:.8;Mataram:1;Gili Trawangan:1.4;Labuan Bajo:1.3;Ambon:.8;Jayapura:1;Sorong:.9;Raja Ampat:2;Bali – Seminyak:1.5;Bali – Ubud:1.4;Bali – Nusa Dua:1.6;Bali – Kuta:1.2;Bali – Canggu:1.3;Bali – Sanur:1.2",
 ["Hilton","Sheraton","JW Marriott","Grand Hyatt","Novotel","Mercure","Swissôtel","The Ritz-Carlton","Pullman","Fairmont","Alila","Aston"],["Ibis Styles","Harris","Swiss-Belinn","Santika","Grand Zuri","Hotel Neo","Amaris","Whiz Prime","Artotel","Fave Hotel"],["POP! Hotel","RedDoorz Plus","OYO Life","Hotel Citradream","Zest","Tune Hotel","Capsule Inn"])
hot("internasional","Singapura:1.6;Kuala Lumpur:.9;Bangkok:.9;Phuket:1;Siem Reap:.7;Hanoi:.7;Ho Chi Minh:.7;Manila:.8;Penang:.7;Hong Kong:1.7;Tokyo:1.6;Osaka:1.2;Kyoto:1.3;Seoul:1.2;Taipei:1;Shanghai:1.2;Beijing:1;Sydney:1.8;Melbourne:1.5;Perth:1.3;Auckland:1.4;Dubai:1.7;Doha:1.5;Makkah:1.2;Istanbul:1.1;London:2.4;Amsterdam:2;Paris:2.4;Rome:1.8;Barcelona:1.6;Mumbai:.9;Delhi:.9;Colombo:.8;Male:2.2;New York:3;Los Angeles:2.2",
 ["Hyatt Regency","Shangri-La","Mandarin Oriental","Four Seasons","InterContinental","Conrad","Park Hyatt","Waldorf Astoria","The Peninsula","Marriott Marquis"],["Holiday Inn","Novotel","Mercure","Ibis","Hilton Garden Inn","DoubleTree","Courtyard","Crowne Plaza","Radisson"],["Ibis Budget","Moxy","Citadines","Hostel One","Formule 1","Capsule Hotel","Super 8","Easyhotel"])
# 6. data tulisan tangan
for r in json.load(open(os.path.join(HERE,'data_manual.json'),encoding='utf-8'))['baris']: add(r)
# 7. sewa mobil: tarif harian model x faktor kota; dengan sopir x1,35 (nasional)
MOB=[("Toyota Agya",350000,4.2),("Honda Brio",380000,4.3),("Toyota Avanza",450000,4.4),("Mitsubishi Xpander",520000,4.5),("Toyota Innova Reborn",650000,4.6),("Toyota Fortuner",1100000,4.7),("Toyota Alphard",2200000,4.8),("Toyota Hiace",1300000,4.5)]
for kota,mu in {"Jakarta":1.1,"Bandung":1,"Yogyakarta":.95,"Surabaya":1,"Bali":1.25,"Malang":.9,"Medan":.95,"Makassar":.95,"Lombok":1.05,"Semarang":.9,"Solo":.85,"Balikpapan":1,"Batam":1,"Labuan Bajo":1.3,"Banyuwangi":.9}.items():
    for m,h,r in random.sample(MOB,4):
        drv=random.random()<.5;add(["mobil","nasional",f"{m} · {'dengan sopir' if drv else 'lepas kunci'}",kota,"",rd(h*mu*(1.35 if drv else 1)*jt(.92,1.1)),0,rt(r)])
MOBI=[("Toyota Corolla",1,4.4),("Honda Fit",.9,4.3),("Nissan Serena",1.3,4.4),("Mercedes C-Class",2.4,4.7),("BMW 3 Series",2.5,4.7)]
for kota,mu in {"Singapura":2.8,"Kuala Lumpur":1.2,"Bangkok":1.1,"Tokyo":2,"Osaka":1.9,"Seoul":1.6,"Sydney":1.8,"Melbourne":1.7,"Perth":1.5,"Auckland":1.6,"Dubai":1.7,"London":2.3,"Paris":2.2,"Phuket":1}.items():
    for m,f,r in random.sample(MOBI,3): add(["mobil","internasional",f"{m} · lepas kunci",kota,"",rd(600000*f*mu*jt(.92,1.1)),0,rt(r)])
# 8. paket wisata (tulisan tangan: nama, lokasi, harga per orang, rating)
for lg,L in(("nasional",[("Paket Bali 3D2N","Bali",2900000,4.6),("Paket Bali 5D4N Ubud + Nusa Penida","Bali",5800000,4.7),("Paket Yogyakarta 2D1N Borobudur + Prambanan","Yogyakarta",1650000,4.5),("Paket Bromo Ijen 3D2N","Malang",2750000,4.7),("Paket Lombok 3D2N + Gili","Lombok",3200000,4.6),("Paket Labuan Bajo 3D2N Liveaboard","Labuan Bajo",4900000,4.8),("Paket Raja Ampat 4D3N","Raja Ampat",8900000,4.9),("Paket Toba Samosir 3D2N","Danau Toba",2400000,4.4),("Paket Bandung 2D1N","Bandung",1150000,4.3),("Paket Jakarta City Tour 1D","Jakarta",420000,4.2),("Paket Bunaken Manado 3D2N","Manado",3300000,4.6),("Paket Belitung 3D2N","Belitung",2650000,4.6),("Paket Karimunjawa 3D2N","Karimunjawa",2350000,4.5),("Paket Wakatobi 4D3N","Wakatobi",7200000,4.8),("Paket Tana Toraja 3D2N","Toraja",2900000,4.5),("Paket Bukittinggi 3D2N","Padang",2100000,4.3),("Paket Sumba 4D3N","Sumba",6100000,4.7),("Paket Banyuwangi Ijen 2D1N","Banyuwangi",1650000,4.5),("Paket Derawan 4D3N","Berau",5400000,4.7),("Paket Pulau Seribu 2D1N","Jakarta",980000,4.2),("Paket Dieng 2D1N","Wonosobo",1200000,4.4),("Paket Tanjung Lesung 2D1N","Banten",1350000,4.2)]),
 ("internasional",[("Paket Singapura 3D2N","Singapura",5200000,4.5),("Paket Kuala Lumpur-Genting 4D3N","Kuala Lumpur",4800000,4.4),("Paket Bangkok-Pattaya 5D4N","Bangkok",6500000,4.5),("Paket Jepang Tokyo-Fuji-Osaka 7D5N","Tokyo",24500000,4.8),("Paket Korea Seoul-Nami 5D4N","Seoul",14500000,4.6),("Paket Hong Kong-Macau 4D3N","Hong Kong",9800000,4.5),("Paket Australia Sydney 6D5N","Sydney",21500000,4.7),("Paket Dubai 5D4N","Dubai",13500000,4.6),("Paket Turki Istanbul-Cappadocia 8D7N","Istanbul",23500000,4.8),("Paket Eropa Barat 10D8N","Paris",42500000,4.7),("Paket Umrah Reguler 9 Hari","Makkah",32500000,4.8),("Paket Vietnam Hanoi-Ha Long 5D4N","Hanoi",7900000,4.5),("Paket Kamboja Angkor 4D3N","Siem Reap",6800000,4.6),("Paket Taiwan 5D4N","Taipei",11800000,4.5),("Paket Maldives 4D3N","Male",21500000,4.8),("Paket Tiongkok Beijing-Shanghai 6D5N","Beijing",15900000,4.5),("Paket Selandia Baru 8D7N","Auckland",39500000,4.8),("Paket India Golden Triangle 6D5N","Delhi",12800000,4.4),("Paket Filipina Cebu 4D3N","Manila",7900000,4.4),("Paket Phuket Phi Phi 4D3N","Phuket",6900000,4.5),("Paket Sri Lanka 6D5N","Colombo",10500000,4.5),("Paket Amerika Barat 10D8N","Los Angeles",49500000,4.6)])):
    for n,l,h,r in L: add(["wisata",lg,n,l,"",h,0,r])
# keluaran
body=',\n'.join(json.dumps(r,ensure_ascii=False) for r in R)
js='{"kolom":["tipe","lingkup","nama","asal","tujuan","harga","durasi","rating"],\n"baris":[\n'+body+'\n]}'
open(os.path.join(HERE,'data.json'),'w',encoding='utf-8').write(js+'\n')
open(os.path.join(HERE,'data.js'),'w',encoding='utf-8').write('const RAW='+js+';\n')
from collections import Counter
print(len(R),'baris',dict(Counter(r[0] for r in R)))
