function deleteResep(i){if(confirm('Hapus resep ini?')){resepData.splice(i,1);renderResep();saveToLocalStorage();showToast('Resep dihapus.')}}

function belanjaDuplicate(date,barang,asal,jumlah,total,exclude=-1){return belanjaData.some((b,i)=>i!==exclude&&b.date===date&&b.barang===barang&&b.asal===asal&&num(b.jumlah)===jumlah&&num(b.total)===total)}
function saveBelanja(){
    const date=document.getElementById('belanja-date').value,barang=document.getElementById('belanja-barang').value,jumlah=parseFloat(document.getElementById('belanja-jumlah').value),total=parseFloat(document.getElementById('belanja-total').value),asal=document.getElementById('belanja-asal').value;
    if(!date||!barang||!Number.isFinite(jumlah)||jumlah<=0||!Number.isFinite(total)||total<0)return showToast('Data belanja tidak valid!');
    if(belanjaDuplicate(date,barang,asal,jumlah,total,editingBelanjaIndex??-1))return showToast('Duplikasi belanja terdeteksi!');
    const row={id:belanjaData[editingBelanjaIndex]?.id||uid(),date,barang,jumlah,total,asal};
    if(editingBelanjaIndex!==null){belanjaData[editingBelanjaIndex]=row;showToast('Belanja diperbarui!')}
    else{belanjaData.push(row);showToast(`Belanja disimpan: ${money(row.total)}`)}
    resetBelanjaForm();
    document.getElementById('belanja-date').value=date;
    renderBelanja();updateDashboard();updateCharts();saveToLocalStorage();
}
function editBelanja(i){editingBelanjaIndex=i;const b=belanjaData[i];document.getElementById('belanja-date').value=b.date;document.getElementById('belanja-barang').value=b.barang;document.getElementById('belanja-jumlah').value=b.jumlah;document.getElementById('belanja-total').value=b.total;document.getElementById('belanja-asal').value=b.asal;document.getElementById('belanja-form-title').innerText='Edit Pencatatan Belanja';document.getElementById('belanja-save-btn').innerText='Update';document.getElementById('belanja-cancel-btn').classList.remove('hidden')}
function resetBelanjaForm(){editingBelanjaIndex=null;document.getElementById('belanja-form-title').innerText='Pencatatan Belanja';document.getElementById('belanja-save-btn').innerText='Simpan';document.getElementById('belanja-cancel-btn').classList.add('hidden');document.getElementById('belanja-jumlah').value='';document.getElementById('belanja-total').value=''}
function deleteBelanja(i){if(confirm('Hapus catatan belanja ini?')){belanjaData.splice(i,1);renderBelanja();updateDashboard();updateCharts();saveToLocalStorage();showToast('Belanja dihapus.')}}
function renderBelanja(){document.getElementById('belanja-table-body').innerHTML=belanjaData.map((b,i)=>`<tr><td class="py-2 px-2">${b.date}</td><td class="py-2 px-2 font-semibold">${esc(b.barang)}</td><td class="py-2 px-2">${num(b.jumlah)}</td><td class="py-2 px-2 font-bold text-amber-600">${money(num(b.total))}</td><td class="py-2 px-2">${b.asal}</td><td class="text-center"><button onclick="editBelanja(${i})" class="text-amber-600 p-1">✎</button><button onclick="deleteBelanja(${i})" class="text-rose-600 p-1">×</button></td></tr>`).join('')}

