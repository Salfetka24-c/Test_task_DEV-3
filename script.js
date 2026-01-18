const input = document.getElementById("textInput");
const btn = document.getElementById("applyBtn");
const editor = document.getElementById("editor");

let letters = [];
let dragging = false;
let draggingGroup = false;
const dragOffsets = new Map();
let draggingLetters = [];
const selectionRect = {
  visible: false,
  x: 0,
  y: 0,
  w: 0,
  h: 0,
  startX: 0,
  startY: 0,
  el: null,
};
btn.addEventListener("click", applyText);

function applyText() {
  letters = [];
  editor.innerHTML = "";
  let x = 10;
  [...input.value].forEach((char, i) => {
    const el = document.createElement("span");
    el.className = "letter";
    el.textContent = char;

    const letter = {
      id: i,
      char,
      x,
      y: 50,
      selected: false,
      startX: 0,
      startY: 0,
      el,
    };

    updateLetter(letter);
    el.addEventListener("mousedown", (e) => onLetterMouseDown(e, letter));
    editor.appendChild(el);
    letters.push(letter);

    x += el.offsetWidth;
  });
}

function updateLetter(currentLetter) {
  currentLetter.el.style.left = currentLetter.x + "px";
  currentLetter.el.style.top = currentLetter.y + "px";
  currentLetter.el.classList.toggle("selected", currentLetter.selected);
}

editor.addEventListener("mousedown", onEditorMouseDown);
document.addEventListener("mousemove", onEditorMouseMove);
document.addEventListener("mouseup", onEditorMouseUp);

function onLetterMouseDown(e, letter) {
  e.stopPropagation();

  const rect = editor.getBoundingClientRect();
  const offsetX = e.clientX - rect.left;
  const offsetY = e.clientY - rect.top;
  if (e.ctrlKey) {
    letter.selected = !letter.selected;
  } else if (!letter.selected) {
    letters.forEach((currentLetter) => (currentLetter.selected = false));
    letter.selected = true;
  }

  letters.forEach(updateLetter);

  const selected = letters.filter((currentLetter) => currentLetter.selected);
  draggingLetters = selected;
  dragOffsets.clear();

  draggingGroup = selected.length > 1;

  selected.forEach((currentLetter) => {
    dragOffsets.set(currentLetter.id, {
      x: offsetX - currentLetter.x,
      y: offsetY - currentLetter.y,
    });
    currentLetter.startX = currentLetter.x;
    currentLetter.startY = currentLetter.y;
  });

  dragging = true;
}

function onEditorMouseMove(e) {
  const rect = editor.getBoundingClientRect();
  const offsetX = e.clientX - rect.left;
  const offsetY = e.clientY - rect.top;

  if (dragging) {
    draggingLetters.forEach((currentLetter) => {
      const off = dragOffsets.get(currentLetter.id);
      currentLetter.x = offsetX - off.x;
      currentLetter.y = offsetY - off.y;
      updateLetter(currentLetter);
    });
    return;
  }

  if (!selectionRect.visible) return;
  selectionRect.x = Math.min(offsetX, selectionRect.startX);
  selectionRect.y = Math.min(offsetY, selectionRect.startY);
  selectionRect.w = Math.abs(offsetX - selectionRect.startX);
  selectionRect.h = Math.abs(offsetY - selectionRect.startY);

  Object.assign(selectionRect.el.style, {
    left: selectionRect.x + "px",
    top: selectionRect.y + "px",
    width: selectionRect.w + "px",
    height: selectionRect.h + "px",
  });
}

function onEditorMouseDown(e) {
  if (e.target !== editor) return;

  letters.forEach((currentLetter) => {
    currentLetter.selected = false;
    updateLetter(currentLetter);
  });
  const rect = editor.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  selectionRect.visible = true;
  selectionRect.startX = x;
  selectionRect.startY = y;
  const box = document.createElement("div");
  box.className = "selection-rect";
  editor.appendChild(box);
  selectionRect.el = box;
}

function onEditorMouseUp(e) {
  const rect = editor.getBoundingClientRect();
  const cursorX = e.clientX - rect.left;
  const cursorY = e.clientY - rect.top;
  if (dragging || draggingGroup) {
    if (!draggingGroup && draggingLetters.length === 1) {
      const dragged = draggingLetters[0];
      const target = letters.find(
        (currentLetter) =>
          currentLetter !== dragged &&
          isPointInsideLetter(cursorX, cursorY, currentLetter),
      );

      if (target && dragged) {
        const tempX = target.x;
        const tempY = target.y;
        target.x = dragged.startX ?? dragged.x;
        target.y = dragged.startY ?? dragged.y;
        dragged.x = tempX;
        dragged.y = tempY;
        updateLetter(target);
        updateLetter(dragged);
      }
    }

    dragging = false;
    draggingGroup = false;
    draggingLetters = [];
    dragOffsets.clear();
    return;
  }

  if (!selectionRect.visible) return;
  letters.forEach((currentLetter) => {
    const width = currentLetter.el.offsetWidth;
    const height = currentLetter.el.offsetHeight;

    const hit =
      currentLetter.x + width > selectionRect.x &&
      currentLetter.x < selectionRect.x + selectionRect.w &&
      currentLetter.y + height > selectionRect.y &&
      currentLetter.y < selectionRect.y + selectionRect.h;
    if (hit) currentLetter.selected = true;
    updateLetter(currentLetter);
  });

  selectionRect.visible = false;
  selectionRect.el.remove();
}

function isPointInsideLetter(x, y, letter) {
  const width = letter.el.offsetWidth;
  const height = letter.el.offsetHeight;
  return (
    x >= letter.x &&
    x <= letter.x + width &&
    y >= letter.y &&
    y <= letter.y + height
  );
}
