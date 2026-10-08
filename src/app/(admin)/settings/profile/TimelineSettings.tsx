'use client'

import { useEffect, useState } from 'react'
import { Copy, EyeOff } from 'lucide-react'
import useSWR from 'swr'
import { toast } from 'sonner'
import Button from '@/components/ui/button/Button'
import Input from '@/components/form/input/InputField'
import Label from '@/components/form/Label'
import { swrMutate } from '@/lib/swr'
import { getLocalDateString } from '@/lib/dateUtils'
import { addIcalCalendar, getTimelineData, removeIcalCalendar, saveTimelineHours } from '@/app/(admin)/execution/daily-sync/ActivityLog/actions/calendar/actions'

const HOURS = Array.from({ length: 24 }, (_, h) => h)
const pad = (h: number) => `${String(h).padStart(2, '0')}:00`
const isTimelineKey = (key: unknown) => Array.isArray(key) && key[0] === 'timeline-data-v2'
const selectClass = 'h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white'

/** Setelan Timeline Harian (app-z0an): rentang jam + link iCal Google Calendar. */
export function TimelineSettings() {
  const today = getLocalDateString(new Date())
  const { data, mutate } = useSWR(['timeline-data-v2', today], () => getTimelineData(today), { revalidateOnFocus: false })
  const [start, setStart] = useState(4)
  const [end, setEnd] = useState(22)
  const [url, setUrl] = useState('')
  const [saving, setSaving] = useState<'hours' | 'ical' | null>(null)

  useEffect(() => {
    if (!data) return
    setStart(data.startHour)
    setEnd(data.endHour)
  }, [data])

  const refresh = () => Promise.all([mutate(), swrMutate(isTimelineKey)])

  const saveHours = async () => {
    setSaving('hours')
    try {
      await saveTimelineHours(start, end)
      await refresh()
      toast.success('Rentang jam timeline disimpan')
    } catch (e) {
      toast.error((e as Error).message || 'Gagal menyimpan rentang jam')
    } finally {
      setSaving(null)
    }
  }

  const addCalendar = async () => {
    setSaving('ical')
    const { error, name } = await addIcalCalendar(url)
    setSaving(null)
    if (error) return toast.error(error)
    setUrl('')
    await refresh()
    toast.success(`Kalender "${name}" tersambung`)
  }

  const removeCalendar = async (index: number, name: string) => {
    setSaving('ical')
    try {
      await removeIcalCalendar(index)
      await refresh()
      toast.success(`Kalender "${name}" diputus`)
    } catch {
      toast.error('Gagal memutus kalender')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div id="timeline" className="max-w-2xl scroll-mt-24 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Timeline Harian</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Rentang jam di kartu timeline Daily Sync dan acara dari Google Calendar</p>
      </div>

      <div className="space-y-4 px-6 py-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="timeline-start">Jam mulai</Label>
            <select id="timeline-start" value={start} onChange={(e) => setStart(Number(e.target.value))} className={selectClass}>
              {HOURS.map((h) => <option key={h} value={h} disabled={h > end}>{pad(h)}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="timeline-end">Jam selesai</Label>
            <select id="timeline-end" value={end} onChange={(e) => setEnd(Number(e.target.value))} className={selectClass}>
              {HOURS.map((h) => <option key={h} value={h} disabled={h < start}>{pad(h)}</option>)}
            </select>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">Jam di luar rentang tetap muncul kalau ada isinya (catatan, siklus, acara).</p>
        <Button
          variant="outline"
          onClick={saveHours}
          loading={saving === 'hours'}
          loadingText="Menyimpan..."
          disabled={!data || (start === data.startHour && end === data.endHour)}
        >
          Simpan rentang jam
        </Button>
      </div>

      <div className="space-y-3 border-t border-gray-200 px-6 py-6 dark:border-gray-800">
        <h3 className="font-semibold text-gray-900 dark:text-white">Google Calendar</h3>
        {data && data.calendars.length > 0 && (
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 dark:divide-gray-800 dark:border-gray-800" data-testid="ical-calendars">
            {data.calendars.map((name, i) => (
              <li key={`${i}-${name}`} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span className="truncate text-gray-800 dark:text-gray-100">{name}</span>
                <button
                  type="button"
                  onClick={() => removeCalendar(i, name)}
                  disabled={saving === 'ical'}
                  className="flex-shrink-0 text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                >
                  Putuskan
                </button>
              </li>
            ))}
          </ul>
        )}
        <ol className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
          <li>
            1. {data?.googleSettingsUrl ? (
              <a href={data.googleSettingsUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-600 hover:underline dark:text-brand-300">
                Buka setelan Google Calendar ↗
              </a>
            ) : 'Buka Google Calendar di laptop → Settings → pilih kalendermu di kiri'}
          </li>
          <li>2. Turun ke bagian paling bawah, <b>Integrate calendar</b>.</li>
          <li>
            3. Di kotak <b>Secret address in iCal format</b> (bukan &quot;Public address&quot;), klik ikon mata{' '}
            <EyeOff className="inline h-4 w-4 align-text-bottom" aria-label="ikon mata" /> supaya link-nya tampil, lalu klik ikon salin{' '}
            <Copy className="inline h-4 w-4 align-text-bottom" aria-label="ikon salin" /> di sebelah kanannya.
          </li>
          <li>4. Tempel di kolom bawah ini lalu klik <b>Tambah kalender</b>.</li>
          <li className="text-gray-500 dark:text-gray-400">
            Mau menambah kalender lain (mis. Family)? Di halaman setelan Google itu, klik nama kalendernya di menu kiri
            (bagian <b>Settings for my calendars</b>), lalu ulangi langkah 2–4.
          </li>
        </ol>
        <div>
          <Label htmlFor="ical-url">Secret address in iCal format</Label>
          <Input id="ical-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://calendar.google.com/calendar/ical/…/private-…/basic.ics" />
        </div>
        <Button onClick={addCalendar} disabled={!url.trim()} loading={saving === 'ical'} loadingText="Memeriksa...">
          Tambah kalender
        </Button>
        <p className="text-xs text-gray-500 dark:text-gray-400">Link ini rahasia: hanya disimpan di server BePlan. Acara diperbarui otomatis tiap 15 menit; kalau mau langsung, klik <b>Perbarui</b> di kartu Timeline Harian.</p>
      </div>
    </div>
  )
}
