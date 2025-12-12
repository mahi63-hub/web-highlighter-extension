chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "highlightText",
    title: "Highlight selected text",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "highlightText" && tab && tab.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: "CONTEXT_HIGHLIGHT",
      text: info.selectionText
    });
  }
});

function updateBadgeForTab(tabId, url) {
  chrome.storage.sync.get(["highlights"], (data) => {
    const all = data.highlights || {};
    const list = all[url] || [];
    const count = list.length || 0;
    const text = count > 0 ? String(count) : "";
    chrome.action.setBadgeText({ text, tabId });
    chrome.action.setBadgeBackgroundColor({ color: "#FF6A00", tabId });
  });
}

chrome.tabs.onActivated.addListener(activeInfo => {
  chrome.tabs.get(activeInfo.tabId, tab => {
    if (tab && tab.url) updateBadgeForTab(activeInfo.tabId, tab.url);
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab && tab.url) updateBadgeForTab(tabId, tab.url);
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  chrome.storage.sync.get(["highlights"], (data) => {
    const all = data.highlights || {};
    if (msg.type === "SAVE_HIGHLIGHT") {
      const arr = all[msg.url] || [];
      arr.push({ id: msg.id, text: msg.text, color: msg.color || "yellow", note: "" });
      all[msg.url] = arr;
      chrome.storage.sync.set({ highlights: all }, () => {
        if (sender && sender.tab && sender.tab.id) updateBadgeForTab(sender.tab.id, msg.url);
      });
      return;
    }
    if (msg.type === "UPDATE_NOTE") {
      const arr = all[msg.url] || [];
      const item = arr.find(h => h.id === msg.id);
      if (item) item.note = msg.note;
      all[msg.url] = arr;
      chrome.storage.sync.set({ highlights: all }, () => {
        sendResponse({ status: "ok" });
      });
      return true;
    }
    if (msg.type === "DELETE_HIGHLIGHT") {
      const arr = all[msg.url] || [];
      const newArr = arr.filter(h => h.id !== msg.id);
      all[msg.url] = newArr;
      chrome.storage.sync.set({ highlights: all }, () => {
        if (sender && sender.tab && sender.tab.id) updateBadgeForTab(sender.tab.id, msg.url);
        sendResponse({ status: "deleted" });
      });
      return true;
    }
    if (msg.type === "GET_HIGHLIGHTS_FOR_TAB") {
      const arr = all[msg.url] || [];
      sendResponse({ items: arr });
      return true;
    }
  });
  return true;
});
