
export enum TaskStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  DONE = 'DONE',
  FAILED = 'FAILED',
}

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskComment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

export interface Artifact {
  id: string;
  type: 'code' | 'log' | 'json' | 'link';
  label: string;
  content: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  dependencies: string[];
  owner?: string;
  duration?: string;
  lastUpdated?: string;
  subtasks?: SubTask[];
  comments?: TaskComment[];
  artifacts?: Artifact[];
  priority?: PriorityLevel;
}

export interface WorkflowTemplate {
  name: string;
  description: string;
  tasks: Task[];
}
