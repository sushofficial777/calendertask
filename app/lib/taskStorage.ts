import { Task } from './types';
import { startOfDay } from 'date-fns';

const STORAGE_KEY = 'calendar-tasks';

export function saveTasksToStorage(tasks: Task[]): void {
  try {
    // Convert Date objects to ISO strings for storage
    // Normalize dates to start of day for consistency
    const tasksToSave = tasks.map(task => ({
      ...task,
      startDate: startOfDay(task.startDate).toISOString(),
      endDate: startOfDay(task.endDate).toISOString(),
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasksToSave));
  } catch (error) {
    console.error('Failed to save tasks to localStorage:', error);
  }
}

export function loadTasksFromStorage(): Task[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    
    const parsed = JSON.parse(stored);
    // Convert ISO strings back to Date objects and normalize to start of day
    return parsed.map((task: any) => ({
      ...task,
      startDate: startOfDay(new Date(task.startDate)),
      endDate: startOfDay(new Date(task.endDate)),
    }));
  } catch (error) {
    console.error('Failed to load tasks from localStorage:', error);
    return [];
  }
}

