document.addEventListener("DOMContentLoaded", () => {
    const fileForm = document.getElementById("file-form");
    const fileSelect = document.getElementById("file-select");
    const processAllButton = document.getElementById("process-all");
    const versesTable = document.getElementById("verses-table");
    const versesTableBody = versesTable.querySelector("tbody");

    async function loadVerses(file) {
        const response = await fetch("/load_verses", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `file=${encodeURIComponent(file)}`,
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.verses;
    }

    async function processVerse(verseId, reprocess, file) {
        const response = await fetch("/process_verse", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `id=${encodeURIComponent(verseId)}&reprocess=${reprocess}&file=${encodeURIComponent(file)}`,
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();
        alert(data.message);
    }

    async function processAll(file, verses) {
        const unprocessedVerses = verses.filter((verse) => verse.status !== "Processed");

        processAllButton.disabled = true;
        processAllButton.textContent = "Processing...";

        try {
            for (const verse of unprocessedVerses) {
                await processVerse(verse.id, false, file);
            }

            alert("All unprocessed verses have been processed!");
        } catch (error) {
            alert(error.message);
        } finally {
            processAllButton.disabled = false;
            processAllButton.textContent = "Process All";
        }

        // Refresh the table after processing
        fileForm.dispatchEvent(new Event("submit"));
    }

    fileForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const file = fileSelect.value;

        if (!file) {
            alert("Please select a file.");
            return;
        }

        try {
            const verses = await loadVerses(file);
            versesTableBody.innerHTML = "";

            const firstEntry = verses[0];
            const book_chapter = `${firstEntry.book.charAt(0).toUpperCase() + firstEntry.book.slice(1)} ${firstEntry.chapter}`;
            document.getElementById("book").textContent = book_chapter;

            verses.forEach((verse) => {
                const isProcessed = verse.status === "Processed";
                const audioPath = isProcessed ? `/static/audio/${verse.audio}` : "";

                const row = document.createElement("tr");
                row.classList.add("hover:bg-gray-50");
                row.innerHTML = `
                    <td class="border border-gray-200 px-4 py-2">${verse.verse_num}</td>
                    <td class="border border-gray-200 px-4 py-2">${verse.verse}</td>
                    <td class="border border-gray-200 px-4 py-2">${verse.status}</td>
                    <td class="border border-gray-200 px-4 py-2">
                        <button class="process-btn px-3 py-1 text-sm text-white ${
                            isProcessed ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-500 hover:bg-green-600"
                        } rounded-md focus:outline-none" data-id="${verse.id}" ${
                        isProcessed ? "data-reprocess=true" : ""
                    }>
                            ${isProcessed ? "Reprocess" : "Process"}
                        </button>
                    </td>
                    <td class="border border-gray-200 px-4 py-2">
                        ${
                            isProcessed
                                ? `<audio controls class="w-full"><source src="${audioPath}" type="audio/mpeg"></audio>`
                                : ""
                        }
                    </td>
                `;
                versesTableBody.appendChild(row);
            });

            processAllButton.disabled = !verses.some((verse) => verse.status !== "Processed");
            versesTable.classList.remove("hidden");
        } catch (error) {
            alert(error.message);
        }
    });

    versesTableBody.addEventListener("click", async (event) => {
        if (event.target.classList.contains("process-btn")) {
            const button = event.target;
            const verseId = button.getAttribute("data-id");
            const reprocess = button.getAttribute("data-reprocess") === "true";
            const file = fileSelect.value;

            try {
                await processVerse(verseId, reprocess, file);
                fileForm.dispatchEvent(new Event("submit"));
            } catch (error) {
                alert(error.message);
            }
        }
    });

    processAllButton.addEventListener("click", async () => {
        const file = fileSelect.value;

        if (!file) {
            alert("Please select a file.");
            return;
        }

        try {
            const verses = await loadVerses(file);
            await processAll(file, verses);
        } catch (error) {
            alert(error.message);
        }
    });
});
