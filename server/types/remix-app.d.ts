import { User, Session } from 'lucia';

declare module 'react-router' {
  export interface AppLoadContext {
    user: User | null;
    session: Session | null;
  }
}
