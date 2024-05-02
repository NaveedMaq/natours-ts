import fs from 'fs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './config.env' });
import Tour, { ITour } from '../../models/tour.model';

export {};

if (!process.env.DATABASE || !process.env.DATABASE_PASSWORD) {
  throw new Error('Database config not found');
}

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose.connect(DB).then(() => {
  console.log('DB connection successful!');

  // READ JSON FILE
  const tours: ITour[] = JSON.parse(
    fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8'),
  );

  // IMPORT DATA INTO DB
  const importData = async () => {
    try {
      await Tour.create(tours);
      console.log('Data successfully loaded!');
    } catch (error) {
      console.log(error);
    }
    mongoose.connection.close();
  };

  // DELETE ALL DATA FROM DB
  const deleteData = async () => {
    try {
      await Tour.deleteMany();
      console.log('Data successfully deleted!');
    } catch (error) {
      console.log(error);
    }
    mongoose.connection.close();
  };

  if (process.argv[2] === '--import') {
    importData();
  } else if (process.argv[2] === '--delete') {
    deleteData();
  }
});
