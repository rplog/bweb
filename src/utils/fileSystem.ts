export type FileType = 'file' | 'directory';

export interface FileSystemNode {
  type: FileType;
  content?: string;
  children?: { [key: string]: FileSystemNode };
}

export const initialFileSystem: { [key: string]: FileSystemNode } = {
  home: {
    type: 'directory',
    children: {
      neo: {
        type: 'directory',
        children: {
          'welcome.txt': {
            type: 'file',
            content: 'Welcome to Neosphere v2.0. Type "help" to get started.',
          },
          gallery: {
            type: 'directory',
            children: {
              'photos.db': { type: 'file', content: 'Binary data...' }
            },
          },
          about: {
            type: 'directory',
            children: {
              'me.txt': {
                type: 'file',
                content: 'I am a full-stack developer based in the Matrix.',
              },
            },
          },
          contact: {
            type: 'directory',
            children: {
              'email.txt': {
                type: 'file',
                content: 'neo@example.com',
              },
            },
          },
        },
      },
    },
  },
};
