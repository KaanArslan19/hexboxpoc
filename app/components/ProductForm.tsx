"use client";
import React, { useState } from "react";
import { Formik, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Steps } from "antd";
import ImageSelector from "./ui/ImageSelector";
import { NewProductInfo } from "../types";
import { toast } from "react-toastify";

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
    description: Yup.string().required("Details are required"),
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
  description: "",
  price: 0,
  supply: 1,
};

interface Props {
  onSubmit(values: NewProductInfo): void;
}
export default function ProductForm({ onSubmit }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [image, setImage] = useState<File | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (values: typeof initialValues) => {
    setIsPending(true);
    setSubmitError(null);

    try {
      const productData: NewProductInfo = {
        image: values.image as string,
        name: values.name,
        description: values.description,
        price: values.price,
        supply: values.supply,
      };

      await onSubmit(productData);
    } catch (error) {
      setSubmitError("An unknown error occurred");
    } finally {
      setIsPending(false);
    }
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
                className="block w-full p-2 border border-gray-300 rounded mb-4 focus:outline-none focus:border-blueColor"
              />
              <ErrorMessage
                name="name"
                component="div"
                className="text-redColor mb-4"
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
                className="text-redColor mb-4"
              />
            </div>
          )}

          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl mb-4">Details</h2>
              <h3 className="text-xl mb-2">Description</h3>
              <Field
                as="textarea"
                name="description"
                placeholder="Product Description"
                className="block w-full p-2 border border-gray-300 rounded mb-4 focus:outline-none focus:border-blueColor h-24"
              />
              <ErrorMessage
                name="description"
                component="div"
                className="text-redColor mb-4"
              />

              <h3 className="text-xl mb-2">Price</h3>
              <Field
                name="price"
                type="number"
                placeholder="Price"
                className="block w-full p-2 border border-gray-300 rounded mb-4 focus:outline-none focus:border-blueColor"
              />
              <ErrorMessage
                name="price"
                component="div"
                className="text-redColor mb-4"
              />

              <h3 className="text-xl mb-2">Supply</h3>
              <Field
                name="supply"
                type="number"
                placeholder="Supply"
                className="block w-full p-2 border border-gray-300 rounded mb-4 focus:outline-none focus:border-blueColor"
              />
              <ErrorMessage
                name="supply"
                component="div"
                className="text-redColor mb-4"
              />
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl mb-4">Review</h2>
              <p>Review all product details before submitting.</p>
              {submitError && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Error Creating Product
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        {submitError}
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                  validateForm().then((errors) => {
                    console.log("Validation Errors:", errors);
                    if (Object.keys(errors).length === 0) {
                      setCurrentStep((prev) => prev + 1);
                    } else {
                      Object.entries(errors).forEach(([field, error]) => {
                        toast.error(`${field}: ${error}`, {
                          autoClose: 3000,
                        });
                      });
                    }
                  })
                }
                className="px-4 py-2 bg-blueColor text-white rounded hover:bg-blueColor/80"
              >
                Next
              </button>
            )}
            {currentStep === steps.length - 1 && (
              <button
                type="submit"
                onClick={() => {
                  if (!isPending) {
                    setSubmitError(null);
                    submitForm();
                  }
                }}
                disabled={isPending}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                {isPending ? (
                  <div className="flex items-center text-white">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="white"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Submitting...
                  </div>
                ) : (
                  "Submit"
                )}
              </button>
            )}
          </div>
        </form>
      )}
    </Formik>
  );
}
