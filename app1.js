
const APP_VERSION='2.0.2', DATA_KEY='kopi_genggam_v2_data', LEGACY_KEY='kopi_genggam_v1_data', BACKUP_INDEX_KEY='kopi_genggam_backup_index_v2';
let menuHarga=[
{name:"Kopi Genggam",price:8500,point:1.5},{name:"Choco Genggam",price:8500,point:1.5},{name:"Matcha Genggam",price:8500,point:1.5},{name:"Mocha Genggam",price:8500,point:1.5},
{name:"Kopi Botol",price:42500,point:7.5},{name:"Choco Botol",price:42500,point:7.5},{name:"Matcha Botol",price:42500,point:7.5},{name:"Mocha Botol",price:42500,point:7.5}];
let bahanList=["Kopi","Coklat","Matcha","UHT","Creamer","SKM","Aren","Botol 200ml","Botol 1000ml"];
let resepData=[
{name:"Kopi Genggam",Kopi:3,Coklat:0,Matcha:0,UHT:75,Creamer:15,SKM:20,Aren:4,"Botol 200ml":1,"Botol 1000ml":0},
{name:"Choco Genggam",Kopi:0,Coklat:16,Matcha:0,UHT:32,Creamer:0,SKM:35,Aren:0,"Botol 200ml":1,"Botol 1000ml":0},
{name:"Matcha Genggam",Kopi:0,Coklat:0,Matcha:22,UHT:45,Creamer:10,SKM:20,Aren:0,"Botol 200ml":1,"Botol 1000ml":0},
{name:"Mocha Genggam",Kopi:2,Coklat:5,Matcha:0,UHT:50,Creamer:10,SKM:30,Aren:0,"Botol 200ml":1,"Botol 1000ml":0},
{name:"Kopi Botol",Kopi:15,Coklat:0,Matcha:0,UHT:375,Creamer:75,SKM:100,Aren:20,"Botol 200ml":0,"Botol 1000ml":1},
{name:"Choco Botol",Kopi:0,Coklat:80,Matcha:0,UHT:160,Creamer:0,SKM:175,Aren:0,"Botol 200ml":0,"Botol 1000ml":1},
{name:"Matcha Botol",Kopi:0,Coklat:0,Matcha:110,UHT:225,Creamer:50,SKM:100,Aren:0,"Botol 200ml":0,"Botol 1000ml":1},
{name:"Mocha Botol",Kopi:10,Coklat:25,Matcha:0,UHT:250,Creamer:50,SKM:150,Aren:0,"Botol 200ml":0,"Botol 1000ml":1}];
let belanjaData=[],transaksiData=[],opnameData=[],setoranData=[],cart=[];
let editingHargaIndex=null,editingResepIndex=null,editingBelanjaIndex=null,editingTrxIndex=null,editingOpnameIndex=null,editingSetoranIndex=null;
let salesChartInstance=null,trendChartInstance=null,assetChartInstance=null,deferredPrompt=null;

const num=v=>Number.isFinite(Number(v))?Number(v):0;
const money=v=>`Rp ${Math.round(num(v)).toLocaleString('id-ID')}`;
// Tanggal lokal Indonesia (WIB) — hindari mundur 1 hari karena UTC
const today=()=>{
    try{
        return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    }catch(e){
        const d=new Date();const off=7*60;const local=new Date(d.getTime()+(d.getTimezoneOffset()+off)*60000);
        return local.toISOString().split('T')[0];
    }
};
const uid=()=>Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);

