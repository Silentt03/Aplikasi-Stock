// 1. Data Bawaan Aplikasi (Default)
const defaultBarang = [
    { kode: "BRG-001", nama: "BP REGULER", stok: 0, kategori: "skincare" },
    { kode: "BRG-002", nama: "BP GREEN", stok: 0, kategori: "skincare" },
    { kode: "BRG-003", nama: "BP BLUE", stok: 0, kategori: "skincare" },
    { kode: "BRG-004", nama: "NORWAY", stok: 0, kategori: "suplemen" },
    { kode: "BRG-005", nama: "BRASSIC PRO", stok: 0, kategori: "skincare" },
    { kode: "BRG-006", nama: "BRASSIC EYE", stok: 0, kategori: "skincare" },
    { kode: "BRG-007", nama: "NIGHT CREAM", stok: 0, kategori: "skincare" },
    { kode: "BRG-008", nama: "DAY CREAM", stok: 0, kategori: "skincare" },
    { kode: "BRG-009", nama: "FACIAL WASH", stok: 0, kategori: "skincare" },
    { kode: "BRG-010", nama: "SERUM", stok: 0, kategori: "skincare" },
    { kode: "BRG-011", nama: "HAIR TONIC", stok: 0, kategori: "skincare" },
    { kode: "BRG-012", nama: "STEFFI", stok: 0, kategori: "suplemen" }
];

// 2. Fungsi Utility untuk LocalStorage dengan Error Handling
function loadFromStorage(key, defaultValue) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error(`Error loading ${key} from localStorage:`, error);
        return defaultValue;
    }
}

function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error(`Error saving ${key} to localStorage:`, error);
        alert(`⚠️ Gagal menyimpan data: ${error.message}. Pastikan storage browser tidak penuh.`);
        return false;
    }
}

// 2. State & Inisialisasi Database LocalStorage
let dataBarang = loadFromStorage('stok_barang', []);
let dataRiwayat = loadFromStorage('stok_riwayat', []);
let monthlyChartInstance = null;

// Migrasi dari versi lama jika diperlukan
if (dataBarang.length === 0 && localStorage.getItem('saas_stok_barang')) {
    dataBarang = loadFromStorage('saas_stok_barang', []);
}
if (dataRiwayat.length === 0 && localStorage.getItem('saas_stok_riwayat')) {
    dataRiwayat = loadFromStorage('saas_stok_riwayat', []);
}

if (dataBarang.length === 0) {
    dataBarang = [...defaultBarang];
}

// Migrasi: tambahkan kategori jika belum ada
dataBarang = dataBarang.map(barang => {
    if (!barang.kategori) {
        const namaProduk = barang.nama.toUpperCase();
        if (namaProduk === 'NORWAY' || namaProduk === 'STEFFI') {
            barang.kategori = 'suplemen';
        } else {
            barang.kategori = 'skincare';
        }
    }
    return barang;
});

// Validasi data integritas
if (dataRiwayat.length === 0) {
    dataBarang.forEach(barang => barang.stok = 0);
}

// Simpan data awal ke localStorage
saveToStorage('stok_barang', dataBarang);
saveToStorage('stok_riwayat', dataRiwayat);

// 3. Sistem Navigasi SPA (Single Page Application)
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.content-section');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        
        sections.forEach(sec => sec.classList.remove('active'));
        navLinks.forEach(lnk => lnk.classList.remove('active'));
        
        document.getElementById(targetId).classList.add('active');
        link.classList.add('active');
        
        // Close mobile navigation after link click
        closeMobileNav();
    });
});

