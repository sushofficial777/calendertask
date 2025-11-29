
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Task, TaskCategory } from '@/app/lib/types';
import { saveTasksToStorage, loadTasksFromStorage } from '@/app/lib/taskStorage';
import {
  formatSmartDate,
  isSelectedDate,
  isTaskOnDay,
  filterTasks,
  getDaysWithTasks,
  type DayWithTasks,
  type TaskWithMetadata,
} from '@/app/lib/calendarUtils';
import TaskModal from './TaskModal';
import TaskComponent from './Task';
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  startOfDay,
  differenceInDays,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import FilterPanel from './FilterPanel';

export default function Calendar() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const hasLoadedRef = useRef(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<TaskCategory>>(
    new Set(['To Do', 'In Progress', 'Review', 'Completed'])
  );
  const [timeFilter, setTimeFilter] = useState<number | null>(null); // null = all, 1/2/3 = weeks

  // Load tasks from localStorage on mount
  useEffect(() => {
    const loadedTasks = loadTasksFromStorage();
    setTasks(loadedTasks);
    hasLoadedRef.current = true;
  }, []);

  // Save tasks to localStorage whenever they change (after initial load)
  useEffect(() => {
    if (hasLoadedRef.current) {
      saveTasksToStorage(tasks);
    }
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as string;
    const task = filteredTasks.find((t) => t.id === taskId);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || !active) return;

    const taskId = active.id as string;
    const task = tasks.find((t) => t.id === taskId); // Use original tasks for updates

    if (!task) return;

    // Check if dropped on a day tile (day tiles have IDs like 'day-2024-01-15')
    const overId = over.id as string;
    if (overId.startsWith('day-')) {
      // Extract the date from the day tile ID
      const dateStr = overId.replace('day-', '');
      const newStartDate = startOfDay(new Date(dateStr));
      const taskDurationDays = differenceInDays(task.endDate, task.startDate);
      // Create new end date maintaining the same duration
      const newEndDate = new Date(newStartDate);
      newEndDate.setDate(newEndDate.getDate() + taskDurationDays);
      const normalizedEndDate = startOfDay(newEndDate);

      // Update the task with new dates
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === taskId
            ? {
              ...t,
              startDate: newStartDate,
              endDate: normalizedEndDate,
            }
            : t
        )
      );
    }
  };

  const handleDragCancel = () => {
    setActiveTask(null);
  };

  const handleDayClick = (day: Date) => {
    setEditingTask(null);
    setSelectedDate(day);
    setShowModal(true);
  };

  const handleTaskClick = (task: TaskWithMetadata, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent day click
    setEditingTask(task);
    setSelectedDate(task.startDate);
    setShowModal(true);
  };

  const handleSaveTask = (task: Omit<Task, 'id'>) => {
    if (editingTask) {
      // Update existing task
      setTasks(tasks.map(t => t.id === editingTask.id ? { ...task, id: editingTask.id } : t));
      setEditingTask(null);
    } else {
      // Create new task
      const newTask: Task = {
        ...task,
        id: new Date().toISOString(),
      };
      setTasks([...tasks, newTask]);
    }
    setShowModal(false);
    setSelectedDate(new Date()); // Reset to today
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  // Filter tasks based on search, categories, and time
  const filteredTasks = filterTasks(tasks, searchQuery, selectedCategories, timeFilter);

  // Filter handlers
  const handleCategoryToggle = (category: TaskCategory) => {
    setSelectedCategories((prev) => {
      // Create a completely new Set to ensure React detects the change
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        // Prevent unchecking if it's the last category
        if (newSet.size === 1) {
          return prev; // Don't allow unchecking the last category
        }
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      // Convert to array and back to Set to ensure it's a new reference
      return new Set(Array.from(newSet));
    });
  };

  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);

  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(firstDayOfMonth),
    end: endOfWeek(lastDayOfMonth),
  });

  // Transform days into array with tasks and metadata
  const daysWithTasks: DayWithTasks[] = getDaysWithTasks(daysInMonth, filteredTasks);

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const prevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  return (
    <div className=''>

      <div className="grid grid-cols-3  mb-4">
        <div className=" flex w-fit items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-full border border-violet-100/80 ">
          <Button onClick={prevMonth} className='cursor-pointer  h-6 w-6 rounded-full' variant="ghost" size="icon-sm">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button onClick={nextMonth} className='cursor-pointer  h-6 w-6 rounded-full ' variant="ghost" size="icon-sm">
            <ChevronRight className="w-4 h-4" />
          </Button>
          <div className="px-2 text-[11px] font-semibold flex items-center gap-1  text-gray-900 dark:text-gray-100">
            <div className={`w-2 h-2 rounded-full bg-violet-400 dark:bg-violet-400 `}></div> <p>{selectedDate ? formatSmartDate(selectedDate) : 'Today'}</p>
          </div>
        </div>
        <div className=" flex justify-center items-center ">
          <div className=" relative bg-white px-10 h-10 flex  items-center justify-center dark:bg-violet-900/50 rounded-full p-1">
            <div className="absolute left-[2%] top-[8px] w-6 h-6! bg-[#f5f7fb] dark:bg-gray-900 rounded-full border-l-violet-300 border-l-2"></div>
            <div className="absolute right-[2%] top-[8px] w-6 h-6! bg-[#f5f7fb] dark:bg-gray-900 rounded-full border-r-violet-300 border-r-2"></div>
            <h2 className="text-md font-semibold text-gray-700 dark:text-white">
              {format(currentDate, 'MMM yyyy')}
            </h2>
          </div>
        </div>
        <div className=" flex justify-end items-center">
          {/* Filter Panel */}
          <FilterPanel
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategories={selectedCategories}
            onCategoryToggle={handleCategoryToggle}
            timeFilter={timeFilter}
            onTimeFilterChange={setTimeFilter}
          /> </div>
      </div>
      <div className=" box_shadow  rounded-2xl overflow-hidden ">
        <div className="grid grid-cols-7  lg:py-[12px] border-b-[.5px] border-gray-200 dark:border-gray-600   bg-white dark:bg-gray-800  ">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center uppercase lg:text-[11px] text-[11px] font-semibold text-gray-600 dark:text-gray-300">
              {day}
            </div>
          ))}
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="grid grid-cols-7 gap-[1.1px]!  bg-[#dee8fe] dark:bg-gray-900 ">

            {daysWithTasks.map((dayData) => {
              const day = dayData.day;
              const dayTasks = dayData.tasks;
              const dayId = `day-${format(day, 'yyyy-MM-dd')}`;
              return (
                <DayTile
                  key={day.toString()}
                  day={day}
                  dayId={dayId}
                  dayTasks={dayTasks}
                  isSameMonth={isSameMonth(day, currentDate)}
                  isToday={isToday(day)}
                  isSelected={isSelectedDate(day, selectedDate)}
                  onDayClick={handleDayClick}
                  onTaskClick={handleTaskClick}
                />
              );
            })}
          </div>
          <DragOverlay>
            {activeTask ? (
              <div className=" bg-violet-700 overflow-hidden text-white text-xs rounded-lg p-1.5 shadow-2xl rotate-3 opacity-90 flex items-center justify-between  ">
                <div className=" flex items-center gap-1 ">
                  <div className=" w-3 h-3 rounded-full bg-violet-400 "></div>
                  <div className="font-medium w-[100px] truncate">{activeTask.name}</div>
                </div>
                <div className="text-[10px] px-2 py-1 bg-violet-400 rounded-full opacity-90 truncate">{activeTask.category}</div>
                {/* <Button className='cursor-pointer  h-6 w-6 rounded-full' variant="ghost" size="icon-sm">
              <ChevronLeft className="w-4 h-4" />
            </Button> */}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
      <TaskModal
        open={showModal}
        onOpenChange={(open) => {
          setShowModal(open);
          if (!open) {
            setEditingTask(null);
            // Keep selected date when closing modal, don't reset
          }
        }}
        selectedDate={selectedDate}
        editingTask={editingTask}
        onSave={handleSaveTask}
        onDelete={editingTask ? () => {
          handleDeleteTask(editingTask.id);
          setShowModal(false);
          setEditingTask(null);
        } : undefined}
      />
    </div>
  );
}

