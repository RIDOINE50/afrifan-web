import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface AfrifanDB extends DBSchema {
  // ✅ Stockage pour les ACHATS (Déjà en place)
  purchased_files: {
    key: string;
    value: { productId: string; fileName: string; mediaType: string; blob: Blob; downloadedAt: number };
  };
  // ✅ Stockage pour les TÉLÉCHARGEMENTS DE POSTS (Nouveau)
  downloaded_posts: {
    key: string; // postId
    value: { 
      postId: string; 
      fileName: string; 
      mediaType: string; 
      blob: Blob; 
      downloadedAt: number;
      creatorName?: string;
      caption?: string;
    };
  };
}

let dbInstance: IDBPDatabase<AfrifanDB> | null = null;

async function getDB() {
  if (dbInstance) return dbInstance;
  
  dbInstance = await openDB<AfrifanDB>('afrifan_db', 2, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('purchased_files')) {
        db.createObjectStore('purchased_files', { keyPath: 'productId' });
      }
      if (!db.objectStoreNames.contains('downloaded_posts')) {
        db.createObjectStore('downloaded_posts', { keyPath: 'postId' });
      }
    },
  });
  
  return dbInstance;
}

// ==========================================
// ✅ GESTION DES ACHATS (Ne pas toucher, ça marche)
// ==========================================
export async function savePurchasedFile(productId: string, fileName: string, mediaType: string, blob: Blob) {
  const db = await getDB();
  await db.put('purchased_files', { productId, fileName, mediaType, blob, downloadedAt: Date.now() });
}

export async function getAllPurchasedFiles() {
  const db = await getDB();
  const files = await db.getAll('purchased_files');
  return files.sort((a, b) => b.downloadedAt - a.downloadedAt);
}

export async function deletePurchasedFile(productId: string) {
  const db = await getDB();
  await db.delete('purchased_files', productId);
}

export async function getPurchasedFileUrl(productId: string): Promise<string | null> {
  const db = await getDB();
  const file = await db.get('purchased_files', productId);
  return file ? URL.createObjectURL(file.blob) : null;
}

// ==========================================
// ✅ GESTION DES TÉLÉCHARGEMENTS DE POSTS (Pour /downloads)
// ==========================================
export async function saveDownloadedPost(
  postId: string, 
  fileName: string, 
  mediaType: string, 
  blob: Blob, 
  creatorName?: string, 
  caption?: string
) {
  const db = await getDB();
  await db.put('downloaded_posts', { 
    postId, 
    fileName, 
    mediaType, 
    blob, 
    downloadedAt: Date.now(),
    creatorName,
    caption
  });
}

export async function getDownloadedPosts() {
  const db = await getDB();
  const posts = await db.getAll('downloaded_posts');
  return posts.sort((a, b) => b.downloadedAt - a.downloadedAt);
}

export async function deleteDownloadedPost(postId: string) {
  const db = await getDB();
  await db.delete('downloaded_posts', postId);
}

export async function getDownloadedPostUrl(postId: string): Promise<string | null> {
  const db = await getDB();
  const post = await db.get('downloaded_posts', postId);
  return post ? URL.createObjectURL(post.blob) : null;
}