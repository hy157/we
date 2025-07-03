// Oyun değişkenleri
let gold = 100, energy = 50, diamond = 0;
let inventory = { wheat: 0, water: 0, flour: 0, bread: 0, bretzel: 0, cookie: 0 };

// Tarla yönetimi
let fieldTiles = [
  // Başlangıçta bir tarla ekli (örnek)
  { id: 1, x: 160, y: 120, state: 'empty', timer: 0, placed: true, selected: false }
];
let placingField = null;

// Tarla görselleri
const FIELD_STATES = {
  empty: 'empty',
  seeding: 'seeding',
  seedling: 'seedling',
  green: 'green',
  ripe: 'ripe'
};
const FIELD_IMAGES = {
  empty: "assets/images/field.png",
  seedling: "assets/images/fieldfide.png",
  green: "assets/images/fieldgreenwheat.png",
  ripe: "assets/images/fieldwheatrh.png"
};

// Sayfa yüklendiğinde üst barları güncelle
window.addEventListener("DOMContentLoaded", function() {
  updateTopBars();
  renderMap();

  // Alt menü butonlarına örnek tıklama
  document.getElementById('store-btn').onclick = function() {
    // Store panel kodun burada olacak
    // Örneğin: yeni tarla ekle (örnek kullanım)
    if (!placingField) {
      spawnNewField();
    }
  };
});

// Üst barları güncelle
function updateTopBars() {
  document.getElementById('gold-amount').textContent = gold;
  document.getElementById('energy-amount').textContent = energy;
  document.getElementById('diamond-amount').textContent = diamond;
}

// Yeni tarla ekle (store'dan alınca)
function spawnNewField() {
  const map = document.getElementById('game-map');
  const rect = map.getBoundingClientRect();
  const x = rect.width / 2 - 100;
  const y = rect.height / 2 - 70;
  const id = Date.now() + Math.random();
  const tile = {id, x, y, state: FIELD_STATES.empty, timer: 0, placed: false, selected: false};
  fieldTiles.push(tile);
  placingField = tile.id;
  renderMap();
}

// Harita ve tarlaları çiz
function renderMap() {
  const map = document.getElementById('game-map');
  map.innerHTML = '';
  fieldTiles.forEach(field => {
    const div = document.createElement('div');
    div.className = 'field-tile';
    div.style.backgroundImage = `url("${getFieldBg(field)}")`;
    div.style.left = (field.x || 80) + 'px';
    div.style.top = (field.y || 40) + 'px';
    if (placingField === field.id && !field.placed) div.classList.add('selected');
    if (field.dragging) div.classList.add('dragging');
    if (field.selected) div.classList.add('selected');
    div.dataset.fid = field.id;
    // Sürükle & bırak
    if (!field.placed && placingField === field.id) {
      div.onpointerdown = dragStart;
      div.ontouchstart = dragStartTouch;
    }
    // Tarlaya tıklama: seçili yap
    div.onclick = (e) => {
      if (placingField || e.detail>1) return;
      selectField(field.id);
    };
    // Field üstü butonlar (örnek - sadece UI, fonksiyonlar eklenebilir)
    if (field.placed) {
      const actions = document.createElement('div');
      actions.className = 'field-actions';
      // SICKLE
      const sickle = document.createElement('img');
      sickle.src = "assets/images/iconsickle.png";
      sickle.className = getSickleClass(field);
      sickle.title = "Hasat";
      sickle.onclick = (ev) => { ev.stopPropagation(); tryHarvest(field); };
      if(getSickleClass(field)==="bw") sickle.onclick=null;
      actions.appendChild(sickle);
      // SEED
      const seed = document.createElement('img');
      seed.src = "assets/images/iconseed.png";
      seed.className = getSeedClass(field);
      seed.title = "Ekim";
      seed.onclick = (ev) => { ev.stopPropagation(); trySow(field); };
      if(getSeedClass(field)==="bw") seed.onclick=null;
      actions.appendChild(seed);
      div.appendChild(actions);
    }
    map.appendChild(div);
  });
}
function getFieldBg(field) {
  if (field.state === FIELD_STATES.seedling) return FIELD_IMAGES.seedling;
  if (field.state === FIELD_STATES.green) return FIELD_IMAGES.green;
  if (field.state === FIELD_STATES.ripe) return FIELD_IMAGES.ripe;
  return FIELD_IMAGES.empty;
}
function getSickleClass(field) {
  if (field.state === FIELD_STATES.ripe) return "";
  return "bw";
}
function getSeedClass(field) {
  if (field.state === FIELD_STATES.empty) return "";
  return "bw";
}
function selectField(fid) {
  fieldTiles.forEach(f=>f.selected=false);
  const f = fieldTiles.find(f=>f.id===fid);
  if(f) f.selected=true;
  renderMap();
}

// Sürükle & bırak (mouse)
let dragOffsetX=0, dragOffsetY=0;
function dragStart(e) {
  e.preventDefault();
  const fid = Number(e.currentTarget.dataset.fid);
  const tile = fieldTiles.find(f=>f.id===fid);
  if (!tile || tile.placed) return;
  tile.dragging = true;
  dragOffsetX = e.clientX - (tile.x||0);
  dragOffsetY = e.clientY - (tile.y||0);
  document.onpointermove = ev => dragMove(ev, tile);
  document.onpointerup = ev => dragEnd(ev, tile);
}
function dragMove(e, tile) {
  tile.x = e.clientX - dragOffsetX;
  tile.y = e.clientY - dragOffsetY;
  renderMap();
}
function dragEnd(e, tile) {
  tile.dragging = false;
  tile.placed = true;
  placingField = null;
  document.onpointermove = null;
  document.onpointerup = null;
  renderMap();
}
// Sürükle & bırak (dokunmatik)
function dragStartTouch(e) {
  const touch = e.touches[0];
  const fid = Number(e.currentTarget.dataset.fid);
  const tile = fieldTiles.find(f=>f.id===fid);
  if (!tile || tile.placed) return;
  tile.dragging = true;
  dragOffsetX = touch.clientX - (tile.x||0);
  dragOffsetY = touch.clientY - (tile.y||0);
  document.ontouchmove = ev => dragMoveTouch(ev, tile);
  document.ontouchend = ev => dragEndTouch(ev, tile);
}
function dragMoveTouch(e, tile) {
  const touch = e.touches[0];
  tile.x = touch.clientX - dragOffsetX;
  tile.y = touch.clientY - dragOffsetY;
  renderMap();
}
function dragEndTouch(e, tile) {
  tile.dragging = false;
  tile.placed = true;
  placingField = null;
  document.ontouchmove = null;
  document.ontouchend = null;
  renderMap();
}

// Ekim & hasat örnek (ilerletmek için fonksiyonlar eklenmeli)
function trySow(field) {
  if (field.state !== FIELD_STATES.empty) return;
  if (energy < 1 || gold < 1) return;
  gold--; energy--;
  field.state = FIELD_STATES.seeding;
  renderMap();
  setTimeout(()=>{ field.state=FIELD_STATES.seedling; renderMap(); }, 0);
  setTimeout(()=>{ field.state=FIELD_STATES.green; renderMap(); }, 8000);
  setTimeout(()=>{ field.state=FIELD_STATES.ripe; renderMap(); }, 16000);
  updateTopBars();
}
function tryHarvest(field) {
  if (field.state !== FIELD_STATES.ripe) return;
  if (energy < 1) return;
  energy--;
  setTimeout(()=>{
    inventory.wheat +=2;
    field.state = FIELD_STATES.empty;
    renderMap();
    updateTopBars();
  }, 1200);
  renderMap();
  updateTopBars();
}