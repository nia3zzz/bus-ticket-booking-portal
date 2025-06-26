import { v2 as cloudinary } from 'cloudinary'; //importing the v2

// check if all the cloudinary configuration environmental variables are provided else throw an error
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  throw new Error('Cloudinary environment variables are not provided.');
}

// interface to mark what we need from result of cloudinary upload function
export interface uploadedImageInterface {
  secure_url: string;
}

// set up the config function with the neccessary auth variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary as cloudinaryConfig };
