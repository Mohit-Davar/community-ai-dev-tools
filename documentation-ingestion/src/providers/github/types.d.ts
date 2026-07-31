export interface TreeItem {
  mode: string;
  path: string;
  sha: string;

  size?: number;
  type: "blob" | "tree" | "commit";
  url: string;
}

export interface ChangedFile {
  filename: string;
  sha: string | null;

  status:
    | "added"
    | "removed"
    | "modified"
    | "renamed"
    | "copied"
    | "changed"
    | "unchanged";
}
