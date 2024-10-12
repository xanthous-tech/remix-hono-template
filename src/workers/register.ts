// import workers that will run along the main server here.
import emailWorker from './email';

export const workers = [emailWorker];