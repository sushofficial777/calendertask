
'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Task, TaskCategory } from '@/app/lib/types';
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
} from 'date-fns';

export default function Calendar() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setTasks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleDayClick = (day: Date) => {
    if (!selectedStartDate) {
      setSelectedStartDate(day);
    } else if (!selectedEndDate) {
      setSelectedEndDate(day);
      setShowModal(true);
    } else {
      setSelectedStartDate(day);
      setSelectedEndDate(null);
    }
  };

  const handleSaveTask = (task: Omit<Task, 'id' | 'startDate' | 'endDate'>) => {
    if (selectedStartDate && selectedEndDate) {
      const newTask: Task = {
        ...task,
        id: new Date().toISOString(),
        startDate: selectedStartDate,
        endDate: selectedEndDate,
      };
      setTasks([...tasks, newTask]);
      setShowModal(false);
      setSelectedStartDate(null);
      setSelectedEndDate(null);
    }
  };

  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);

  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(firstDayOfMonth),
    end: endOfWeek(lastDayOfMonth),
  });

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const prevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  return (
    <div className="p-4">
        <header className='flex justify-between items-center mb-4'>
            <h1 className='text-4xl font-bold'>Task Planner</h1>
        </header>
      <div className="flex justify-between items-center mb-4">
        <button onClick={prevMonth} className="px-4 py-2 bg-gray-200 rounded-lg">
          Previous
        </button>
        <h2 className="text-xl font-bold">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <button onClick={nextMonth} className="px-4 py-2 bg-gray-200 rounded-lg">
          Next
        </button>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center font-bold">
              {day}
            </div>
          ))}
          {daysInMonth.map((day) => (
            <div
              key={day.toString()}
              className={`border rounded-lg p-2 h-32 ${
                isSameMonth(day, currentDate) ? '' : 'bg-gray-100'
              } ${isToday(day) ? 'bg-blue-100' : ''}`}
              onClick={() => handleDayClick(day)}
            >
              <time dateTime={format(day, 'yyyy-MM-dd')}>
                {format(day, 'd')}
              </time>
              <SortableContext
                items={tasks.map((task) => task.id)}
                strategy={verticalListSortingStrategy}
              >
                {tasks
                  .filter(
                    (task) =>
                      day >= task.startDate &&
                      day <= task.endDate &&
                      isSameMonth(day, currentDate)
                  )
                  .map((task) => (
                    <TaskComponent key={task.id} task={task} />
                  ))}
              </SortableContext>
            </div>
          ))}
        </div>
      </DndContext>
      <TaskModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveTask}
      />
    </div>
  );
}