function showToast(msg){const t=document.getElementById('toast');document.getElementById('toast-msg').innerText=msg;t.classList.remove('translate-y-20','opacity-0');clearTimeout(window.__toastTimer);window.__toastTimer=setTimeout(()=>t.classList.add('translate-y-20','opacity-0'),2200)}
function backupSnapshot(reason='auto'){
    try{
        const snapshot={version:APP_VERSION,backupId:uid(),createdAt:new Date().toISOString(),reason,
            data:{menuHarga,bahanList,resepData,belanjaData,transaksiData,opnameData,setoranData}};
        localStorage.setItem(`kopi_genggam_backup_${snapshot.backupId}`,JSON.stringify(snapshot));
        let index=JSON.parse(localStorage.getItem(BACKUP_INDEX_KEY)||'[]');
        index.unshift({key:`kopi_genggam_backup_${snapshot.backupId}`,backupId:snapshot.backupId,createdAt:snapshot.createdAt,reason});
        index=index.slice(0,20);
        localStorage.setItem(BACKUP_INDEX_KEY,JSON.stringify(index));
        return snapshot;
    }catch(e){console.error('backupSnapshot',e);return null}
}
function saveToLocalStorage(reason='save'){
    try{
        const payload={schemaVersion:2,appVersion:APP_VERSION,updatedAt:new Date().toISOString(),
            menuHarga,bahanList,resepData,belanjaData,transaksiData,opnameData,setoranData};
        localStorage.setItem(DATA_KEY,JSON.stringify(payload));
    }catch(e){
        console.error('saveToLocalStorage',e);
        showToast('Gagal menyimpan data (penyimpanan penuh?)');
    }
}
function normalizeData(){
    belanjaData=belanjaData.map(b=>{const jumlah=num(b.jumlah);const total=num(b.total)||(num(b.harga)*jumlah);return {...b,jumlah,total};});
    transaksiData=transaksiData.map(t=>({...t,qty:num(t.qty),total:num(t.total)||(num(t.qty)*num((menuHarga.find(m=>m.name===t.name)||{}).price))}));
    opnameData=opnameData.map(o=>({...o,apps:num(o.apps),real:num(o.real),selisih:num(o.selisih)}));
    setoranData=setoranData.map(s=>({...s,nominal:num(s.nominal)}));
}

function loadFromLocalStorage(){
    let saved=localStorage.getItem(DATA_KEY), source='v2';
    if(!saved){saved=localStorage.getItem(LEGACY_KEY);source='v1'}
    if(!saved)return;
    try{
        const p=JSON.parse(saved);
        const d=p.data||p;
        if(d.menuHarga)menuHarga=d.menuHarga;if(d.bahanList)bahanList=d.bahanList;if(d.resepData)resepData=d.resepData;
        if(d.belanjaData)belanjaData=d.belanjaData;if(d.transaksiData)transaksiData=d.transaksiData;if(d.opnameData)opnameData=d.opnameData;if(d.setoranData)setoranData=d.setoranData;
        normalizeData();
        if(source==='v1'){backupSnapshot('pre-migration-v1');saveToLocalStorage('migration-v1-to-v2');showToast('Data lama dimigrasikan ke versi 2.0');}
    }catch(e){console.error(e);showToast('Gagal membaca data tersimpan');}
}
function getOpnameAdjustMap(){
    const adj={};
    bahanList.forEach(b=>{adj[b]=0});
    opnameData.forEach(o=>{if(adj[o.barang]!==undefined)adj[o.barang]+=num(o.selisih)});
    return adj;
}
function getStockMaps(){
    const inMap={},outMap={},costMap={},qtyMap={},adjMap=getOpnameAdjustMap();
    bahanList.forEach(b=>{inMap[b]=0;outMap[b]=0;costMap[b]=0;qtyMap[b]=0});
    belanjaData.forEach(b=>{if(inMap[b.barang]!==undefined){const q=num(b.jumlah),total=num(b.total)||(q*num(b.harga));inMap[b.barang]+=q;qtyMap[b.barang]+=q;costMap[b.barang]+=total;}});
    transaksiData.forEach(t=>{const r=resepData.find(x=>x.name===t.name);if(r)bahanList.forEach(b=>{outMap[b]+=num(r[b])*num(t.qty)})});
    return {inMap,outMap,costMap,qtyMap,adjMap};
}
function calculateStockData(){const {inMap,outMap,costMap,qtyMap,adjMap}=getStockMaps();return bahanList.reduce((s,b)=>{const avg=qtyMap[b]>0?costMap[b]/qtyMap[b]:0;const sisa=inMap[b]-outMap[b]+(adjMap[b]||0);return s+Math.max(0,sisa)*avg},0)}
function renderBahanDropdowns(){['belanja-barang','opname-barang'].forEach(id=>{const s=document.getElementById(id),old=s.value;s.innerHTML=bahanList.map(b=>`<option value="${esc(b)}">${esc(b)}</option>`).join('');if(bahanList.includes(old))s.value=old})}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&','<':'<','>':'>','"':'"',"'":'&#39;'}[m]))}

