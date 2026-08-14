import { IpcService } from '../ipc-service';
import { Api } from './api';

const ipcService = new IpcService();

export const api = new Api(ipcService);

export type RendererApi = typeof api;
