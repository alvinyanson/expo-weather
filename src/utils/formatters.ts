// TODO: Implement comprehensive JSDoc annotations for these utility functions.
// Return: "24"
export const formatRound = (value: number): string => {
  return Math.round(value).toString();
};

// Return: "June 26"
export const formatDateFull = (dateStr?: string | number | Date): string => {
  const date = dateStr ? new Date(dateStr) : new Date();
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
};

// Return: "Thursday"
export const formatDayName = (dateStr: string | number | Date): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

// Return: "10:30 AM"
export const formatTime = (dateStr: string | number | Date): string => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

// Return: "10AM"
export const formatHourlyTime = (dateStr: string | number | Date): string => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }).replace(' ', '');
};
