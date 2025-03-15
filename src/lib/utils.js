// Fungsi untuk mendapatkan waktu saat ini dalam zona waktu WIB (UTC+7)
export function getCurrentWIBTime() {
  const now = new Date();
  now.setHours(now.getHours() + 7);
  return now.toISOString();
}

// Fungsi untuk memformat tanggal ke format Indonesia
export function formatDateIndonesia(dateString) {
  const date = new Date(dateString);
  date.setHours(date.getHours() + 7); // Menambahkan 7 jam
  
  const options = { 
    day: 'numeric',
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta'
  };
  return date.toLocaleDateString('id-ID', options);
} 