function highlightNow(text, id) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const node = walker.currentNode
    if (!node.nodeValue.includes(text)) continue
    const span = document.createElement("span")
    span.dataset.highlightId = id
    span.style.backgroundColor = "yellow"
    span.style.borderRadius = "2px"
    span.style.cursor = "pointer"
    span.textContent = text
    node.parentNode.replaceChild(span, node)
    break
  }
}

function restore() {
  const url = window.location.href
  chrome.storage.sync.get(["highlights"], (data) => {
    const pageData = data.highlights?.[url]
    if (!pageData) return
    pageData.forEach(h => {
      highlightNow(h.text, h.id)
    })
  })
}


window.addEventListener("load", () => {
  restore()
})

document.addEventListener("mouseup", () => {
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed) return

  const text = sel.toString()
  const id = Date.now().toString(36)
  const url = window.location.href

  if (!text.trim()) return

  highlightNow(text, id)

  chrome.runtime.sendMessage({
    type: "SAVE_HIGHLIGHT",
    id,
    text,
    url
  })

  sel.removeAllRanges()
})

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "SCROLL_TO") {
    const el = document.querySelector(`[data-highlight-id="${msg.id}"]`)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }
})
