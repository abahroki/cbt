// ============================================
// CBT LMS - Frontend Logic
// ============================================

// ============ TAB LOGIN ============
function switchTab(role) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.login-form').forEach(f => f.classList.remove('active'));
  
  event.target.closest('.tab-btn').classList.add('active');
  document.getElementById(role === 'siswa' ? 'formSiswa' : 'formAdmin').classList.add('active');
}

// ============ LOGIN HANDLERS ============
function handleLoginSiswa(e) {
  e.preventDefault();
  const nis = document.getElementById('nis').value;
  const pin = document.getElementById('pin').value;
  
  showMessage('Memverifikasi...', 'info');
  
  google.script.run
    .withSuccessHandler(res => {
      if (res.success) {
        sessionStorage.setItem('currentUser', JSON.stringify(res));
        showMessage('Login berhasil! Mengalihkan...', 'success');
        setTimeout(() => window.location.href = 'siswa.html', 1000);
      } else {
        showMessage(res.message, 'error');
      }
    })
    .loginSiswa(nis, pin);
}

function handleLoginAdmin(e) {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  showMessage('Memverifikasi...', 'info');
  
  google.script.run
    .withSuccessHandler(res => {
      if (res.success) {
        sessionStorage.setItem('currentUser', JSON.stringify(res));
        showMessage('Login berhasil! Mengalihkan...', 'success');
        setTimeout(() => window.location.href = 'admin.html', 1000);
      } else {
        showMessage(res.message, 'error');
      }
    })
    .loginAdmin(username, password);
}

function showMessage(msg, type) {
  const el = document.getElementById('loginMessage');
  if (!el) return;
  el.style.display = 'block';
  el.textContent = msg;
  el.style.background = type === 'error' ? '#fee2e2' : type === 'success' ? '#d1fae5' : '#dbeafe';
  el.style.color = type === 'error' ? '#991b1b' : type === 'success' ? '#065f46' : '#1e40af';
}

// ============ LOGOUT ============
function logout() {
  sessionStorage.clear();
  window.location.href = 'index.html';
}

// ============ SIDEBAR TOGGLE ============
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ============ NAVIGASI PAGE (Admin) ============
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  
  const target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');
  
  event.target.closest('.nav-item').classList.add('active');
  
  const titles = {
    dashboard: 'Dashboard',
    peserta: 'Data Peserta',
    materi: 'Materi & Kelas',
    banksoal: 'Bank Soal',
    jadwal: 'Jadwal Ujian',
    hasil: 'Hasil Nilai',
    monitoring: 'Monitoring'
  };
  document.getElementById('pageTitle').textContent = titles[page] || 'Dashboard';
  
  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('open');
  }
}

// ============ SISWA PAGE NAV ============
function showSiswaPage(page) {
  document.querySelectorAll('[id^="spage-"]').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-siswa .nav-item').forEach(n => n.classList.remove('active'));
  
  const target = document.getElementById('spage-' + page);
  if (target) target.classList.add('active');
  event.target.closest('.nav-item').classList.add('active');
}

// ============ DASHBOARD STATS ============
function loadDashboardStats() {
  google.script.run
    .withSuccessHandler(stats => {
      document.getElementById('statSiswa').textContent = stats.totalSiswa;
      document.getElementById('statAktif').textContent = stats.siswaAktif;
      document.getElementById('statSoal').textContent = stats.totalSoal;
      document.getElementById('statUjian').textContent = stats.totalUjian;
      
      const grid = document.getElementById('kelasGrid');
      grid.innerHTML = '';
      stats.kelasList.forEach(k => {
        grid.innerHTML += `
          <div class="kelas-card" onclick="filterByKelas('${k}')">
            <h4>${k}</h4>
            <p>Kelas</p>
          </div>`;
      });
    })
    .getDashboardStats();
}

