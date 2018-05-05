const canvases = document.querySelectorAll("canvas");
const ctxs = Array.from(canvases).map(canvas => canvas.getContext("2d"));

let speed = 2.5;

const width = 100;
const height = 100;
const bulletSize = 5;
const bulletSpeed = 20;

onresize = () => {
  canvases.forEach(canvas => canvas.setAttribute("width", (innerWidth / 2 - 10).toString()));
  canvases.forEach(canvas => canvas.setAttribute("height", innerHeight.toString()));
};
onresize();

const keys = {};
const doLog = false;
const log = (...args) => {
  if(doLog/* && frame % 20 === 0*/){
    console.log(...args);// eslint-disable-line no-console
  }
};

onkeydown = e => {
  keys[e.code] = true;
};
onkeyup = e => {
  delete keys[e.code];
};

const isCollision = (rect1, rect2) => {
  if (
    rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.height + rect1.y > rect2.y
  ) {
    return true;
  }
  return false;
};

class Block {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.collisionBoxes = [[0, 0, width, height]];
  }
  draw(ctx) {
    ctx.fillStyle = this.fillColor || "black";
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

const playerCollisionCheck = (playerCollisionBoxes, objsToTest = blocks) => {
  let objCollidedWith = null;
  playerCollisionBoxes.some(playerBox => {
    return objsToTest.some(block => {
      if(!block || !block.collisionBoxes){
        throw block;
      }
      const isCollided = block.collisionBoxes.some(blockBox => {
        if(isCollision({
          x: playerBox[0],
          y: playerBox[1],
          width: playerBox[2],
          height: playerBox[3]
        }, {
          x: blockBox[0] + block.x,
          y: blockBox[1] + block.y,
          width: blockBox[2],
          height: blockBox[3]
        })){
          objCollidedWith = block;
          log("COLLISION");
          return true;
        }
      });
      return isCollided;
    });
  });
  return objCollidedWith;
};

const clone = arr => {
  let returnArr = [];
  arr.forEach(elem => {
    if(elem instanceof Array){
      return returnArr.push(clone(elem));
    }
    returnArr.push(elem);
  });
  return returnArr;
};

const realCollisionBoxes = player => {
  return clone(player.collisionBoxes).map(box => {
    box[0] += player.realX;
    box[1] += player.realY;
    return box;
  });
};

class Player {
  constructor(x, y, width, height, controls, color, idx) {
    this.shotCooldown = 10;
    this.collisionBoxes = [[0, 0, width, height]];
    this.width = width;
    this.height = height;
    this.realX = x;
    this.realY = y;
    this.controls = controls;
    this.fillColor = color;
    this.direction = "up";
    this.idx = idx;
  }
  draw(ctx) {
    ctx.fillStyle = this.fillColor || "black";
    ctx.fillRect(this.x, this.y, this.width, this.height);

    ctx.fillStyle = "gray";
    const slice = 3;
    switch(this.direction){
    case "up":
      ctx.fillRect(this.x, this.y, this.width, this.height / slice);
      break;
    case "down":
      ctx.fillRect(this.x, this.y + (this.height - this.height / slice), this.width, this.height / slice);
      break;
    case "left":
      ctx.fillRect(this.x, this.y, this.width / slice, this.height);
      break;
    case "right":
      ctx.fillRect(this.x + (this.width - this.width / slice), this.y, this.width / slice, this.height);
      break;
    }
  }
  kill(){
    // alert("RIP " + this.fillColor);
    if(players.length === 1){
      players.pop();
    }else{
      players.splice(players.indexOf(this), 1);
    }
  }
  ifKeyPressed(key) {
    switch (key) {
    case this.controls.up:
      this.direction = "up";
      this.y-=speed;
      break;
    case this.controls.down:
      this.direction = "down";
      this.y+=speed;
      break;
    case this.controls.left:
      this.direction = "left";
      this.x-=speed;
      break;
    case this.controls.right:
      this.direction = "right";
      this.x+=speed;
      break;
    case this.controls.shoot:
      bullets.push(new Bullet(this.x + this.width / 2, this.y + this.height / 2, this.direction, this));
    }
  }

  get x() {
    return this.realX;
  }

  get y() {
    return this.realY;
  }

  set x(newVal) {
    if(playerCollisionCheck(clone(this.collisionBoxes).map(box => {
      box[0] += newVal;
      box[1] += this.realY;
      return box;
    }))){
      return newVal;
    }
    this.realX = newVal;
    return newVal;
  }

  set y(newVal) {
    if(playerCollisionCheck(clone(this.collisionBoxes).map(box => {
      box[0] += this.realX;
      box[1] += newVal;
      return box;
    }))){
      return newVal;
    }
    this.realY = newVal;
    return newVal;
  }
}

const bulletOnCoordChange = (bullet, isX, newVal) => {
  let mapped;
  if(isX){
    mapped = clone(bullet.collisionBoxes).map(box => {
      box[0] += newVal;
      box[1] += bullet.realY;
      return box;
    });
  }else{
    mapped = clone(bullet.collisionBoxes).map(box => {
      box[0] += bullet.realX;
      box[1] += newVal;
      return box;
    });
  }

  let joined = [].concat(players/*.map((player, idx) => ({
    collisionBoxes: realCollisionBoxes(player),
    idx
  }))*/);
  joined = joined.concat(blocks);

  const collision = playerCollisionCheck(mapped, joined);

  if(collision){
    // console.log(collision);
    if(typeof collision.idx === "number"){
      // console.warn(players.indexOf(bullet.player), collision.idx);
      if(players.indexOf(bullet.player) !== collision.idx){
        players[collision.idx].kill();
      }else{
        log("Bullet hit owner.");
      }
    }

    bullet.remove();
    return newVal;
  }
  if(isX){
    bullet.realX = newVal;
  }else{
    bullet.realY = newVal;
  }
  return newVal;
};

class Bullet {
  constructor(x, y, direction, player){
    this.realX = x;
    this.realY = y;
    this.size = bulletSize;
    this.direction = direction;
    this.speed = bulletSpeed;
    this.collisionBoxes = [[-this.size / 2, -this.size / 2, this.size / 2, this.size / 2]];
    this.player = player;
  }
  draw(ctx){
    ctx.fillStyle = "gray";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, true);
    ctx.fill();

    switch(this.direction){
    case "up":
      this.y -= bulletSpeed;
      break;
    case "down":
      this.y += bulletSpeed;
      break;
    case "left":
      this.x -= bulletSpeed;
      break;
    case "right":
      this.x += bulletSpeed;
      break;
    }
  }

  remove(){
    if(bullets.length === 1){
      bullets.pop();
    }else{
      bullets.splice(bullets.indexOf(this), 1);
    }
  }

  get x() {
    return this.realX;
  }

  get y() {
    return this.realY;
  }

  set x(newVal) {
    return bulletOnCoordChange(this, true, newVal);
  }

  set y(newVal) {
    return bulletOnCoordChange(this, false, newVal);
  }
}

