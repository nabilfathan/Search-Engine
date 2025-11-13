import json
from flask import Flask, request, jsonify
from flask_cors import CORS

# --- 1. Setup Server ---
app = Flask(__name__)
# CORS mengizinkan file HTML Anda "berbicara" dengan server Python ini
CORS(app) 

# --- 2. Muat "Database" JSON Anda ---
try:
    # Membuka dan memuat seluruh data JSON ke dalam memori
    with open('Database/dataset.json', 'r', encoding='utf-8') as f:
        dataset = json.load(f)
    print("Database (dataset.json) berhasil dimuat!")
except FileNotFoundError:
    print("ERROR: File 'dataset.json' tidak ditemukan di folder yang sama!")
    dataset = {} # Gunakan dataset kosong jika file tidak ada
except Exception as e:
    print(f"ERROR saat memuat JSON: {e}")
    dataset = {}

# --- 3. Buat API Endpoint untuk Pencarian ---
# Ini adalah URL yang akan "dipanggil" oleh HTML Anda
@app.route('/search')
def search():
    # Ambil kata kunci (query) dari URL, 
    # cth: http://.../search?query=apel
    query = request.args.get('query', '').lower() # Ambil query & ubah ke huruf kecil

    # Jika query kosong, kembalikan list kosong
    if not query:
        return jsonify([]) 

    # Siapkan list kosong untuk menampung hasil
    results = []
    
    # Ambil huruf pertama dari query (misal "M" dari "Mobil")
    first_letter = query[0].upper()

    # Cek apakah huruf pertama ada di dataset (optimasi pencarian)
    if first_letter in dataset:
        
        # Loop semua item di bawah huruf tersebut (misal di bawah "M")
        for item in dataset[first_letter]:
            
            # Cek apakah 'kata_dasar' dimulai dengan query pengguna
            # Ini adalah inti dari search engine Anda!
            if item['kata_dasar'].lower().startswith(query):
                results.append(item)

    # Kembalikan hasil pencarian dalam format JSON
    return jsonify(results)

# --- 4. Jalankan Server ---
if __name__ == '__main__':
    # Server akan berjalan di http://127.0.0.1:5000/
    # debug=True berarti server akan auto-restart jika Anda mengubah kode
    app.run(debug=True, port=5000)