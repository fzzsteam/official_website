const { createApp } = require('./server/app');

const port = Number(process.env.PORT || 3000);
const app = createApp();

app.listen(port, function onListen() {
  console.log(`official-website listening on port ${port}`);
});
