
export interface CpuTaskOnEcs{
  githubRepo: string;
  githubOwner: string;
  githubBranch: string;
  containerPort: number;
  cpu: number;
  memoryLimitMiB: number;
}
