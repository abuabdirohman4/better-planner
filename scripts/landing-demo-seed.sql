-- =====================================================================
-- Better Planner - SEED AKUN DEMO (untuk screenshot landing, app-mqh7)
-- =====================================================================
-- CARA PAKAI
--   1. Buat user demo lewat auth.admin.createUser({ email, password, email_confirm: true })
--      (pola sama dengan tests/global-setup.ts). Ambil UUID-nya.
--   2. Ganti v_uid di bawah. Kalau pakai psql, boleh ganti jadi :'demo_user_id'.
--   3. Jalankan SELURUH berkas ini sebagai satu statement (satu DO block, atomik:
--      gagal di tengah = tidak ada yang tersimpan).
--   4. Jalankan blok VERIFIKASI di paling bawah (SELECT saja).
--
-- TANGGAL
--   v_monday = Senin minggu pemotretan (Q4 2026 W1 = 2026-09-28). "Hari ini" = v_monday + 3 (Kamis).
--   Kalau pemotretan baru dilakukan setelah Minggu 4 Okt 2026, GESER v_monday ke Senin minggu itu:
--   status HFG dihitung hfg_weekly_status() dari activity_logs MINGGU BERJALAN, jadi data
--   minggu lama tidak lagi muncul di dashboard. Semua tanggal/jam turunan ikut bergeser.
--
-- IDEMPOTEN
--   Script MENOLAK jalan kalau user ini sudah punya quest/task (mencegah data ganda).
--   Untuk mengulang: jalankan blok CLEANUP (dikomentari, paling bawah), lalu seed lagi.
--   Script tidak pernah menghapus apa pun sendiri.
--
-- KEAMANAN: hanya menyentuh baris dengan user_id = v_uid. Wajib dijalankan sebagai role
--   yang melewati RLS (service role / postgres / MCP execute_sql).
-- =====================================================================

DO $demo$
DECLARE
  v_uid    uuid := '00000000-0000-0000-0000-000000000000'::uuid;  -- GANTI: UUID user demo
  v_monday date := DATE '2026-09-28';                              -- Senin minggu pemotretan (WIB)

  v_year   int;
  v_woy    int;   -- minggu tahun perencanaan (Senin pekan yang memuat 1 Jan = minggu 1)
  v_q      int;
  v_wiq    int;   -- minggu dalam kuartal (1..13) -> weekly_goals.week_number
  v_base   timestamptz;
  v_rev    uuid;
