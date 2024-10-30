import { UniqueConstraintError, ValidationError } from "sequelize";
import * as imageService from "../services/imageService.js"; // Ensure you create this service
const AWS = require("aws-sdk");

const s3 = new AWS.S3();

export const createImage = async (req, res) => {
  try {
    const user = req.user;
    console.log("user : " + user);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const user_id = user.id;

    const existingImage = await imageService.findImageByUserId(user_id);
    if (existingImage) {
      return res
        .status(400)
        .json({ error: "Profile picture already present." }); // Error if image already exists
    }

    let chunks = [];
    req.on("data", (chunk) => {
      chunks.push(chunk);
    });

    req.on("end", async () => {
      const buffer = Buffer.concat(chunks);

      const contentType = req.headers["content-type"];

      let fileExtension;
      if (contentType === "image/jpeg") {
        fileExtension = "jpg";
      } else if (contentType === "image/png") {
        fileExtension = "png";
      } else if (contentType === "image/jpg") {
        fileExtension = "jpg";
      } else {
        return res
          .status(400)
          .json({
            error:
              "Unsupported image format. Please upload a PNG or JPG image.",
          });
      }

      const file_name = `${user_id}-${Date.now()}.${fileExtension}`;

      const s3Params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: file_name,
        Body: buffer,
        ContentType: contentType,
      };

      const s3Response = await s3.upload(s3Params).promise();

      const newImage = await imageService.createImage({
        file_name,
        url: s3Response.Location,
        user_id,
      });

      return res.status(201).json({
        id: newImage.id,
        file_name: newImage.file_name,
        url: newImage.url,
        upload_date: newImage.upload_date,
        user_id: newImage.user_id,
      });
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(400).json({ error: "Image already exists" });
    }
    return res
      .status(500)
      .json({ error: "Error creating image", details: error.message });
  }
};

export const getImage = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const user_id = user.id;

    const existingImage = await imageService.findImageByUserId(user_id);
    if (!existingImage) {
      return res.status(404).json({ error: "Profile picture Not Found" });
    }
    return res.status(200).json(existingImage);
  } catch (error) {
    return res.status(400).json({ error: "Error retrieving images" });
  }
};

export const deleteImage = async (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }

  const user_id = user.id;

  const existingImage = await imageService.findImageByUserId(user_id);

  try {
    if (!existingImage) {
      return res.status(404).json({ error: "Image not found" });
    }

    const s3Params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: existingImage.file_name,
    };

    await s3.deleteObject(s3Params).promise();

    await existingImage.destroy();

    return res.status(204).send();
  } catch (error) {
    return res
      .status(400)
      .json({ error: "Error deleting image", details: error.message });
  }
};

export const unsupportedCall = async (req, res) => {
  return res.status(405).end();
};