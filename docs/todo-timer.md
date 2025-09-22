# Timer Persistence Strategy - Better Planner

## 📋 **Overview**

Dokumen ini menjelaskan strategi lengkap untuk mengimplementasikan timer persistence dan multi-device sync pada aplikasi Better Planner. Strategi ini dirancang khusus berdasarkan analisis database Supabase dan arsitektur aplikasi yang sudah ada.

## 🎯 **Goals**

- [ ] **Mencegah Data Loss**: Timer tidak hilang saat close browser
- [ ] **Multi-Device Sync**: Timer sync real-time antar device
- [ ] **Recovery Mechanism**: Resume timer saat buka kembali
- [ ] **Offline Support**: Timer tetap berjalan saat offline
- [ ] **Conflict Resolution**: Handle concurrent updates antar device

## 🔍 **Current State Analysis**

### **✅ Yang Sudah Baik**
- [x] Database structure solid dengan `activity_logs` table
- [x] Timer store menggunakan Zustand dengan persist middleware
- [x] Data flow Timer → Activity Logs sudah terintegrasi
- [x] RLS enabled untuk security
- [x] User context sudah proper

### **❌ Yang Perlu Diperbaiki**
- [ ] No real-time persistence ke database
- [ ] No multi-device sync
- [ ] No recovery mechanism
- [ ] No background sync
- [ ] Data hilang saat close browser

## 🏗️ **Database Design**

### **1. Timer Sessions Table**
```sql
CREATE TABLE timer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  daily_plan_item_id UUID REFERENCES daily_plan_items(id),
  task_id UUID REFERENCES tasks(id),
  task_title TEXT NOT NULL,
  session_type TEXT NOT NULL, -- 'FOCUS', 'SHORT_BREAK', 'LONG_BREAK'
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  target_duration_seconds INTEGER NOT NULL,
  current_duration_seconds INTEGER DEFAULT 0,
  status TEXT DEFAULT 'RUNNING', -- 'RUNNING', 'PAUSED', 'COMPLETED'
  device_id TEXT, -- Untuk multi-device sync
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes untuk performance
CREATE INDEX idx_timer_sessions_user_running ON timer_sessions(user_id, status);
CREATE INDEX idx_timer_sessions_device ON timer_sessions(device_id);
```

