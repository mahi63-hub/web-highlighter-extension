let selectedColor = "yellow";

function createSpan(text, id, color) {
  const span = document.createElement("span");
  span.dataset.highlightId = id;
  span.id = "highlight-" + id;
  span.style.backgroundColor = color || "yellow";
  span.style.cursor = "pointer";
  span.style.borderRadius = "2px";
  span.textContent = text;
  return span;
}

function splitAndReplace(node, start, length, id, color) {
  const text = node.nodeValue;
  const before = text.slice(0, start);
  const match = text.slice(start, start + length);
  const after = text.slice(start + length);

  const parent = node.parentNode;
  const beforeNode = document.createTextNode(before);
  const matchSpan = createSpan(match, id, color);
  const afterNode = document.createTextNode(after);

  parent.insertBefore(beforeNode, node);
  parent.insertBefore(matchSpan, node);
  parent.insertBefore(afterNode, node);
  parent.removeChild(node);

  return afterNode;
}

function highlightAll(text, baseId, color) {
  const lower = text.toLowerCase();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let found = false;
  let index = 1;

  while (walker.nextNode()) {
    let node = walker.currentNode;
    while (node) {
      const val = node.nodeValue;
      const i = val.toLowerCase().indexOf(lower);
      if (i === -1) break;

      found = true;
      const uid = `${baseId}-${index++}`;
      node = splitAndReplace(node, i, text.length, uid, color);
    }
  }
  return found;
}

function restore(url) {
  chrome.runtime.sendMessage({ type: "GET_HIGHLIGHTS_FOR_TAB", url }, (res) => {
    if (!res || !res.items) return;

    res.items.forEach(item => {
      highlightAll(item.text, item.id, item.color);
    });
  });
}

window.addEventListener("load", () => {
  setTimeout(() => restore(window.location.href), 200);
  const mo = new MutationObserver(() => restore(window.location.href));
  mo.observe(document.body, { childList: true, subtree: true });
});

function getColor(cb) {
  chrome.storage.sync.get(["selectedColor"], (d) => {
    cb(d.selectedColor || "yellow");
  });
}

document.addEventListener("mouseup", () => {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed) return;

  const text = sel.toString().trim();
  if (!text) return;

  const id = Date.now().toString(36);
  const url = window.location.href;

  getColor((color) => {
    selectedColor = color;
    const ok = highlightAll(text, id, color);
    if (ok) chrome.runtime.sendMessage({ type: "SAVE_HIGHLIGHT", id, text, url, color });
  });

  sel.removeAllRanges();
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "SET_COLOR") {
    selectedColor = msg.color;
  }

  if (msg.type === "SCROLL_TO") {
    const selector = `[data-highlight-id^="${msg.id}"]`;
    const el = document.querySelector(selector);

    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.style.boxShadow = "0 0 0 3px orange";
      setTimeout(() => (el.style.boxShadow = ""), 800);
    }
  }

  if (msg.type === "DELETE_HIGHLIGHT") {
    const all = document.querySelectorAll(`[data-highlight-id^="${msg.id}"]`);
    all.forEach(span => {
      span.replaceWith(document.createTextNode(span.textContent));
    });
  }
});
