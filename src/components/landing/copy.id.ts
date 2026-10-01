const IMG = '/images/landing';

// Ukuran baku screenshot (lihat desain §Screenshot) — width/height next/image.
export const SIZE = {
  wide: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
  card: { width: 800, height: 600 },
} as const;

export const copy = {
  nav: {
    features: 'Fitur',
    howItWorks: 'Cara kerja',
    pricing: 'Harga',
    faq: 'FAQ',
    cta: 'Mulai Sekarang',
  },
  hero: {
    eyebrow: 'Perencanaan 12 minggu · metode Sync Planner',
    titleLead: 'Hari-harimu penuh, target besarmu masih di tempat.',
    titleAccent: 'Mulai dari 3 yang terpenting.',
    // Potongan subjudul; bold = ditebalkan.
    subtitle: [
      { text: 'Better Planner menyambungkan ' },
      { text: 'visi, 3 goal 12 minggu, rencana mingguan, jadwal harian, dan timer fokus', bold: true },
      { text: ' dalam satu alur. ' },
      { text: 'Tiap minggu kamu tahu goal mana yang mulai tertinggal', bold: true },
      { text: ' — bukan sekadar daftar tugas yang terus memanjang.' },
    ],
    cta: 'Mulai Sekarang',
    secondaryCta: 'Lihat cara kerja',
    // Chip pertama tampil dengan ikon globe.
    checks: ['Aplikasi web, bukan Google Sheets', 'Gratis selama masa awal', 'Cukup daftar dengan email', 'Bisa di-install di HP'],
    browserUrl: 'planner.abuabdirohman.com',
    image: {
      desktop: `${IMG}/hero-desktop.jpg`,
      mobile: `${IMG}/hero-mobile.jpg`,
      alt: 'Halaman Daily Sync Better Planner: daftar tugas hari ini, timer fokus, dan jadwal harian',
    },
  },
  stats: [
    { value: 'Web App', label: 'Bisa di-install di HP' },
    { value: '12 Minggu', label: 'Satu siklus fokus' },
    { value: '3 Goal', label: 'Bukan 30 to-do' },
    { value: 'Rp0', label: 'Selama masa awal' },
  ],
  callout: {
    title: 'Bukan spreadsheet, bukan buku planner. Ini aplikasi yang bekerja untukmu.',
    body: 'Banyak orang menjalankan metode 12 minggu di spreadsheet atau buku. Semua diisi dan dihitung manual, dan goal yang tertinggal baru ketahuan di akhir 12 minggu. Di Better Planner, semuanya sudah tersambung, dari visi sampai jadwal hari ini.',
    no: ['template Google Sheets / Excel', 'buku planner yang diisi tangan'],
    yes: 'aplikasi yang langsung memberi tahu goal mana yang tertinggal',
    yesLabel: 'Ya,',
    noLabel: 'Bukan',
  },
  problem: {
    eyebrow: 'Masalahnya',
    title: 'Kenapa target besar sering tidak bergerak?',
    subtitle: 'Bukan karena kurang rajin. Karena tidak ada sistem yang menjaga arahnya.',
    items: [
      { icon: '🤹', title: 'Terlalu banyak target', body: 'Sepuluh hal ingin dicapai sekaligus. Tenaga terbagi rata, tidak ada yang selesai.' },
      { icon: '🚨', title: 'Yang mendesak selalu menang', body: 'Chat, rapat, dan urusan kecil menghabiskan hari. Yang penting terus menunggu "nanti".' },
      { icon: '🧩', title: 'Rencana dan kenyataan terpisah', body: 'Rencana ada di kepala atau buku, kerjaan di tempat lain. Tidak ada yang menyandingkan keduanya.' },
      { icon: '⌛', title: 'Baru sadar di akhir', body: 'Evaluasi baru terjadi setelah 12 minggu lewat, saat sudah terlambat untuk mengejar.' },
    ],
  },
  solution: {
    eyebrow: 'Solusinya',
    title: 'Satu sistem, dari visi sampai jadwal hari ini',
    subtitle: 'Tiap bagian saling tersambung, bukan kumpulan fitur lepas.',
    // Urutan = urutan warna SOLUTION_GRADIENTS di LandingPage.tsx.
    items: [
      { icon: '🧭', title: 'Visi & 12 Week Quest', body: 'Tulis visi, adu semua ide goal berpasangan, lalu ambil 3 teratas untuk 12 minggu.', tag: 'Highest First' },
      { icon: '🎯', title: 'Main Quest & milestone', body: 'Tiap goal dipecah jadi milestone, langkah, dan sub-langkah yang bisa langsung dikerjakan.', tag: '3 Goal' },
      { icon: '🗓️', title: 'Weekly Sync', body: 'Rencana minggu ini ditarik dari 3 goal, plus To Don\'t List untuk hal yang sengaja tidak dikerjakan.', tag: 'Tiap minggu' },
      { icon: '⏱️', title: 'Daily Sync & timer fokus', body: 'Tarik tugas ke hari ini, pasang di jam, lalu mulai Pomodoro. Tiap sesi tercatat sendiri.', tag: 'Pomodoro' },
      { icon: '📈', title: 'Progres mingguan per goal', body: 'Tiap goal punya persentase progres minggu ini, dan grafik 12 minggu menunjukkan trennya. Yang tertinggal langsung kelihatan.', tag: 'Progres' },
      { icon: '⚖️', title: 'Rencana vs kenyataan', body: 'Kalender yang menyandingkan jadwal dengan yang benar-benar terjadi, dengan Best Week sebagai patokan.', tag: 'Plan · Actual' },
      { icon: '✅', title: 'Habit tracker', body: 'Target per hari, hari tertentu, dan runtun yang tidak putus tiap ganti bulan.', tag: 'Konsisten' },
      { icon: '📝', title: 'Jurnal & evaluasi', body: 'Catatan singkat tiap sesi fokus, lalu 12 Week Sync di minggu terakhir untuk menilai tiap goal.', tag: 'Refleksi' },
    ],
  },
  howItWorks: {
    eyebrow: 'Cara kerjanya',
    title: 'Tiga langkah, diulang tiap 12 minggu',
    subtitle:
      'Tentukan arah sekali di awal. Jalankan tiap minggu dan tiap hari. Evaluasi, lalu sesuaikan. Semuanya di satu tempat, jadi kamu tidak perlu menyambungkannya sendiri.',
  },
  steps: [
    {
      tag: 'Langkah 1 · Arah',
      title: 'Pilih 3 goal untuk 12 minggu ke depan',
      body: 'Mulai dari visimu, tulis semua yang ingin dicapai dalam 12 minggu ke depan, lalu adu satu lawan satu sampai ketemu tiga yang paling penting. Tiga, bukan sepuluh — supaya tenagamu tidak terbagi rata ke semua hal.',
      image: {
        src: `${IMG}/l1-main-quests.jpg`,
        alt: 'Tiga goal 12 minggu berjajar, masing-masing dengan milestone dan langkahnya',
      },
      cards: [
        {
          title: 'Visi',
          body: 'Tulis mau jadi apa 3–10 tahun lagi. Ini jadi patokan saat memilih goal.',
          image: { src: `${IMG}/l1-vision.jpg`, alt: 'Halaman visi' },
        },
        {
          title: 'Pilih yang terpenting',
          body: 'Semua ide goal diadu berpasangan. Hasilnya urutan prioritas yang jelas, bukan tebakan.',
          image: {
            src: `${IMG}/l1-pairwise.jpg`,
            alt: 'Matriks perbandingan berpasangan untuk mengurutkan goal',
          },
        },
        {
          title: 'Milestone per goal',
          body: 'Tiap goal dipecah jadi 3 milestone, lalu langkah-langkah kecil di bawahnya.',
          image: { src: `${IMG}/l1-milestone.jpg`, alt: 'Tiga milestone dan langkah selanjutnya untuk satu goal' },
        },
      ],
    },
    {
      tag: 'Langkah 2 · Jalan',
      title: 'Ubah goal jadi jadwal minggu ini dan hari ini',
      body: 'Tiap awal minggu, pilih langkah dari tiga goal tadi — plus daftar hal yang sengaja tidak kamu kerjakan minggu ini. Tiap pagi, tarik yang mau dikerjakan hari ini, pasang di jam, lalu mulai timer fokus. Semua sesi tercatat sendiri.',
      image: {
        src: `${IMG}/l2-weekly-sync.jpg`,
        alt: 'Weekly Sync: rencana minggu ini yang diambil dari tiga goal',
      },
      cards: [
        {
          title: 'Rencana harian',
          body: 'Tiap pagi, tarik tugas dari rencana minggu ini ke hari ini, lengkap dengan jamnya.',
          image: { src: `${IMG}/l2-daily-plan.jpg`, alt: 'Daftar tugas hari ini di Daily Sync' },
        },
        {
          title: 'Timer fokus',
          body: 'Sesi 25 menit yang tetap jalan walau tab ditutup, lengkap dengan notifikasi.',
          image: { src: `${IMG}/l2-timer.jpg`, alt: 'Timer fokus yang sedang berjalan' },
        },
        {
          title: 'Rencana vs kenyataan',
          body: 'Kalender harian menampilkan jadwal yang direncanakan dan yang benar-benar terjadi, berdampingan.',
          image: {
            src: `${IMG}/l2-plan-actual.jpg`,
            alt: 'Kalender harian mode Plan dan Actual berdampingan',
          },
        },
      ],
    },
    {
      tag: 'Langkah 3 · Evaluasi',
      title: 'Tahu goal mana yang tertinggal, sebelum terlambat',
      body: 'Tiap minggu, progres ketiga goal dihitung dari langkah yang selesai, jadi kamu tahu goal mana yang perlu dikejar — bukan baru sadar di minggu ke-11. Di minggu terakhir, 12 Week Sync membantumu menilai tiap goal dan menyiapkan 12 minggu berikutnya.',
      image: {
        src: `${IMG}/l3-evaluasi.jpg`,
        alt: '12 Week Sync: nilai tiap goal, daftar pencapaian, dan refleksi akhir 12 minggu',
      },
      cards: [
        {
          title: 'Progres per goal',
          body: 'Di Weekly Sync, tiap goal punya cincin progres: berapa langkah minggu ini yang sudah selesai.',
          image: { src: `${IMG}/l3-goal-progress.jpg`, alt: 'Cincin progres mingguan tiap goal di Weekly Sync' },
        },
        {
          title: 'Minggu ideal',
          body: 'Bandingkan jadwal nyata minggu ini dengan template minggu idealmu.',
          image: { src: `${IMG}/l3-best-week.jpg`, alt: 'Jadwal minggu ini di atas grid minggu ideal' },
        },
        {
          title: 'Grafik 12 minggu',
          body: 'Progres tiap minggu tergambar dari minggu 1 sampai 12, jadi trennya terlihat sekilas.',
          image: { src: `${IMG}/l3-weekly-progress.jpg`, alt: 'Grafik progres mingguan dari minggu 1 sampai minggu 12' },
        },
      ],
    },
  ],
  comfort: {
    eyebrow: 'Nyaman dipakai',
    title: 'Di laptop atau di HP, terang atau gelap.',
    body: 'Install Better Planner di HP seperti aplikasi biasa, tanpa lewat Play Store atau App Store. Timer tetap jalan dan mengirim notifikasi walau aplikasinya ditutup, dan datanya sama di HP maupun laptop.',
    points: [
      { icon: '📱', text: 'Install di HP' },
      { icon: '🔔', text: 'Notifikasi saat sesi fokus selesai' },
      { icon: '🌗', text: 'Mode terang & gelap' },
      { icon: '🔄', text: 'Data sama di HP dan laptop' },
    ],
    image: { src: `${IMG}/hero-mobile.jpg`, alt: 'Better Planner di HP: timer fokus dan daftar tugas hari ini' },
  },
  comparison: {
    eyebrow: 'Kenapa Better Planner?',
    title: 'Bukan sekadar spreadsheet atau buku planner',
    subtitle: 'Satu sistem 12 minggu yang langsung jalan. Bandingkan sendiri.',
    columns: ['Better Planner', 'Google Sheets', 'Buku planner'],
    // Sel diawali ✓ tampil hijau, diawali ✕ tampil merah.
    rows: [
      { label: 'Visi sampai jadwal hari ini tersambung', cells: ['✓ otomatis', 'rumus & link sendiri', 'ditulis ulang'] },
      { label: 'Memilih 3 goal terpenting', cells: ['✓ dipandu', 'manual', 'manual'] },
      { label: 'Progres mingguan per goal', cells: ['✓ + grafik 12 minggu', 'rumus manual', 'dihitung manual'] },
      { label: 'Timer fokus & catatan sesi', cells: ['✓ tercatat sendiri', '✕', '✕'] },
      { label: 'Rencana vs kenyataan', cells: ['✓ berdampingan', 'manual', 'ditulis tangan'] },
      { label: 'Habit tracker', cells: ['✓ menyatu', 'rumus sendiri', 'tabel di kertas'] },
      { label: 'Dipakai di HP', cells: ['✓ bisa di-install', 'berat di layar kecil', 'harus dibawa'] },
      { label: 'Biaya', cells: ['Gratis selama masa awal', 'gratis tapi ribet', 'beli buku berkala'] },
    ],
    perks: [
      { icon: '⚡', text: 'Langsung pakai, tanpa setup' },
      { icon: '📱', text: 'Bisa di-install di HP' },
      { icon: '🔔', text: 'Notifikasi timer' },
      { icon: '🔄', text: 'Data sama di semua perangkat' },
      { icon: '🎁', text: 'Gratis selama masa awal' },
    ],
  },
  method: {
    eyebrow: 'Dasarnya',
    title: 'Dibangun di atas metode Sync Planner',
    subtitle:
      'Bukan metode baru. Metode yang sudah dipakai banyak orang, dibuat gampang dijalankan tiap hari.',
    points: [
      {
        title: '12 minggu, bukan setahun',
        body: 'Setahun terlalu jauh untuk terasa mendesak. Dua belas minggu cukup panjang untuk hasil besar, dan cukup pendek untuk tetap fokus.',
      },
      {
        title: '3 goal terpenting',
        body: 'Prinsip Highest First: kerjakan yang paling penting dulu, sisanya menunggu giliran.',
      },
      {
        title: 'Sinkron tiap minggu dan hari',
        body: 'Weekly Sync dan Daily Sync menjaga rencana besar tetap nyambung dengan yang kamu kerjakan hari ini.',
      },
    ],
    quote:
      'Sebelum ada aplikasi ini, saya menjalankan metode Sync Planner di bukunya, sampai sekitar 16 buku terisi. Lama-lama terasa ribet dan bikin kewalahan, jadi saya pindah ke Google Sheets. Sheet-nya pun makin berat: susah dibuka di HP, semua hubungan antar data diisi manual, dan saya baru sadar sebuah target tertinggal ketika 12 minggunya hampir habis. Better Planner saya bangun untuk menutup celah itu, dan sampai sekarang saya pakai tiap hari.',
    author: 'Abu Abdirohman',
    role: 'pembuat Better Planner',
    initials: 'AA',
  },
  pricing: {
    eyebrow: 'Harga',
    title: 'Gratis selama masa awal. Semua fitur terbuka.',
    subtitle: 'Tanpa kartu kredit, tanpa fitur yang dikunci. Cukup daftar dengan email, langsung pakai.',
    badge: 'Akses masa awal',
    price: 'Rp0',
    priceTag: 'Gratis',
    note: 'Semua fitur · tanpa kartu kredit · daftar dengan email',
    // Potongan pertama butir pertama ditebalkan.
    features: [
      { bold: 'Sistem 12 minggu lengkap', text: ': Visi, 12 Week Quest, Main Quest, Weekly Sync, Daily Sync & 12 Week Sync' },
      { text: 'Timer Pomodoro + catatan sesi otomatis & notifikasi' },
      { text: 'Progres mingguan per goal + grafik 12 minggu' },
      { text: 'Kalender rencana vs kenyataan + Best Week' },
      { text: 'Habit tracker & jurnal tiap sesi fokus' },
      { text: 'Bisa di-install di HP, mode terang/gelap, data sama di semua perangkat' },
    ],
    boxLabel: 'Masa awal',
    boxText: 'Better Planner masih dikembangkan aktif dan dipakai pembuatnya tiap hari. Masukanmu ikut menentukan fitur berikutnya.',
    cta: 'Mulai Sekarang',
    footnote: 'Tanpa kartu kredit',
  },
  faq: {
    eyebrow: 'FAQ',
    title: 'Pertanyaan yang sering muncul',
    items: [
      {
        q: 'Apa bedanya dengan to-do list biasa?',
        a: 'To-do list mencatat semua hal. Better Planner dimulai dari 3 goal terpenting, lalu hanya menurunkan pekerjaan yang mendukung goal itu ke minggu dan harimu.',
      },
      {
        q: 'Belum pernah pakai metode 12 minggu, bisa?',
        a: 'Bisa. Urutannya dipandu: visi, pilih goal, pecah jadi milestone, lalu rencana mingguan. Cukup disusun sekali di awal tiap 12 minggu.',
      },
      {
        q: 'Bisa dipakai di HP?',
        a: 'Bisa. Better Planner jalan di browser dan bisa di-install di HP seperti aplikasi. Timer tetap mengirim notifikasi.',
      },
      {
        q: 'Data saya aman?',
        a: 'Data tiap akun terpisah dan hanya bisa dibuka pemiliknya.',
      },
      {
        q: 'Tersambung ke Google Calendar?',
        a: 'Belum. Jadwal dibuat di dalam Better Planner.',
      },
      {
        q: 'Aplikasinya berbahasa Indonesia?',
        a: 'Halaman ini iya. Di dalam aplikasi, beberapa istilah masih bahasa Inggris (Daily Sync, Weekly Sync) karena mengikuti nama metodenya.',
      },
      {
        q: 'Berapa biayanya?',
        a: 'Gratis selama masa awal.',
      },
    ],
  },
  closing: {
    title: '12 Minggu ini, pastikan yang terpenting yang kamu kerjakan.',
    subtitle: 'Dua belas minggu cukup untuk satu perubahan besar. Mulai dengan memilih tiga goal-mu hari ini.',
    cta: 'Mulai Sekarang',
  },
  footer: {
    tagline: 'Sistem perencanaan 12 minggu untuk menyelesaikan tiga hal yang paling penting, satu minggu demi satu minggu.',
    productTitle: 'Produk',
    accountTitle: 'Akun',
    signin: 'Masuk',
    signup: 'Daftar',
    copyright: '© 2026 Better Planner',
    site: 'planner.abuabdirohman.com',
  },
  meta: {
    title: 'Better Planner — Rencana 12 Minggu untuk 3 Goal Terpentingmu',
    description:
      'Pilih 3 goal terpenting, pecah jadi rencana 12 minggu, mingguan, dan harian, lalu lihat mana yang mulai tertinggal. Gratis selama masa awal.',
    keywords:
      'perencanaan 12 minggu, planner, target, produktivitas, sync planner, pomodoro, habit tracker',
  },
};

// copy.en.ts nanti wajib berbentuk sama.
export type LandingCopy = typeof copy;
