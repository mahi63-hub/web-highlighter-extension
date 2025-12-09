function loadHighlights() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs[0].url

    chrome.storage.sync.get(["highlights"], (data) => {
      const items = data.highlights?.[url] || []
      const list = document.getElementById("list")
      list.innerHTML = ""

      items.forEach(h => {
        const div = document.createElement("div")
        div.className = "item"
        div.textContent = h.text

        div.addEventListener("click", () => {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: "SCROLL_TO",
            id: h.id
          })
        })

        list.appendChild(div)
      })
    })
  })
}

document.addEventListener("DOMContentLoaded", loadHighlights)
