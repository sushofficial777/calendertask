
export type TaskCategory = "To Do" | "In Progress" | "Review" | "Completed";

export interface Task {
  id: string;
  name: string;
  category: TaskCategory;
  startDate: Date;
  endDate: Date;
  isEnd?:Boolean;
  isStart?:Boolean;
  isContinue:Boolean;
}
