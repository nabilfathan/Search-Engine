// Menunggu DOM (HTML) selesai dimuat
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. DEKLARASI VARIABEL ---
    console.log("DOM Loaded. Menghubungkan variabel...");
    const searchInput = document.getElementById('search-input');
    const suggestionsList = document.getElementById('suggestions-list');
    const resultsList = document.getElementById('results-list');
    const detailPane = document.getElementById('detail-pane');
    const detailPlaceholder = document.getElementById('detail-placeholder');

    let database = {}; // Menyimpan data mentah dari JSON
    let searchIndex = []; // Menyimpan data "datar" yang sudah dioptimalkan untuk pencarian
    let currentResults = []; // Menyimpan hasil pencarian saat ini

    if (!searchInput) {
        console.error("GAGAL: Tidak bisa menemukan elemen #search-input.");
        return;
    }

    searchInput.addEventListener('input', handleSearch);
    loadDatabase();

    // --- 2. MEMUAT DATABASE ---
    async function loadDatabase() {
        try {
            // ===================================================
            //  ⬇️ PERUBAHAN ADA DI BARIS INI ⬇️
            const response = await fetch('Database/dataset.json');
            // ===================================================

            if (!response.ok) {
                // ===================================================
                //  ⬇️ SAYA JUGA MEMPERBARUI PESAN ERROR DI SINI ⬇️
                throw new Error('Gagal memuat Database/dataset.json. Pastikan file ada.');
                // ===================================================
            }
            database = await response.json();
            console.log("Database JSON berhasil di-load.");
            buildSearchIndex();
            suggestionsList.innerHTML = `<li class="text-gray-400 text-sm">Database A-Z siap. Silakan cari...</li>`;
        } catch (error) {
            console.error(error);
            resultsList.innerHTML = `<p class="text-red-400">${error.message}</p>`;
        }
    }

    // --- 3. MEMBANGUN INDEKS PENCARIAN ---
    function buildSearchIndex() {
        searchIndex = [];
        for (const abjadKey in database) {
            const kataObj = database[abjadKey];
            for (const kataKey in kataObj) {
                const kueriObj = kataObj[kataKey];
                for (const kueriKey in kueriObj) {
                    const detailData = kueriObj[kueriKey];
                   const searchableText = `${kataKey} ${kueriKey}`.toLowerCase();
                    
                    searchIndex.push({
                        kueri: kueriKey,
                        kata: kataKey,
                        abjad: abjadKey,
                        searchableText: searchableText,
                        detail: detailData 
                    });
                }
            }
        }
        console.log(`Indeks pencarian dibuat. Total ${searchIndex.length} item.`);
    }

    // --- 4. FUNGSI PENCARIAN (HANDLE SEARCH) ---
function handleSearch(event) {
    console.log("Mengetik terdeteksi:", event.target.value);
    const searchTerm = event.target.value.toLowerCase();

    if (searchTerm.length === 0) {
        clearAllPanes();
        return;
    }

    // --- ⬇️ LOGIKA BARU UNTUK BUG FIX ⬇️ ---

    // --- (Di dalam fungsi handleSearch) ---

    // 1. Ambil SEMUA kata kunci unik (cth: "gajah", "gunung")
    const uniqueKata = [...new Set(searchIndex.map(item => item.kata))];
    
    // 2. Filter kata kunci (DENGAN LOGIKA BARU YANG DIPISAH)
    
    // Daftar 1: Yang AWALNYA cocok (Prioritas)
    const startsWithMatches = uniqueKata.filter(kata => 
        kata.toLowerCase().startsWith(searchTerm)
    );

    // Daftar 2: Yang MENGANDUNG, tapi BUKAN awalan (Sisanya)
    const includesMatches = uniqueKata.filter(kata => 
        !kata.toLowerCase().startsWith(searchTerm) && // Pastikan tidak ada di daftar 1
         kata.toLowerCase().includes(searchTerm)
    );

    // Gabungkan: Prioritas di atas, sisanya di bawah
    const matchingKata = [...startsWithMatches, ...includesMatches];
    
    console.log("Kategori yang cocok (terurut):", matchingKata);

    // 3. Simpan SEMUA item yang kategorinya cocok di 'currentResults'
    // Ini kita simpan untuk nanti, saat pengguna mengklik sugesti
    currentResults = searchIndex.filter(item => 
        matchingKata.includes(item.kata)
    );

    // 4. Render 'Indeks Kata' HANYA dengan kategori yang cocok
    renderSuggestions(matchingKata);

    // 5. (FIX BUG 2) Beri placeholder di 'Hasil Pencarian', JANGAN tampilkan hasilnya
    resultsList.innerHTML = '<p class="text-gray-500">Pilih kategori dari "Indeks Kata" di sebelah kiri.</p>';
    
    // 6. Bersihkan panel detail
    clearDetailPane();

    // --- ⬆️ AKHIR DARI LOGIKA BARU ⬆️ ---
}


    // --- 5. RENDER (MENAMPILKAN) HASIL ---