// 4. Fungsi Render & Update UI Utama
function renderApp() {
    const keyword = document.getElementById('search-barang').value.toLowerCase();
    
    // Render Tabel Master Barang + Fitur Cari
    const listBarangHtml = document.getElementById('list-barang');
    listBarangHtml.innerHTML = '';

    let totalStokKeseluruhan = 0;

    dataBarang.forEach((barang, index) => {
        totalStokKeseluruhan += Number(barang.stok);
        if (barang.nama.toLowerCase().includes(keyword)) {
            listBarangHtml.innerHTML += `
                <tr>
                    <td>${barang.nama}</td>
                    <td>${barang.stok}</td>
                </tr>
            `;
        }
    });

    // Update Dashboard Metrics
    document.getElementById('stat-total-jenis').innerText = dataBarang.length;
    document.getElementById('stat-total-stok').innerText = totalStokKeseluruhan;

    // Render Dropdown untuk Form Transaksi
    const txBarangSelect = document.getElementById('tx-barang');
    txBarangSelect.innerHTML = dataBarang.map((b, i) => `<option value="${i}">${b.nama}</option>`).join('');

    // Render Riwayat Transaksi
    const listRiwayatHtml = document.getElementById('list-riwayat');
    listRiwayatHtml.innerHTML = dataRiwayat.map((r, index) => `
        <tr>
            <td><small>${r.waktu}</small></td>
            <td>${r.nama}</td>
            <td><span style="color: ${r.jenis === 'masuk' ? 'var(--success)' : 'var(--danger)'}; font-weight: bold;">${r.jenis.toUpperCase()}</span></td>
            <td>${r.jumlah}</td>
            <td>
                <button class="btn btn-primary" style="padding: 4px 8px;" onclick="editRiwayat(${index})"><i data-lucide="edit-3" style="width:14px;"></i></button>
                <button class="btn btn-danger" style="padding: 4px 8px;" onclick="hapusRiwayatItem(${index})"><i data-lucide="trash-2" style="width:14px;"></i></button>
            </td>
        </tr>
    `).join('');

    // Reload Lucide Icons agar ikon baru ke-render
    lucide.createIcons();
    updateMonthlyChart();
    renderMonthlySummary();
}

function normalizeRiwayatEntries() {
    let changed = false;
    dataRiwayat = dataRiwayat.map(entry => {
        const waktuISO = entry.waktuISO || parseRiwayatISO(entry.waktu);
        const waktu = new Date(waktuISO);
        if (isNaN(waktu)) return entry;

        const periode = entry.periode || getMonthPeriod(waktu);
        const bulan = entry.bulan || getMonthLabel(waktu);

        if (!entry.waktuISO || !entry.periode || !entry.bulan) {
            changed = true;
            return { ...entry, waktuISO, periode, bulan };
        }
        return entry;
    });
    if (changed) {
        localStorage.setItem('stok_riwayat', JSON.stringify(dataRiwayat));
    }
}

function getMonthLabel(date) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

