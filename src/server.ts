import app from "./app";
import dotenv from 'dotenv';
import './config/redis';
import './modules/email/email.worker';

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});