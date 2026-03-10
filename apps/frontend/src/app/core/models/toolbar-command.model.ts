export type ToolbarCommandType = 'button' | 'separator';

export interface ToolbarCommand {
  type?: ToolbarCommandType;
  id?: string;
  icon?: string;
  tooltip?: string;
  enabled?: boolean;
  visible?: boolean;
  action?: () => void;
}