function renderStok(){const {inMap,outMap,costMap,qtyMap,adjMap}=getStockMaps();document.getElementById('stok-table-body').innerHTML=bahanList.map(b=>{const s=inMap[b]-outMap[b]+(adjMap[b]||0),avg=qtyMap[b]>0?costMap[b]/qtyMap[b]:0,val=s>0?s*avg:0;const neg=s<0;return `<tr class="${neg?'bg-rose-50':''}"><td class="py-2.5 px-2 font-bold">${esc(b)}</td><td class="py-2.5 px-2 text-emerald-600 font-semibold">${inMap[b]}</td><td class="py-2.5 px-2 text-rose-600 font-semibold">${outMap[b]}</td><td class="py-2.5 px-2 font-bold ${neg?'text-rose-700':'text-stone-900'}">${s} ${neg?'⚠':''}</td><td class="py-2.5 px-2 font-bold ${neg?'text-rose-600':'text-amber-600'}">${money(val)}</td></tr>`}).join('')}

function currentAppStock(barang,excludeOpnameIndex=-1){
    const inMap={},outMap={};
    bahanList.forEach(b=>{inMap[b]=0;outMap[b]=0});
    belanjaData.forEach(b=>{if(inMap[b.barang]!==undefined)inMap[b.barang]+=num(b.jumlah)});
    transaksiData.forEach(t=>{const r=resepData.find(x=>x.name===t.name);if(r)bahanList.forEach(b=>{outMap[b]+=num(r[b])*num(t.qty)})});
    let adj=0;
    opnameData.forEach((o,i)=>{if(i!==excludeOpnameIndex&&o.barang===barang)adj+=num(o.selisih)});
    return num(inMap[barang])-num(outMap[barang])+adj;
}
function opnameDuplicate(date,barang,exclude=-1){return opnameData.some((o,i)=>i!==exclude&&o.date===date&&o.barang===barang)}
function saveOpname(){const date=document.getElementById('opname-date').value,barang=document.getElementById('opname-barang').value,real=parseFloat(document.getElementById('opname-real').value);if(!date||!barang||!Number.isFinite(real)||real<0)return showToast('Data opname tidak valid!');if(opnameDuplicate(date,barang,editingOpnameIndex??-1))return showToast('Duplikasi opname terdeteksi: tanggal & barang sudah ada!');const apps=currentAppStock(barang,editingOpnameIndex??-1),row={id:opnameData[editingOpnameIndex]?.id||uid(),date,barang,apps,real,selisih:real-apps};if(editingOpnameIndex!==null){opnameData[editingOpnameIndex]=row;resetOpnameForm();showToast('Opname diperbarui — stok disesuaikan!')}else{opnameData.push(row);showToast('Opname disimpan — stok disesuaikan!')}renderOpname();renderStok();updateDashboard();updateCharts();saveToLocalStorage()}
function editOpname(i){editingOpnameIndex=i;const o=opnameData[i];document.getElementById('opname-date').value=o.date;document.getElementById('opname-barang').value=o.barang;document.getElementById('opname-real').value=o.real;document.getElementById('opname-form-title').innerText='Edit Stok Opname Fisik';document.getElementById('opname-save-btn').innerText='Update';document.getElementById('opname-cancel-btn').classList.remove('hidden')}
function resetOpnameForm(){editingOpnameIndex=null;document.getElementById('opname-form-title').innerText='Stok Opname Fisik';document.getElementById('opname-save-btn').innerText='Simpan';document.getElementById('opname-cancel-btn').classList.add('hidden');document.getElementById('opname-real').value=''}
function deleteOpname(i){if(confirm('Hapus data opname ini? Stok akan dihitung ulang tanpa koreksi ini.')){opnameData.splice(i,1);renderOpname();renderStok();updateDashboard();updateCharts();saveToLocalStorage();showToast('Opname dihapus — stok dihitung ulang.')}}
function renderOpname(){document.getElementById('opname-table-body').innerHTML=opnameData.map((o,i)=>`<tr><td class="py-2 px-2">${o.date}</td><td class="py-2 px-2 font-semibold">${esc(o.barang)}</td><td class="py-2 px-2">${o.apps} / <b>${o.real}</b></td><td class="py-2 px-2 font-semibold ${o.selisih<0?'text-rose-600':'text-emerald-600'}">${o.selisih}</td><td class="text-center"><button onclick="editOpname(${i})" class="text-amber-600 p-1">✎</button><button onclick="deleteOpname(${i})" class="text-rose-600 p-1">×</button></td></tr>`).join('')}

