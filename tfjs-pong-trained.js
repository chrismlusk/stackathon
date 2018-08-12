const init = async () => {
  model = await tf.loadModel(
    // 'https://hkinsley.com/static/tfjsmodel/model.json'
    'tfjsmodel/model.json'
  );
  console.log('model loaded from storage');
  computer.ai_plays = true;

  document.getElementById('playing').innerHTML = computer.ai_plays
    ? 'Me vs A.I.'
    : 'Me vs Computer';

  // start a game
  animate(step);
};

/**
 * New A.I. code
 * =============
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
 * Set animation game speed
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
const paddle_width = 64;
const paddle_height = 10;
canvas.width = board_width;
canvas.height = board_height;
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
  player.update(ball);

  if (computer.ai_plays) {
    move = ai.predict_move();
    computer.ai_update(move);
  } else {
    move = ai.predict_move();
    computer.ai_update(move);
  }

  // update ball position
  ball.update(player.paddle, computer.paddle);

  // add training data from current frame to training set
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
 * Paddle object
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
 * Computer object
 */
function Computer() {
  this.paddle = new Paddle(
    (board_width / 2) - (paddle_width / 2),
    (paddle_height / 2),
    paddle_width,
    paddle_height,
    '#ff0000'
  );
  // this.ai_plays = false;
}

Computer.prototype.render = function() {
  this.paddle.render();
};