BEGIN
  -- ---------- pengaman ----------
  IF v_uid = '00000000-0000-0000-0000-000000000000'::uuid THEN
    RAISE EXCEPTION 'Ganti v_uid dengan UUID user demo dulu';
  END IF;
  IF v_uid = '59076bab-b21c-49ce-a7d1-7b9d69a6001c'::uuid THEN
    RAISE EXCEPTION 'Itu user_id Abu, BUKAN akun demo. Dibatalkan.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_uid) THEN
    RAISE EXCEPTION 'User % tidak ada di auth.users (buat dulu lewat auth.admin.createUser)', v_uid;
  END IF;
  IF EXISTS (SELECT 1 FROM quests WHERE user_id = v_uid)
     OR EXISTS (SELECT 1 FROM tasks WHERE user_id = v_uid) THEN
    RAISE EXCEPTION 'User demo sudah punya data. Jalankan blok CLEANUP dulu agar tidak dobel.';
  END IF;

  -- Penanggalan perencanaan: sama dengan quarterUtils + hfg_weekly_status
  v_year := extract(year FROM v_monday)::int;
  v_woy  := ((v_monday - date_trunc('week', make_date(v_year, 1, 1))::date) / 7) + 1;
  v_q    := LEAST(4, (v_woy - 1) / 13 + 1);
  v_wiq  := v_woy - (v_q - 1) * 13;
  v_base := ((v_monday - 1)::timestamp + time '20:00') AT TIME ZONE 'Asia/Jakarta'; -- Minggu malam sebelum minggu ini
  RAISE NOTICE 'Seed demo: tahun %, Q%, W% (woy %), Senin %', v_year, v_q, v_wiq, v_woy, v_monday;

  -- peta key -> uuid (dipakai semua tabel di bawah)
  CREATE TEMP TABLE _demo_ids (k text PRIMARY KEY, id uuid NOT NULL DEFAULT gen_random_uuid()) ON COMMIT DROP;

  ------------------------------------------------------------------
  -- 1. QUESTS: 10 kandidat 12 Week Quest (A-J; UI memang 10 slot tetap). Top 3 = HFG (is_committed)
  --    label = huruf matriks pairwise; urutan created_at = urutan baris matriks.
  ------------------------------------------------------------------
  CREATE TEMP TABLE _demo_q (k text, label text, ord int, title text, committed boolean, score numeric,
                             hours numeric, status text, motivation text) ON COMMIT DROP;
  INSERT INTO _demo_q VALUES
   ('qA','A',1,'Lulus sertifikasi data analyst', true, 9, 6.0,'IN_PROGRESS','Naik kelas dari admin ke analis data supaya pekerjaan lebih menantang dan gaji ikut naik.'),
   ('qB','B',2,'Dana darurat Rp10 juta',                  true, 8, 2.0,'IN_PROGRESS','Supaya tenang kalau ada kejadian tak terduga dan tidak perlu berutang.'),
   ('qC','C',3,'Lari 10K tanpa berhenti',                 true, 7, 3.0,'IN_PROGRESS','Bukti ke diri sendiri bahwa aku bisa konsisten, dan badan jadi lebih bugar.'),
   ('qD','D',4,'Turun 4 kg berat badan',                  false,4, NULL,'TODO', NULL),
   ('qE','E',5,'Belajar bahasa Inggris percakapan',       false,1, NULL,'TODO', NULL),
   ('qF','F',6,'Rapikan rumah dan buang barang tak terpakai', false,0, NULL,'TODO', NULL),
   ('qG','G',7,'Liburan keluarga ke Yogyakarta',          false,6, NULL,'TODO', NULL),
   ('qH','H',8,'Baca 6 buku nonfiksi',                    false,3, NULL,'TODO', NULL),
   ('qI','I',9,'Bikin portofolio proyek data di GitHub',  false,4, NULL,'TODO', NULL),
   ('qJ','J',10,'Kurangi jajan kopi harian',              false,3, NULL,'TODO', NULL);
  INSERT INTO _demo_ids (k) SELECT k FROM _demo_q;

  INSERT INTO quests (id, user_id, title, type, is_committed, year, quarter, created_at, updated_at,
                      priority_score, label, status, motivation, weekly_target_hours)
  SELECT i.id, v_uid, q.title, 'PERSONAL'::quest_type, q.committed, v_year, v_q,
         v_base + q.ord * interval '1 minute', v_base + q.ord * interval '1 minute',
         q.score, q.label, q.status::quest_status, q.motivation, q.hours
  FROM _demo_q q JOIN _demo_ids i ON i.k = q.k;

  -- pairwise: kunci "X-Y" (X<Y) = label pemenang. 45 pasangan. Skor = jumlah kemenangan (A9 B8 C7 G6 D4 I4 H3 J3 E1 F0); top 3 = A,B,C.
  INSERT INTO pairwise_results (user_id, year, quarter, results_json, is_finalized)
  VALUES (v_uid, v_year, v_q, jsonb_build_object(
    'A-B','A','A-C','A','A-D','A','A-E','A','A-F','A','A-G','A','A-H','A','A-I','A','A-J','A',
    'B-C','B','B-D','B','B-E','B','B-F','B','B-G','B','B-H','B','B-I','B','B-J','B',
    'C-D','C','C-E','C','C-F','C','C-G','C','C-H','C','C-I','C','C-J','C',
    'D-E','D','D-F','D','D-G','G','D-H','D','D-I','I','D-J','D',
    'E-F','E','E-G','G','E-H','H','E-I','I','E-J','J',
    'F-G','G','F-H','H','F-I','I','F-J','J',
    'G-H','G','G-I','G','G-J','G',
    'H-I','H','H-J','J',
    'I-J','I'), true);

  ------------------------------------------------------------------
  -- 2. MILESTONES (3 per HFG) - hanya untuk A, B, C
  ------------------------------------------------------------------
  CREATE TEMP TABLE _demo_m (k text, q text, ord int, title text, status text) ON COMMIT DROP;
  INSERT INTO _demo_m VALUES
   ('mA1','qA',1,'Kursus 1-2: Fondasi dan cara bertanya','IN_PROGRESS'),
   ('mA2','qA',2,'Kursus 3-5: Siapkan, bersihkan, dan analisis data','TODO'),
   ('mA3','qA',3,'Kursus 6-8: Visualisasi, R, dan studi kasus','TODO'),
   ('mB1','qB',1,'Rekening dana darurat siap dan terotomasi','IN_PROGRESS'),
   ('mB2','qB',2,'Terkumpul Rp5 juta (separuh jalan)','TODO'),
   ('mB3','qB',3,'Terkumpul Rp10 juta','TODO'),
   ('mC1','qC',1,'Lari 5K tanpa berhenti','IN_PROGRESS'),
   ('mC2','qC',2,'Lari 7K tanpa berhenti','TODO'),
   ('mC3','qC',3,'Lari 10K tanpa berhenti','TODO');
  INSERT INTO _demo_ids (k) SELECT k FROM _demo_m;

  INSERT INTO milestones (id, quest_id, title, display_order, status, created_at)
  SELECT i.id, iq.id, m.title, m.ord, m.status::milestone_status, v_base + interval '30 minutes'
  FROM _demo_m m JOIN _demo_ids i ON i.k = m.k JOIN _demo_ids iq ON iq.k = m.q;

  ------------------------------------------------------------------
  -- 3. TASKS
  --    MAIN_QUEST: langkah (punya milestone_id) + sub task (parent_task_id, tanpa milestone_id)
  --    DAILY_QUEST: rutinitas harian (tanpa milestone) - BUKAN bagian HFG manapun
  ------------------------------------------------------------------
  CREATE TEMP TABLE _demo_t (k text, ms text, parent text, typ text, title text, status text, ord float8) ON COMMIT DROP;
  INSERT INTO _demo_t VALUES
   -- HFG 1: sertifikasi
   ('tCourse1','mA1',NULL,'MAIN_QUEST','Kursus 1: Dasar-dasar analisis data','IN_PROGRESS',1),
   ('tModul1',NULL,'tCourse1','MAIN_QUEST','Modul 1: Pengenalan analitik data','DONE',1),
   ('tModul2',NULL,'tCourse1','MAIN_QUEST','Modul 2: Siklus hidup data dan peran analis','DONE',2),
   ('tModul3',NULL,'tCourse1','MAIN_QUEST','Modul 3: Spreadsheet dasar, rumus, dan filter','DONE',3),
   ('tModul4',NULL,'tCourse1','MAIN_QUEST','Modul 4: Kuis akhir dan refleksi Kursus 1','IN_PROGRESS',4),
   ('tCourse2','mA1',NULL,'MAIN_QUEST','Kursus 2: Merumuskan pertanyaan bisnis','TODO',2),
   ('tA2a','mA2',NULL,'MAIN_QUEST','Kursus 3: Menyiapkan data','TODO',1),
   ('tA2b','mA2',NULL,'MAIN_QUEST','Kursus 4: Membersihkan data','TODO',2),
   ('tA2c','mA2',NULL,'MAIN_QUEST','Kursus 5: Menganalisis data','TODO',3),
   ('tA3a','mA3',NULL,'MAIN_QUEST','Kursus 6: Visualisasi data','TODO',1),
   ('tA3b','mA3',NULL,'MAIN_QUEST','Kursus 7: Analisis data dengan R','TODO',2),
   ('tA3c','mA3',NULL,'MAIN_QUEST','Kursus 8: Studi kasus untuk portofolio','TODO',3),
   -- HFG 2: dana darurat
   ('tBandingkan','mB1',NULL,'MAIN_QUEST','Bandingkan 3 produk dana darurat (reksa dana pasar uang, tabungan, deposito)','DONE',1),
   ('tBukaRek','mB1',NULL,'MAIN_QUEST','Buka rekening khusus dana darurat','DONE',2),
   ('tAutodebet','mB1',NULL,'MAIN_QUEST','Atur autodebet Rp2.500.000 tiap gajian','IN_PROGRESS',3),
   ('tB2a','mB2',NULL,'MAIN_QUEST','Sisihkan Rp2.500.000 dari gaji Oktober','TODO',1),
   ('tB2b','mB2',NULL,'MAIN_QUEST','Sisihkan Rp2.500.000 dari gaji November','TODO',2),
   ('tB2c','mB2',NULL,'MAIN_QUEST','Cek saldo: Rp5 juta tercapai','TODO',3),
   ('tB3a','mB3',NULL,'MAIN_QUEST','Sisihkan Rp2.500.000 dari gaji Desember','TODO',1),
   ('tB3b','mB3',NULL,'MAIN_QUEST','Jual barang tak terpakai, target Rp500.000','TODO',2),
   ('tB3c','mB3',NULL,'MAIN_QUEST','Masukkan Rp2.000.000 dari THR atau bonus akhir tahun','TODO',3),
   -- HFG 3: lari 10K
   ('tLari','mC1',NULL,'MAIN_QUEST','Lari-jalan 3 kali seminggu selama 2 minggu','IN_PROGRESS',1),
   ('tSepatu','mC1',NULL,'MAIN_QUEST','Beli sepatu lari yang pas','TODO',2),
   ('tTes5k','mC1',NULL,'MAIN_QUEST','Tes lari 5K santai tanpa jalan','TODO',3),
   ('tC2a','mC2',NULL,'MAIN_QUEST','Lari 5K tiga kali seminggu','TODO',1),
   ('tC2b','mC2',NULL,'MAIN_QUEST','Tambah jarak 500 m tiap minggu','TODO',2),
   ('tC2c','mC2',NULL,'MAIN_QUEST','Tes lari 7K','TODO',3),
   ('tC3a','mC3',NULL,'MAIN_QUEST','Daftar fun run 10K akhir Desember','TODO',1),
   ('tC3b','mC3',NULL,'MAIN_QUEST','Latihan long run 8-9K','TODO',2),
   ('tC3c','mC3',NULL,'MAIN_QUEST','Lari 10K tanpa berhenti di hari lomba','TODO',3),
   -- Daily quest (rutin kantor), satu task per hari
   ('tRev0',NULL,NULL,'DAILY_QUEST','Review inbox dan susun prioritas kerja','DONE',NULL),
   ('tRev1',NULL,NULL,'DAILY_QUEST','Review inbox dan susun prioritas kerja','DONE',NULL),
   ('tRev2',NULL,NULL,'DAILY_QUEST','Review inbox dan susun prioritas kerja','DONE',NULL),
   ('tRev3',NULL,NULL,'DAILY_QUEST','Review inbox dan susun prioritas kerja','DONE',NULL),
   ('tCatat',NULL,NULL,'DAILY_QUEST','Catat pengeluaran hari ini','TODO',NULL);
  INSERT INTO _demo_ids (k) SELECT k FROM _demo_t;

  -- induk dulu, baru sub task (FK parent_task_id)
  INSERT INTO tasks (id, user_id, milestone_id, parent_task_id, title, type, status, display_order, focus_duration, created_at, updated_at)
  SELECT i.id, v_uid, im.id, NULL, t.title, t.typ::task_type, t.status::task_status, t.ord, 25,
         v_base + interval '40 minutes', v_base + interval '40 minutes'
  FROM _demo_t t JOIN _demo_ids i ON i.k = t.k LEFT JOIN _demo_ids im ON im.k = t.ms
  WHERE t.parent IS NULL;

  INSERT INTO tasks (id, user_id, milestone_id, parent_task_id, title, type, status, display_order, focus_duration, created_at, updated_at)
  SELECT i.id, v_uid, NULL, ip.id, t.title, t.typ::task_type, t.status::task_status, t.ord, 25,
         v_base + interval '41 minutes', v_base + interval '41 minutes'
  FROM _demo_t t JOIN _demo_ids i ON i.k = t.k JOIN _demo_ids ip ON ip.k = t.parent
  WHERE t.parent IS NOT NULL;

  ------------------------------------------------------------------
  -- 4. WEEKLY SYNC: weekly_goals (slot 1-3 = urutan HFG), items, To Don't list
  --    week_number = minggu DALAM kuartal (1..13), bukan minggu tahun.
  ------------------------------------------------------------------
  INSERT INTO weekly_goals (user_id, year, quarter, week_number, goal_slot)
  VALUES (v_uid, v_year, v_q, v_wiq, 1), (v_uid, v_year, v_q, v_wiq, 2), (v_uid, v_year, v_q, v_wiq, 3);

  INSERT INTO weekly_goal_items (weekly_goal_id, item_id, status, week_date)
  SELECT wg.id, i.id, t.status::task_status, v_monday
  FROM (VALUES
     (1,'tModul1'),(1,'tModul2'),(1,'tModul3'),(1,'tModul4'),(1,'tCourse2'),
     (2,'tBandingkan'),(2,'tBukaRek'),(2,'tAutodebet'),
     (3,'tLari'),(3,'tSepatu'),(3,'tTes5k')
   ) AS x(slot, k)
  JOIN weekly_goals wg ON wg.user_id = v_uid AND wg.year = v_year AND wg.quarter = v_q
                      AND wg.week_number = v_wiq AND wg.goal_slot = x.slot
  JOIN _demo_ids i ON i.k = x.k
  JOIN _demo_t t ON t.k = x.k;

  INSERT INTO weekly_rules (user_id, year, quarter, week_number, rule_text, display_order)
  VALUES
   (v_uid, v_year, v_q, v_wiq, 'Tidak scroll media sosial sebelum sesi belajar pagi selesai', 1),
   (v_uid, v_year, v_q, v_wiq, 'Tidak belanja online impulsif, tunda 24 jam dulu', 2),
   (v_uid, v_year, v_q, v_wiq, 'Tidak membuka laptop kantor setelah jam 19.00', 3);

  ------------------------------------------------------------------
  -- 5. DAILY PLAN Senin-Kamis + task_schedules (jadwal) + activity_logs (aktual)
  --    Jam ditulis WIB, disimpan UTC lewat AT TIME ZONE 'Asia/Jakarta'.
  ------------------------------------------------------------------
  INSERT INTO daily_plans (user_id, plan_date)
  SELECT v_uid, v_monday + d FROM generate_series(0, 3) d;

  -- (hari ke-, task, item_type, status saat itu, target sesi, urutan)
  CREATE TEMP TABLE _demo_pi (d int, tk text, itype text, status text, target int, ord float8) ON COMMIT DROP;
  INSERT INTO _demo_pi VALUES
   (0,'tModul1','MAIN_QUEST','DONE',2,1), (0,'tModul2','MAIN_QUEST','IN_PROGRESS',2,2),
   (0,'tBandingkan','MAIN_QUEST','IN_PROGRESS',1,3), (0,'tLari','MAIN_QUEST','IN_PROGRESS',1,4),
   (0,'tRev0','DAILY_QUEST','DONE',1,5),
   (1,'tModul2','MAIN_QUEST','DONE',1,1), (1,'tModul3','MAIN_QUEST','IN_PROGRESS',2,2),
   (1,'tBandingkan','MAIN_QUEST','DONE',1,3), (1,'tRev1','DAILY_QUEST','DONE',1,4),
   (2,'tModul3','MAIN_QUEST','DONE',3,1), (2,'tBukaRek','MAIN_QUEST','DONE',1,2),
   (2,'tLari','MAIN_QUEST','IN_PROGRESS',1,3), (2,'tRev2','DAILY_QUEST','DONE',1,4),
   (3,'tModul4','MAIN_QUEST','IN_PROGRESS',3,1), (3,'tAutodebet','MAIN_QUEST','IN_PROGRESS',1,2),
   (3,'tLari','MAIN_QUEST','TODO',1,3), (3,'tCourse2','MAIN_QUEST','TODO',2,4),
   (3,'tRev3','DAILY_QUEST','DONE',1,5), (3,'tCatat','DAILY_QUEST','TODO',1,6);

  INSERT INTO daily_plan_items (daily_plan_id, item_id, item_type, status, daily_session_target, focus_duration, display_order)
  SELECT dp.id, i.id, p.itype, p.status::task_status, p.target, 25, p.ord
  FROM _demo_pi p
  JOIN daily_plans dp ON dp.user_id = v_uid AND dp.plan_date = v_monday + p.d
  JOIN _demo_ids i ON i.k = p.tk;

  -- jadwal di kalender: (hari ke-, task, jam mulai WIB, total menit, jumlah sesi)
  CREATE TEMP TABLE _demo_sch (d int, tk text, hhmm text, mins int, sess int) ON COMMIT DROP;
  INSERT INTO _demo_sch VALUES
   (0,'tModul1','05:30',50,2), (0,'tRev0','08:30',25,1), (0,'tBandingkan','12:15',25,1),
   (0,'tLari','18:00',25,1),   (0,'tModul2','19:30',50,2),
   (1,'tModul2','05:30',25,1), (1,'tRev1','08:30',25,1), (1,'tBandingkan','12:15',25,1),
   (1,'tModul3','19:30',50,2),
   (2,'tModul3','05:30',50,2), (2,'tRev2','08:30',25,1), (2,'tBukaRek','12:15',25,1),
   (2,'tLari','18:00',25,1),   (2,'tModul3','19:30',25,1),
   (3,'tModul4','05:30',50,2), (3,'tRev3','08:30',25,1), (3,'tAutodebet','12:20',25,1),
   (3,'tLari','18:00',25,1),   (3,'tCourse2','19:30',50,2);   -- Kamis sore = terjadwal, belum dikerjakan

  INSERT INTO task_schedules (daily_plan_item_id, scheduled_start_time, scheduled_end_time, duration_minutes, session_count)
  SELECT dpi.id,
         ((v_monday + s.d) + s.hhmm::time)::timestamp AT TIME ZONE 'Asia/Jakarta',
         ((v_monday + s.d) + s.hhmm::time)::timestamp AT TIME ZONE 'Asia/Jakarta' + make_interval(mins => s.mins),
         s.mins, s.sess
  FROM _demo_sch s
  JOIN daily_plans dp ON dp.user_id = v_uid AND dp.plan_date = v_monday + s.d
  JOIN _demo_ids i ON i.k = s.tk
  JOIN daily_plan_items dpi ON dpi.daily_plan_id = dp.id AND dpi.item_id = i.id;

  -- aktual: 22 sesi FOCUS x 25 menit. energy: 1=+, 0==, -1=-, NULL=tidak dijawab
  --   HFG1 12 sesi = 300 mnt | HFG2 4 sesi = 100 mnt | HFG3 2 sesi = 50 mnt | daily quest 4 sesi
  --   => Kamis (dsm=3): HFG1 ON_TRACK (>=173), HFG2 ON_TRACK (>=58), HFG3 AT_RISK (<87). Tetap sama s.d. Minggu.
  CREATE TEMP TABLE _demo_act (d int, hhmm text, tk text, energy smallint, what_done text) ON COMMIT DROP;
  INSERT INTO _demo_act VALUES
   (0,'05:30','tModul1', 1,'Selesai video dan catatan modul 1'),
   (0,'05:55','tModul1', 1,'Kerjakan kuis modul 1'),
   (0,'08:30','tRev0',   0,NULL),
   (0,'12:15','tBandingkan',-1,'Baca syarat tiga produk, banyak istilah baru'),
   (0,'18:00','tLari',   1,'Lari-jalan 2 km, napas masih enak'),
   (0,'19:30','tModul2', 0,NULL),
   (0,'19:55','tModul2', 1,'Rangkum siklus hidup data'),
   (1,'05:30','tModul2', 0,NULL),
   (1,'08:30','tRev1',   0,NULL),
   (1,'12:15','tBandingkan',-1,'Bikin tabel perbandingan biaya dan imbal hasil'),
   (1,'19:30','tModul3', 1,'Latihan rumus SUM dan AVERAGE'),
   (1,'19:55','tModul3',-1,'Filter dan sort bikin pusing'),
   (2,'05:30','tModul3', 1,'Latihan filter data contoh'),
   (2,'05:55','tModul3', 0,NULL),
   (2,'08:30','tRev2',   NULL,NULL),
   (2,'12:15','tBukaRek',0,'Buka rekening lewat aplikasi, verifikasi wajah'),
   (2,'18:00','tLari',   1,'Lari-jalan 2,5 km'),
   (2,'19:30','tModul3', 1,'Selesai kuis modul 3'),
   (3,'05:30','tModul4', 1,'Rangkum Kursus 1 dalam satu halaman'),
   (3,'05:55','tModul4', 0,NULL),
   (3,'08:30','tRev3',   0,NULL),
   (3,'12:20','tAutodebet',1,'Autodebet Rp2.500.000 terpasang tiap tanggal gajian');

  INSERT INTO activity_logs (user_id, task_id, type, start_time, end_time, duration_minutes, local_date, what_done, energy, created_at)
  SELECT v_uid, i.id, 'FOCUS'::activity_log_type,
         ((v_monday + a.d) + a.hhmm::time)::timestamp AT TIME ZONE 'Asia/Jakarta',
         ((v_monday + a.d) + a.hhmm::time)::timestamp AT TIME ZONE 'Asia/Jakarta' + interval '25 minutes',
         25, v_monday + a.d, a.what_done, a.energy,
         ((v_monday + a.d) + a.hhmm::time)::timestamp AT TIME ZONE 'Asia/Jakarta' + interval '25 minutes 5 seconds'
  FROM _demo_act a JOIN _demo_ids i ON i.k = a.tk;

  ------------------------------------------------------------------
  -- 6. BEST WEEK: 1 template aktif
  --    days = kode 'mon'..'sun'; category: high_lifetime_value | high_rupiah_value |
  --    low_rupiah_value | zero_rupiah_value | transition; color dibiarkan NULL (pakai warna kategori).
  ------------------------------------------------------------------
  INSERT INTO _demo_ids (k) VALUES ('bwt');
  INSERT INTO best_week_templates (id, user_id, name, is_active)
  SELECT id, v_uid, 'Best Week Q4 2026', true FROM _demo_ids WHERE k = 'bwt';

  INSERT INTO best_week_blocks (template_id, days, start_time, end_time, category, title)
  SELECT (SELECT id FROM _demo_ids WHERE k = 'bwt'), b.days, b.s::time, b.e::time, b.cat, b.title
  FROM (VALUES
   (ARRAY['mon','tue','wed','thu','fri','sat','sun'],'00:00','05:00','transition','Tidur'),
   (ARRAY['tue','thu','sat'],                        '05:00','05:30','high_lifetime_value','Olahraga pagi'),
   (ARRAY['mon','tue','wed','thu','fri'],            '05:30','06:30','high_lifetime_value','Belajar sertifikasi data analyst'),
   (ARRAY['mon','tue','wed','thu','fri'],            '06:30','08:30','transition','Siap-siap dan perjalanan ke kantor'),
   (ARRAY['mon','tue','wed','thu','fri'],            '08:30','12:00','high_rupiah_value','Kerja fokus di kantor'),
   (ARRAY['mon','tue','wed','thu','fri'],            '12:00','13:00','transition','Makan siang dan istirahat'),
   (ARRAY['mon','tue','wed','thu','fri'],            '13:00','17:00','high_rupiah_value','Rapat, laporan, dan kerja kantor'),
   (ARRAY['mon','tue','wed','thu','fri'],            '17:00','18:00','transition','Perjalanan pulang'),
   (ARRAY['mon','wed','fri'],                        '18:00','19:00','high_lifetime_value','Lari latihan 10K'),
   (ARRAY['mon','tue','wed','thu','fri'],            '19:00','19:30','transition','Makan malam'),
   (ARRAY['mon','tue','wed','thu','fri'],            '19:30','20:30','high_lifetime_value','Belajar sertifikasi dan urusan dana darurat'),
   (ARRAY['mon','tue','wed','thu','fri'],            '20:30','22:00','high_lifetime_value','Waktu bersama keluarga'),
   (ARRAY['mon','tue','wed','thu','fri'],            '22:00','23:00','transition','Wind-down, tidur sebelum 23.00'),
   (ARRAY['sat','sun'],                              '08:00','10:00','high_lifetime_value','Lari jarak jauh atau jalan santai'),
   (ARRAY['sat','sun'],                              '10:00','12:00','low_rupiah_value','Urusan rumah dan administrasi keuangan'),
   (ARRAY['sat','sun'],                              '14:00','16:00','high_lifetime_value','Waktu berkualitas dengan keluarga'),
   (ARRAY['sat','sun'],                              '16:00','17:00','zero_rupiah_value','Rebahan dan main HP')
  ) AS b(days, s, e, cat, title);

  ------------------------------------------------------------------
  -- 7. VISI (unik per user_id + life_area). 7 area dari planning/vision/constants.ts
  ------------------------------------------------------------------
  INSERT INTO visions (user_id, life_area, vision_3_5_year, vision_10_year) VALUES
   (v_uid,'Karier/Bisnis','Menjadi data analyst di perusahaan dengan budaya kerja yang sehat, punya portofolio nyata, dan gaji naik sekitar 40 persen dari sekarang.','Memimpin tim analitik kecil dan jadi mentor bagi analis muda.'),
   (v_uid,'Kesehatan & Kebugaran','Berat badan ideal, lari rutin sampai sanggup 10K lalu half marathon, dan tidur cukup hampir tiap malam.','Tubuh bugar dan bebas penyakit gaya hidup di usia 40-an.'),
   (v_uid,'Relasi','Makan malam bersama keluarga minimal empat kali seminggu, dengan waktu berkualitas bersama pasangan dan orang tua.','Keluarga yang hangat dan dekat, anak-anak tumbuh percaya diri.'),
   (v_uid,'Kontribusi','Mengajar dasar spreadsheet gratis untuk komunitas di sekitar rumah.','Membuka program beasiswa kecil untuk anak berprestasi di kampung halaman.'),
   (v_uid,'Petualangan','Liburan keluarga ke satu kota baru setiap tahun.','Menjelajahi 15 tempat baru di dalam dan luar negeri bersama keluarga.'),
   (v_uid,'Keuangan','Dana darurat enam bulan pengeluaran, tanpa utang konsumtif, dan investasi rutin tiap bulan.','Aset investasi setara sepuluh kali pengeluaran tahunan.'),
   (v_uid,'Spiritual','Punya waktu hening 10 menit tiap pagi dan rutin berbagi ke sesama.','Hidup lebih tenang, bersyukur, dan tidak mudah membandingkan diri.');

  ------------------------------------------------------------------
  -- 8. HABIT (4) + completions 14 Sep s.d. hari ini
  --    target_days: 0=Minggu..6=Sabtu (getUTCDay). NULL = tiap hari.
  ------------------------------------------------------------------
  CREATE TEMP TABLE _demo_h (k text, name text, cat text, freq text, goal int, days smallint[], showd boolean,
                             deadline time, done_at time, ord int) ON COMMIT DROP;
  INSERT INTO _demo_h VALUES
   ('hOlah','Olahraga pagi','kesehatan','flexible',12, ARRAY[2,4,6]::smallint[], true,  NULL,        '05:10',1),
   ('hBaca','Baca 20 menit','karir',    'daily',   26, NULL,                      true,  NULL,        '21:15',2),
   ('hTidur','Tidur sebelum 23.00','kesehatan','daily',26, NULL,                  false, '23:00',     '22:40',3),
   ('hCatat','Catat pengeluaran harian','keuangan','daily',28, NULL,              false, NULL,        '21:40',4);
  INSERT INTO _demo_ids (k) SELECT k FROM _demo_h;

  INSERT INTO habits (id, user_id, name, category, frequency, monthly_goal, tracking_type, is_archived, sort_order,
                      daily_target, target_days, show_in_daily_sync, deadline_time, created_at)
  SELECT i.id, v_uid, h.name, h.cat::habit_category, h.freq::habit_frequency, h.goal, 'positive'::habit_tracking_type,
         false, h.ord, 1, h.days, h.showd, h.deadline, v_base - interval '30 days'
  FROM _demo_h h JOIN _demo_ids i ON i.k = h.k;

  -- Pola deterministik (tanpa random): bolong tiap hari ke-4/5 supaya grafik terlihat manusiawi.
  -- Hari ini (Kamis) sengaja: Olahraga sudah, yang malam belum.
  INSERT INTO habit_completions (habit_id, user_id, date, done_at, created_at)
  SELECT i.id, v_uid, dd::date, h.done_at,
         (dd::date + h.done_at)::timestamp AT TIME ZONE 'Asia/Jakarta'
  FROM _demo_h h
  JOIN _demo_ids i ON i.k = h.k
  CROSS JOIN generate_series((v_monday - 14)::timestamp, (v_monday + 3)::timestamp, interval '1 day') dd
  WHERE (h.days IS NULL OR extract(dow FROM dd)::smallint = ANY (h.days))
    AND CASE h.k
          WHEN 'hOlah'  THEN dd::date <> v_monday - 2                                     -- lewatkan satu Sabtu
          WHEN 'hBaca'  THEN ((dd::date - (v_monday - 14)) % 5 <> 3) AND dd::date < v_monday + 3
          WHEN 'hTidur' THEN ((dd::date - (v_monday - 14)) % 4 <> 2) AND dd::date < v_monday + 3
          WHEN 'hCatat' THEN ((dd::date - (v_monday - 14)) % 6 <> 4) AND dd::date < v_monday + 3
        END;

  ------------------------------------------------------------------
  -- 9. BRAIN DUMP hari ini (isi HTML, format yang dipakai editor)
  ------------------------------------------------------------------
  INSERT INTO brain_dumps (user_id, content, date)
  VALUES (v_uid, '<p>Tanya HRD soal jadwal cuti Desember</p><p>- Cek harga tiket kereta ke Yogyakarta</p><p>- Kirim laporan bulanan sebelum Jumat</p><p>- Cari playlist lari 160 bpm</p>', v_monday + 3);

  ------------------------------------------------------------------
  -- 10. 12 WEEK SYNC - kuartal LALU (Q3), selesai. quest_id NULL (kolom boleh kosong).
  --     Dibuka dengan /planning/12-week-sync?q=2026-Q3. Kuartal berjalan (Q4) TIDAK di-seed:
  --     halaman itu membuat review kosong sendiri saat pertama dibuka.
  ------------------------------------------------------------------
  INSERT INTO quarterly_reviews (user_id, year, quarter, start_date, end_date, challenges_faced, advice_for_next, reward,
                                 goals_needing_commitment, goals_needing_revision, is_completed, completed_at)
  VALUES (v_uid, v_year, v_q - 1, (v_monday - 91), (v_monday - 1),
    'Musim hujan bikin jadwal jalan kaki pagi sering batal. Dua minggu padat di kantor membuat catatan pengeluaran bolong dan fokus belajar Excel sempat terputus.',
    'Siapkan rencana cadangan di dalam ruangan untuk hari hujan. Kerjakan hal terpenting paling pagi sebelum kerjaan kantor mengambil energi.',
    'Makan malam spesial bersama keluarga di restoran favorit, Sabtu akhir pekan ini.',
    'Dana darurat tetap jadi prioritas: naikkan setoran bulanan dan otomatiskan.',
    'Target olahraga naik dari jalan kaki 5K menjadi lari 10K dengan latihan bertahap.',
    true, ((v_monday - 2)::timestamp + time '13:00') AT TIME ZONE 'Asia/Jakarta')
  RETURNING id INTO v_rev;

  INSERT INTO goal_reviews (quarterly_review_id, quest_id, goal_name, progress_score, achievement_notes, sort_order) VALUES
   (v_rev, NULL, 'Rapikan keuangan: catat pengeluaran 90 hari', 8, 'Tercatat 82 dari 90 hari. Bolong saat dinas luar kota.', 0),
   (v_rev, NULL, 'Naik level Excel: selesaikan kursus menengah', 9, 'Selesai lebih cepat dari rencana dan sudah dipakai untuk laporan di kantor.', 1),
   (v_rev, NULL, 'Mulai rutin bergerak: jalan kaki 5K',          6, 'Konsisten delapan minggu pertama, lalu kendor saat musim hujan.', 2);

  INSERT INTO accomplishments (quarterly_review_id, description, sort_order) VALUES
   (v_rev, 'Mencatat pengeluaran harian 82 dari 90 hari', 0),
   (v_rev, 'Melunasi cicilan kartu kredit', 1),
   (v_rev, 'Lulus kursus Excel menengah', 2),
   (v_rev, 'Jalan kaki 5K dua kali seminggu selama delapan minggu', 3),
   (v_rev, 'Memulai dana darurat pertama sebesar Rp2 juta', 4),
   (v_rev, 'Tidur sebelum jam 23.00 di sekitar 70 persen malam', 5);

  INSERT INTO sync_actions (quarterly_review_id, action_text, is_completed, completed_at, sort_order)
  SELECT v_rev, a.t, a.done, CASE WHEN a.done THEN ((v_monday - 2)::timestamp + time '12:00') AT TIME ZONE 'Asia/Jakarta' END, a.o
  FROM (VALUES
    ('Review and rate each High Focus Goal', true, 0),
    ('List 5-10 accomplishments', true, 1),
    ('Answer reflection questions honestly', true, 2),
    ('Set reward and schedule it', true, 3),
    ('Archive completed quarter', true, 4),
    ('Set 3 new High Focus Goals for next quarter', true, 5),
    ('Update Best Week template based on learnings', true, 6),
    ('Review Habit Tracker patterns', false, 7)
  ) AS a(t, done, o);

  ------------------------------------------------------------------
  -- Ringkasan cepat (muncul sebagai NOTICE)
  ------------------------------------------------------------------
  RAISE NOTICE 'Seed selesai. Jalankan blok VERIFIKASI di bawah untuk memastikan ON_TRACK / AT_RISK.';