function renderSuggestions(matchingKata) {
    suggestionsList.innerHTML = '';
    
    if (matchingKata.length === 0) {
        suggestionsList.innerHTML = `<li class="text-gray-500 text-sm">Kategori tidak ditemukan...</li>`;
        return;
    }

    // 'matchingKata' sekarang adalah array string, cth: ["gajah", "gunung"]
    matchingKata.forEach(kata => {
        const li = document.createElement('li');
        li.className = "text-gray-200 p-2 rounded-md hover:bg-gray-700 cursor-pointer transition-colors capitalize";
        li.textContent = kata;
        
        // --- ⬇️ INI ADALAH KUNCI FIX BUG 2 ⬇️ ---
        li.onclick = () => {
            console.log(`Kategori '${kata}' diklik.`);
            // Ambil 'currentResults' yang sudah kita simpan
            // Filter HANYA untuk kata yang diklik ini
            const filteredResults = currentResults.filter(item => item.kata === kata);
            
            // SEKARANG baru kita render 'Hasil Pencarian'
            renderResults(filteredResults);
        };
        // --- ⬆️ AKHIR DARI ONCLICK BARU ⬆️ ---

        suggestionsList.appendChild(li);
    });
}

// (Fungsi renderResults Anda tidak perlu diubah, biarkan saja)

    function renderResults(results) {
        resultsList.innerHTML = '';
        if (results.length === 0) {
            resultsList.innerHTML = `<p class="text-gray-500">Tidak ada hasil untuk kueri ini.</p>`;
            return;
        }
        results.forEach(item => {
            const div = document.createElement('div');
            div.className = "p-4 bg-gray-800 rounded-lg shadow-md hover:bg-gray-700 cursor-pointer transition-all border border-gray-700 hover:border-blue-500";
            const kataTampil = item.kata.charAt(0).toUpperCase() + item.kata.slice(1);
            div.innerHTML = `
                <h3 class="font-bold text-lg text-blue-300">${item.kueri}</h3>
                <p class="text-sm text-gray-400 mt-1">Kategori: ${kataTampil}</p>
            `;
            div.onclick = () => {
                renderDetail(item);
            };
            resultsList.appendChild(div);
        });
    }
    // ⬇️ ⬇️ ⬇️ PASTE KODE INI DI SCRIPT.JS ANDA ⬇️ ⬇️ ⬇️

    // --- 6. FUNGSI RENDER DETAIL (YANG HILANG) ---
    function renderDetail(item) {
        // Sembunyikan placeholder
        if(detailPlaceholder) detailPlaceholder.style.display = 'none';

        // Bersihkan panel detail
        detailPane.innerHTML = ''; 
        
        // Ubah 'kata' menjadi huruf kapital di awal
        const kataTampil = item.kata.charAt(0).toUpperCase() + item.kata.slice(1);

        // Buat HTML untuk detail
        detailPane.innerHTML = `
            <h3 class="font-bold text-xl text-blue-300 mb-2">${item.kueri}</h3>
            <p class="text-sm text-gray-400 mb-4">
                Kategori: <span class="capitalize">${kataTampil}</span> 
                (Abjad: ${item.abjad.toUpperCase()})
            </p>
            
            <h4 class="font-semibold text-gray-200 mt-5 mb-2">Teks Detail:</h4>
            <div class="bg-gray-900 p-4 rounded-md text-gray-300 whitespace-pre-wrap">
                ${item.detail.teks}
            </div>
            
            ${item.detail.foto ? `
                <h4 class="font-semibold text-gray-200 mt-5 mb-2">Foto Referensi:</h4>
                <p class="text-gray-400 text-sm">${item.detail.foto}</p>
                ` : ''}
            
            ${item.detail.video ? `
                <h4 class="font-semibold text-gray-200 mt-5 mb-2">Video Referensi:</h4>
                <p class="text-gray-400 text-sm">${item.detail.video}</p>
            ` : ''}
        `;
    }

    // --- 7. FUNGSI CLEAR (YANG HILANG) ---
    function clearDetailPane() {
        detailPane.innerHTML = ''; // Hapus konten lama
        if (detailPlaceholder) {
            detailPane.appendChild(detailPlaceholder); // Pasang lagi placeholder
            detailPlaceholder.style.display = 'flex'; // Tampilkan placeholder
        }
    }

    function clearAllPanes() {
        suggestionsList.innerHTML = '<li class="text-gray-500 text-sm">Ketik untuk mencari...</li>';
        resultsList.innerHTML = '<p class="text-gray-500">Hasil akan muncul di sini.</p>';
        clearDetailPane();
    }

// ⬆️ ⬆️ ⬆️ LETAKKAN SEBELUM BARIS ); YANG PALING BAWAH ⬆️ ⬆️ ⬆️
}   );