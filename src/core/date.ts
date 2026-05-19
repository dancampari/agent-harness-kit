function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

/** Carimbo de data/hora para nomes de arquivo: YYYY-MM-DD-HH-mm */
export function fileStamp(date = new Date()): string {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
  ].join("-");
}

/** Data/hora legível para conteúdo de documentos: YYYY-MM-DD HH:mm:ss */
export function readableStamp(date = new Date()): string {
  const d = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const t = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  return `${d} ${t}`;
}

/** Sufixo seguro para backups: YYYYMMDD-HHmmss */
export function backupStamp(date = new Date()): string {
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
}
