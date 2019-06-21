import './env';
import app, { startSver } from './app';
const { PORT } = process.env;

app.listen(PORT, () => {
  startSver();
  console.log('AS-service server is listening to port', PORT);
});
