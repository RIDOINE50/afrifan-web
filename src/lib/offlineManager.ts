// src/lib/offlineManager.ts

const DB_NAME = 'AfrifanOfflineDB';
const STORE_NAME = 'downloaded_posts';

// 1. Initialiser la base de données (Équivalent de Hive.openBox)
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

// 2. Télécharger et sauvegarder le média + les métadonnées
export const downloadForOffline = async (postId: string, mediaUrl: string, postData: any) => {
  try {
    console.log('⬇️ [DOWNLOAD] Récupération du média pour:', postId);
    
    // Récupérer le fichier sous forme de Blob (donnée binaire brute)
    const response = await fetch(mediaUrl);
    if (!response.ok) throw new Error('Échec du réseau');
    const blob = await response.blob();

    // Préparer les données à sauvegarder
    const enrichedPost = {
      ...postData,
      id: postId,
      mediaBlob: blob, // Le fichier est stocké ici, invisible pour l'utilisateur
      downloadedAt: new Date().toISOString(),
    };

    // Sauvegarder dans IndexedDB
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    await new Promise((resolve, reject) => {
      const request = store.put(enrichedPost);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });

    console.log('✅ [DOWNLOAD] Sauvegardé avec succès dans le stockage local.');
    return true;
  } catch (error) {
    console.error('❌ [DOWNLOAD] Erreur critique:', error);
    return false;
  }
};

// 3. Récupérer tous les posts téléchargés (pour ton écran "Mes téléchargements")
export const getDownloadedPosts = async () => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise<any[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const posts = request.result;
        // Convertir le Blob stocké en URL lisible par les balises <img> ou <video>
        const postsWithUrls = posts.map((post: any) => ({
          ...post,
          localUrl: post.mediaBlob ? URL.createObjectURL(post.mediaBlob) : post.media_url,
        }));
        resolve(postsWithUrls);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ [INDEXEDDB] Erreur:', error);
    return [];
  }
};

// ✅ 4. Supprimer un post téléchargé (C'EST CETTE FONCTION QUI MANQUAIT !)
export const deleteDownloadedPost = async (postId: string) => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    await new Promise((resolve, reject) => {
      const request = store.delete(postId);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
    console.log('🗑️ [DELETE] Post supprimé du stockage local:', postId);
    return true;
  } catch (error) {
    console.error('❌ [DELETE] Erreur:', error);
    return false;
  }
};