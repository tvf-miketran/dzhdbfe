import { MetricCardProps, Ticket, TicketEntry } from '../types';

type ProjectStatus = 'Active' | 'On Hold' | 'Completed';

export interface Project {
  id: string;
  name: string;
  pm: string;
  status: ProjectStatus;
  updatedAt: string;
}

export const METRICS_MOCK: MetricCardProps[] = [
  { title: 'Total Headcount', value: '142', change: '2%', isUp: true, icon: 'group', colorClass: 'text-primary', progress: 78 },
  { title: 'Project Health', value: '96%', subtitle: 'Healthy', icon: 'health_and_safety', colorClass: 'text-emerald-500', progress: 96 },
  { title: 'Avg KPI Score', value: '8.7', change: '+0.3', subtitle: '/ 10', icon: 'military_tech', colorClass: 'text-purple-500', progress: 87 },
  { title: 'Billable Hours', value: '12.5k', subtitle: 'hrs', icon: 'attach_money', colorClass: 'text-blue-400', progress: 65 },
];

export const PERFORMANCE_MOCK = [
  { month: 'Aug', value: 40 },
  { month: 'Sep', value: 55 },
  { month: 'Oct', value: 50 },
  { month: 'Nov', value: 80 },
  { month: 'Dec', value: 70 },
  { month: 'Jan', value: 90 },
];

export const TICKETS_MOCK: Ticket[] = [
  { id: 'ODC-204', title: 'Fix Login Auth Bug', code: 'ODC-204', due: 'Due in 2 days', status: 'In Progress', assignees: ['u1', 'u2'], type: 'bug' },
  { id: 'ODC-319', title: 'API Integration for Dashboard', code: 'ODC-319', due: 'Due Today', status: 'Urgent', assignees: ['u3'], type: 'code' },
  { id: 'ODC-112', title: 'Unit Testing Implementation', code: 'ODC-112', due: 'Completed', status: 'Done', assignees: ['u4'], type: 'check' },
];

export const PROJECTS_MOCK: Project[] = [
  { id: 'PRJ-101', name: 'Alpha ODC Platform', pm: 'Emily Blunt', status: 'Active', updatedAt: 'Feb 02, 2026' },
  { id: 'PRJ-102', name: 'Beta FinTech API', pm: 'David Kim', status: 'On Hold', updatedAt: 'Jan 28, 2026' },
  { id: 'PRJ-103', name: 'Gamma Mobile Suite', pm: 'Sarah Chen', status: 'Active', updatedAt: 'Feb 04, 2026' },
  { id: 'PRJ-104', name: 'Delta Analytics', pm: 'Mike Ross', status: 'Completed', updatedAt: 'Jan 19, 2026' },
];

export const USER_PROJECTS_MOCK: Array<{ id: string; name: string }> = [
  { id: 'UP-101', name: 'E-Commerce Platform' },
  { id: 'UP-102', name: 'Mobile App' },
  { id: 'UP-103', name: 'CRM System' },
  { id: 'UP-104', name: 'Dashboard' },
  { id: 'UP-105', name: 'Internal HR Tool' },
  { id: 'UP-106', name: 'Payments Gateway' },
];

export const PROJECT_LIST_MOCK: string[] = [
  'Alpha Banking Portal',
  'Cloud Migration II',
  'Mobile App Refresh',
  'Internal HR Tool',
  'E-commerce Engine',
];

export const TICKET_TYPES_MOCK: string[] = ['Bug Fix', 'Feature', 'Refactor', 'Hotfix', 'Research'];
export const ROLES_MOCK: string[] = ['Senior Dev', 'Junior Dev', 'QA Lead', 'UX Designer', 'Team Lead'];

export const TICKET_ENTRIES_MOCK: TicketEntry[] = [
  { id: '1', ticketId: 'ODC-120', projectName: 'Alpha Banking Portal', type: 'Feature', role: 'Senior Dev', status: 'InQA', timestamp: '2023-10-01' },
  { id: '2', ticketId: 'ODC-341', projectName: 'Mobile App Refresh', type: 'Bug Fix', role: 'QA Lead', status: 'Closed', timestamp: '2023-10-02' },
];
