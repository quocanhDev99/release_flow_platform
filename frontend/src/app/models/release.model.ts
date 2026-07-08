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
  theme?: string;
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
  releaseVersion?: string;
  tickets: Ticket[];
  builds: Build[];
}

export interface ReleasePackage {
  id: number;
  version: string;
  buildArtifactHash?: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
  deploymentItems?: DeploymentItem[];
  bookings?: DeploymentBooking[];
}

export interface DeploymentPolicy {
  id: number;
  name: string;
  cronSchedule: string;
  targetEnvironment: string;
  capacityLimit: number;
  freezeWindow: number;
  createdAt: string;
  updatedAt: string;
  windows?: DeploymentWindow[];
}

export interface DeploymentWindow {
  id: number;
  startTime: string;
  endTime: string;
  freezeTime: string;
  capacity: number;
  status: 'open' | 'frozen' | 'executing' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  policyId?: number;
  policy?: DeploymentPolicy;
  environmentId: number;
  environment: Environment;
  bookings?: DeploymentBooking[];
}

export interface DeploymentBooking {
  id: number;
  bookedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  releasePackageId: number;
  releasePackage?: ReleasePackage;
  deploymentWindowId: number;
  deploymentWindow?: DeploymentWindow;
}
