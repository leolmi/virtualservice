export interface ScopeProperty {
  name: string;
  type?: string;
  description: string;
}

export interface ScopeExample {
  description: string;
  code: string;
  result?: string;
}

export interface ScopeVariable {
  name: string;
  type: string;
  description: string;
  /** Optional label shown as a badge, e.g. 'built-in', 'rules only' */
  tag?: string;
  /** Known sub-properties (e.g. params.userId, pathValue.id) */
  properties?: ScopeProperty[];
  examples?: ScopeExample[];
}

export interface ExpressionHelpContext {
  /** Shown in the header, e.g. "GET myservice/users/{id}" */
  title?: string;
  variables: ScopeVariable[];
}