### **2. Timer Events Table (Audit Trail)**
```sql
CREATE TABLE timer_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES timer_sessions(id),
  event_type VARCHAR(50) NOT NULL, -- 'start', 'pause', 'stop', 'resume', 'sync'
  event_data JSONB,
  device_id TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🚀 **Implementation Phases**

### **Phase 1: Immediate Fixes (1-2 hari)**

#### **1.1 Enhanced Timer Store**
- [x] Implementasi auto-save setiap 30 detik
- [x] Tambahkan recovery mechanism
- [x] Integrasi dengan database
```typescript
// stores/timerStore.ts - Enhanced version
export const useTimerStore = create<TimerStoreState>()(
  persist(
    (set, get) => ({
      // ... existing state
      
      // Auto-save setiap 30 detik
      autoSaveTimer: async () => {
        const state = get();
        if (state.timerState === 'FOCUSING' && state.activeTask) {
          await saveTimerSessionToDatabase({
            taskId: state.activeTask.id,
            taskTitle: state.activeTask.title,
            sessionType: 'FOCUS',
            startTime: state.startTime,
            currentDuration: state.secondsElapsed,
            status: state.timerState
          });
        }
      },
      
      // Recovery saat app load
      recoverActiveSession: async () => {
        const activeSession = await getActiveTimerSession();
        if (activeSession) {
          set({
            activeTask: {
              id: activeSession.task_id,
              title: activeSession.task_title,
              item_type: 'TASK'
            },
            timerState: 'FOCUSING',
            secondsElapsed: activeSession.current_duration_seconds,
            startTime: activeSession.start_time
          });
        }
      }
    }),
    {
      name: 'timer-storage',
      partialize: (state) => ({
        timerState: state.timerState,
        secondsElapsed: state.secondsElapsed,
        activeTask: state.activeTask,
        sessionCount: state.sessionCount,
        breakType: state.breakType,
      }),
    }
  )
);
```

#### **1.2 Server Actions**
- [x] Buat `saveTimerSession` function
- [x] Buat `getActiveTimerSession` function
- [x] Buat `completeTimerSession` function
```typescript
// actions/timerSessionActions.ts
export async function saveTimerSession(sessionData: {
  taskId: string;
  taskTitle: string;
  sessionType: string;
  startTime: string;
  targetDuration: number;
  currentDuration: number;
  status: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('timer_sessions')
    .upsert({
      user_id: user.id,
      task_id: sessionData.taskId,
      task_title: sessionData.taskTitle,
      session_type: sessionData.sessionType,
      start_time: sessionData.startTime,
      target_duration_seconds: sessionData.targetDuration,
      current_duration_seconds: sessionData.currentDuration,
      status: sessionData.status,
      device_id: getDeviceId(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,task_id,device_id'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getActiveTimerSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('timer_sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'RUNNING')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function completeTimerSession(sessionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Get session data
  const { data: session, error: sessionError } = await supabase
    .from('timer_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (sessionError) throw sessionError;

  // Move to activity_logs
  const { error: logError } = await supabase
    .from('activity_logs')
    .insert({
      user_id: user.id,
      task_id: session.task_id,
      type: session.session_type,
      start_time: session.start_time,
      end_time: new Date().toISOString(),
      duration_minutes: Math.round(session.current_duration_seconds / 60),
      local_date: new Date().toISOString().slice(0, 10)
    });

  if (logError) throw logError;

  // Mark session as completed
  const { error: updateError } = await supabase
    .from('timer_sessions')
    .update({ 
      status: 'COMPLETED',
      updated_at: new Date().toISOString()
    })
    .eq('id', sessionId);

  if (updateError) throw updateError;
}
```

#### **1.3 Auto-Save Hook**
- [x] Implementasi `useTimerPersistence` hook
- [x] Tambahkan page visibility API
- [x] Integrasi dengan recovery system
```typescript
// hooks/useTimerPersistence.ts
export function useTimerPersistence() {
  const { timerState, activeTask, secondsElapsed } = useTimer();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Auto-save setiap 30 detik
  useEffect(() => {
    if (timerState === 'FOCUSING' && activeTask) {
      const interval = setInterval(async () => {
        try {
          await saveTimerSession({
            taskId: activeTask.id,
            taskTitle: activeTask.title,
            sessionType: 'FOCUS',
            startTime: activeTask.startTime,
            targetDuration: activeTask.focus_duration * 60,
            currentDuration: secondsElapsed,
            status: timerState
          });
        } catch (error) {
          console.error('Failed to save timer session:', error);
        }
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [timerState, activeTask, secondsElapsed]);

  // Save saat page visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && timerState === 'FOCUSING' && activeTask) {
        saveTimerSession({
          taskId: activeTask.id,
          taskTitle: activeTask.title,
          sessionType: 'FOCUS',
          startTime: activeTask.startTime,
          targetDuration: activeTask.focus_duration * 60,
          currentDuration: secondsElapsed,
          status: timerState
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [timerState, activeTask, secondsElapsed]);

  // Recovery saat app load
  useEffect(() => {
    const recoverSession = async () => {
      try {
        const activeSession = await getActiveTimerSession();
        if (activeSession) {
          // Resume timer dari database
          useTimerStore.getState().resumeFromDatabase(activeSession);
        }
      } catch (error) {
        console.error('Failed to recover timer session:', error);
      }
    };

    recoverSession();
  }, []);
}
```

### **Phase 2: Multi-Device Sync (3-5 hari)**

#### **2.1 Supabase Realtime Integration**
- [ ] Setup Supabase Realtime subscription
- [ ] Implementasi conflict resolution
- [ ] Testing multi-device sync
```typescript
// hooks/useTimerRealtimeSync.ts
export function useTimerRealtimeSync() {
  const { user } = useAuth();
  const { updateTimerFromRemote } = useTimer();

  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('timer_sessions')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'timer_sessions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          handleRemoteTimerUpdate(payload);
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, [user]);

  const handleRemoteTimerUpdate = (payload: any) => {
    const { new: remoteData, old: oldData } = payload;
    
    // Simple conflict resolution: Server wins
    if (remoteData.updated_at > oldData?.updated_at) {
      updateTimerFromRemote(remoteData);
    }
  };
}
```

#### **2.2 Conflict Resolution Strategy**
- [ ] Implementasi `TimerConflictResolver` class
- [ ] Testing conflict scenarios
- [ ] Optimasi resolution algorithm
```typescript
// utils/timerConflictResolution.ts
export class TimerConflictResolver {
  static resolve(localData: any, remoteData: any): any {
    // Strategy: Server wins dengan timestamp comparison
    const localTime = new Date(localData.updated_at);
    const remoteTime = new Date(remoteData.updated_at);
    
    if (remoteTime > localTime) {
      return remoteData; // Server wins
    }
    
    return localData; // Local wins
  }

  static merge(localData: any, remoteData: any): any {
    // Merge strategy untuk partial updates
    return {
      ...localData,
      ...remoteData,
      lastSync: new Date().toISOString(),
      conflictResolved: true
    };
  }
}
```

### **Phase 3: Advanced Features (1-2 minggu)**

#### **3.1 Background Sync dengan Service Worker**
- [ ] Setup Service Worker
- [ ] Implementasi background sync
- [ ] Testing offline scenarios
```typescript
// public/sw.js
self.addEventListener('sync', (event) => {
  if (event.tag === 'timer-sync') {
    event.waitUntil(syncTimerToDatabase());
  }
});

async function syncTimerToDatabase() {
  try {
    const timerData = await getStoredTimerData();
    if (timerData) {
      await saveTimerSession(timerData);
      await clearStoredTimerData();
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}
```

#### **3.2 Offline Support**
- [ ] Implementasi `OfflineTimerQueue` class
- [ ] Setup IndexedDB
- [ ] Testing offline functionality
```typescript
// utils/offlineTimerQueue.ts
export class OfflineTimerQueue {
  private dbName = 'BetterPlannerTimer';
  private version = 1;
  private storeName = 'timerQueue';

  async add(timerData: any) {
    const db = await this.openDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    
    await store.add({
      ...timerData,
      timestamp: Date.now(),
      synced: false
    });
  }

  async sync() {
    const db = await this.openDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    const items = await store.getAll();
    
    for (const item of items) {
      if (!item.synced) {
        try {
          await saveTimerSession(item);
          item.synced = true;
          await store.put(item);
        } catch (error) {
          console.error('Sync failed for item:', item, error);
        }
      }
    }
  }

  private async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }
}
```

## 🎯 **Implementation Priority**

### **🔥 High Priority (Implementasi Segera)**
- [x] **Timer Sessions Table** - Database schema
- [x] **Auto-save setiap 30 detik** - Mencegah data loss
- [x] **Recovery mechanism** - Resume timer saat reload
- [x] **Page visibility API** - Save saat tab tidak aktif

### **⚡ Medium Priority (1-2 minggu)**
- [ ] **Supabase Realtime** - Multi-device sync
- [ ] **Conflict resolution** - Handle concurrent updates
- [ ] **Background sync** - Service Worker integration

### **🚀 Low Priority (Future)**
- [ ] **Advanced offline support** - IndexedDB
- [ ] **Push notifications** - Timer alerts
- [ ] **Analytics dashboard** - Timer insights

## 📊 **Success Metrics**

### **Phase 1 Success Criteria**
- [ ] Timer tidak hilang saat close browser
- [ ] Auto-save berjalan setiap 30 detik
- [ ] Recovery mechanism berfungsi
- [ ] Data tersimpan ke database

### **Phase 2 Success Criteria**
- [ ] Multi-device sync berfungsi
- [ ] Conflict resolution bekerja
- [ ] Real-time updates antar device

### **Phase 3 Success Criteria**
- [ ] Offline support lengkap
- [ ] Background sync berjalan
- [ ] Performance optimal

## 🔧 **Testing Strategy**

### **Unit Tests**
- [ ] Test auto-save functionality
- [ ] Test recovery mechanism
- [ ] Test conflict resolution
- [ ] Test timer state management

### **Integration Tests**
- [ ] Test multi-device sync
- [ ] Test offline functionality
- [ ] Test database integration
- [ ] Test real-time updates

## 📚 **References**

### **External Resources**
- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Zustand Persist Middleware](https://github.com/pmndrs/zustand#persist-middleware)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

### **Internal References**
- `src/stores/timerStore.ts` - Current timer implementation
- `src/app/(admin)/execution/daily-sync/` - Timer integration
- `src/lib/supabase/` - Database configuration

## 🚨 **Known Issues & Limitations**

### **Current Limitations**
1. **No Real-time Persistence** - Timer hanya di localStorage
2. **No Multi-device Sync** - Tidak ada sinkronisasi antar device
3. **No Recovery Mechanism** - Data hilang saat close browser
4. **No Offline Support** - Tidak bisa berjalan offline

### **Planned Solutions**
1. **Timer Sessions Table** - Database persistence
2. **Supabase Realtime** - Multi-device sync
3. **Recovery System** - Resume timer functionality
4. **Offline Queue** - IndexedDB support

## 📝 **Changelog**

### **v1.0.0** - Initial Strategy
- Database design untuk timer sessions
- Auto-save mechanism
- Recovery system
- Multi-device sync strategy

### **v1.1.0** - Planned Updates
- Conflict resolution implementation
- Background sync dengan Service Worker
- Offline support dengan IndexedDB

---

**Last Updated**: 2024-01-XX
**Author**: AI Assistant
**Status**: Planning Phase
**Next Review**: After Phase 1 Implementation