const blocks = [];
const map = `
   #           ##
    #          #         #
    #          #         #
     #         #  #####  #
#              #      #  #
#              #      #  #
#              #####  #  #
#

   #####
   #####
   #####
   #####
   #####
`.slice(1, -1);

const blockWidth = 20;

map.split("\n").forEach((line, lineNumber) => {
  line.split("").forEach((char, idx) => {
    log(char);
    if(char === "##"){
      log(idx, lineNumber);
      blocks.push(new Block(idx * blockWidth, lineNumber * blockWidth, blockWidth, blockWidth));
    }
  });
});

const players = [
  new Player(
    // (width - 2) * blockWidth,
    // (height - 2) * blockWidth,
    blockWidth * 2,
    blockWidth * 2,
    blockWidth,
    blockWidth,
    {
      up: "KeyW",
      down: "KeyS",
      left: "KeyA",
      right: "KeyD",
      shoot: "KeyQ"
    },
    "red",
    0
  ),
  new Player(
    blockWidth,
    blockWidth,
    blockWidth,
    blockWidth,
    {
      up: "ArrowUp",
      down: "ArrowDown",
      left: "ArrowLeft",
      right: "ArrowRight",
      shoot: "ControlRight"
    },
    "blue",
    1
  )
];

let isRunning = false;

const drawBorder = (x, y, w, h) => {
  for(let i = 0; i < w; i++){
    blocks.push(new Block(x + i * blockWidth, y, blockWidth, blockWidth));
    blocks.push(new Block(x + i * blockWidth, y + (h - 1) * blockWidth, blockWidth, blockWidth));
  }
  for(let i = 0; i < h; i++){
    blocks.push(new Block(x, y + i * blockWidth, blockWidth, blockWidth));
    blocks.push(new Block(x + (w - 1) * blockWidth, y + i * blockWidth, blockWidth, blockWidth));
  }
};
const drawNoise = (x, y, w, h, density) => {
  for(let i = 0; i < w; i++){
    for(let i2 = 0; i2 < h; i2++){
      if(Math.random() < density){
        blocks.push(new Block(i * blockWidth + (x * blockWidth), i2 * blockWidth + (y * blockWidth), blockWidth, blockWidth));
        players.forEach(player => {
          if(playerCollisionCheck(realCollisionBoxes(player))){
            blocks.pop();
          }
        });
      }
    }
  }
};

drawBorder(0, 0, width, height);
drawNoise(1, 1, width - 2, height - 2, 0.2);

const bullets = [];

const draw = () => {
  if(isRunning){
    throw new Error("OOF");
  }
  isRunning = true;
  ctxs.forEach((ctx, id) => {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 10000, 10000);
    if(!players[id]) return;

    ctx.save();
    ctx.translate(Math.round(-(players[id].x + (players[id].width / 2) - (ctx.canvas.offsetWidth / 2))), Math.round(-(players[id].y + (players[id].height / 2) - (ctx.canvas.offsetHeight / 2))));
    players.forEach(player => player.draw(ctx));
    blocks.forEach(block => block.draw(ctx));
    bullets.forEach(bullet => bullet.draw(ctx));
    Object.keys(keys).forEach(key => players.forEach(player => player.ifKeyPressed(key)));
    ctx.restore();
  });

  isRunning = false;
};

setInterval(draw, 1000 / 60);