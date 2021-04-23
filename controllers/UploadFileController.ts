import express from 'express';
import multer from 'multer';
import cloudinary from '../core/cloudinary';

class UploadFileController {
  async upload(req: express.Request, res: express.Response): Promise<void> {
    const file = req.file;

    cloudinary.v2.uploader
      .upload_stream({ resource_type: 'auto' }, function (error, result) {
        if (error) {
          res.send(500).json({
            status: 'error',
          });
        }
        res.send(200).json({
          status: 'success',
          message: result,
        });
      })
      .end(file.buffer);
  }
}

export const UploadFileCtrl = new UploadFileController();
