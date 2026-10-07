import { Profile, Department } from '../types';

export const REAL_MEMBERS: Profile[] = [];

export const REAL_DEPARTMENTS: Department[] = [
  {
    id: 'dept-dev',
    name: 'Development',
    code: 'dev',
    description: 'Hardware firmware, edge vision models, and camera pipelines',
    color: '#3b82f6',
    status: 'Operational',
    member_count: 0
  },
  {
    id: 'dept-ops',
    name: 'Operations',
    code: 'ops',
    description: 'Hardware tooling, vendor logistics, supply chain and deployment',
    color: '#a3a3a3',
    status: 'Operational',
    member_count: 0
  },
  {
    id: 'dept-mkt',
    name: 'Marketing & Design',
    code: 'mkt',
    description: 'Brand identity, enterprise client acquisition, and launch campaigns',
    color: '#ec4899',
    status: 'Operational',
    member_count: 0
  },
  {
    id: 'dept-fin',
    name: 'Finance',
    code: 'fin',
    description: 'Institutional capital, grants, budgets, and treasury management',
    color: '#f59e0b',
    status: 'Operational',
    member_count: 0
  },
  {
    id: 'dept-exec',
    name: 'Executive',
    code: 'exec',
    description: 'Company-wide strategic alignment, corporate governance, and capital allocation',
    color: '#d4af37',
    status: 'Operational',
    member_count: 1
  }
];
