# NodeJs POC
## Image processing system

App to efficiently **process images** picked from `.csv` files and compresses them by 50%.

- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose ORM)
- **Queue Processing**: BullMQ + Redis
- **File Handling**: Multer (CSV upload)
- **Image Processing**: Sharp (Image compression)
- **Storage**: Local file system (Can be extended to AWS S3)
- **Validation**: CSV parsing and format validation

The `.csv` file must have the following columns -
1. Serial Number (Must be unique for each row).
2. Product Name:- This will be a name of product against which we will
store input and output images. (Cannot be empty)
3. Input Image Urls:- In this column we will have comma separated
image urls. (Validations will be implied on this column)

There are 2 APIs exposed -
1. Upload API:- Accepts the CSV , Validates the Formatting and returns a unique
request ID.
2. Status API:- Allows users to query processing status with the request ID.