function saveSetoran(){const date=document.getElementById('setoran-date').value,nominal=parseFloat(document.getElementById('setoran-nominal').value);if(!date||!Number.isFinite(nominal)||nominal<0)return showToast('Data setoran tidak valid!');if(editingSetoranIndex!==null){setoranData[editingSetoranIndex]={...setoranData[editingSetoranIndex],date,nominal};resetSetoranForm();showToast('Setoran diperbarui!')}else{setoranData.push({id:uid(),date,nominal});showToast('Setoran disimpan!')}renderSetoran();updateDashboard();updateCharts();saveToLocalStorage()}
function editSetoran(i){editingSetoranIndex=i;const s=setoranData[i];document.getElementById('setoran-date').value=s.date;document.getElementById('setoran-nominal').value=s.nominal;document.getElementById('setoran-form-title').innerText='Edit Pencatatan Setoran';document.getElementById('setoran-save-btn').innerText='Update';document.getElementById('setoran-cancel-btn').classList.remove('hidden')}
function resetSetoranForm(){editingSetoranIndex=null;document.getElementById('setoran-form-title').innerText='Pencatatan Setoran Uang';document.getElementById('setoran-save-btn').innerText='Setor';document.getElementById('setoran-cancel-btn').classList.add('hidden');document.getElementById('setoran-nominal').value=''}
function deleteSetoran(i){if(confirm('Hapus setoran ini?')){setoranData.splice(i,1);renderSetoran();updateDashboard();updateCharts();saveToLocalStorage();showToast('Setoran dihapus.')}}
function renderSetoran(){document.getElementById('setoran-table-body').innerHTML=setoranData.map((s,i)=>`<tr><td class="py-2 px-2">${s.date}</td><td class="py-2 px-2 font-bold text-emerald-600">${money(s.nominal)}</td><td class="text-center"><button onclick="editSetoran(${i})" class="text-amber-600 p-1">✎</button><button onclick="deleteSetoran(${i})" class="text-rose-600 p-1">×</button></td></tr>`).join('')}

