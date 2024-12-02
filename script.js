import { isValidURL } from "./utils.js";
import Database from "./database.js";

const ANIM_BETWEEN_TIME = 250;

const getNewAnime = () => (
    { 
        title: "", 
        img: "", 
        link: ""
    }
)

window.onload = function() {
    let animeList = [];
    const animeGrid = document.getElementById('animeGrid');

    const dropZone = document.getElementById('dropZone');
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

    const btnNew = document.getElementById('btnNew');
    // Add a new empty anime
    btnNew.addEventListener("click", () => {
        animeList.push(getNewAnime());
        saveAnimeList();
        renderAnimeList();
    });

    // Load anime list from IndexedDB
    function loadAnimeList() {
        return Database.getAllAnime()
            .then((list) => {
                animeList = list.length ? list : [];
            })
            .catch((error) => {
                console.error("Error loading anime list:", error);
                animeList = [];
            });
    }

    // Save anime list to IndexedDB
    function saveAnimeList() {
        Database.saveAllAnime(animeList)
            .then(() => console.log("Anime list saved."))
            .catch((error) => console.error("Error saving anime list:", error));
    }

    // Render the anime list
    function renderAnimeList(fadeIn = false) {
        animeGrid.innerHTML = "";
        animeList.forEach((anime, index) => {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            tile.dataset.index = index;

            // Retrieve the image from IndexedDB and set it as the background
            if (anime.img) {
                Database.loadImage(anime.img)
                    .then((imageBlob) => {
                        if (imageBlob && imageBlob.type.startsWith("image/")) {
                            const imageURL = URL.createObjectURL(imageBlob);
                            tile.style.backgroundImage = `url(${imageURL})`;
                        } else {
                            console.warn("Invalid Blob data:", imageBlob);
                            tile.style.backgroundImage = `url('default-image.png')`; // Fallback image
                        }
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

            tile.addEventListener("mouseleave", () => {
                const result = animateTile(tile, "shuffle-anim")
                setTimeout(() => {
                    result.remove();
                }, 2000)
            })

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
                        Database.saveImage(id, file) // Save the raw Blob directly
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

            if (fadeIn) {
                tile.style.setProperty("opacity", 0);
                const result = animateTile(tile, "fade-in-anim", index * ANIM_BETWEEN_TIME);
                setTimeout(() =>{
                    result.remove();
                    tile.style.setProperty("opacity", 1);
                }, 1000+index * ANIM_BETWEEN_TIME)
            }

            setInterval(() => {
                animateTile(tile, "shuffle-anim", index * ANIM_BETWEEN_TIME);
            }, 60000);

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
        })
    }

    // Add a new anime
    function addAnimeFromUrl(url) {
        const newAnime = getNewAnime();
        newAnime.link = url;
        animeList.push(newAnime);
        saveAnimeList();
        renderAnimeList();
    }

    function animateTile(tile, animation, delayTime = 0) {
        if (tile.classList.contains(animation)) {
            return
        }
        tile.classList.add(animation);
        tile.style.setProperty("--animation-delay", `${delayTime}ms`);
        return { remove() {
            tile.classList.remove(animation)
        }}
    }

    // Initialize the database and load the anime list
    Database.init()
    .then(() => loadAnimeList())
    .then(() => renderAnimeList(true))
    .catch((error) => console.error("Initialization failed:", error));
};
