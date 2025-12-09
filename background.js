async function getData() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["highlights"], (data) => {
      resolve(data.highlights || {})
    })
  })
}

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  if (msg.type === "SAVE_HIGHLIGHT") {
    const data = await getData()
    if (!data[msg.url]) data[msg.url] = []
    data[msg.url].push({
      id: msg.id,
      text: msg.text
    })
    chrome.storage.sync.set({ highlights: data })
  }

  if (msg.type === "LOAD_HIGHLIGHTS") {
    chrome.storage.sync.get(["highlights"], (data) => {
      const res = data.highlights || {}
      sendResponse({ items: res[msg.url] || [] })
    })
    return true
  }
})