// DayTile component with droppable functionality
function DayTile({
  day,
  dayId,
  dayTasks,
  isSameMonth,
  isToday,
  isSelected,
  onDayClick,
  onTaskClick,
}: {
  day: Date;
  dayId: string;
  dayTasks: TaskWithMetadata[];
  isSameMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  onDayClick: (day: Date) => void;
  onTaskClick: (task: TaskWithMetadata, e: React.MouseEvent) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: dayId,
  });

  return (
    <div
      ref={setNodeRef}
      className={`   h-36  overflow-hidden border-gray-300 dark:border-gray-600 ${isSameMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-900'
        } ${isToday ? 'bg-violet-100 dark:bg-violet-900' : ''} ${isSelected ? ' !bg-violet-50 dark:!bg-gray-900 ' : ''} ${isOver ? 'ring-2 ring-violet-500 dark:ring-violet-400 bg-violet-50 dark:bg-violet-900/50' : ''
        } cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 flex flex-col overflow-hidden`}
      onClick={() => onDayClick(day)}
    >
      <time
        dateTime={format(day, 'yyyy-MM-dd')}
        className={`text-[13px] w-6 h-6 rounded-full flex items-center justify-center  font-medium mb-1 ${isSameMonth ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'} ${isSelected ? ' !bg-black text-white  dark:!bg-violet-400 ' : ''}  `}
      >
        {format(day, 'd')}
      </time>
      <div className="flex-1 overflow-y-auto min-h-0 space-y-0.5">
        <SortableContext
          items={dayTasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {(() => {
            const tasksByLevel = new Map<number, TaskWithMetadata>();
            let maxLevel = -1;
            
            dayTasks.forEach((task) => {
              tasksByLevel.set(task.level, task);
              maxLevel = Math.max(maxLevel, task.level);
            });
            
            const renderedItems: (TaskWithMetadata | null)[] = [];
            
            for (let level = 0; level <= maxLevel; level++) {
              const task = tasksByLevel.get(level);
              renderedItems.push(task || null);
            }
            
            return renderedItems.map((item, index) => {
              if (item === null) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="h-[21.5px]  my-0.5 mt-[14px] "
                    aria-hidden="true"
                  />
                );
              }
              
              return (
                <TaskComponent
                  key={item.id}
                  task={item}
                  onClick={(e) => onTaskClick(item, e)}
                  onTaskClick={(task, e) => onTaskClick(task, e)}
                />
              );
            });
          })()}
        </SortableContext>
      </div>
    </div>
  );
}
