"use client";
import React, { useState } from "react";
import { Formik, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Steps } from "antd";
import ImageSelector from "./ui/ImageSelector";
import { NewProductInfo, Product } from "../types";

const steps = [
  { title: "Product Info" },
  { title: "Details" },
  { title: "Review" },
];

const FILE_SIZE_LIMIT = 1024 * 1024; // 1MB in bytes
const fileSizeValidator = Yup.mixed().test(
  "fileSize",
  "File size must be less than 1MB",
  (value: unknown) => {
    if (value instanceof File) {
      return value.size <= FILE_SIZE_LIMIT;
    }
    return true;
  }
);

const validationSchema = [
  Yup.object({
    name: Yup.string().required("Product name is required"),
    image: fileSizeValidator.required("Image is required"),
  }),
  Yup.object({
    details: Yup.string().required("Details are required"),
    price: Yup.number()
      .typeError("Price must be a number")
      .required("Price is required")
      .positive("Price must be greater than 0"),
    supply: Yup.number()
      .typeError("Supply must be a number")
      .required("Supply is required")
      .integer("Supply must be an integer")
      .min(1, "Supply must be at least 1"),
  }),
];

const initialValues: NewProductInfo = {
  image: "",
  name: "",
  details: "",
  price: 0,
  supply: 1,
};

interface Props {
  onSubmit(values: NewProductInfo): void;
}
export default function ProductForm({ onSubmit }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [image, setImage] = useState<File | null>(null);

  const handleSubmit = async (values: typeof initialValues) => {
    const productData: NewProductInfo = {
      image: values.image as string,
      name: values.name,
      details: values.details,
      price: values.price,
      supply: values.supply,
    };

    await onSubmit(productData);
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema[currentStep]}
      onSubmit={handleSubmit}
    >
      {({ validateForm, setFieldValue, submitForm }) => (
        <form
          onSubmit={(e) => e.preventDefault()}
          className="p-6 max-w-2xl mx-auto"
        >
          <h1 className="text-3xl text-center mb-4">Create a Product</h1>
          <div className="mb-6">
            <Steps
              progressDot
              current={currentStep}
              responsive
              items={steps.map((step, index) => ({
                title: step.title,
                description:
                  index < currentStep
                    ? "Completed"
                    : index === currentStep
                    ? "In Progress"
                    : "Pending",
              }))}
            />
          </div>

          {currentStep === 0 && (
            <div>
              <h2 className="text-2xl mb-4">Product Info</h2>
              <h3 className="text-xl mb-2">Name</h3>
              <Field
                name="name"
                placeholder="Product Name"
                className="block w-full p-2 border border-gray-300 rounded mb-4 focus:outline-none focus:border-blue-500"
              />
              <ErrorMessage
                name="name"
                component="div"
                className="text-red-500 mb-4"
              />

              <h3 className="text-xl mb-2">Image</h3>
              <ImageSelector
                id="productImage"
                images={image ? [URL.createObjectURL(image)] : []}
                onChange={({ target }) => {
                  const file = target.files ? target.files[0] : null;
                  setFieldValue("image", file);
                  setImage(target.files ? target.files[0] : null);
                }}
              />
              <ErrorMessage
                name="image"
                component="div"
                className="text-red-500 mb-4"
              />
            </div>
          )}

          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl mb-4">Details</h2>
              <h3 className="text-xl mb-2">Details</h3>
              <Field
                as="textarea"
                name="details"
                placeholder="Product Details"
                className="block w-full p-2 border border-gray-300 rounded mb-4 focus:outline-none focus:border-blue-500 h-24"
              />
              <ErrorMessage
                name="details"
                component="div"
                className="text-red-500 mb-4"
              />

              <h3 className="text-xl mb-2">Price</h3>
              <Field
                name="price"
                type="number"
                placeholder="Price"
                className="block w-full p-2 border border-gray-300 rounded mb-4 focus:outline-none focus:border-blue-500"
              />
              <ErrorMessage
                name="price"
                component="div"
                className="text-red-500 mb-4"
              />

              <h3 className="text-xl mb-2">Supply</h3>
              <Field
                name="supply"
                type="number"
                placeholder="Supply"
                className="block w-full p-2 border border-gray-300 rounded mb-4 focus:outline-none focus:border-blue-500"
              />
              <ErrorMessage
                name="supply"
                component="div"
                className="text-red-500 mb-4"
              />
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl mb-4">Review</h2>
              <p>Review all product details before submitting.</p>
            </div>
          )}

          <div className="flex justify-between mt-4">
            <button
              type="button"
              disabled={currentStep === 0}
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Back
            </button>
            {currentStep < steps.length - 1 && (
              <button
                type="button"
                onClick={() =>
                  validateForm().then(() => setCurrentStep((prev) => prev + 1))
                }
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Next
              </button>
            )}
            {currentStep === steps.length - 1 && (
              <button
                type="submit"
                onClick={submitForm}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Submit
              </button>
            )}
          </div>
        </form>
      )}
    </Formik>
  );
}
