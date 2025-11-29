'use client'
import { Task } from "@/app/lib/types";
import { TaskWithMetadata } from "@/app/lib/calendarUtils";
import { Button } from "@/components/ui/button";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronLeft, Pencil } from "lucide-react";

interface TaskProps {
  task: TaskWithMetadata;
  dragId?: string;
  onClick?: (e: React.MouseEvent) => void;
  onTaskClick?: (task: TaskWithMetadata, e: React.MouseEvent) => void;
}

export default function TaskComponent({ task, dragId, onClick, onTaskClick }: TaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: dragId ?? task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'To Do':
        return 'bg-violet-500 hover:bg-violet-600';
      case 'In Progress':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'Review':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'Completed':
        return 'bg-green-500 hover:bg-green-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getCategoryDotColor = (category: string) => {
    switch (category) {
      case 'To Do':
        return 'bg-violet-400';
      case 'In Progress':
        return 'bg-yellow-400';
      case 'Review':
        return 'bg-purple-400';
      case 'Completed':
        return 'bg-green-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'To Do':
        return 'bg-violet-400';
      case 'In Progress':
        return 'bg-yellow-400';
      case 'Review':
        return 'bg-purple-400';
      case 'Completed':
        return 'bg-green-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getCategoryButtonColor = (category: string) => {
    switch (category) {
      case 'To Do':
        return 'bg-violet-400 hover:bg-violet-500';
      case 'In Progress':
        return 'bg-yellow-400 hover:bg-yellow-500';
      case 'Review':
        return 'bg-purple-400 hover:bg-purple-500';
      case 'Completed':
        return 'bg-green-400 hover:bg-green-500';
      default:
        return 'bg-gray-400 hover:bg-gray-500';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`${getCategoryColor(task.category)} ${task.isStart && task.isEnd  ? ' rounded-sm mx-1.5' : task.isStart && task.isContinue ? ' rounded-l-sm ml-1.5' : task.isEnd ? ' rounded-r-sm mr-1.5' : ' scale-x-[1.001] ' } task_box text-white text-xs p-1.5 my-0.5 cursor-grab active:cursor-grabbing transition-all duration-200 ${isDragging ? ' shadow-lg z-50' : ''
        }  `}
      onClick={onClick}
      title={`${task.name} - ${task.category}`}
    >
        {
          task.isStart ? (
            <>
             <div className=" flex group items-center overflow-hidden justify-between  ">
              <div className=" flex items-center gap-1 ">
                <div className={`w-3 h-3 rounded-full ${getCategoryDotColor(task.category)}`}></div>
                <div className="font-medium w-[80px]  truncate"><p>{task.name}</p></div>
              </div>
              <div className={`text-[10px]  flex items-center justify-center group-hover:hidden duration-300 px-2 py-1 ${getCategoryBadgeColor(task.category)} rounded-full w-[140px]!  opacity-90 truncate`}>{task.category}</div>
              <Button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent drag from starting
                  if (onTaskClick) {
                    onTaskClick(task, e);
                  }
                }}
                onPointerDown={(e) => {
                  e.stopPropagation(); // Prevent drag on pointer down
                }}
                onMouseDown={(e) => {
                  e.stopPropagation(); // Prevent drag on mouse down
                }}
                className={`cursor-pointer hidden group-hover:flex ${getCategoryButtonColor(task.category)} h-[22px] w-[22px] rounded-full`}
                variant="ghost"
                size="icon-sm"
              >
                <Pencil className="w-3! h-3!" />
              </Button>
              </div>
            </>
          ) : <div className={`h-[21.5px] rounded-null! `}></div>
        }
    </div>
  );
}
