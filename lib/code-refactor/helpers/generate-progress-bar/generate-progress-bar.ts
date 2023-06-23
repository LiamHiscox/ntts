import ProgressBar from 'progress';

export const generateProgressBar = (total: number): ProgressBar => {
  return new ProgressBar('[:bar] :current/:total', { total, incomplete: ' ' });
}
