import { defaultAnimeList, getNewAnime } from "./animelist.js";
import { isValidURL } from "./utils.js";
import Database from "./database.js";

window.onload = function() {
    let animeList = [];

    const animeGrid = document.getElementById('animeGrid');
    const dropZone = document.getElementById('dropZone');
    const btnNew = document.getElementById('btnNew');

    // Load anime list from IndexedDB
    function loadAnimeList() {
        return Database.getAllAnime()
            .then((list) => {
                animeList = list.length ? list : defaultAnimeList;
            })
            .catch((error) => {
                console.error("Error loading anime list:", error);
                animeList = defaultAnimeList;
            });
    }

    // Save anime list to IndexedDB
    function saveAnimeList() {
        Database.saveAllAnime(animeList)
            .then(() => console.log("Anime list saved."))
            .catch((error) => console.error("Error saving anime list:", error));
    }

    // Render the anime list
    function renderAnimeList() {
        animeGrid.innerHTML = "";
        animeList.forEach((anime, index) => {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            tile.dataset.index = index;

            // Retrieve the image from IndexedDB and set it as the background
            if (anime.img) {
                Database.loadImage(anime.img)
                    .then((imageBlob) => {
                        tile.style.backgroundImage = `url(${imageBlob || ""})`;
                    })
                    .catch(() => {
                        tile.style.backgroundImage = `url('default-image.png')`; // Fallback image
                    });
            } else {
                tile.style.backgroundImage = `url('default-image.png')`; // Fallback image
            }

            tile.innerHTML = `
                <a href="${anime.link}" target="_blank">
                    <div class="overlay">${anime.title}</div>
                </a>
            `;

            // Drag-and-drop handling for tiles
            tile.addEventListener('dragover', (event) => {
                event.preventDefault();
                tile.classList.add('dragover');
            });

            tile.addEventListener('dragleave', () => {
                tile.classList.remove('dragover');
            });

            tile.addEventListener('drop', (event) => {
                event.preventDefault();
                tile.classList.remove('dragover');

                const file = event.dataTransfer.files[0];
                const droppedText = event.dataTransfer.getData("text");
                const isUrl = isValidURL(droppedText);

                if (file && file.type.startsWith("image/")) {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const id = `img-${Date.now()}`;
                        const imageBlob = reader.result;

                        Database.saveImage(id, imageBlob)
                            .then(() => {
                                animeList[index].img = id;
                                saveAnimeList();
                                renderAnimeList();
                            })
                            .catch((error) => console.error("Error saving image:", error));
                    };
                    reader.readAsDataURL(file);
                } else if (isUrl) {
                    animeList[index].link = droppedText;
                    saveAnimeList();
                    renderAnimeList();
                } else {
                    animeList[index].title = droppedText;
                    saveAnimeList();
                    renderAnimeList();
                }
            });

            // Remove button
            const removeButton = document.createElement("button");
            removeButton.innerHTML = "❌";
            removeButton.classList.add("btn_remove");
            removeButton.title = "Remove Anime";
            removeButton.addEventListener("click", () => {
                animeList.splice(index, 1);
                saveAnimeList();
                renderAnimeList();
            });
            tile.appendChild(removeButton);

            animeGrid.appendChild(tile);
        });
    }

    // Add a new anime
    function addAnimeFromUrl(url) {
        const newAnime = getNewAnime();
        newAnime.link = url;
        animeList.push(newAnime);
        saveAnimeList();
        renderAnimeList();
    }

    // Drag-and-drop handling for the drop zone
    dropZone.addEventListener('dragover', (event) => {
        event.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (event) => {
        event.preventDefault();
        dropZone.classList.remove('dragover');

        const url = event.dataTransfer.getData("text");
        if (url) {
            addAnimeFromUrl(url);
        } else {
            alert("Please drop a valid URL.");
        }
    });

    // Add a new empty anime
    btnNew.addEventListener("click", () => {
        animeList.push(getNewAnime());
        saveAnimeList();
        renderAnimeList();
    });

    // Initialize the database and load the anime list
    Database.init()
        .then(() => loadAnimeList())
        .then(() => renderAnimeList())
        .catch((error) => console.error("Initialization failed:", error));
};
