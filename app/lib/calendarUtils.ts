import moment from 'moment';
import { startOfDay, addWeeks, addDays } from 'date-fns';
import { Task, TaskCategory } from './types';

/**
 * Task with day-specific metadata
 */
export interface TaskWithMetadata extends Task {
  isEnd: boolean; // true if task ends on this day, false if it continues to next day
  isStart: boolean; // true if task starts on this day
  isContinue: boolean; // true if task continues to the next day (present in next day)
  level: number; // vertical position/index for stacking (0 = top, higher = lower)
}

/**
 * Format date intelligently: Today, Tomorrow, Yesterday, or formatted date
 */
export function formatSmartDate(date: Date | null): string {
  if (!date) return 'Today';

  const today = moment().startOf('day');
  const dateMoment = moment(date).startOf('day');
  const diffDays = dateMoment.diff(today, 'days');

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else if (diffDays === -1) {
    return 'Yesterday';
  } else {
    // For dates far away, show the formatted date (day and month)
    return moment(date).format('MMM D, YYYY');
  }
}

/**
 * Check if a day is the selected date
 */
export function isSelectedDate(day: Date, selectedDate: Date | null): boolean {
  if (!selectedDate) return false;
  const dayStart = startOfDay(day);
  const selectedStart = startOfDay(selectedDate);
  return dayStart.getTime() === selectedStart.getTime();
}

/**
 * Check if a task should be displayed on a specific day
 */
export function isTaskOnDay(task: Task, day: Date): boolean {
  const dayStart = startOfDay(day);
  const taskStart = startOfDay(task.startDate);
  const taskEnd = startOfDay(task.endDate);

  // Check if the day falls within the task's date range
  return dayStart >= taskStart && dayStart <= taskEnd;
}

/**
 * Filter tasks based on search query, categories, and time
 */
