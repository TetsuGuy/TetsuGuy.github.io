const Database = (() => {
    let db = null;

    const init = () => {
        return new Promise((resolve, reject) => {
            const dbRequest = indexedDB.open("AnimeDatabase", 1);

            dbRequest.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains("images")) {
                    db.createObjectStore("images", { keyPath: "id" });
                }
                if (!db.objectStoreNames.contains("animeList")) {
                    db.createObjectStore("animeList", { keyPath: "id" });
                }
            };

            dbRequest.onsuccess = (event) => {
                db = event.target.result;
                resolve();
            };

            dbRequest.onerror = (event) => {
                reject(event.target.error);
            };
        });
    };

    const saveImage = (id, imageBlob) => {
        const transaction = db.transaction("images", "readwrite");
        const store = transaction.objectStore("images");
        return store.put({ id, imageBlob });
    };

    const loadImage = (id) => {
        const transaction = db.transaction("images", "readonly");
        const store = transaction.objectStore("images");
        return store.get(id).then((result) => result?.imageBlob || null);
    };

    const saveAllAnime = (animeList) => {
        const transaction = db.transaction("animeList", "readwrite");
        const store = transaction.objectStore("animeList");
        return store.put({ id: "animeList", data: animeList });
    };

    const getAllAnime = () => {
        const transaction = db.transaction("animeList", "readonly");
        const store = transaction.objectStore("animeList");
        return store.get("animeList").then((result) => result?.data || []);
    };

    return {
        init,
        saveImage,
        loadImage,
        saveAllAnime,
        getAllAnime,
    };
})();

export default Database;
