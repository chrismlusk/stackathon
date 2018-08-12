const init = async () => {
  // model = await tf.loadModel(
  //   'https://hkinsley.com/static/tfjsmodel/model.json'
  // );
  // console.log('model loaded from storage');
  computer.ai_plays = false;

  document.getElementById('playing').innerHTML = computer.ai_plays
    ? 'Me vs A.I.'
    : 'Me vs Computer';

  // start a game
  animate(step);
};

/**
 * A.I. code
 * =========
 * Initial model definition
 */
let model = tf.sequential();
model.add(tf.layers.dense({ units: 256, inputShape: [8] })); // input is 1x8
model.add(tf.layers.dense({ units: 512, inputShape: [256] })); // hidden layer
model.add(tf.layers.dense({ units: 256, inputShape: [512] })); // hidden layer
model.add(tf.layers.dense({ units: 3, inputShape: [256] })); // output is 1x3
const learningRate = 0.0001;
const optimizer = tf.train.adam(learningRate);
model.compile({ loss: 'meanSquaredError', optimizer });

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
const ai = new AI();
const keysDown = {};

const render = () => {
  context.fillStyle = '#1a1a1a';
  context.fillRect(0, 0, board_width, board_height);
  player.render();
  computer.render();
  ball.render();
};

const update = () => {
  // player.update();
  player.update(ball);

  if (computer.ai_plays) {
    move = ai.predict_move();
    computer.ai_update(move);
  } else {
    computer.update(ball);
  }

  ball.update(player.paddle, computer.paddle);
  ai.save_data(player.paddle, computer.paddle, ball);
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
    paddle_width,
    paddle_height,
    '#ff0000'
  );
  this.ai_plays = false;
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
 * A.I. code
 * =========
 * Depending on the move passed in, we move the computer 5x.
 * Network output is either -1, 0, 1 (left, stay, right)
 */
Computer.prototype.ai_update = function (move = 0) {
  this.paddle.move(5 * move, 0)
}

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
  // this.x_speed = Math.random() * 4 + 1;
  // this.y_speed = Math.random() * 3 + 2;
  this.x_speed = 0;
  this.y_speed = 5;
  this.player_strikes = false;
  this.ai_strikes = false;
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
    // this.x_speed = Math.random() * 4 + 1;
    this.x_speed = 0;
    // this.y_speed = Math.random() * 3 + 2;
    this.y_speed = 5;
    this.x = (board_width / 2);
    this.y = (board_height / 2);
    ai.new_turn();
  }

  this.player_strikes = false;
  this.ai_strikes = false;

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
      this.ai_strikes = true;
      // console.log('A.I. strikes!');
    }
  }
};

/**
 * A.I. code
 * =========
 * Store data for ai
 */
function AI() {
  this.previous_data = null;
  this.training_data = [[], [], []];
  this.last_data_object = null;
  this.turn = 0;
  this.grab_data = true;
  this.flip_table = true;
}

/**
 * A.I. code
 * =========
 * Save data per frame
 */
AI.prototype.save_data = function(player, computer, ball) {
  if (!this.grab_data) return;

  // If this is the very first frame (no prior data)
  if (this.previous_data === null) {
    data = this.flip_table
      ? [
          board_width - computer.x,
          board_width - player.x,
          board_width - ball.x,
          board_height - ball.y
        ]
      : [player.x, computer.x, ball.x, ball.y];
    this.previous_data = data;
    return;
  }

  // table is rotated to learn from player, but apply to computer position
  if (this.flip_table) {
    data_xs = [
      board_width - computer.x,
      board_width - player.x,
      board_width - ball.x,
      board_height - ball.y
    ];
    index =
      board_width - player.x > this.previous_data[1]
        ? 0 : board_width - player.x == this.previous_data[1] ? 1 : 2;
  } else {
    data_xs = [player.x, computer.x, ball.x, ball.y];
    index =
      player.x < this.previous_data[0]
        ? 0 : player.x == this.previous_data[0] ? 1 : 2;
  }

  this.last_data_object = [...this.previous_data, ...data_xs];
  this.training_data[index].push(this.last_data_object);
  this.previous_data = data_xs;
};

/**
 * A.I. code
 * =========
 * Decide whether to play as ai
 */
AI.prototype.new_turn = function() {
  this.previous_data = null;
  this.turn++;
  console.log(`new turn: ${this.turn}`);

  // number of games to train?
  if (this.turn > 0) {
    this.train();
    computer.ai_plays = true;
    this.reset();
  }

  document.getElementById('playing').innerHTML = computer.ai_plays
    ? 'Me vs A.I.'
    : 'Me vs Computer';
}

/**
 * A.I. code
 * =========
 * Empty training data to start clean
 */
AI.prototype.reset = function() {
  this.previous_data = null;
  this.training_data = [[], [], []];
  this.turn = 0;

  document.getElementById('playing').innerHTML = computer.ai_plays
    ? 'Me vs A.I.'
    : 'Me vs Computer';

  console.log('reset... ');
}

/**
 * A.I. code
 * =========
 * Train a model
 */
AI.prototype.train = function() {
  console.log('balancing');
  document.getElementById('playing').innerHTML = 'Training';

  // shuffle attempt
  len = Math.min(
    this.training_data[0].length,
    this.training_data[1].length,
    this.training_data[2].length
  );

  console.log('training_data', this.training_data);

  if (!len) {
    console.log('nothing to train');
    return;
  }

  data_xs = [];
  data_ys = [];

  for (let i = 0; i < 3; i++) {
    data_xs.push(...this.training_data[i].slice(0, len));
    data_ys.push(
      ...Array(len).fill([i == 0 ? 1 : 0, i == 1 ? 1 : 0, i == 2 ? 1 : 0])
    );
  }

  document.createElement('playing').innerHTML =
    'Training: ' + data_xs.length + ' records';

  const xs = tf.tensor(data_xs);
  const ys = tf.tensor(data_ys);

  (async function() {
    console.log('training...');
    let result = await model.fit(xs, ys);
    console.log('result', result);
  })();

  console.log('trained!');
};

/**
 * A.I. code
 * =========
 * Make predictions based on training data
 */
AI.prototype.predict_move = function() {
  if (this.last_data_object !== null) {
    // use this.last_data_object for input data
    // return -1, 0, 1
    prediction = model.predict(tf.tensor([this.last_data_object]));
    return -(tf.argMax(prediction, 1).dataSync() - 1);
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
