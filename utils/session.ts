// CHECK IF BROWSER STORAGE IS EXIST
function isStorageExist(): boolean {
  if (typeof Storage === "undefined") {
    // GIVE ERROR OR ALERT TO USER
    return false;
  }
  return true;
}

// CHECK IF DATA IS JSON
function isJson(str: string | null): boolean {
  try {
    JSON.parse(str as string);
  } catch (e) {
    return false;
  }
  return true;
}

// SAVE SESSION DATA
export function setSession(key: string, value: any): boolean | undefined {
  if (isStorageExist()) {
    sessionStorage.setItem(key, JSON.stringify(value));
    return true;
  }
}

// GET SESSION DATA
export function getSession(key: string): any {
  if (isStorageExist()) {
    const dataSession = sessionStorage.getItem(key);
    return isJson(dataSession)
      ? JSON.parse(dataSession as string)
      : dataSession;
  }
}

// REMOVE SESSION DATA
export function removeSession(key: string): void | undefined {
  if (isStorageExist()) {
    sessionStorage.removeItem(key);
  }
}

// CLEAR SESSION
export function clearSession(): void | undefined {
  if (isStorageExist()) {
    sessionStorage.clear();
  }
}

// SAVE LOCAL BROWSER DATA
export function setLocal(key: string, value: any): boolean | undefined {
  if (isStorageExist()) {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  }
}

// GET LOCAL BROWSER DATA
export function getLocal(key: string): any {
  if (isStorageExist()) {
    const dataLocal = localStorage.getItem(key);
    return isJson(dataLocal) ? JSON.parse(dataLocal as string) : dataLocal;
  }
}

// REMOVE LOCAL DATA
export function removeLocal(key: string): void | undefined {
  if (isStorageExist()) {
    localStorage.removeItem(key);
  }
}

// CLEAR LOCAL
export function clearLocal(): void | undefined {
  if (isStorageExist()) {
    localStorage.clear();
  }
}