function renderPOSMenu(){document.getElementById('pos-menu-grid').innerHTML=menuHarga.map((m,i)=>`<div onclick="addToCart(${i})" class="bg-white p-3 rounded-xl border border-stone-200 active:border-amber-600 shadow-2xs cursor-pointer"><h4 class="font-bold text-stone-800 text-xs truncate">${esc(m.name)}</h4><div class="flex justify-between items-center mt-2"><span class="text-[11px] font-bold text-amber-600">${money(m.price)}</span><span class="text-[10px] bg-stone-100 px-1.5 py-0.5 rounded">+ Tambah</span></div></div>`).join('')}
function addToCart(i){const m=menuHarga[i],x=cart.find(c=>c.name===m.name);if(x)x.qty++;else cart.push({name:m.name,price:num(m.price),qty:1});renderCart()}
function updateCartQty(i,d){cart[i].qty+=d;if(cart[i].qty<=0)cart.splice(i,1);renderCart()}
function setCartQty(i,v){const q=parseInt(v);if(!Number.isFinite(q)||q<=0)cart.splice(i,1);else cart[i].qty=q;renderCart()}
function clearCart(){cart=[];renderCart()}
function renderCart(){const c=document.getElementById('cart-items');if(!cart.length){c.innerHTML='<p class="text-xs text-stone-400 text-center py-4">Keranjang kosong</p>';document.getElementById('cart-total').innerText='Rp 0';return}let total=0;c.innerHTML=cart.map((x,i)=>{total+=x.price*x.qty;return `<div class="flex items-center justify-between bg-stone-50 p-2 rounded-lg border text-xs"><div class="max-w-[110px]"><p class="font-bold truncate text-[11px]">${esc(x.name)}</p><p class="text-[10px] text-amber-600">${money(x.price)}</p></div><div class="flex items-center space-x-1"><button onclick="updateCartQty(${i},-1)" class="w-6 h-6 bg-white border rounded">-</button><input type="number" min="1" value="${x.qty}" onchange="setCartQty(${i},this.value)" class="w-8 text-center bg-white border rounded font-bold text-xs"><button onclick="updateCartQty(${i},1)" class="w-6 h-6 bg-white border rounded">+</button></div></div>`}).join('');document.getElementById('cart-total').innerText=money(total)}

