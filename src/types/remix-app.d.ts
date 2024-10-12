import { User, Session } from 'lucia';

declare module '@remix-run/server-runtime' {
  export interface AppLoadContext {
    user: User | null;
    session: Session | null;
  }
}
