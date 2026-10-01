const IMG = '/images/landing';

// Ukuran baku screenshot (lihat desain §Screenshot) — width/height next/image.
export const SIZE = {
  wide: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
  card: { width: 800, height: 600 },
} as const;

export const copy = {
  nav: {
    howItWorks: 'Cara kerja',
    pricing: 'Harga',
    faq: 'Tanya jawab',
    signin: 'Masuk',
    cta: 'Coba gratis',
  },
  hero: {
    eyebrow: 'Perencana 12 minggu',
    title: 'Hari-harimu penuh. Target besarmu masih di tempat.',
    subtitle:
      'Better Planner membantumu memilih 3 tujuan terpenting, memecahnya jadi rencana 12 minggu, mingguan, dan harian — lalu memberi tahu mana yang mulai tertinggal.',
    cta: 'Coba gratis',
    signinPrompt: 'Sudah punya akun?',
    signin: 'Masuk',
    note: 'Gratis selama masa awal. Cukup daftar dengan email.',
    image: {
      desktop: `${IMG}/hero-desktop.jpg`,
      mobile: `${IMG}/hero-mobile.jpg`,
      alt: 'Halaman Daily Sync Better Planner: daftar tugas hari ini, timer fokus, dan jadwal harian',
    },
  },
  problem: {
    eyebrow: 'Terdengar familiar?',
    title: 'Bukan kurang rajin. Kurang arah.',
    body: 'Daftar tugasmu 40 baris. Kalender penuh rapat. Tiap malam kamu capek, tapi kalau ditanya "tujuan besarmu maju berapa minggu ini?" — jawabannya diam. Masalahnya jarang di kemauan. Kamu sibuk mengerjakan yang mendesak, sementara yang penting menunggu giliran yang tidak pernah datang.',
    punchline: 'Tiga bulan lewat lagi, dan target yang sama masih ada di daftar.',
    todo: {
      title: 'Hari ini',
      items: [
        'Balas 23 chat grup',
        'Rapat mingguan',
        'Rapikan folder laptop',
        'Beli token listrik',
        'Revisi slide presentasi',
      ],
      faded: ['Belajar untuk sertifikasi', 'Riset usaha sampingan'],
      more: '+ 32 lagi',
    },
  },
  howItWorks: {
    eyebrow: 'Cara kerjanya',
    title: 'Tiga langkah, diulang tiap kuartal',
    subtitle:
      'Tentukan arah sekali di awal. Jalankan tiap minggu dan tiap hari. Cek, lalu sesuaikan. Semuanya di satu tempat, jadi kamu tidak perlu menyambungkannya sendiri.',
  },
  steps: [
    {
      tag: 'Langkah 1 · Arah',
      title: 'Pilih 3 tujuan untuk 12 minggu ke depan',
      body: 'Mulai dari visimu, tulis semua yang ingin dicapai kuartal ini, lalu adu satu lawan satu sampai ketemu tiga yang paling penting. Tiga, bukan sepuluh — supaya tenagamu tidak terbagi rata ke semua hal.',
      image: {
        src: `${IMG}/l1-main-quests.jpg`,
        alt: 'Tiga tujuan kuartal berjajar, masing-masing dengan milestone dan langkahnya',
      },
      cards: [
        {
          title: 'Visi',
          body: 'Tulis mau jadi apa 3–10 tahun lagi. Ini jadi patokan saat memilih tujuan.',
          image: { src: `${IMG}/l1-vision.jpg`, alt: 'Halaman visi' },
        },
        {
          title: 'Pilih yang terpenting',
          body: 'Semua ide tujuan diadu berpasangan. Hasilnya urutan prioritas yang jelas, bukan tebakan.',
          image: {
            src: `${IMG}/l1-pairwise.jpg`,
            alt: 'Matriks perbandingan berpasangan untuk mengurutkan tujuan',
          },
        },
        {
          title: 'Jatah jam per tujuan',
          body: 'Tiap tujuan dipecah jadi milestone dan diberi jatah jam per minggu.',
          image: { src: `${IMG}/l1-jatah-jam.jpg`, alt: 'Tujuan dengan jatah jam per minggu' },
        },
      ],
    },
    {
      tag: 'Langkah 2 · Jalan',
      title: 'Ubah tujuan jadi jadwal minggu ini dan hari ini',
      body: 'Tiap awal minggu, pilih langkah dari tiga tujuan tadi — plus daftar hal yang sengaja tidak kamu kerjakan minggu ini. Tiap pagi, tarik yang mau dikerjakan hari ini, pasang di jam, lalu mulai timer fokus. Semua sesi tercatat sendiri.',
      image: {
        src: `${IMG}/l2-weekly-sync.jpg`,
        alt: 'Weekly Sync: rencana minggu ini yang diambil dari tiga tujuan',
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
      tag: 'Langkah 3 · Cek',
      title: 'Tahu tujuan mana yang tertinggal, sebelum terlambat',
      body: 'Tiap tujuan diberi status ON TRACK atau AT RISK, dihitung dari jam fokus yang benar-benar kamu habiskan minggu ini dibanding jatahnya. Kamu tahu harus menambah jam di mana — bukan baru sadar di minggu ke-11.',
      image: {
        src: `${IMG}/l3-hfg-status.jpg`,
        alt: 'Status mingguan tiga tujuan: jam fokus dibanding jatah, ON TRACK dan AT RISK',
      },
      cards: [
        {
          title: 'Tanda energi',
          body: 'Tiap sesi diberi tanda +, =, atau −. Lama-lama kelihatan kerja mana yang menguras dan mana yang mengisi.',
          image: { src: `${IMG}/l3-energi.jpg`, alt: 'Ringkasan energi minggu ini' },
        },
        {
          title: 'Minggu ideal',
          body: 'Bandingkan jadwal nyata minggu ini dengan template minggu idealmu.',
          image: { src: `${IMG}/l3-best-week.jpg`, alt: 'Jadwal minggu ini di atas grid minggu ideal' },
        },
        {
          title: 'Evaluasi 12 minggu',
          body: 'Di akhir kuartal, tinjau pencapaian dan refleksi, lalu mulai kuartal baru dengan bahan yang lengkap.',
          image: { src: `${IMG}/l3-12-week-sync.jpg`, alt: 'Halaman evaluasi akhir kuartal' },
        },
      ],
    },
  ],
  beforeAfter: {
    title: 'Yang berubah',
    before: {
      label: 'Tanpa sistem',
      body: 'Daftar tugas yang tidak pernah habis, kalender yang tidak pernah bertanya apakah ini penting, dan evaluasi yang baru terjadi setelah kuartal lewat.',
    },
    after: {
      label: 'Dengan Better Planner',
      body: 'Tiga tujuan yang jelas, jam yang disisihkan untuk masing-masing, dan peringatan tiap minggu saat salah satunya mulai tertinggal.',
    },
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
        title: '3 tujuan terpenting',
        body: 'Prinsip Highest First: kerjakan yang paling penting dulu, sisanya menunggu giliran.',
      },
      {
        title: 'Sinkron tiap minggu dan hari',
        body: 'Weekly Sync dan Daily Sync menjaga rencana besar tetap nyambung dengan yang kamu kerjakan hari ini.',
      },
    ],
    quote:
      'Sistem 12 minggu ini awalnya saya jalankan di Google Sheets. Lama-lama sheet-nya makin berat: susah dibuka di HP, semua hubungan antar data diisi manual, dan saya baru sadar sebuah target tertinggal ketika kuartalnya hampir habis. Better Planner saya bangun untuk menutup celah itu, dan sampai sekarang saya pakai tiap hari untuk merencanakan dan mencatat kerja.',
    author: 'Abu Abdirohman',
    role: 'pembuat Better Planner',
    initials: 'AA',
  },
  pricing: {
    title: 'Mulai gratis',
    free: {
      name: 'Gratis',
      price: 'Rp0',
      note: 'Semua fitur, selama masa awal',
      features: [
        '3 tujuan & rencana 12 minggu',
        'Weekly Sync & Daily Sync',
        'Timer fokus + catatan otomatis',
        'Habit tracker',
        'Bisa dipasang di HP',
      ],
      cta: 'Coba gratis',
    },
    pro: {
      name: 'Pro',
      badge: 'Segera',
      price: 'Diumumkan nanti',
      note: 'Untuk yang ingin lebih dari dasar',
      cta: 'Segera hadir',
    },
  },
  faq: {
    title: 'Tanya jawab',
    items: [
      {
        q: 'Apa bedanya dengan to-do list biasa?',
        a: 'To-do list mencatat semua hal. Better Planner dimulai dari 3 tujuan terpenting, lalu hanya menurunkan pekerjaan yang mendukung tujuan itu ke minggu dan harimu.',
      },
      {
        q: 'Belum pernah pakai metode 12 minggu, bisa?',
        a: 'Bisa. Urutannya dipandu: visi, pilih tujuan, pecah jadi milestone, lalu rencana mingguan. Cukup disusun sekali di awal kuartal.',
      },
      {
        q: 'Bisa dipakai di HP?',
        a: 'Bisa. Better Planner jalan di browser dan bisa dipasang ke layar utama HP seperti aplikasi. Timer tetap mengirim notifikasi.',
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
    title: 'Kuartal ini, pastikan yang penting benar-benar bergerak.',
    cta: 'Coba gratis',
  },
  footer: {
    copyright: '© 2026 Better Planner',
    signin: 'Masuk',
    signup: 'Daftar',
  },
  meta: {
    title: 'Better Planner — Rencana 12 Minggu untuk 3 Tujuan Terpentingmu',
    description:
      'Pilih 3 tujuan terpenting, pecah jadi rencana 12 minggu, mingguan, dan harian, lalu lihat mana yang mulai tertinggal. Gratis selama masa awal.',
    keywords:
      'perencanaan 12 minggu, planner, target, produktivitas, sync planner, pomodoro, habit tracker',
  },
};

// copy.en.ts nanti wajib berbentuk sama.
export type LandingCopy = typeof copy;
