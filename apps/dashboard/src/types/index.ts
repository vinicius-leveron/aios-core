// Leveron CRM - Imobiliárias
// Types for real estate CRM platform

import type { IconName } from '@/lib/icons';

// ============ Sidebar Types ============

export type SidebarView =
  | 'dashboard'
  | 'leads'
  | 'imoveis'
  | 'pipeline'
  | 'cadences'
  | 'domains'
  | 'settings';

export interface SidebarItem {
  id: SidebarView;
  label: string;
  icon: IconName;
  href: string;
  shortcut?: string;
}

// ============ Sidebar Config ============

export const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: '/outbound', shortcut: 'D' },
  { id: 'leads', label: 'Leads', icon: 'users', href: '/outbound/leads', shortcut: 'L' },
  { id: 'imoveis', label: 'Imóveis', icon: 'building', href: '/outbound/imoveis', shortcut: 'I' },
  { id: 'pipeline', label: 'Pipeline', icon: 'target', href: '/outbound/pipeline', shortcut: 'P' },
  { id: 'cadences', label: 'Cadências', icon: 'mail', href: '/outbound/cadences', shortcut: 'C' },
  { id: 'domains', label: 'Domínios', icon: 'globe', href: '/outbound/domains', shortcut: 'M' },
  { id: 'settings', label: 'Configurações', icon: 'settings', href: '/outbound/settings', shortcut: 'S' },
];

// ============ Legacy types kept for compatibility ============

export type StoryStatus =
  | 'backlog'
  | 'in_progress'
  | 'ai_review'
  | 'human_review'
  | 'pr_created'
  | 'done'
  | 'error';

export type StoryComplexity = 'simple' | 'standard' | 'complex';
export type StoryPriority = 'low' | 'medium' | 'high' | 'critical';
export type StoryCategory = 'feature' | 'fix' | 'refactor' | 'docs';
export type StoryType = 'epic' | 'story';

export interface Story {
  id: string;
  title: string;
  description: string;
  status: StoryStatus;
  type?: StoryType;
  epicId?: string;
  complexity?: StoryComplexity;
  priority?: StoryPriority;
  category?: StoryCategory;
  agentId?: AgentId;
  progress?: number;
  acceptanceCriteria?: string[];
  technicalNotes?: string;
  filePath: string;
  createdAt: string;
  updatedAt: string;
}

export type AgentId = 'dev' | 'qa' | 'architect' | 'pm' | 'po' | 'analyst' | 'devops';
export type AgentStatus = 'idle' | 'working' | 'waiting' | 'error';
export type AgentPhase = 'planning' | 'coding' | 'testing' | 'reviewing' | 'deploying';

export interface Agent {
  id: AgentId;
  name: string;
  icon: IconName;
  color: string;
  status: AgentStatus;
  currentStoryId?: string;
  phase?: AgentPhase;
  progress?: number;
  lastActivity?: string;
}

export interface Project {
  id: string;
  name: string;
  path: string;
}

export interface AiosStatus {
  version: string;
  updatedAt: string;
  connected: boolean;
  project: {
    name: string;
    path: string;
  } | null;
  activeAgent: {
    id: AgentId;
    name: string;
    activatedAt: string;
    currentStory?: string;
  } | null;
  session: {
    startedAt: string;
    commandsExecuted: number;
    lastCommand?: string;
  } | null;
  stories: {
    inProgress: string[];
    completed: string[];
  };
  rateLimit?: {
    used: number;
    limit: number;
    resetsAt?: string;
  };
}

export interface AgentConfig {
  name: string;
  icon: IconName;
  color: string;
}

export const AGENT_CONFIG: Record<AgentId, AgentConfig> = {
  dev: { name: 'Dev', icon: 'code', color: 'var(--agent-dev)' },
  qa: { name: 'QA', icon: 'test-tube', color: 'var(--agent-qa)' },
  architect: { name: 'Architect', icon: 'building', color: 'var(--agent-architect)' },
  pm: { name: 'PM', icon: 'bar-chart', color: 'var(--agent-pm)' },
  po: { name: 'PO', icon: 'target', color: 'var(--agent-po)' },
  analyst: { name: 'Analyst', icon: 'line-chart', color: 'var(--agent-analyst)' },
  devops: { name: 'DevOps', icon: 'wrench', color: 'var(--agent-devops)' },
};
