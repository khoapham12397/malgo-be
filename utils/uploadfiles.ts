import multer from 'multer';
import path from 'path';
const appRoot = require('app-root-path');

export const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(appRoot.path, './images/'));
  },
  filename: function (req, file: any, cb) {
    cb(
      null,
      file.fieldname + '-' + Date.now() + file.originalname.match(/\..*$/)[0]
    );
  }
});

export const multi_upload_img = multer({
  storage,
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype == 'image/png' ||
      file.mimetype == 'image/jpg' ||
      file.mimetype == 'image/jpeg'
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      const err = new Error('Only .png, .jpg and .jpeg format allowed!');
      err.name = 'ExtensionError';
      return cb(err);
    }
  }
}).array('uploadedImages', 10);
// van de dang la gi dung:

export const getUrlImage = (filename: string) => {
  return 'images/' + filename;
};