function getMonthPeriod(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function parseRiwayatISO(waktu) {
    const parsed = new Date(waktu);
    if (!isNaN(parsed)) return parsed.toISOString();

    const normalized = waktu
        .replace(/\.(?=\d{2}(?:\D|$))/g, ':')
        .replace(/\s+/, ' ')
        .replace(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/, '$3-$2-$1');
    const fallback = new Date(normalized);
    return isNaN(fallback) ? new Date().toISOString() : fallback.toISOString();
}

function getMonthlySummary() {
    normalizeRiwayatEntries();

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const summary = {};
    dataRiwayat.forEach(entry => {
        const waktu = entry.waktuISO ? new Date(entry.waktuISO) : new Date(parseRiwayatISO(entry.waktu));
        if (isNaN(waktu)) return;

        const year = waktu.getFullYear();
        const month = waktu.getMonth() + 1;
        const key = `${year}-${String(month).padStart(2, '0')}`;
        if (!summary[key]) {
            summary[key] = { masuk: 0, keluar: 0 };
        }
        const jumlah = parseIntegerValue(entry.jumlah);
        if (entry.jenis === 'masuk') {
            summary[key].masuk += jumlah;
        } else {
            summary[key].keluar += jumlah;
        }
    });

    return Object.keys(summary)
        .sort()
        .map(key => {
            const [year, month] = key.split('-').map(Number);
            const label = `${monthNames[month - 1]} ${year}`;
            return { bulan: label, masuk: summary[key].masuk, keluar: summary[key].keluar, periode: key };
        });
}

function getMonthlySummaryByCategory() {
    normalizeRiwayatEntries();

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const summary = {};
    
    dataRiwayat.forEach(entry => {
        const waktu = entry.waktuISO ? new Date(entry.waktuISO) : new Date(parseRiwayatISO(entry.waktu));
        if (isNaN(waktu)) return;

        const year = waktu.getFullYear();
        const month = waktu.getMonth() + 1;
        const key = `${year}-${String(month).padStart(2, '0')}`;
        
        // Cari kategori barang
        const barang = dataBarang.find(b => b.nama === entry.nama);
        const kategori = barang ? (barang.kategori || 'skincare') : 'skincare';
        
        if (!summary[key]) {
            summary[key] = { 
                skincare: { masuk: 0, keluar: 0 }, 
                suplemen: { masuk: 0, keluar: 0 } 
            };
        }
        
        const jumlah = parseIntegerValue(entry.jumlah);
        if (entry.jenis === 'masuk') {
            summary[key][kategori].masuk += jumlah;
        } else {
            summary[key][kategori].keluar += jumlah;
        }
    });

    return Object.keys(summary)
        .sort()
        .map(key => {
            const [year, month] = key.split('-').map(Number);
            const label = `${monthNames[month - 1]} ${year}`;
            return { 
                bulan: label, 
                periode: key,
                skincare: summary[key].skincare,
                suplemen: summary[key].suplemen,
                totalMasuk: summary[key].skincare.masuk + summary[key].suplemen.masuk,
                totalKeluar: summary[key].skincare.keluar + summary[key].suplemen.keluar
            };
        });
}

function updateMonthlyChart() {
    if (typeof Chart === 'undefined') return;
    const summary = getMonthlySummary();
    const labels = summary.map(item => item.bulan);
    const masukData = summary.map(item => item.masuk);
    const keluarData = summary.map(item => item.keluar);

    const ctx = document.getElementById('chartMonthlyTransaksi');
    if (!ctx) return;

    if (monthlyChartInstance) {
        monthlyChartInstance.destroy();
    }

    // Determine colors based on dark mode
    const isDarkMode = document.documentElement.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#f8fafc' : '#1e293b';
    const gridColor = isDarkMode ? 'rgba(52, 65, 84, 0.5)' : 'rgba(148, 163, 184, 0.3)';
    const bgColor = isDarkMode ? '#1e293b' : '#ffffff';

    // Create gradients for modern look
    const ctx2d = ctx.getContext('2d');
    const greenGradient = ctx2d.createLinearGradient(0, 0, 0, 200);
    greenGradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
    greenGradient.addColorStop(1, 'rgba(16, 185, 129, 0.02)');

    const redGradient = ctx2d.createLinearGradient(0, 0, 0, 200);
    redGradient.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
    redGradient.addColorStop(1, 'rgba(239, 68, 68, 0.02)');

    monthlyChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Barang Masuk',
                    data: masukData,
                    borderColor: '#10b981',
                    backgroundColor: greenGradient,
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 6,
                    pointBackgroundColor: '#10b981',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2.5,
                    pointHoverRadius: 8,
                    pointHoverBackgroundColor: '#059669',
                    pointHoverBorderWidth: 3,
                    segment: {
                        borderDash: [0]
                    }
                },
                {
                    label: 'Barang Keluar',
                    data: keluarData,
                    borderColor: '#ef4444',
                    backgroundColor: redGradient,
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 6,
                    pointBackgroundColor: '#ef4444',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2.5,
                    pointHoverRadius: 8,
                    pointHoverBackgroundColor: '#dc2626',
                    pointHoverBorderWidth: 3,
                    segment: {
                        borderDash: [0]
                    }
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            animation: {
                duration: 750,
                easing: 'easeInOutQuart'
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Bulan',
                        color: textColor,
                        font: {
                            size: 14,
                            weight: '600'
                        },
                        padding: 12
                    },
                    ticks: { 
                        color: textColor,
                        font: {
                            size: 12,
                            weight: '500'
                        }
                    },
                    grid: { 
                        color: gridColor,
                        drawBorder: true,
                        lineWidth: 1,
                        borderColor: isDarkMode ? 'rgba(52, 65, 84, 0.8)' : 'rgba(226, 232, 240, 1)'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Jumlah Stok',
                        color: textColor,
                        font: {
                            size: 14,
                            weight: '600'
                        },
                        padding: 12
                    },
                    ticks: { 
                        precision: 0, 
                        color: textColor,
                        font: {
                            size: 12,
                            weight: '500'
                        },
                        stepSize: 'auto',
                        callback: function(value) {
                            return value > 1000 ? (value / 1000).toFixed(1) + 'k' : value;
                        }
                    },
                    grid: { 
                        color: gridColor,
                        drawBorder: true,
                        lineWidth: 1,
                        borderColor: isDarkMode ? 'rgba(52, 65, 84, 0.8)' : 'rgba(226, 232, 240, 1)'
                    }
                }
            },
            plugins: {
                legend: { 
                    position: 'top',
                    labels: { 
                        color: textColor,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 20,
                        font: {
                            size: 13,
                            weight: '600'
                        },
                        boxWidth: 10,
                        boxHeight: 10
                    },
                    align: 'center'
                },
                tooltip: { 
                    mode: 'index', 
                    intersect: false,
                    backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(30, 41, 59, 0.95)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#4f46e5',
                    borderWidth: 2,
                    padding: 14,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y.toLocaleString('id-ID');
                        },
                        title: function(context) {
                            return '📅 ' + context[0].label;
                        }
                    },
                    font: {
                        size: 13,
                        weight: '600'
                    },
                    boxPadding: 8,
                    usePointStyle: true
                },
                title: {
                    display: false
                },
                filler: {
                    propagate: true
                }
            }
        }
    });
}

