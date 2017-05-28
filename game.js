'use strict';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  plus(vector) {
    if (vector instanceof Vector) {
      return new Vector(this.x + vector.x, this.y + vector.y)
    } else {
      throw new Error('Вы передали неправильные данные');
    }
  }

times(n){
    return new Vector(this.x * n, this.y * n);
  }
}


class Actor {
  constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
    if (pos instanceof Vector) {
      this.pos = pos;
    } else {
      throw new Error('pos не является vector')
    }

    if (size instanceof Vector) {
      this.size = size;
    } else {
      throw new Error('size не является vector')
    }

    if (speed instanceof Vector) {
      this.speed = speed;
    } else {
      throw new Error('speed не является vector')
    }
  }

  get left() {
    return this.pos.x;
  }

  get right() {
    return this.pos.x + this.size.x;
  }

  get top() {
    return this.pos.y;
  }

  get bottom() {
    return this.pos.y + this.size.y;
  }

  get type() {
    return 'actor';
  }

  act() {

  }

  isIntersect(actor) {
    if (!(actor instanceof Actor)) {
      throw new Error('actor не является Actor')
    }

    if (actor.left === this.left && actor.right === this.right && actor.top === this.top && actor.bottom === this.bottom) {
      return false;
    } else if (actor.right < this.left || actor.bottom < this.top && actor.left < this.right || actor.top > this.bottom) {
      return false;
    } else if (actor.right === this.left || actor.left === this.right || actor.top === this.bottom || actor.bottom === this.top) {
      return false;
    } else if (-actor.left === this.left && -actor.top === this.top && -actor.right === this.right && -actor.bottom === this.bottom) {
      return false;
    } else if (actor.left > this.left && actor.top > this.top && actor.right < this.right && actor.bottom < this.bottom) {
      return true;
    } else if (
      (actor.left < this.left && actor.right > this.left) ||
      (actor.left < this.right && actor.right > this.right) ||
      (actor.top < this.top && actor.bottom > this.top) ||
      (actor.top < this.bottom && actor.bottom > this.bottom)
    ) {
      return true;
    }
  }
}

class Level {
  constructor(grid = [], actors = []) {
    this.grid = grid;
    this.actors = actors;
    this.height = grid.length;
    this.status = null;
    this.finishDelay = 1;
  }

  get width() {
    let max = 0;

    if (this.grid.length) {
      for (let i = 0; i < this.grid.length; i++) {
        if (max < this.grid[i].length) {
          max = this.grid[i].length;
        }
      }
    }

    return max;
  }

  get player() {
    return this.actors.filter(actor => actor.type === 'player')[0];
  }

  isFinished() {
    if (this.status != null && this.finishDelay < 0) {
      return true;
    }

    if (this.status != null && this.finishDelay > 0) {
      return false;
    }

    return false;
  }

  actorAt(actor) {
    if (!(actor instanceof Actor) || actor === undefined) {
      throw new Error('actor не является Actor')
    }

    for (let i = 0; i < this.actors.length; i++) {
      let other = this.actors[i];
      if (other != actor &&
          actor.pos.x + actor.size.x > other.pos.x &&
          actor.pos.x < other.pos.x + other.size.x &&
          actor.pos.y + actor.size.y > other.pos.y &&
          actor.pos.y < other.pos.y + other.size.y)
        return other;
    }
  }

  obstacleAt(pos, size) {
    console.log(size)
    let xStart = Math.floor(pos.x);
    let xEnd   = Math.ceil(pos.x + size.x);
    let yStart = Math.floor(pos.y);
    let yEnd   = Math.ceil(pos.y + size.y);

    if (xStart < 0 || xEnd > this.width || yStart < 0)
      return "wall";
    if (yEnd > this.height)
      return "lava";
    for (let y = yStart; y < yEnd; y++) {
      for (let x = xStart; x < xEnd; x++) {
        let fieldType = this.grid[y][x];
        if (fieldType) return fieldType;
      }
    }
  }

  removeActor(actor) {
    let count = 0;
    for (let i = 0; i < this.actors.length; i++) {
      if (this.actors[i] === actor) {
        count = i;
      }
    }
    this.actors.splice(count, 1);
  }

  noMoreActors(type) {
    for (let i = 0; i < this.actors.length; i++) {
      if (this.actors[i].type === type) {
        return false;
      }
    }
    return true;
  }

