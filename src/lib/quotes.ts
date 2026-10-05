export interface Quote { text: string; author: string }

// Semua dalam Bahasa Indonesia; kutipan tokoh luar adalah terjemahan.
export const QUOTES: Quote[] = [
  { text: 'Kalau kamu tidak siap gagal, kamu tidak akan menciptakan hal baru.', author: 'Brené Brown' },
  { text: "Saat kamu punya rencana, kamu punya kekuatan luar biasa untuk memutuskan secara proaktif dan berkata 'TIDAK'.", author: 'Hyrum Smith' },
  { text: 'Tanpa ambisi, orang tidak memulai apa pun. Tanpa kerja, orang tidak menyelesaikan apa pun. Hadiahnya tidak akan dikirim kepadamu. Kamu harus meraihnya.', author: 'Ralph Waldo Emerson' },
  { text: 'Yang terpenting adalah menjaga hal terpenting tetap menjadi yang terpenting.', author: 'Stephen Covey' },
  { text: 'Mulailah dengan tujuan akhir di benak.', author: 'Stephen Covey' },
  { text: 'Kuncinya bukan memprioritaskan apa yang ada di jadwalmu, tetapi menjadwalkan prioritasmu.', author: 'Stephen Covey' },
  { text: 'Kamu tidak naik ke level tujuanmu. Kamu jatuh ke level sistemmu.', author: 'James Clear' },
  { text: 'Setiap tindakanmu adalah suara untuk menjadi orang seperti apa yang kamu inginkan.', author: 'James Clear' },
  { text: 'Kebiasaan adalah bunga majemuk dari pengembangan diri.', author: 'James Clear' },
  { text: 'Tujuan bagus untuk menentukan arah, tetapi sistemlah yang terbaik untuk membuat kemajuan.', author: 'James Clear' },
  { text: 'Tidak ada yang lebih sia-sia daripada mengerjakan dengan efisien sesuatu yang seharusnya tidak dikerjakan sama sekali.', author: 'Peter Drucker' },
  { text: 'Efisiensi adalah mengerjakan sesuatu dengan benar; efektivitas adalah mengerjakan hal yang benar.', author: 'Peter Drucker' },
  { text: 'Rencana hanyalah niat baik kecuali segera berubah menjadi kerja keras.', author: 'Peter Drucker' },
  { text: 'Bukan waktu hidup kita yang singkat, tetapi terlalu banyak yang kita sia-siakan.', author: 'Seneca' },
  { text: 'Kesulitan menguatkan pikiran, seperti kerja menguatkan tubuh.', author: 'Seneca' },
  { text: 'Selagi kita menunda-nunda, hidup terus melaju.', author: 'Seneca' },
  { text: 'Kalau seseorang tidak tahu pelabuhan mana yang dituju, tidak ada angin yang baik baginya.', author: 'Seneca' },
  { text: 'Rintangan bagi tindakan justru memajukan tindakan. Apa yang menghalangi jalan menjadi jalan itu sendiri.', author: 'Marcus Aurelius' },
  { text: 'Katakan dulu pada dirimu siapa yang ingin kamu jadi; lalu lakukan apa yang harus kamu lakukan.', author: 'Epictetus' },
  { text: 'Perjalanan seribu mil dimulai dari satu langkah.', author: 'Lao Tzu' },
  { text: 'Kejeniusan adalah satu persen inspirasi dan sembilan puluh sembilan persen keringat.', author: 'Thomas Edison' },
  { text: 'Waktu yang hilang tidak akan pernah ditemukan lagi.', author: 'Benjamin Franklin' },
  { text: 'Dikerjakan dengan baik lebih berharga daripada dikatakan dengan baik.', author: 'Benjamin Franklin' },
  { text: 'Kalau kamu tidak memprioritaskan hidupmu, orang lain yang akan melakukannya.', author: 'Greg McKeown' },
  { text: 'Sibuk adalah bentuk kemalasan: berpikir malas dan bertindak tanpa pilih-pilih.', author: 'Tim Ferriss' },
  { text: 'Orang mengira fokus berarti berkata ya pada hal yang harus difokuskan. Bukan begitu maksudnya. Fokus berarti berkata tidak pada seratus ide bagus lainnya.', author: 'Steve Jobs' },
  { text: 'Rencana itu tidak berharga, tetapi merencanakan adalah segalanya.', author: 'Dwight D. Eisenhower' },
  { text: 'Yang penting jarang mendesak, dan yang mendesak jarang penting.', author: 'Dwight D. Eisenhower' },
  { text: 'Disiplin adalah jembatan antara tujuan dan pencapaian.', author: 'Jim Rohn' },
  { text: 'Berakit-rakit ke hulu, berenang-renang ke tepian. Bersakit-sakit dahulu, bersenang-senang kemudian.', author: 'Pepatah' },
  { text: 'Sedikit demi sedikit, lama-lama menjadi bukit.', author: 'Pepatah' },
  { text: 'Sedia payung sebelum hujan.', author: 'Pepatah' },
  { text: 'Rajin pangkal pandai, hemat pangkal kaya.', author: 'Pepatah' },
  { text: 'Alah bisa karena biasa.', author: 'Pepatah' },
  { text: 'Di mana ada kemauan, di situ ada jalan.', author: 'Pepatah' },
  { text: 'Sekali merengkuh dayung, dua tiga pulau terlampaui.', author: 'Pepatah' },
  { text: 'Tak ada rotan, akar pun jadi.', author: 'Pepatah' },
  { text: 'Biar lambat asal selamat.', author: 'Pepatah' },
  { text: 'Gantungkan cita-citamu setinggi langit!', author: 'Soekarno' },
  { text: 'Habis gelap terbitlah terang.', author: 'R.A. Kartini' },
];

// date = "YYYY-MM-DD" (WIB); sama sepanjang hari, bergilir tiap hari.
export function quoteOfDay(date: string): Quote {
  const n = QUOTES.length;
  const day = Math.floor(Date.parse(date + 'T00:00:00Z') / 86400000);
  return QUOTES[((day % n) + n) % n];
}
