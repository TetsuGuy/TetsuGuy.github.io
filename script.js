import { defaultAnimeList, getNewAnime } from "./animelist.js";
import { isValidURL } from "./utils.js";

window.onload = function() {
    // Load Anime List from localStorage or Default
    let animeList = JSON.parse(localStorage.getItem("animeList")) || defaultAnimeList;

    const animeGrid = document.getElementById('animeGrid');
    const dropZone = document.getElementById('dropZone');
    const btnNew = document.getElementById('btnNew');

    // Render Anime List
    function renderAnimeList() {
        animeGrid.innerHTML = "";
        animeList.forEach((anime, index) => {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            tile.dataset.index = index;
            tile.style.backgroundImage = `url(${anime.img})`
            tile.innerHTML = `
                <a href="${anime.link}" target="_blank">
                    <div class="overlay">${anime.title}</div>
                </a>
            `;
            // Add drag-and-drop functionality for updating tile image
            tile.addEventListener('dragover', event => {
                event.preventDefault();
                tile.classList.add('dragover');
            });
            tile.addEventListener('dragleave', () => {
                tile.classList.remove('dragover');
            });
            
            tile.addEventListener('drop', event => {
                event.preventDefault();
                tile.classList.remove('dragover');

                const file = event.dataTransfer.files[0];
                const droppedText = event.dataTransfer.getData("text");
                const isUrl = isValidURL(droppedText)

                if (file && file.type.startsWith("image/")) {
                    // Handle image drop
                    const reader = new FileReader();
                    reader.onload = () => {
                        animeList[index].img = reader.result; // Update image in anime list
                        saveAnimeList(); // Save to localStorage
                        renderAnimeList(); // Re-render grid
                    };
                    reader.readAsDataURL(file); // Read file as Base64
                } else if (isUrl) {
                    animeList[index].link = droppedText; // Update link in anime list
                    saveAnimeList(); // Save to localStorage
                    renderAnimeList(); // Re-render grid
                } else {
                    animeList[index].title = droppedText;
                    saveAnimeList();
                    renderAnimeList();
                }
            });

            const removeButton = document.createElement("button");
            removeButton.innerHTML = "❌";
            removeButton.classList.add("btn_remove");
            removeButton.title = "Anime entfernen";
            removeButton.addEventListener("click", () => {
                removeAnime(index);
                saveAnimeList();
                renderAnimeList();
            })
            tile.appendChild(removeButton);

            animeGrid.appendChild(tile);
        });
    }

    // Save Anime List to localStorage
    function saveAnimeList() {
        localStorage.setItem("animeList", JSON.stringify(animeList));
    }

    function removeAnime(index) {
        animeList.splice(index, 1);
    }

    // Add Anime From URL
    function addAnimeFromUrl(url) {
        const newAnime = getNewAnime();
        newAnime.link = url
        animeList.push(newAnime);
        saveAnimeList(); // Save updated list to localStorage
        renderAnimeList(); // Re-render the grid
    }

    // Drag-and-Drop Logic for Dropzone
    dropZone.addEventListener('dragover', event => {
        event.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', event => {
        event.preventDefault();
        dropZone.classList.remove('dragover');

        const url = event.dataTransfer.getData("text");
        if (url) {
            addAnimeFromUrl(url);
        } else {
            alert("Please drop a valid URL.");
        }
    });

    btnNew.addEventListener("click", () => {
        animeList.push(getNewAnime());
        renderAnimeList();
    })

    // Initial Render
    renderAnimeList();
}
