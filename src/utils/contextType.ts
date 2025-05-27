export enum ContextType {
  'video/mp4' = 'video/mp4',
  'video/webm' = 'video/webm',
  'video/ogg' = 'video/ogg',

  'application/octet-stream' = 'application/octet-stream',
}

export function getContextTypeByExtension(extension: string) {
  switch (extension) {
    case 'mp4':
      return ContextType['video/mp4'];

    case 'webm':
      return ContextType['video/webm'];

    case 'ogg':
      return ContextType['video/ogg'];

    default:
      return ContextType['application/octet-stream'];
  }
}
