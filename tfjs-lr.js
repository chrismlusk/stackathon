let xs = [];
let ys = [];
let bestfit = [];
document.getElementById('x').value = 1; // starting X value

const model = tf.sequential();
model.add(tf.layers.dense({ units: 128, inputShape: [1] }));
model.add(tf.layers.dense({ units: 128, inputShape: [128], activation: 'sigmoid' }));
model.add(tf.layers.dense({ units: 1, inputShape: [128] }));
// const optimizer = tf.train.adam(0.001);
model.compile({ loss: 'meanSquaredError', optimizer: 'adam' });

document.getElementById('append').onclick = (event) => {
  event.preventDefault();
  const x = +document.getElementById('x').value;
  const y = +document.getElementById('y').value;
  xs.push(x);
  ys.push(y);
  document.getElementById('x').value = x + 1;
  document.getElementById('y').value = '';

  model
    .fit(tf.tensor(xs), tf.tensor(ys), {
      epochs: 300
    })
    .then(() => {
      bestfit = model.predict(tf.tensor2d(xs, [xs.length, 1])).dataSync();

      const ctx = document.getElementById('myChart').getContext('2d');
      const chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: xs,
          datasets: [
            {
              label: 'My dataset',
              backgroundColor: 'rgba(0,0,0,.2)',
              borderColor: '#ddd',
              borderWidth: 1,
              data: ys
            },
            {
              label: 'Best fit',
              backgroundColor: 'rgba(0,0,0,0)',
              borderColor: 'rgb(255, 99, 132)',
              borderWidth: 2,
              data: bestfit
            }
          ]
        },

        // Configuration options go here
        options: {
          scales: {
            yAxes: [{ ticks: { beginAtZero: true } }]
          }
        }
      });
    });
};