function getCartRequirements(){
    const need={};
    bahanList.forEach(b=>{need[b]=0});
    cart.forEach(c=>{const r=resepData.find(x=>x.name===c.name);if(r)bahanList.forEach(b=>{need[b]+=num(r[b])*num(c.qty)})});
    return need;
}
function getStockShortfalls(){
    const {inMap,outMap,adjMap}=getStockMaps(),need=getCartRequirements(),list=[];
    bahanList.forEach(b=>{
        const available=num(inMap[b])-num(outMap[b])+num(adjMap[b]||0);
        const req=num(need[b]);
        if(req>0&&req>available)list.push({barang:b,need:req,available,short:req-available});
    });
    return list;
}
function checkout(){
    if(!cart.length)return showToast('Keranjang kosong!');
    const shortfalls=getStockShortfalls();
    if(shortfalls.length){
        const detail=shortfalls.map(s=>`• ${s.barang}: perlu ${s.need}, sisa ${s.available} (kurang ${s.short})`).join('\n');
        if(!confirm('⚠ Stok tidak cukup:\n'+detail+'\n\nLanjut simpan transaksi?'))return;
    }
    const date=document.getElementById('trx-date').value||today();
    cart.forEach(c=>transaksiData.push({id:uid(),date,name:c.name,qty:num(c.qty),total:num(c.price)*num(c.qty)}));
    cart=[];renderCart();renderTransactions();updateDashboard();updateCharts();saveToLocalStorage();
    showToast(shortfalls.length?'Transaksi disimpan (stok minus!)':'Transaksi disimpan!');
}
function renderTransactions(){
    const b=document.getElementById('transactions-table-body');
    if(!transaksiData.length){b.innerHTML='<tr><td colspan="3" class="text-center py-4 text-stone-400">Belum ada transaksi</td></tr>';return}
    const rows=[...transaksiData.keys()].reverse();
    b.innerHTML=rows.map(i=>{const t=transaksiData[i];return `<tr><td class="py-2 px-2"><p class="font-semibold">${esc(t.name)}</p><p class="text-[10px] text-stone-400">${t.date}</p></td><td class="py-2 px-2"><p>${t.qty} Pcs</p><p class="font-bold">${money(t.total)}</p></td><td class="py-2 px-2 text-center"><button onclick="editTransaction(${i})" class="text-amber-600 p-1"><i class="fa-solid fa-pen-to-square"></i></button><button onclick="deleteTransaction(${i})" class="text-rose-600 p-1"><i class="fa-solid fa-trash"></i></button></td></tr>`}).join('');
}
function editTransaction(i){editingTrxIndex=i;const t=transaksiData[i];document.getElementById('modal-trx-date').value=t.date;document.getElementById('modal-trx-qty').value=t.qty;document.getElementById('modal-trx-name').innerHTML=menuHarga.map(m=>`<option ${m.name===t.name?'selected':''}>${esc(m.name)}</option>`).join('');document.getElementById('trx-modal').classList.remove('hidden');document.getElementById('trx-modal').classList.add('flex')}
function closeTrxModal(){editingTrxIndex=null;document.getElementById('trx-modal').classList.add('hidden');document.getElementById('trx-modal').classList.remove('flex')}
function saveTrxEdit(){if(editingTrxIndex===null)return;const date=document.getElementById('modal-trx-date').value,name=document.getElementById('modal-trx-name').value,qty=parseInt(document.getElementById('modal-trx-qty').value),m=menuHarga.find(x=>x.name===name);if(!date||qty<=0||!m)return showToast('Data transaksi tidak valid!');transaksiData[editingTrxIndex]={...transaksiData[editingTrxIndex],date,name,qty,total:num(m.price)*qty};closeTrxModal();renderTransactions();updateDashboard();updateCharts();saveToLocalStorage();showToast('Transaksi diperbarui!')}
function deleteTransaction(i){if(confirm('Hapus transaksi ini?')){transaksiData.splice(i,1);renderTransactions();updateDashboard();updateCharts();saveToLocalStorage();showToast('Transaksi dihapus.')}}

function renderHarga(){document.getElementById('harga-table-body').innerHTML=menuHarga.map((h,i)=>`<tr draggable="true" ondragstart="onDragStart(event,${i})" ondragover="onDragOver(event)" ondrop="onDrop(event,${i})"><td class="py-2 px-2 text-center">${i+1} <button onclick="moveMenu(${i},-1)">↑</button><button onclick="moveMenu(${i},1)">↓</button></td><td class="py-2 px-2 font-semibold">${esc(h.name)}</td><td class="py-2 px-2 text-amber-600 font-bold">${money(h.price)}</td><td class="py-2 px-2">${h.point}</td><td class="text-center"><button onclick="openHargaModal(${i})" class="text-amber-600 p-1"><i class="fa-solid fa-pen-to-square"></i></button><button onclick="deleteHarga(${i})" class="text-rose-600 p-1"><i class="fa-solid fa-trash"></i></button></td></tr>`).join('')}
let draggedIndex=null;function onDragStart(e,i){draggedIndex=i;e.dataTransfer.effectAllowed='move'}function onDragOver(e){e.preventDefault()}function onDrop(e,i){e.preventDefault();if(draggedIndex===null||draggedIndex===i)return;const x=menuHarga.splice(draggedIndex,1)[0];menuHarga.splice(i,0,x);draggedIndex=null;renderHarga();renderPOSMenu();saveToLocalStorage();showToast('Urutan menu diperbarui!')}
function moveMenu(i,d){const j=i+d;if(j<0||j>=menuHarga.length)return;[menuHarga[i],menuHarga[j]]=[menuHarga[j],menuHarga[i]];renderHarga();renderPOSMenu();saveToLocalStorage()}
function openHargaModal(i=null){editingHargaIndex=i;document.getElementById('modal-harga-title').innerText=i===null?'Tambah Menu Baru':'Edit Menu & Harga';document.getElementById('modal-menu-name').value=i===null?'':menuHarga[i].name;document.getElementById('modal-menu-price').value=i===null?'':menuHarga[i].price;document.getElementById('modal-menu-point').value=i===null?'':menuHarga[i].point;document.getElementById('harga-modal').classList.remove('hidden');document.getElementById('harga-modal').classList.add('flex')}
function closeHargaModal(){editingHargaIndex=null;document.getElementById('harga-modal').classList.add('hidden');document.getElementById('harga-modal').classList.remove('flex')}
function saveHargaModal(){
    const name=document.getElementById('modal-menu-name').value.trim(),price=parseFloat(document.getElementById('modal-menu-price').value),point=parseFloat(document.getElementById('modal-menu-point').value)||0;
    if(!name||!Number.isFinite(price)||price<0)return showToast('Isi nama & harga dengan benar!');
    if(menuHarga.some((m,i)=>m.name===name&&i!==editingHargaIndex))return showToast('Menu sudah ada!');
    if(editingHargaIndex!==null){
        const old=menuHarga[editingHargaIndex].name;
        menuHarga[editingHargaIndex]={...menuHarga[editingHargaIndex],name,price,point};
        const r=resepData.find(x=>x.name===old);if(r)r.name=name;
        if(old!==name)transaksiData.forEach(t=>{if(t.name===old)t.name=name});
    }else{
        menuHarga.push({name,price,point});
        if(!resepData.some(r=>r.name===name))resepData.push(Object.assign({name},...bahanList.map(b=>({[b]:0}))));
    }
    closeHargaModal();renderAll();showToast('Menu disimpan!');
}
function deleteHarga(i){const name=menuHarga[i].name;if(confirm(`Hapus menu "${name}" beserta resep terkait?`)){backupSnapshot('before-delete-menu');menuHarga.splice(i,1);resepData=resepData.filter(r=>r.name!==name);renderAll();showToast('Menu dan resep terkait dihapus.')}}

