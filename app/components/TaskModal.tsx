'use client'
import { Task, TaskCategory } from "@/app/lib/types";
import { useState } from "react";

interface TaskModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'startDate' | 'endDate'>) => void;
}

export default function TaskModal({ show, onClose, onSave }: TaskModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<TaskCategory>("To Do");

  if (!show) {
    return null;
  }

  const handleSave = () => {
    onSave({ name, category });
    setName("");
    setCategory("To Do");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Create Task</h2>
        <div className="mb-4">
          <label className="block mb-2">Task Name</label>
          <input
            type="text"
            className="w-full border rounded-lg p-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2">Category</label>
          <select
            className="w-full border rounded-lg p-2"
            value={category}
            onChange={(e) => setCategory(e.target.value as TaskCategory)}
          >
            <option>To Do</option>
            <option>In Progress</option>
            <option>Review</option>
            <option>Completed</option>
          </select>
        </div>
        <div className="flex justify-end">
          <button onClick={onClose} className="mr-2 px-4 py-2 bg-gray-200 rounded-lg">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white rounded-lg">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
