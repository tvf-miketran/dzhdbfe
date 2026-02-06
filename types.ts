
export enum Page {
  DASHBOARD = 'dashboard',
  RESOURCES = 'resources',
  PROJECTS = 'projects',
  LOGTICKETS = 'logtickets',
  TIMESHEETS = 'timesheets',
  SETTINGS = 'settings',
  FORMULACONFIG = 'formulaconfig',
  PROFILE = 'profile'
}

export interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  isUp?: boolean;
  subtitle?: string;
  icon: string;
  colorClass: string;
  progress: number;
}

export interface Ticket {
  id: string;
  title: string;
  code: string;
  due: string;
  status: 'In Progress' | 'Urgent' | 'Done';
  assignees: string[];
  type: 'bug' | 'code' | 'check';
}
export interface TicketEntry {
  id: string;
  ticketId: string;
  projectName: string;
  type: string;
  role: string;
  status: 'Open' | 'Closed' | 'InQA';
  timestamp: string;
}