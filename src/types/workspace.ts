export type WorkspaceRole = 'owner' | 'inspector' | 'viewer';

export interface WorkspaceMember {
  uid: string;
  email: string;
  displayName: string;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  code: string;
  ownerId: string;
  ownerEmail: string;
  members: Record<string, WorkspaceMember>;
  createdAt: string;
  updatedAt: string;
}