function renderResep(){document.getElementById('resep-table-head').innerHTML='<th class="py-2 px-2">Resep</th>'+bahanList.map(b=>`<th class="py-2 px-1">${esc(b)}</th>`).join('')+'<th>Aksi</th>';document.getElementById('resep-table-body').innerHTML=resepData.map((r,i)=>`<tr><td class="py-2 px-2 font-bold">${esc(r.name)}</td>${bahanList.map(b=>`<td class="py-2 px-1">${num(r[b])}</td>`).join('')}<td><button onclick="openResepModal(${i})" class="text-amber-600 p-1">✎</button><button onclick="deleteResep(${i})" class="text-rose-600 p-1">×</button></td></tr>`).join('')}
function openResepModal(i=null){editingResepIndex=i;const r=i===null?{name:''}:resepData[i];document.getElementById('modal-resep-title').innerText=i===null?'Tambah Resep Baru':'Edit Resep Komposisi';document.getElementById('modal-resep-name').value=r.name;document.getElementById('modal-resep-name').disabled=i!==null;document.getElementById('modal-resep-ingredients').innerHTML=bahanList.map(b=>`<div class="flex justify-between bg-stone-50 px-2.5 py-1 rounded-lg border"><span class="text-[11px]">${esc(b)}</span><input type="number" id="resep-qty-${CSS.escape(b)}" value="${num(r[b])}" min="0" step="any" class="w-14 border rounded text-xs text-center"></div>`).join('');document.getElementById('resep-modal').classList.remove('hidden');document.getElementById('resep-modal').classList.add('flex')}
function closeResepModal(){editingResepIndex=null;document.getElementById('resep-modal').classList.add('hidden');document.getElementById('resep-modal').classList.remove('flex')}
function saveNewResep(){const name=document.getElementById('modal-resep-name').value.trim();if(!name)return showToast('Nama resep kosong!');if(editingResepIndex===null&&resepData.some(r=>r.name===name))return showToast('Resep sudah ada!');let r=editingResepIndex===null?{name}:resepData[editingResepIndex];bahanList.forEach(b=>r[b]=num(document.getElementById(`resep-qty-${CSS.escape(b)}`).value));if(editingResepIndex===null){resepData.push(r);if(!menuHarga.some(m=>m.name===name))menuHarga.push({name,price:10000,point:2})}closeResepModal();renderAll();showToast('Resep disimpan!')}
