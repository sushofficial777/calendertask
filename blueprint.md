# Month View Task Planner

## Overview

A simplified, calendar-inspired task planner with a fixed month view. Users can create, reschedule, and categorize tasks with drag-and-drop functionality.

## Features

*   **Calendar:** A fixed month view displaying the days as a grid.
*   **Task Creation:** Drag across consecutive days to create a new task. A modal will prompt for a task name and category.
*   **Task Rescheduling:** Drag and drop tasks to different dates.
*   **Task Resizing:** Adjust the start and end dates of a task by dragging its edges.
*   **Task Categorization:** Assign one of the following categories to tasks:
    *   To Do
    *   In Progress
    *   Review
    *   Completed
*   **Filtering:** Filter the displayed tasks by category.
*   **Styling:** A clean and modern UI with a focus on usability and aesthetics.

## Implementation Plan

1.  **Dependencies:** Install necessary libraries for drag-and-drop (`@dnd-kit/core`, `@dnd-kit/sortable`) and date manipulation (`date-fns`).
2.  **Project Structure:**
    *   Create a `components` directory for UI components (`Calendar`, `Task`, `TaskModal`).
    *   Create a `lib` directory for types and state management.
3.  **State Management:** Use React's built-in state management (useState, useReducer, useContext) to manage tasks in memory.
4.  **Component Development:**
    *   **`Calendar`:** The main component to render the month grid and handle task interactions.
    *   **`Task`:** A component to display individual tasks.
    *   **`TaskModal`:** A modal for creating and editing tasks.
5.  **Styling:** Use Tailwind CSS for styling and adhere to the design principles outlined in the project's `GEMINI.md` file.
6.  **Functionality:**
    *   Implement the calendar grid logic using `date-fns`.
    *   Integrate `@dnd-kit` for drag-and-drop functionality.
    *   Build the task creation and editing flow.
    *   Add filtering controls.
