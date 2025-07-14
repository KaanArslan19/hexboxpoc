import * as Yup from "yup";
const FILE_SIZE_LIMIT = 1024 * 1024 * 5;
const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const fileTypeValidator = Yup.mixed().test(
  "fileType",
  "File type must be one of: " + allowedTypes.join(", "),
  (value: unknown) => {
    if (value instanceof File) {
      return allowedTypes.includes(value.type);
    }
    return true;
  }
);

const fileSizeValidator = Yup.mixed().test(
  "fileSize",
  "File size must be less than 5MB",
  (value: unknown) => {
    if (value instanceof File) {
      return value.size <= FILE_SIZE_LIMIT;
    }
    return true;
  }
);

// Combined validator for both size and type
export const fileValidator = Yup.mixed().test(
  "file",
  "Invalid file",
  async (value: unknown) => {
    if (!value) return true;

    const sizeValid = await fileSizeValidator.isValid(value);
    const typeValid = await fileTypeValidator.isValid(value);

    if (!sizeValid) {
      throw new Yup.ValidationError("File size must be less than 5MB");
    }
    if (!typeValid) {
      throw new Yup.ValidationError(
        `File type must be one of: ${allowedTypes.join(", ")}`
      );
    }

    return true;
  }
);
