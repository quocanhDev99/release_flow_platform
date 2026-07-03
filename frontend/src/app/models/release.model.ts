export interface Repository {
  id: number;
  name: string;
  gitUrl?: string;
  createdAt: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface ReleaseStream {
  id: number;
  version: string;
  status: 'active' | 'completed' | 'archived';
  createdAt: string;
}

export interface Environment {
  id: number;
  name: string;
  description?: string;
}

export interface Build {
  id: number;
  buildNumber?: string;
  buildUrl?: string;
  status: 'SUCCESS' | 'FAILED' | 'BUILDING';
  builtAt: string;
  environment: Environment;
  environmentId: number;
}

export interface Ticket {
  id: number;
  ticketId: string;
  summary?: string;
  changeType: 'Feature' | 'Fix bug' | 'Enhance';
  qcStatus: string; // 'waiting for QC test', 'ready for QC', 'passed', 'failed'
  pendingIssues?: string;
  createdAt: string;
  updatedAt: string;
  deploymentItemId: number;
}

export interface DeploymentItem {
  id: number;
  sourceBranch: string;
  status: 'merged' | 'pending' | 'closed';
  isMergedOnDevel: boolean;
  mergedAt: string;
  createdAt: string;
  updatedAt: string;
  repository: Repository;
  repositoryId: number;
  user: User;
  userId: number;
  releaseStream?: ReleaseStream;
  releaseStreamId?: number;
  tickets: Ticket[];
  builds: Build[];
}