  playerTouched(type, actor) {
    if (type === 'lava' || type === 'fireball') {
      this.status = 'lost';
    }

    if (type === 'coin') {
      this.actors = this.actors.filter(other => other !== actor);

      if (!this.actors.some(actor => actor.type === "coin")) {
        this.status = "won";
      }
    }
  }
}

class Player extends Actor {
  constructor(pos = new Vector(0, 0), size = new Vector(0.8, 1.5)) {
    super(pos, size)

    this.pos = pos.plus(new Vector(0, -0.5));
    this.size = size;
  }

  get type() {
    return 'player';
  }
}

class Fireball extends Actor {
  constructor(pos, speed) {
    super(pos, new Vector(1, 1), speed);
  }

  get type () {
    return 'fireball';
  }

  getNextPosition(time = 1) {
    if (this.speed) {
      return this.pos.plus(this.speed.times(time));
    }
    return this.pos;
 }

  handleObstacle() {
    this.speed = this.speed.times(-1);
  }

 act(time, level) {
    let newPos = this.getNextPosition(time);
    if (level.obstacleAt(newPos, this.size)) {
      this.handleObstacle();
    } else {
      this.pos = newPos;
    }
  }
}

class HorizontalFireball extends Fireball {
  constructor(vector) {
    super(vector);

    this.size = new Vector(1, 1);
    this.speed = new Vector(2, 0);
  }
}

class VerticalFireball extends Fireball {
  constructor(vector) {
    super(vector);

    this.size = new Vector(1, 1);
    this.speed = new Vector(0, 2);
  }
}

class FireRain extends Fireball {
  constructor(pos) {
    super(pos, new Vector(0, 3));
    this.size = new Vector(1, 1);
    this.oldPos = pos;
  }
  get type() {
    return 'fireball'
  }

  handleObstacle() {
    if (this.pos) this.pos = this.oldPos;
  }
}

function random(min, max) {
  let rand = min + Math.random() * (max - min);

  return rand;
}

const phaseStart = 0;
const phaseFinish = 2 * Math.PI;

class Coin extends Actor {
  constructor(pos) {
    super(pos);

    this.size = new Vector(0.6, 0.6);
    this.pos  = this.pos.plus(new Vector(0.2, 0.1));
    this.spring = random(phaseStart, phaseFinish);
    this.springDist = 0.07;
    this.springSpeed = 8;
  }

  get type() {
    return 'coin';
  }

  updateSpring(time = 1) {
    this.spring = this.spring + this.springSpeed * time;
  }

  getSpringVector() {
    let y = Math.sin(this.spring) * this.springDist;
    return new Vector(0, y);
  }

  getNextPosition(time = 1) {
    this.updateSpring(time);
    return this.pos.plus(this.getSpringVector());
  }

  act(time) {
    this.pos = this.getNextPosition(time);
  }
}

class LevelParser {
  constructor(symbol) {
    this.symbol = symbol;
  }

  actorFromSymbol(str) {
    if (!this.symbol) {
      return this.symbol = undefined;
    }

    return this.symbol[str];
  }

  obstacleFromSymbol(str) {
    if (str === 'x') return 'wall';
    if (str === '!') return 'lava';
    return undefined;
  }

  createGrid(arrString) {
    if (!arrString.length) return [];

    return arrString.map(char => {
      return char.split('').map(ch => this.obstacleFromSymbol(ch));
    })
  }

  createActors(plan) {
    let arrActor = []

    for (let i = 0; i < plan.length; i++) {
      for (let j = 0; j < plan[i].length; j++) {
        for (let symb in this.symbol) {
          if (symb === plan[i][j]) {
            let objActor = new this.symbol[symb](new Vector(j, i));

            arrActor.push(objActor);
          }
        }
      }
    }

    return arrActor;
  }

  parse(plan) {
    return new Level(this.createGrid(plan), this.createActors(plan))
  }
}


const schemas = [
  [
    "     v                 ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "  |xxx       w         ",
    "  o                 o  ",
    "  x               = x  ",
    "  x          o o    x  ",
    "  x  @    *  xxxxx  x  ",
    "  xxxxx             x  ",
    "      x!!!!!!!!!!!!!x  ",
    "      xxxxxxxxxxxxxxx  ",
    "                       "
  ]
];

var actorDict = {
  "@": Player,
  "=": HorizontalFireball,
  "|": VerticalFireball,
  "v": FireRain,
  "o": Coin
};

const parser = new LevelParser(actorDict);
runGame(schemas, parser, DOMDisplay)
  .then(() => console.log('Вы выиграли приз!'));
