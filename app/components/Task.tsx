'use client'
import { Task } from "@/app/lib/types";

interface TaskProps {
  task: Task;
}

export default function TaskComponent({ task }: TaskProps) {
  return (
    <div
      className="bg-blue-500 text-white rounded-lg p-2 my-1"
      style={{
        gridColumnStart: task.startDate.getDay() + 1,
        gridColumnEnd: task.endDate.getDay() + 2,
      }}
    >
      {task.name}
    </div>
  );
}