END
$demo$;


-- =====================================================================
-- VERIFIKASI (SELECT saja). Ganti UUID dan tanggal Kamis pemotretan.
-- =====================================================================
-- Harapan: HFG1 ON_TRACK (300 mnt), HFG2 ON_TRACK (100), HFG3 AT_RISK (50); week_in_quarter = 1
-- SELECT urut, title, weekly_target_hours, actual_minutes, expected_minutes, status, week_in_quarter
--   FROM public.hfg_weekly_status('<UUID_DEMO>'::uuid, DATE '2026-10-01');
--
-- Harapan kartu energi: plus 10, neutral 8, minus 3 (total 21), tugas terkuras = "Bandingkan 3 produk ..."
-- SELECT energy, count(*) FROM activity_logs
--   WHERE user_id='<UUID_DEMO>' AND local_date BETWEEN DATE '2026-09-28' AND DATE '2026-10-04' GROUP BY 1 ORDER BY 1;
--
-- Harapan weekly sync: 3 goal, 11 item, 3 aturan
-- SELECT public.get_weekly_sync('<UUID_DEMO>'::uuid, 2026, 4, 1, DATE '2026-09-28', DATE '2026-10-04');
--
-- Harapan: 22 activity_logs, 4 daily_plans, 19 daily_plan_items, 19 task_schedules, 8 quests, 45 pairwise
-- SELECT (SELECT count(*) FROM activity_logs WHERE user_id='<UUID_DEMO>') logs,
--        (SELECT count(*) FROM daily_plans WHERE user_id='<UUID_DEMO>') plans,
--        (SELECT count(*) FROM quests WHERE user_id='<UUID_DEMO>') quests,
--        (SELECT count(*) FROM jsonb_object_keys((SELECT results_json FROM pairwise_results WHERE user_id='<UUID_DEMO>'))) pairs;