Computer.prototype.update = function(ball) {
  const x_pos = ball.x;
  let diff = -(this.paddle.x + this.paddle.width / 2 - x_pos);

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
 * New A.I. code
 * =============
 * Depending on the move passed in, we move the computer 4x.
 * Network output is either -1, 0, 1 (left, stay, right)
 */
Computer.prototype.ai_update = function (move = 0) {
  this.paddle.move(5 * move, 0)
}

/**
 * Pong code
 * =========
 * Player object
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
      this.paddle.move(-4, 0);
    } else if (+key === 39) {
      this.paddle.move(4, 0);
    } else {
      this.paddle.move(0, 0);
    }
  }
};

/**
 * Pong code
 * =========
 * Ball object
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
    // this.y_speed = Math.random() * 3 + 2;
    this.x_speed = 0;
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
 * New A.I. code
 * =============
 * Store data for ai
 */
function AI(){
  // from previous frame
  this.previous_data = null;

  // empty training dataset
  this.training_data = [[], [], []];

  // empty batch (dataset to be added to training data)
  this.training_batch_data = [[], [], []];

  // input data from previus frame
  this.previous_xs = null;

  // number of turn
  this.turn = 0;

  this.grab_data = true;
  this.flip_table = true;

  // keep some number of training records
  this.keep_training_records = true;

  // number of training records to keep
  this.training_records_to_keep = 100000;

  // first strike flag (to ommit data)
  this.first_strike = true;
}

/**
 * New A.I. code
 * =============
 * Save data per frame
 */
AI.prototype.save_data = function(player, computer, ball) {
  if (!this.grab_data) return;

  // fresh turn -- fill in initial data
  if (this.previous_data === null) {
    this.previous_data = [player.x, computer.x, ball.x, ball.y];
    return;
  }

  // if ai strikes, start recording data -- empty batch
  if (ball.ai_strikes) {
    this.training_batch_data = [[], [], []];
    console.log('A.I. strikes! Emptying batch');
  }

  // create current data object [player_x, computer_x, ball_x, ball_y]
  // and embed index (0 - left, 1 - no move, 2 - right)
  data_xs = [player.x, computer.x, ball.x - 60, ball.y];
  index =
    player.x < this.previous_data[0]
      ? 0 : player.x == this.previous_data[0] ? 1 : 2;

  // save data as [...previous data, ...current data]
  // result --> [old_player_x, old_computer_x, old_ball_x, old_ball_y, player_x, computer_x, ball_x, ball_y]
  this.previous_xs = [...this.previous_data, ...data_xs];

  // add data to training set depending on index value
  // only player and ball position
  this.training_batch_data[index].push([
    this.previous_xs[0],
    this.previous_xs[2],
    this.previous_xs[3],
    this.previous_xs[4],
    this.previous_xs[6],
    this.previous_xs[7]
  ]);

  // set current data as previous data for next frame
  this.previous_data = data_xs;

  // if player strikes, add batch to training data
  if (ball.player_strikes) {
    if (this.first_strike) {
      this.first_strike = false;
      this.training_batch_data = [[], [], []];
      console.log('Player strikes! Emptying batch');
    } else {
      for (let i = 0; i < 3; i++) {
        this.training_data[i].push(...this.training_batch_data[i]);
        this.training_batch_data = [[], [], []];
        console.log('adding batch...');
      }
    }
  }
};

/**
 * New A.I. code
 * =============
 * Decide whether to play as ai
 */

AI.prototype.new_turn = function() {
  // clean previous data and start fresh
  this.first_strike = true;
  this.training_batch_data = [[], [], []];
  this.previous_data = null;
  this.turn++;
  console.log(`new turn: ${this.turn}`);

  document.getElementById('playing').innerHTML = computer.ai_plays
    ? 'Me vs A.I.'
    : 'Me vs Computer';

  // // after 10 turns
  // if (this.turn > 10) {
  //   this.train();
  //   computer.ai_plays = true;
  //   this.reset();
  // }
};

/**
 * New A.I. code
 * =============
 * Empty training data to start clean
 */
AI.prototype.reset = function() {
  this.previous_data = null;
  if (!this.keep_training_records) {
    this.training_data = [[], [], []];
  }
  this.turn = 0;

  document.getElementById('playing').innerHTML = computer.ai_plays
    ? 'Me vs A.I.'
    : 'Me vs Computer';

  console.log('reset... emptying batch');
};

/**
 * New A.I. code
 * =============
 * Train a model
 */
AI.prototype.train = function() {
  // first we have to balance the data
  console.log('balancing');
  document.getElementById('playing').innerHTML = 'Training';

  // trim data and find min number of training records in data
  if (this.keep_training_records) {
    for (let i = 0; i < 3; i++) {
      if (this.training_data[i].length > this.training_records_to_keep) {
        this.training_data[i] = this.training_data[i].slice(
          Math.max(
            0,
            this.training_data[i].length - this.training_records_to_keep
          ),
          this.training_data[i].length
        );
      }
    }
  }

  len = Math.min(
    this.training_data[0].length,
    this.training_data[1].length,
    this.training_data[2].length
  );

  console.log('training_data', this.training_data);

  if (!len) {
    console.log('no data to train on');
    return;
  }

  data_xs = [];
  data_ys = [];

  // now we need to trim data so every embedding will contain exactly the same amount of training records than randomize that data and create embedding records one embedding record for every input data record finally add training data records and embedding records to common tables (for training) tf.fit() will do final data shuffle for us
  for (let i = 0; i < 3; i++) {
    data_xs.push(
      ...this.training_data[i]
        .slice(0, len)
        .sort(() => Math.random() - 0.5)
        .sort(() => Math.random() - 0.5)
    ); // trims training data to 'len' length and shuffle it
    data_ys.push(
      ...Array(len).fill([i == 0 ? 1 : 0, i == 1 ? 1 : 0, i == 2 ? 1 : 0])
    ); // creates 'len' number records of embedding data
    // either [1, 0 0] for left, [0, 1, 0] - for no move
    // and [0, 0, 1] for right (depending in index if training data)
  }

  document.createElement('playing').innerHTML =
    'Training: ' + data_xs.length + ' records';

  console.log('training-1');

  // create tensor from
  const xs = tf.tensor(data_xs);
  const ys = tf.tensor(data_ys);

  (async function() {
    console.log('training-2');

    // train a model
    let result = await model.fit(xs, ys, {
      batchSize: 32,
      epochs: 1,
      shuffle: true,
      validationSplit: 0.1,
      callbacks: {
        // print batch stats
        onBatchEnd: async (batch, logs) => {
          console.log(
            'Step ' +
              batch +
              ', loss: ' +
              logs.loss.toFixed(5) +
              ', acc: ' +
              logs.acc.toFixed(5)
          );
        }
      }
    });

    // and save it in a local storage (for later use)
    await model.save('indexeddb://my-model-1');

    // print model and validation stats
    console.log(
      'Model: loss: ' +
        result.history.loss[0].toFixed(5) +
        ', acc: ' +
        result.history.acc[0].toFixed(5)
    );
    console.log(
      'Validation: loss: ' +
        result.history.val_loss[0].toFixed(5) +
        ', acc: ' +
        result.history.val_acc[0].toFixed(5)
    );
  })();

  console.log('trained');
};

/**
 * New A.I. code
 * =============
 * Make predicitions based on training data
 */
AI.prototype.predict_move = function() {
  // but only for 2+ frame of a game (we need data from previous frame as well)
  if (this.previous_xs !== null) {
    // flip table so ai will see it from player's perspective
    data_xs = [
      board_width - this.previous_xs[1],
      board_width - this.previous_xs[2],
      board_height - this.previous_xs[3],
      board_width - this.previous_xs[5],
      board_width - this.previous_xs[6],
      board_height - this.previous_xs[7]
    ];

    prediction = model.predict(tf.tensor([data_xs]));
    // argmax will return embeddingL 0, 1 or 2, we need -1, 0 or 1 (left, no move, right) - decrement it and return also we actually need to flip that prediction, as ai plays on top (upside-down)
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