// ============ LOAD JADWAL ============
function loadJadwal() {
  google.script.run
    .withSuccessHandler(jadwal => {
      const container = document.getElementById('jadwalContainer');
      if (!jadwal.length) {
        container.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:40px;">Belum ada jadwal ujian.</p>';
        return;
      }
      
      const grouped = jadwal.reduce((acc, j) => {
        if (!acc[j.kelas]) acc[j.kelas] = [];
        acc[j.kelas].push(j);
        return acc;
      }, {});
      
      container.innerHTML = '';
      Object.entries(grouped).forEach(([kelas, items]) => {
        let cards = items.map((j, i) => `
          <div class="jadwal-card">
            <h4>${j.mapel.substring(0, 50)}${j.mapel.length > 50 ? '...' : ''}</h4>
            <span class="mapel-badge">${j.mapel.includes('Bab 1') ? 'MATEMATIKA' : 'MATEMATIKA'}</span>
            <div class="jadwal-card-actions">
              <button class="btn-edit"><i class="fas fa-edit"></i> Edit</button>
              <button class="btn-soal"><i class="fas fa-list"></i> Soal</button>
              <button class="btn-cetak"><i class="fas fa-print"></i> Cetak</button>
              <button class="btn-hapus" onclick="hapusJadwal(${i})"><i class="fas fa-trash"></i></button>
            </div>
          </div>`).join('');
        
        container.innerHTML += `
          <div class="jadwal-kelas">
            <h3><i class="fas fa-calendar-day"></i> Jadwal Kelas: ${kelas}</h3>
            <div class="jadwal-cards">${cards}</div>
          </div>`;
      });
    })
    .getJadwal();
}

