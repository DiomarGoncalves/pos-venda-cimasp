import { FichaTecnica } from '../types';

export const getFichasTecnicas = async (): Promise<FichaTecnica[]> => {
  return await window.electronAPI.getFichasTecnicas();
};
