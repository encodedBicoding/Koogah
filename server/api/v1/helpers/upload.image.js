/* eslint-disable no-plusplus */
/* eslint-disable camelcase */
import cloudinary from 'cloudinary';
import log from 'fancy-log';
import dotenv from 'dotenv';
import multer from 'multer';
import Datauri from 'datauri';
import path from 'path';

const storage = multer.memoryStorage();
const singleMulter = multer({ storage }).single('profile');
const multipleMulter = multer({ storage }).array('package', 12);

const dUri = new Datauri();

const dataUri = (file) => dUri.format(path.extname(file.originalname).toString(), file.buffer);


dotenv.config();
const { uploader, config } = cloudinary.v2;

config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

async function multiple_upload(req, res) {
  const { files } = req;
  const fileLength = files.length;
  return Promise.try(async () => {
    const is_complete = [];
    const uploads = new Promise((resolve, reject) => {
      for (let i = 0; i < fileLength; i++) {
        const image = dataUri(files[i]).content;
        uploader.upload(image, (error, result) => {
          if (error) {
            reject(error);
          }
          if (result) {
            is_complete.push(result);
            if (is_complete.length === fileLength) {
              resolve(is_complete);
            }
          }
        });
      }
    }).then((result) => result)
      .catch((error) => {
        log(error);
        throw new Error(error);
      });
    const result = await uploads;
    return res.status(200).json({
      status: 200,
      message: 'Files uploaded successfully',
      data: result,
    });
  }).catch((error) => {
    log(error);
    return res.status(400).json({
      status: 400,
      error,
    });
  });
}

async function single_upload(req, res) {
  let { file } = req;
  return Promise.try(async () => {
    if (file) {
      file = dataUri(file).content;
      const image = new Promise((resolve, reject) => uploader.upload(file, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      })).then((result) => result)
        .catch((error) => {
          log(error);
          return res.status(400).json({
            status: 400,
            error,
          });
        });
      const upload = await image;
      return res.status(200).json({
        status: 200,
        message: 'Image uploaded successfully',
        data: upload,
      });
    }
    return res.status(400).json({
      status: 400,
      error: 'Please upload at least one file',
    });
  }).catch((error) => {
    log(error);
    return res.status(400).json({
      status: 400,
      error,
    });
  });
}

export {
  multiple_upload,
  single_upload,
  singleMulter,
  multipleMulter,
};
