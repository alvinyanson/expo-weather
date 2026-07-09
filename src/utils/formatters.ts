// TODO: Implement comprehensive JSDoc annotations for these utility functions.
// Return: "24"
export const formatRound = (value: number): string => {
  return Math.round(value).toString();
};

// Return: "June 26" / "6月26日"
export const formatDateFull = (dateStr?: string | number | Date): string => {
  const date = dateStr ? new Date(dateStr) : new Date();
  return date.toLocaleDateString('default', { month: 'long', day: 'numeric' });
};

// Return: "Thursday" / "木曜日"
export const formatDayName = (dateStr: string | number | Date): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('default', { weekday: 'long' });
};

// Return: "10:30 AM" / "午前10:30"
export const formatTime = (dateStr: string | number | Date): string => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('default', { hour: 'numeric', minute: '2-digit' });
};

// Return: "10AM" / "午前10時"
export const formatHourlyTime = (dateStr: string | number | Date): string => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('default', { hour: 'numeric', hour12: true }).replace(' ', '');
};
