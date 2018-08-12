const init = async () => {
  animate(step);
};

/**
 * Pong code
 * =========
 * Animation
 */
const animate =
  window.requestAnimationFrame ||
  function(callback) {
    window.setTimeout(callback, 1000 / 60);
  };

/**
 * Pong code
 * =========
 * Game variables
 */
const canvas = document.createElement('canvas');
const board_width = 500;
const board_height = 600;
canvas.width = board_width;
canvas.height = board_height;
const paddle_width = 64;
const paddle_height = 10;
const context = canvas.getContext('2d');
const player = new Player();
const computer = new Computer();
const ball = new Ball((board_width / 2), (board_height / 2));
const keysDown = {};

const render = () => {
  context.fillStyle = '#1a1a1a';
  context.fillRect(0, 0, board_width, board_height);
  player.render();
  computer.render();
  ball.render();
};

const update = () => {
  player.update(ball);
  computer.update(ball);
  ball.update(player.paddle, computer.paddle);
};

const step = () => {
  update();
  render();
  animate(step);
};

/**
 * Pong code
 * =========
 * Paddle class
 */
function Paddle(x, y, w, h, color = '#59a6ff') {
  this.x = x;
  this.y = y;
  this.width = w;
  this.height = h;
  this.x_speed = 0;
  this.y_speed = 0;
  this.color = color;
}

Paddle.prototype.render = function() {
  context.fillStyle = this.color;
  context.fillRect(this.x, this.y, this.width, this.height);
};

Paddle.prototype.move = function(x, y) {
  this.x += x;
  this.y += y;
  this.x_speed = x;
  this.y_speed = y;

  if (this.x < 0) {
    this.x = 0;
    this.x_speed = 0;
  } else if (this.x + this.width > board_width) {
    this.x = board_width - this.width;
    this.x_speed = 0;
  }
};

/**
 * Pong code
 * =========
 * Computer class
 */
function Computer() {
  this.paddle = new Paddle(
    (board_width / 2) - (paddle_width / 2),
    (paddle_height / 2),
    0,
    0,
    '#ff0000'
  );
}

Computer.prototype.render = function() {
  this.paddle.render();
};

// Defines what is required for the computer to update paddle position
Computer.prototype.update = function(ball) {
  const x_pos = ball.x;
  let diff = -(this.paddle.x + (this.paddle.width / 2) - x_pos);

  if (diff < -5) {
    diff = -6;
  } else if (diff > 5) {
    diff = 6;
  }

  this.paddle.move(diff, 0);

  if (this.paddle.x < 0) {
    this.paddle.x = 0;
  } else if (this.paddle.x + this.paddle.width > board_width) {
    this.paddle.x = board_width - this.paddle.width;
  }
};

/**
 * Pong code
 * =========
 * Player class
 */
function Player() {
  this.paddle = new Paddle(
    (board_width / 2) - (paddle_width / 2),
    board_height - (paddle_height * 1.5),
    paddle_width,
    paddle_height
  );
}

Player.prototype.render = function() {
  this.paddle.render();
};

Player.prototype.update = Computer.prototype.update;

Player.prototype.update = function() {
  for (let key in keysDown) {
    if (+key === 37) {
      this.paddle.move(-5, 0);
    } else if (+key === 39) {
      this.paddle.move(5, 0);
    } else {
      this.paddle.move(0, 0);
    }
  }
};

/**
 * Pong code
 * =========
 * Ball class
 */
function Ball(x, y) {
  this.x = x;
  this.y = y;
  this.x_speed = 0;
  this.y_speed = 5;
  this.player_strikes = false;
}

Ball.prototype.render = function() {
  context.beginPath();
  context.arc(this.x, this.y, 5, 2 * Math.PI, false);
  context.fillStyle = '#ddff59';
  context.fill();
};

Ball.prototype.update = function(paddle1, paddle2, new_turn) {
  this.x += this.x_speed;
  this.y += this.y_speed;
  let top_x = this.x - 5;
  let top_y = this.y - 5;
  let bottom_x = this.x + 5;
  let bottom_y = this.y + 5;

  if (this.x - 5 < 0) {
    this.x = 5;
    this.x_speed = -this.x_speed;
  } else if (this.x + 5 > board_width) {
    this.x = board_width - 5;
    this.x_speed = -this.x_speed;
  }

  if (this.y < 0 || this.y > board_height) {
    this.x_speed = 0;
    this.y_speed = 5;
    this.x = (board_width / 2);
    this.y = (board_height / 2);
  }

  this.player_strikes = false;

  if (top_y > (board_height / 2)) {
    if (
      top_y < paddle1.y + paddle1.height &&
      bottom_y > paddle1.y &&
      top_x < paddle1.x + paddle1.width &&
      bottom_x > paddle1.x
    ) {
      this.y_speed = -5;
      this.x_speed += paddle1.x_speed / 2;
      this.y += this.y_speed;
      this.player_strikes = true;
      // console.log('Player strikes!');
    }
  } else {
    if (
      top_y < paddle2.y + paddle2.height &&
      bottom_y > paddle2.y &&
      top_x < paddle2.x + paddle2.width &&
      bottom_x > paddle2.x
    ) {
      this.y_speed = 5;
      this.x_speed += paddle2.x_speed / 2;
      this.y += this.y_speed;
    }
  }
};

/**
 * Pong code
 * =========
 * The finishing game code
 */
document.getElementById('app').appendChild(canvas);
init();

window.addEventListener('keydown', event => {
  keysDown[event.keyCode] = true;
});

window.addEventListener('keyup', event => {
  delete keysDown[event.keyCode];
});
