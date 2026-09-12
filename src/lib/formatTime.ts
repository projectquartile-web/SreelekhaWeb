export function formatShowtime(timeStr: string): string {
  if (!timeStr) return timeStr;
  
  const cleanTimeStr = timeStr.trim();
  
  // If it already has AM/PM, leave it alone (e.g. manual override)
  if (cleanTimeStr.toUpperCase().includes('AM') || cleanTimeStr.toUpperCase().includes('PM')) {
    return cleanTimeStr;
  }
  
  const parts = cleanTimeStr.split(':');
  if (parts.length < 2) return cleanTimeStr;
  
  const hoursInt = parseInt(parts[0], 10);
  const minutesInt = parseInt(parts[1], 10);
  
  if (isNaN(hoursInt) || isNaN(minutesInt)) return cleanTimeStr;
  
  const ampm = hoursInt >= 12 ? 'PM' : 'AM';
  let hours12 = hoursInt % 12;
  hours12 = hours12 ? hours12 : 12;
  
  const paddedMinutes = minutesInt.toString().padStart(2, '0');
  
  return `${hours12}:${paddedMinutes} ${ampm}`;
}
