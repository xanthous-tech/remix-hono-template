import { User, Session } from 'lucia';

declare module 'hono' {
  interface ContextVariableMap {
    user: User | null;
    session: Session | null;
  }
}