export function filterTasks(
  tasks: Task[],
  searchQuery: string,
  selectedCategories: Set<TaskCategory>,
  timeFilter: number | null
): Task[] {
  return tasks.filter((task) => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      if (!task.name.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Category filter - if no categories selected, show nothing
    if (selectedCategories.size === 0) {
      return false;
    }
    // If categories are selected, only show tasks matching selected categories
    if (!selectedCategories.has(task.category)) {
      return false;
    }

    // Time filter - show tasks that start within X weeks from today
    if (timeFilter !== null) {
      const today = startOfDay(new Date());
      const futureDate = addWeeks(today, timeFilter);
      const taskStart = startOfDay(task.startDate);

      // Task must start on or before the future date (within the time window)
      if (taskStart > futureDate) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Transform tasks for a specific day with metadata (isEnd, isStart, isContinue, level)
 */
export function getTasksForDay(
  tasks: Task[], 
  day: Date, 
  taskLevelMap?: Map<string, number>
): TaskWithMetadata[] {
  const dayStart = startOfDay(day);
  const nextDayStart = startOfDay(addDays(day, 1));

  return tasks
    .filter((task) => isTaskOnDay(task, day))
    .map((task) => {
      const taskStart = startOfDay(task.startDate);
      const taskEnd = startOfDay(task.endDate);

      const isStart = dayStart.getTime() === taskStart.getTime();
      const isEnd = dayStart.getTime() === taskEnd.getTime();
      // Task continues if it doesn't end on this day and the next day is within the task range
      const isContinue = !isEnd && nextDayStart <= taskEnd;
      // Get level from map if provided, otherwise default to 0
      const level = taskLevelMap?.get(task.id) ?? 0;

      return {
        ...task,
        isStart,
        isEnd,
        isContinue,
        level,
      };
    });
}

/**
 * Calculate task levels for all tasks across all days
 * 
 * IMPORTANT: Multi-day tasks maintain the same level (cached/indexed) across ALL days they span.
 * Once assigned, a multi-day task's level NEVER changes, even if lower levels become available.
 * This ensures visual continuity - if a task is at level 1 on day 12, it stays at level 1 
 * through day 21, allowing new tasks to fill level 0 if it becomes empty.
 * 
 * Single-day tasks fill available slots and can use any empty level on their specific day.
 */
export function calculateTaskLevels(
  days: Date[],
  tasks: Task[]
): Map<string, number> {
  const taskLevelMap = new Map<string, number>();
  const dayStart = startOfDay;

  // Separate multi-day and single-day tasks
  const multiDayTasks: Task[] = [];
  const singleDayTasks: Task[] = [];

  tasks.forEach((task) => {
    const taskStart = dayStart(task.startDate);
    const taskEnd = dayStart(task.endDate);
    const duration = taskEnd.getTime() - taskStart.getTime();
    
    if (duration === 0) {
      singleDayTasks.push(task);
    } else {
      multiDayTasks.push(task);
    }
  });

  // Create a set to track multi-day task IDs for locking their levels
  // Multi-day tasks maintain their assigned level across ALL days they span
  const multiDayTaskIds = new Set(multiDayTasks.map(t => t.id));
  
  // Step 1: Assign levels to multi-day tasks first
  // Sort by start date, then by duration (longer tasks first to get lower levels)
  multiDayTasks.sort((a, b) => {
    const aStart = dayStart(a.startDate).getTime();
    const bStart = dayStart(b.startDate).getTime();
    if (aStart !== bStart) return aStart - bStart;
    
    const aDuration = dayStart(a.endDate).getTime() - aStart;
    const bDuration = dayStart(b.endDate).getTime() - bStart;
    return bDuration - aDuration; // Longer tasks first
  });

  let currentLevel = 0;
  for (const task of multiDayTasks) {
    const taskStart = dayStart(task.startDate);
    const taskEnd = dayStart(task.endDate);
    
    // Find the first available level for this task across all days it spans
    let assignedLevel = -1;
    
    // Check each level starting from 0
    for (let level = 0; level <= currentLevel + 1; level++) {
      let levelAvailable = true;
      
      // Check if this level is free on all days this task spans
      for (let day of days) {
        const dayStartTime = dayStart(day).getTime();
        if (dayStartTime >= taskStart.getTime() && dayStartTime <= taskEnd.getTime()) {
          // Check if any other multi-day task already uses this level on this day
          for (const [taskId, existingLevel] of taskLevelMap.entries()) {
            // Only check against multi-day tasks (they lock their levels)
            if (multiDayTaskIds.has(taskId) && existingLevel === level) {
              const existingTask = tasks.find(t => t.id === taskId);
              if (existingTask) {
                const existingStart = dayStart(existingTask.startDate).getTime();
                const existingEnd = dayStart(existingTask.endDate).getTime();
                // If existing task overlaps this day, level is not available
                if (dayStartTime >= existingStart && dayStartTime <= existingEnd) {
                  levelAvailable = false;
                  break;
                }
              }
            }
          }
          if (!levelAvailable) break;
        }
      }
      
      if (levelAvailable) {
        assignedLevel = level;
        break;
      }
    }
    
    if (assignedLevel === -1) {
      assignedLevel = currentLevel + 1;
    }
    
    // Lock the level for this multi-day task - it will maintain this level across ALL days
    taskLevelMap.set(task.id, assignedLevel);
    currentLevel = Math.max(currentLevel, assignedLevel);
  }

  // Step 2: For each day, assign levels to single-day tasks
  // They fill available slots (levels not occupied by multi-day tasks on that day)
  days.forEach((day) => {
    const dayStartTime = dayStart(day).getTime();
    
    // Get single-day tasks for this day
    const daySingleTasks = singleDayTasks.filter((task) => {
      const taskStartTime = dayStart(task.startDate).getTime();
      const taskEndTime = dayStart(task.endDate).getTime();
      return dayStartTime >= taskStartTime && dayStartTime <= taskEndTime;
    });

    // Get occupied levels on this day (from multi-day tasks only)
    // Multi-day tasks lock their levels and must maintain them across all days
    const occupiedLevels = new Set<number>();
    taskLevelMap.forEach((level, taskId) => {
      // Only consider multi-day tasks - they have locked levels
      if (multiDayTaskIds.has(taskId)) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          const taskStartTime = dayStart(task.startDate).getTime();
          const taskEndTime = dayStart(task.endDate).getTime();
          // If this multi-day task spans this day, its level is occupied
          if (dayStartTime >= taskStartTime && dayStartTime <= taskEndTime) {
            occupiedLevels.add(level);
          }
        }
      }
    });

    // Assign levels to single-day tasks, filling gaps first
    const daySingleTasksWithLevels: Array<{ task: Task; level: number }> = [];
    
    for (const task of daySingleTasks) {
      // Skip if already assigned (shouldn't happen for single-day, but just in case)
      if (taskLevelMap.has(task.id)) continue;
      
      // Find first available level
      let assignedLevel = -1;
      
      // First, try to fill gaps (occupied levels that are now free)
      for (let level = 0; level <= currentLevel; level++) {
        if (!occupiedLevels.has(level)) {
          // Check if this level is already assigned to another single-day task on this day
          const levelTaken = daySingleTasksWithLevels.some(
            item => item.level === level
          );
          if (!levelTaken) {
            assignedLevel = level;
            break;
          }
        }
      }
      
      // If no gap found, assign to next available level
      if (assignedLevel === -1) {
        assignedLevel = currentLevel + 1;
        currentLevel = assignedLevel;
      }
      
      daySingleTasksWithLevels.push({ task, level: assignedLevel });
      taskLevelMap.set(task.id, assignedLevel);
    }
  });

  return taskLevelMap;
}

/**
 * Transform days into array with tasks and metadata, including level information
 */
export interface DayWithTasks {
  day: Date;
  tasks: TaskWithMetadata[];
}

export function getDaysWithTasks(
  days: Date[],
  tasks: Task[]
): DayWithTasks[] {
  // Calculate levels for all tasks
  const taskLevelMap = calculateTaskLevels(days, tasks);
  
  return days.map((day) => {
    // Get tasks with levels already assigned
    const dayTasks = getTasksForDay(tasks, day, taskLevelMap);
    
    // Sort by level (0 = top)
    const sortedTasks = [...dayTasks].sort((a, b) => a.level - b.level);
    
    return {
      day,
      tasks: sortedTasks,
    };
  });
}

