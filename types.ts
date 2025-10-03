
export enum Tab {
  GENERATE = 'GENERATE',
  EDIT = 'EDIT',
  COMPOSE = 'COMPOSE',
}

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export interface ImageFile {
  id: number;
  file: File;
  preview: string;
}