function showModalJadwal() {
  document.getElementById('modalJadwal').classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

function handleSimpanJadwal(e) {
  e.preventDefault();
  const data = {
    kelas: document.getElementById('jadwalKelas').value,
    mapel: document.getElementById('jadwalMapel').value,
    tanggal: document.getElementById('jadwalTanggal').value,
    waktu: document.getElementById('jadwalWaktu').value,
    durasi: document.getElementById('jadwalDurasi').value,
    status: 'Aktif'
  };
  
  google.script.run
    .withSuccessHandler(() => {
      closeModal('modalJadwal');
      loadJadwal();
      alert('Jadwal berhasil disimpan!');
    })
    .simpanJadwal(data.kelas, data.mapel, data.tanggal, data.waktu, data.durasi, data.status);
}

function hapusJadwal(index) {
  if (confirm('Hapus jadwal ini?')) {
    google.script.run
      .withSuccessHandler(() => loadJadwal())
      .hapusJadwal(index);
  }
}

// ============ LOAD SISWA ============
function loadSiswa() {
  google.script.run
    .withSuccessHandler(data => {
      const tbody = document.getElementById('tbodySiswa');
      tbody.innerHTML = data.map(s => `
        <tr>
          <td>${s['NIS']}</td>
          <td>${s['Nama']}</td>
          <td>${s['Kelas']}</td>
          <td>${s['PIN']}</td>
          <td><span class="status-badge status-aktif">${s['Status']}</span></td>
        </tr>`).join('');
    })
    .getDataSiswa();
}

function filterSiswa() {
  const kelas = document.getElementById('filterKelas').value;
  const search = document.getElementById('searchSiswa').value.toLowerCase();
  
  google.script.run
    .withSuccessHandler(data => {
      const filtered = data.filter(s => 
        (!kelas || s['Kelas'] === kelas) &&
        (!search || s['Nama'].toLowerCase().includes(search) || String(s['NIS']).includes(search))
      );
      const tbody = document.getElementById('tbodySiswa');
      tbody.innerHTML = filtered.map(s => `
        <tr>
          <td>${s['NIS']}</td>
          <td>${s['Nama']}</td>
          <td>${s['Kelas']}</td>
          <td>${s['PIN']}</td>
          <td><span class="status-badge status-aktif">${s['Status']}</span></td>
        </tr>`).join('');
    })
    .getDataSiswa();
}

// ============ LOAD BANK SOAL ============
function loadBankSoal() {
  google.script.run
    .withSuccessHandler(data => {
      const container = document.getElementById('soalList');
      container.innerHTML = data.map((s, i) => `
        <div class="jadwal-card" style="margin-bottom:15px;">
          <h4>Soal #${i + 1} - ${s.mapel}</h4>
          <p style="margin:10px 0;font-size:14px;">${s.soal}</p>
          <div style="font-size:13px;color:var(--text-secondary);">
            <p>A. ${s.opsiA}</p>
            <p>B. ${s.opsiB}</p>
            <p>C. ${s.opsiC}</p>
            <p>D. ${s.opsiD}</p>
            <p>E. ${s.opsiE}</p>
          </div>
          <span class="mapel-badge" style="margin-top:10px;">Kunci: ${s.kunci}</span>
        </div>`).join('');
    })
    .getBankSoal();
}

function filterSoal() {
  const mapel = document.getElementById('filterMapel').value;
  google.script.run
    .withSuccessHandler(data => {
      const filtered = mapel ? data.filter(s => s.mapel === mapel) : data;
      // Re-render (simplified)
      loadBankSoal();
    })
    .getBankSoal();
}

// ============ LOAD HASIL ============
function loadHasil() {
  google.script.run
    .withSuccessHandler(data => {
      const tbody = document.getElementById('tbodyHasil');
      if (!tbody) return;
      tbody.innerHTML = data.map(r => `
        <tr>
          <td>${new Date(r.timestamp).toLocaleString('id-ID')}</td>
          <td>${r.nis}</td>
          <td>${r.nama}</td>
          <td>${r.kelas}</td>
          <td>${r.mapel}</td>
          <td><strong>${r.skor}</strong></td>
          <td><span class="status-badge ${r.status === 'Normal' ? 'status-aktif' : 'status-tidak-lulus'}">${r.status}</span></td>
        </tr>`).join('');
    })
    .getRekapNilai();
}

// ============ SISWA DASHBOARD ============
function loadSiswaDashboard() {
  const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
  if (!user.nis) return;
  
  google.script.run
    .withSuccessHandler(rekap => {
      document.getElementById('statUjianSiswa').textContent = rekap.length;
      const lulus = rekap.filter(r => r.skor >= 75).length;
      document.getElementById('statLulus').textContent = lulus;
      const rata = rekap.length ? Math.round(rekap.reduce((a, r) => a + r.skor, 0) / rekap.length) : 0;
      document.getElementById('statRataRata').textContent = rata;
      
      // Hasil siswa
      const tbody = document.getElementById('tbodyHasilSiswa');
      if (tbody) {
        tbody.innerHTML = rekap.map(r => `
          <tr>
            <td>${new Date(r.timestamp).toLocaleDateString('id-ID')}</td>
            <td>${r.mapel}</td>
            <td><strong>${r.skor}</strong></td>
            <td>75</td>
            <td><span class="status-badge ${r.skor >= 75 ? 'status-lulus' : 'status-tidak-lulus'}">
              ${r.skor >= 75 ? 'LULUS' : 'TIDAK LULUS'}</span></td>
          </tr>`).join('');
      }
      
      // Ujian tersedia
      const ujianGrid = document.getElementById('ujianTersedia');
      if (ujianGrid) {
        ujianGrid.innerHTML = `
          <div class="ujian-card">
            <h4>Bab 1 - Bentuk Pangkat, Akar & Logaritma</h4>
            <p>30 soal | Durasi: 90 menit | KKM: 75</p>
            <button class="btn-primary" onclick="mulaiUjian('Bab 1 -Bentuk Pangkat Akar dan logaritma')">
              <i class="fas fa-play"></i> Mulai Ujian
            </button>
          </div>
          <div class="ujian-card">
            <h4>Bab 2 - Persamaan Fungsi Eksponen & Logaritma</h4>
            <p>30 soal | Durasi: 90 menit | KKM: 75</p>
            <button class="btn-primary" onclick="mulaiUjian('Bab 2-Persamaan Fungsi Ekspionen dan Logaritma')">
              <i class="fas fa-play"></i> Mulai Ujian
            </button>
          </div>`;
      }
    })
    .getRekapBySiswa(user.nis);
}

function mulaiUjian(mapel) {
  sessionStorage.setItem('config', JSON.stringify({ durasi: 90 }));
  window.location.href = `ujian.html?mapel=${encodeURIComponent(mapel)}`;
}

// ============ UTILITIES ============
function updateDateTime() {
  const el = document.getElementById('datetime');
  if (el) {
    const now = new Date();
    el.textContent = now.toLocaleString('id-ID', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

function handleResetCache() {
  if (confirm('Reset semua cache sistem?')) {
    google.script.run
      .withSuccessHandler(res => alert(res.message))
      .resetCache();
  }
}

function filterByKelas(kelas) {
  showPage('peserta');
  document.getElementById('filterKelas').value = kelas;
  filterSiswa();
}