function updateDashboard(){const rev=transaksiData.reduce((s,t)=>s+num(t.total),0),bc=belanjaData.filter(b=>b.asal==='Cabang').reduce((s,b)=>s+num(b.total),0),bp=belanjaData.filter(b=>b.asal==='Pusat').reduce((s,b)=>s+num(b.total),0),setor=setoranData.reduce((s,x)=>s+num(x.nominal),0),saldo=rev-bc-setor,aset=calculateStockData();document.getElementById('dash-rev').innerText=money(rev);document.getElementById('dash-belanja-pusat').innerText=money(bp);document.getElementById('dash-belanja-cabang').innerText=money(bc);document.getElementById('dash-setoran').innerText=money(setor);document.getElementById('dash-saldo-cabang').innerText=money(saldo);document.getElementById('dash-aset-stok').innerText=money(aset);renderStok()}
function initCharts(){salesChartInstance=new Chart(document.getElementById('salesChart'),{type:'bar',data:{labels:[],datasets:[{label:'Qty',data:[],backgroundColor:'#d97706',borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true},x:{grid:{display:false}}}}});trendChartInstance=new Chart(document.getElementById('trendChart'),{type:'line',data:{labels:[],datasets:[{label:'Rp',data:[],borderColor:'#059669',backgroundColor:'rgba(5,150,105,.1)',fill:true,tension:.3}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true},x:{grid:{display:false}}}}});assetChartInstance=new Chart(document.getElementById('assetChart'),{type:'doughnut',data:{labels:['Saldo Kas / Cabang','Nilai Aset Stok','Total Setoran'],datasets:[{data:[0,0,0],backgroundColor:['#d97706','#6366f1','#059669'],borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom'}}}});updateCharts()}
function updateCharts(){if(!salesChartInstance||!trendChartInstance||!assetChartInstance)return;const sales={};menuHarga.forEach(m=>sales[m.name]=0);transaksiData.forEach(t=>sales[t.name]=(sales[t.name]||0)+num(t.qty));salesChartInstance.data.labels=Object.keys(sales);salesChartInstance.data.datasets[0].data=Object.values(sales);salesChartInstance.update('none');const trend={};transaksiData.forEach(t=>{if(t.date)trend[t.date]=(trend[t.date]||0)+num(t.total)});const dates=Object.keys(trend).sort();trendChartInstance.data.labels=dates;trendChartInstance.data.datasets[0].data=dates.map(d=>trend[d]);trendChartInstance.update('none');const rev=transaksiData.reduce((s,t)=>s+num(t.total),0),bc=belanjaData.filter(b=>b.asal==='Cabang').reduce((s,b)=>s+num(b.total),0),setor=setoranData.reduce((s,x)=>s+num(x.nominal),0),saldo=Math.max(0,rev-bc-setor),aset=calculateStockData();assetChartInstance.data.datasets[0].data=[saldo,aset,setor];assetChartInstance.update('none')}

function renderAll(){renderHarga();renderResep();renderBahanDropdowns();renderPOSMenu();renderCart();renderBelanja();renderTransactions();renderOpname();renderSetoran();updateDashboard();updateCharts();saveToLocalStorage()}
function switchTab(tab){['dashboard','pos','harga','resep','belanja','stok','opname','setoran'].forEach(t=>{document.getElementById('tab-'+t).classList.add('hidden');const n=document.getElementById('nav-'+t);if(n)n.className='flex flex-col items-center py-1 px-2 hover:text-white text-stone-400'});document.getElementById('tab-'+tab).classList.remove('hidden');document.getElementById('nav-'+tab).className='flex flex-col items-center text-amber-500 font-semibold py-1 px-2';document.getElementById('header-title').innerText={dashboard:'Dashboard (v2.0.2)',pos:'Kasir POS',harga:'Daftar Harga',resep:'Tabel Resep',belanja:'Pencatatan Belanja',stok:'Stok Barang',opname:'Stok Opname',setoran:'Setoran Uang'}[tab]||'KOPI GENGGAM';if(tab==='dashboard'){updateDashboard();updateCharts()}if(tab==='stok')renderStok()}

function exportToExcel(){try{backupSnapshot('excel-export');const wb=XLSX.utils.book_new();[['MenuHarga',menuHarga],['DaftarBahan',bahanList.map(NamaBahan=>({NamaBahan}))],['Resep',resepData],['Belanja',belanjaData],['Transaksi',transaksiData],['Opname',opnameData],['Setoran',setoranData]].forEach(([n,d])=>XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(d),n));const stamp=new Date().toISOString().replace(/[:.]/g,'-');XLSX.writeFile(wb,`Kopi_Genggam_v${APP_VERSION}_Backup_${stamp}.xlsx`);showToast('Backup Excel berhasil dibuat!')}catch(e){console.error(e);showToast('Gagal export Excel!')}}
function importFromExcel(e){
    const file=e.target.files[0];if(!file)return;
    if(!confirm('Import akan MENGGANTI data saat ini.\nData lama akan di-backup otomatis terlebih dahulu.\n\nLanjutkan import?')){e.target.value='';return}
    const reader=new FileReader();
    reader.onload=x=>{
        try{
            backupSnapshot('before-excel-import');
            const wb=XLSX.read(new Uint8Array(x.target.result),{type:'array',cellDates:true});
            const sheetToJson=name=>{
                if(!wb.Sheets[name])return null;
                return XLSX.utils.sheet_to_json(wb.Sheets[name],{raw:false,defval:''});
            };
            const toISODate=v=>{
                if(v==null||v==='')return '';
                if(typeof v==='number'&&Number.isFinite(v)){
                    const d=XLSX.SSF?XLSX.SSF.parse_date_code(v):null;
                    if(d)return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
                    const epoch=new Date(Date.UTC(1899,11,30)+v*86400000);
                    return epoch.toISOString().split('T')[0];
                }
                const s=String(v).trim();
                if(/^\d{4}-\d{2}-\d{2}/.test(s))return s.slice(0,10);
                const p=new Date(s);if(!isNaN(p.getTime()))return p.toISOString().split('T')[0];
                return s;
            };
            const mh=sheetToJson('MenuHarga');if(mh)menuHarga=mh.map(r=>({name:String(r.name||r.Name||'').trim(),price:num(r.price||r.Price),point:num(r.point||r.Point)}));
            const db=sheetToJson('DaftarBahan');if(db)bahanList=db.map(x=>x.NamaBahan||x.name||Object.values(x)[0]).filter(Boolean).map(String);
            const rs=sheetToJson('Resep');if(rs)resepData=rs;
            const bj=sheetToJson('Belanja');if(bj)belanjaData=bj.map(r=>({...r,date:toISODate(r.date||r.Date),jumlah:num(r.jumlah||r.Jumlah),total:num(r.total||r.Total),barang:String(r.barang||r.Barang||''),asal:String(r.asal||r.Asal||'Pusat')}));
            const tr=sheetToJson('Transaksi');if(tr)transaksiData=tr.map(r=>({...r,date:toISODate(r.date||r.Date),name:String(r.name||r.Name||''),qty:num(r.qty||r.Qty),total:num(r.total||r.Total)}));
            const op=sheetToJson('Opname');if(op)opnameData=op.map(r=>({...r,date:toISODate(r.date||r.Date),barang:String(r.barang||r.Barang||''),apps:num(r.apps),real:num(r.real),selisih:num(r.selisih)}));
            const st=sheetToJson('Setoran');if(st)setoranData=st.map(r=>({...r,date:toISODate(r.date||r.Date),nominal:num(r.nominal||r.Nominal)}));
            normalizeData();renderAll();showToast('Import berhasil! Data sebelumnya sudah dibackup.');
        }catch(err){console.error(err);showToast('Format Excel tidak valid!')}
        finally{e.target.value=''}
    };
    reader.readAsArrayBuffer(file);
}

function openBahanModal(){document.getElementById('bahan-modal').classList.remove('hidden');document.getElementById('bahan-modal').classList.add('flex')}
function closeBahanModal(){document.getElementById('bahan-modal').classList.add('hidden');document.getElementById('bahan-modal').classList.remove('flex')}
function saveNewBahan(){const name=document.getElementById('modal-bahan-name').value.trim();if(!name)return showToast('Nama barang kosong!');if(bahanList.some(b=>b.toLowerCase()===name.toLowerCase()))return showToast('Barang sudah ada!');bahanList.push(name);resepData.forEach(r=>{if(r[name]===undefined)r[name]=0});closeBahanModal();document.getElementById('modal-bahan-name').value='';renderAll();showToast('Barang ditambahkan!')}

function installPWA(){if(deferredPrompt){deferredPrompt.prompt();deferredPrompt.userChoice.then(r=>{if(r.outcome==='accepted')showToast('Aplikasi berhasil diinstall!');deferredPrompt=null})}else showToast('Aplikasi sudah terinstall atau browser belum mendukung.')}
function dismissPwaBanner(){document.getElementById('pwa-install-banner').classList.add('hidden')}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;document.getElementById('install-btn').classList.remove('hidden');document.getElementById('pwa-install-banner').classList.remove('hidden')});

window.onload=()=>{loadFromLocalStorage();const d=today();['trx-date','belanja-date','opname-date','setoran-date'].forEach(id=>document.getElementById(id).value=d);document.getElementById('current-date').innerText=new Date().toLocaleDateString('id-ID',{weekday:'short',day:'numeric',month:'short'});renderAll();initCharts()};
