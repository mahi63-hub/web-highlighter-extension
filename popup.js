let selectedId = null
let selectedUrl = null

function setColorInUI(c) {
  document.querySelectorAll(".color-btn").forEach(b => b.style.outline = b.dataset.color === c ? "2px solid #333" : "none")
  chrome.storage.sync.set({ selectedColor: c })
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return
    chrome.tabs.sendMessage(tabs[0].id, { type: "SET_COLOR", color: c })
  })
}

document.querySelectorAll(".color-btn").forEach(b => b.addEventListener("click", () => setColorInUI(b.dataset.color)))
chrome.storage.sync.get(["selectedColor"], (d) => {
  const c = (d && d.selectedColor) ? d.selectedColor : "yellow"
  setColorInUI(c)
})

function showNote(item) {
  selectedId = item.id
  selectedUrl = item.url
  document.getElementById("note-section").style.display = "block"
  document.getElementById("note-input").value = item.note || ""
}

function hideNote() {
  document.getElementById("note-section").style.display = "none"
  document.getElementById("note-input").value = ""
}

function deleteHighlight(id, url) {
  chrome.runtime.sendMessage({ type: "DELETE_HIGHLIGHT", id, url }, () => {
    load()
  })
}

function load() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs[0].url
    chrome.runtime.sendMessage({ type: "GET_HIGHLIGHTS_FOR_TAB", url }, (res) => {
      const items = (res && res.items) ? res.items : []
      const list = document.getElementById("list")
      list.innerHTML = ""
      items.forEach(h => {
        const wrapper = document.createElement("div")
        wrapper.className = "item"
        const txt = document.createElement("div")
        txt.className = "text"
        txt.textContent = h.text
        txt.style.background = h.color || "yellow"
        txt.style.padding = "6px"
        txt.style.borderRadius = "4px"
        wrapper.appendChild(txt)
        if (h.note && h.note.trim() !== "") {
          const viewBtn = document.createElement("button")
          viewBtn.className = "btn"
          viewBtn.textContent = "View Note"
          viewBtn.addEventListener("click", (e) => {
            e.stopPropagation()
            showNote({ ...h, url })
          })
          wrapper.appendChild(viewBtn)
        }
        const del = document.createElement("button")
        del.className = "btn"
        del.textContent = "X"
        del.addEventListener("click", (e) => {
          e.stopPropagation()
          deleteHighlight(h.id, url)
        })
        wrapper.appendChild(del)
        wrapper.addEventListener("dblclick", () => showNote({ ...h, url }))
        wrapper.addEventListener("click", () => {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs2) => {
            chrome.tabs.sendMessage(tabs2[0].id, { type: "SCROLL_TO", id: h.id })
          })
        })
        list.appendChild(wrapper)
      })
    })
  })
}

document.getElementById("search").addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase()
  document.querySelectorAll("#list .item").forEach(item => {
    const t = item.querySelector(".text").textContent.toLowerCase()
    item.style.display = t.includes(q) ? "flex" : "none"
  })
})

document.getElementById("save-note").addEventListener("click", () => {
  const note = document.getElementById("note-input").value
  chrome.runtime.sendMessage({ type: "UPDATE_NOTE", id: selectedId, note, url: selectedUrl }, () => {
    hideNote()
    load()
  })
})

document.getElementById("cancel-note").addEventListener("click", () => {
  hideNote()
})

document.addEventListener("DOMContentLoaded", load)