function exportMonthlySummaryCSV() {
    const summary = getMonthlySummary();
    let csv = 'Periode,Bulan,Masuk,Keluar\n';
    summary.forEach(item => {
        csv += `${item.periode},${item.bulan},${item.masuk},${item.keluar}\n`;
    });
    downloadBlob(csv, 'BPStock_Grafik_Bulanan.csv', 'text/csv');
}

function exportProdukToExcel() {
    let csv = 'No,Kode Barang,Nama Barang,Kategori,Stok\n';
    
    dataBarang.forEach((barang, index) => {
        const kategori = barang.kategori ? (barang.kategori.charAt(0).toUpperCase() + barang.kategori.slice(1)) : 'Skincare';
        csv += `${index + 1},"${barang.kode}","${barang.nama}","${kategori}",${barang.stok}\n`;
    });
    
    const timestamp = new Date().toLocaleDateString('id-ID').replace(/\//g, '-');
    downloadBlob(csv, `BPStock_Produk_${timestamp}.csv`, 'text/csv');
}

function renderMonthlySummary() {
    const summary = getMonthlySummaryByCategory();
    const tbody = document.getElementById('list-monthly-summary');
    
    if (!tbody) return;
    
    tbody.innerHTML = summary.map(item => {
        const skincareSaldo = item.skincare.masuk - item.skincare.keluar;
        const supumenSaldo = item.suplemen.masuk - item.suplemen.keluar;
        const totalSaldo = item.totalMasuk - item.totalKeluar;
        
        const skincareSaldoClass = skincareSaldo >= 0 ? 'text-success' : 'text-danger';
        const supumenSaldoClass = supumenSaldo >= 0 ? 'text-success' : 'text-danger';
        const totalSaldoClass = totalSaldo >= 0 ? 'text-success' : 'text-danger';
        
        return `
            <tr>
                <td rowspan="3"><strong>${item.bulan}</strong></td>
                <td style="background-color: rgba(79, 70, 229, 0.05); font-weight: 600; color: var(--primary);">SKINCARE</td>
                <td class="text-right text-success"><strong>+${item.skincare.masuk.toLocaleString()}</strong></td>
                <td class="text-right text-danger"><strong>-${item.skincare.keluar.toLocaleString()}</strong></td>
                <td class="text-right ${skincareSaldoClass}"><strong>${skincareSaldo >= 0 ? '+' : ''}${skincareSaldo.toLocaleString()}</strong></td>
            </tr>
            <tr>
                <td style="background-color: rgba(34, 197, 94, 0.05); font-weight: 600; color: var(--success);">SUPLEMEN</td>
                <td class="text-right text-success"><strong>+${item.suplemen.masuk.toLocaleString()}</strong></td>
                <td class="text-right text-danger"><strong>-${item.suplemen.keluar.toLocaleString()}</strong></td>
                <td class="text-right ${supumenSaldoClass}"><strong>${supumenSaldo >= 0 ? '+' : ''}${supumenSaldo.toLocaleString()}</strong></td>
            </tr>
            <tr>
                <td style="background-color: rgba(241, 65, 108, 0.05); font-weight: 600; color: var(--danger);">TOTAL</td>
                <td class="text-right text-success"><strong>+${item.totalMasuk.toLocaleString()}</strong></td>
                <td class="text-right text-danger"><strong>-${item.totalKeluar.toLocaleString()}</strong></td>
                <td class="text-right ${totalSaldoClass}"><strong>${totalSaldo >= 0 ? '+' : ''}${totalSaldo.toLocaleString()}</strong></td>
            </tr>
        `;
    }).join('');
}

// 5. Tambah / Edit Data Master Barang
function parseIntegerValue(value) {
    if (typeof value !== 'string') return Number(value);
    const sanitized = value.replace(/[.,]/g, '');
    return parseInt(sanitized, 10) || 0;
}

function generateKodeBarang() {
    const existingNumbers = dataBarang
        .map(b => {
            const match = b.kode.match(/(\d+)$/);
            return match ? parseInt(match[1], 10) : 0;
        })
        .filter(n => !isNaN(n));
    const nextNumber = existingNumbers.length ? Math.max(...existingNumbers) + 1 : 1;
    return `BRG-${String(nextNumber).padStart(3, '0')}`;
}

function simpanBarangBaru(e) {
    e.preventDefault();
    const index = document.getElementById('edit-index').value;
    const nama = document.getElementById('brg-nama').value.trim();
    const stok = parseIntegerValue(document.getElementById('brg-stok').value);

    // Validasi nama barang
    if (!nama || nama.length < 3) {
        alert('❌ Nama barang minimal 3 karakter.');
        return;
    }

    // Validasi stok
    if (isNaN(stok) || stok < 0) {
        alert('❌ Stok harus berupa angka positif.');
        return;
    }

    // Cek duplikasi nama barang (kecuali untuk produk yang sedang diedit)
    const isDuplicate = dataBarang.some((barang, idx) => 
        barang.nama.toLowerCase() === nama.toLowerCase() && idx !== parseInt(index)
    );

    if (isDuplicate) {
        alert('❌ Nama barang sudah ada. Silakan gunakan nama lain.');
        return;
    }

    try {
        if (index === "") {
            const kode = generateKodeBarang();
            dataBarang.push({ kode, nama, stok, kategori: 'skincare' });
        } else {
            dataBarang[index].nama = nama;
            dataBarang[index].stok = stok;
        }

        simpanDanRefresh();
        toggleModal('modal-barang');
        document.getElementById('form-barang').reset();
        alert('✅ Data barang berhasil disimpan!');
    } catch (error) {
        console.error('Error saving barang:', error);
        alert('❌ Gagal menyimpan data barang.');
    }
}

function editRiwayat(index) {
    const item = dataRiwayat[index];
    const barangIndex = dataBarang.findIndex(b => b.kode === item.kode);
    if (barangIndex === -1) {
        alert('❌ Data barang tidak ditemukan.');
        return;
    }

    document.getElementById('modal-title').innerText = "Edit Data Barang";
    document.getElementById('edit-index').value = barangIndex;
    document.getElementById('brg-kode').value = dataBarang[barangIndex].kode;
    document.getElementById('brg-nama').value = dataBarang[barangIndex].nama;
    document.getElementById('stok-awal-container').style.display = 'none';
    toggleModal('modal-barang');
}

function revertRiwayatItem(index) {
    const item = dataRiwayat[index];
    const barang = dataBarang.find(b => b.kode === item.kode);
    if (!barang) return;

    if (item.jenis === 'masuk') {
        barang.stok -= item.jumlah;
    } else {
        barang.stok += item.jumlah;
    }

    if (barang.stok < 0) barang.stok = 0;
}

function hapusRiwayatItem(index) {
    const item = dataRiwayat[index];
    if (!item) {
        alert('❌ Data riwayat tidak ditemukan.');
        return;
    }

    if (confirm(`Hapus transaksi ${item.nama} (${item.jenis.toUpperCase()}: ${item.jumlah})?`)) {
        try {
            revertRiwayatItem(index);
            dataRiwayat.splice(index, 1);
            simpanDanRefresh();
            alert('✅ Riwayat transaksi berhasil dihapus!');
        } catch (error) {
            console.error('Error deleting riwayat:', error);
            alert('❌ Gagal menghapus riwayat transaksi.');
        }
    }
}

// 6. Logika Mutasi Stok Otomatis (Masuk / Keluar)
function simpanTransaksi(e) {
    e.preventDefault();
    const indexBarang = document.getElementById('tx-barang').value;
    const jenis = document.getElementById('tx-jenis').value;
    const jumlah = parseIntegerValue(document.getElementById('tx-jumlah').value);
    
    if (!dataBarang[indexBarang]) {
        alert('❌ Barang tidak ditemukan.');
        return;
    }

    const barang = dataBarang[indexBarang];
    const waktu = new Date().toLocaleString('id-ID');

    // Validasi jumlah
    if (isNaN(jumlah) || jumlah <= 0) {
        alert('❌ Jumlah harus berupa angka bulat lebih dari 0.');
        return;
    }

    // Validasi stok untuk barang keluar
    if (jenis === 'keluar' && barang.stok < jumlah) {
        alert(`❌ Stok tidak mencukupi! Stok saat ini: ${barang.stok}`);
        return;
    }

    try {
        // Hitung Otomatis Stok
        if (jenis === 'masuk') {
            barang.stok += jumlah;
        } else {
            barang.stok -= jumlah;
        }

        // Validasi stok tidak negatif
        if (barang.stok < 0) {
            barang.stok = 0;
        }

        // Catat ke Riwayat
        const waktuISO = new Date().toISOString();
        const waktuDate = new Date(waktuISO);
        dataRiwayat.unshift({
            waktu,
            waktuISO,
            periode: getMonthPeriod(waktuDate),
            bulan: getMonthLabel(waktuDate),
            kode: barang.kode,
            nama: barang.nama,
            jenis,
            jumlah
        });

        simpanDanRefresh();
        renderApp();
        document.getElementById('form-transaksi').reset();
        alert(`✅ Transaksi sukses! ${barang.nama} (${jenis.toUpperCase()}: ${jumlah})`);
    } catch (error) {
        console.error('Error saving transaksi:', error);
        alert('❌ Gagal menyimpan transaksi.');
    }
}

// 7. Fungsi Pembantu / Utilities
function simpanDanRefresh() {
    const barangSaved = saveToStorage('stok_barang', dataBarang);
    const riwayatSaved = saveToStorage('stok_riwayat', dataRiwayat);
    
    if (!barangSaved || !riwayatSaved) {
        console.warn('⚠️ Beberapa data mungkin tidak tersimpan dengan sempurna.');
    }
    
    renderApp();
}

function toggleDarkMode() {
    const html = document.documentElement;
    const isDarkMode = html.classList.contains('dark-mode');
    
    if (isDarkMode) {
        html.classList.remove('dark-mode');
        localStorage.setItem('theme-mode', 'light');
    } else {
        html.classList.add('dark-mode');
        localStorage.setItem('theme-mode', 'dark');
    }
    
    updateThemeButton();
    
    // Update chart colors
    if (monthlyChartInstance) {
        updateMonthlyChart();
    }
}

function updateThemeButton() {
    const themeBtn = document.getElementById('theme-toggle');
    const isDarkMode = document.documentElement.classList.contains('dark-mode');
    
    if (isDarkMode) {
        themeBtn.textContent = '';
        themeBtn.innerHTML = '<i data-lucide="sun"></i> Terang';
    } else {
        themeBtn.textContent = '';
        themeBtn.innerHTML = '<i data-lucide="moon"></i> Gelap';
    }
    
    // Reinitialize lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme-mode') || 'light';
    const html = document.documentElement;
    
    if (savedTheme === 'dark') {
        html.classList.add('dark-mode');
    } else {
        html.classList.remove('dark-mode');
    }
    
    updateThemeButton();
}

function toggleModal(id) {
    const modal = document.getElementById(id);
    if(modal.style.display === 'flex') {
        modal.style.display = 'none';
    } else {
        modal.style.display = 'flex';
        if(id === 'modal-barang' && document.getElementById('edit-index').value === "") {
            document.getElementById('modal-title').innerText = "Tambah Barang Baru";
            document.getElementById('stok-awal-container').style.display = 'block';
        }
    }
}

function hapusRiwayat() {
    if(confirm("⚠️ Apakah Anda yakin ingin menghapus SELURUH riwayat transaksi? Stok barang akan kembali ke 0.")) {
        try {
            dataRiwayat.forEach((_, index) => revertRiwayatItem(index));
            dataRiwayat = [];
            simpanDanRefresh();
            alert('✅ Riwayat transaksi berhasil dihapus!');
        } catch (error) {
            console.error('Error clearing riwayat:', error);
            alert('❌ Gagal menghapus riwayat transaksi.');
        }
    }
}

function checkAuth() {
    if (localStorage.getItem('saas_is_logged_in') !== 'true') {
        window.location.href = 'login.html';
    } else {
        initTheme();
        renderApp();
    }
}

window.onload = checkAuth;

function downloadBlob(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
}document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.querySelector('.hamburger-toggle');
  const mobileMenu = document.getElementById('mobileMenu');
  
  if (toggleBtn && mobileMenu) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      mobileMenu.classList.toggle('active');
      
      // Polish: Change burger icon to close 'X' smoothly
      toggleBtn.innerHTML = mobileMenu.classList.contains('active') ? '✕' : '☰';
    });
    
    // Smooth closing mechanics when clicking outside the menu drawer
    document.addEventListener('click', (e) => {
      if (!mobileMenu.contains(e.target) && mobileMenu.classList.contains('active')) {
        mobileMenu.classList.remove('active');
        toggleBtn.innerHTML = '☰';
      }
    });
  }
});