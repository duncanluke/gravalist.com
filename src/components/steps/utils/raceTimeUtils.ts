// Time utilities for race components
export const getStartTime = (): Date => {
  const now = new Date();
  const startTime = new Date(now);
  startTime.setHours(6, 0, 0, 0);
  
  // If it's already past 6 AM today, set it for tomorrow
  if (now > startTime) {
    startTime.setDate(startTime.getDate() + 1);
  }
  
  return startTime;
};

export const formatCountdown = (milliseconds: number): string => {
  if (milliseconds <= 0) return "00:00:00";
  
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

export const formatTimeWithSeconds = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

export const getStartButtonTime = (startTime: Date): Date => {
  const startButtonTime = new Date(startTime);
  startButtonTime.setMinutes(startButtonTime.getMinutes() - 10);
  return startButtonTime;
};