'use client'
import { Task, TaskCategory } from "@/app/lib/types";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, startOfDay } from "date-fns";

interface TaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  editingTask: Task | null;
  onSave: (task: Omit<Task, 'id'>) => void;
  onDelete?: () => void;
}

export default function TaskModal({ open, onOpenChange, selectedDate, editingTask, onSave, onDelete }: TaskModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<TaskCategory>("To Do");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (open) {
      if (editingTask) {
        // Populate form with editing task data
        setName(editingTask.name);
        setCategory(editingTask.category);
        setStartDate(format(editingTask.startDate, 'yyyy-MM-dd'));
        setEndDate(format(editingTask.endDate, 'yyyy-MM-dd'));
      } else if (selectedDate) {
        // Populate with selected date for new task
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        setStartDate(dateStr);
        setEndDate(dateStr);
        setName("");
        setCategory("To Do");
      }
    }
  }, [selectedDate, editingTask, open]);

  const handleSave = () => {
    if (!name.trim() || !startDate || !endDate) {
      return;
    }

    let start = startOfDay(new Date(startDate));
    let end = startOfDay(new Date(endDate));

    // Ensure end date is after or equal to start date
    if (end < start) {
      [start, end] = [end, start];
    }

    onSave({
      name,
      category,
      startDate: start,
      endDate: end,
      isContinue:false
    });

    // Reset form
    setName("");
    setCategory("To Do");
    setStartDate("");
    setEndDate("");
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setName("");
      setCategory("To Do");
      setStartDate("");
      setEndDate("");
    }
    onOpenChange(newOpen);
  };

  const handleDelete = () => {
    if (onDelete && editingTask) {
      onDelete();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]  ">
        <DialogHeader>
          <DialogTitle>{editingTask ? 'Edit Task' : 'Create Task'}</DialogTitle>
          <DialogDescription>
            {editingTask 
              ? 'Update your task details and date range.' 
              : 'Add a new task with a date range to your calendar.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4  ">
          <div className="grid gap-2">
            <Label htmlFor="name">Task Name</Label>
            <Input
              id="name"
              placeholder="Enter task name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={category}
              onChange={(e) => setCategory(e.target.value as TaskCategory)}
            >
              <option>To Do</option>
              <option>In Progress</option>
              <option>Review</option>
              <option>Completed</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
            />
          </div>
        </div>
        <DialogFooter>
          {editingTask && onDelete && (
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              className="mr-auto"
            >
              Delete
            </Button>
          )}
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || !startDate || !endDate}>
            {editingTask ? 'Update Task' : 'Save Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