-- =====================================================================
-- CLEANUP (dikomentari). Menghapus SEMUA data demo, user auth tetap ada.
-- Hapus tanda komentar, ganti UUID, jalankan. Urutan aman terhadap FK:
--   timer_events/timer_sessions (FK tanpa cascade, terisi kalau timer dipakai saat pemotretan)
--   -> baris anak cascade dari quests/tasks/daily_plans/weekly_goals/habits/quarterly_reviews/best_week_templates.
-- =====================================================================
-- DO $cleanup$
-- DECLARE v_uid uuid := '00000000-0000-0000-0000-000000000000'::uuid;  -- GANTI
-- BEGIN
--   IF v_uid IN ('00000000-0000-0000-0000-000000000000'::uuid, '59076bab-b21c-49ce-a7d1-7b9d69a6001c'::uuid) THEN
--     RAISE EXCEPTION 'v_uid belum diganti atau itu user Abu';
--   END IF;
--   DELETE FROM timer_events WHERE session_id IN (SELECT id FROM timer_sessions WHERE user_id = v_uid);
--   DELETE FROM timer_sessions WHERE user_id = v_uid;
--   DELETE FROM activity_logs        WHERE user_id = v_uid;
--   DELETE FROM daily_plans          WHERE user_id = v_uid;  -- cascade: daily_plan_items -> task_schedules
--   DELETE FROM weekly_goals         WHERE user_id = v_uid;  -- cascade: weekly_goal_items
--   DELETE FROM weekly_rules         WHERE user_id = v_uid;
--   DELETE FROM quests               WHERE user_id = v_uid;  -- cascade: milestones -> tasks(+sub task)
--   DELETE FROM tasks                WHERE user_id = v_uid;  -- sisa (daily quest tanpa milestone)
--   DELETE FROM pairwise_results     WHERE user_id = v_uid;
--   DELETE FROM visions              WHERE user_id = v_uid;
--   DELETE FROM best_week_templates  WHERE user_id = v_uid;  -- cascade: best_week_blocks
--   DELETE FROM habits               WHERE user_id = v_uid;  -- cascade: habit_completions
--   DELETE FROM brain_dumps          WHERE user_id = v_uid;
--   DELETE FROM quarterly_reviews    WHERE user_id = v_uid;  -- cascade: goal_reviews, accomplishments, sync_actions
--   DELETE FROM user_profiles        WHERE user_id = v_uid;
--   DELETE FROM performance_summaries WHERE user_id = v_uid;
--   DELETE FROM notification_queue   WHERE user_id = v_uid;
--   DELETE FROM notification_history WHERE user_id = v_uid;
-- END
-- $cleanup$;
