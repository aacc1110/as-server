import './env';
import app, { startSver } from './app';
const { PORT } = process.env;
startSver();
app.listen(PORT, () => {
  console.log('AS-service server is listening to port', PORT);
});
