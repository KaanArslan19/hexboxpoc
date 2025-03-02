"use client";
import React, { useState, ChangeEventHandler, useEffect } from "react";
import { Formik, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Steps } from "antd";
import ImageSelector from "./ui/ImageSelector";
import { ProductNew, ProductCategory, ProductOrService } from "../types";
import { toast } from "react-toastify";
import { fileValidator } from "../utils/imageValidators";

const steps = [
  { title: "Basic Info" },
  { title: "Details" },
  { title: "Pricing & Inventory" },
  { title: "Shipping & Terms" },
  { title: "Review" },
];

// Base validation schemas
const baseValidationSchemas = {
  // Basic Info - common for both
  basicInfo: Yup.object({
    name: Yup.string().required("Name is required"),
    logo: fileValidator.required("Logo is required"),
    images: Yup.array().of(fileValidator),
    manufacturerId: Yup.string().required("Manufacturer ID is required"),
    type: Yup.string().required("Type is required"),
    countryOfOrigin: Yup.string().required("Country of origin is required"),
  }),

  // Details - common for both
  details: Yup.object({
    description: Yup.string().required("Description is required"),
    category: Yup.object({
      name: Yup.string().required("Category is required"),
    }),
  }),

  // Pricing & Inventory - different for product vs service
  pricingProduct: Yup.object({
    price: Yup.object({
      amount: Yup.number()
        .typeError("Price must be a number")
        .required("Price is required")
        .positive("Price must be greater than 0"),
      tax_inclusive: Yup.boolean().required("Tax inclusive status is required"),
      gst_rate: Yup.number().when("tax_inclusive", {
        is: true,
        then: (schema) =>
          schema
            .min(0, "GST rate cannot be negative")
            .max(90, "GST rate cannot exceed 90%")
            .required("GST rate is required"),
        otherwise: (schema) => schema.nullable(),
      }),
      gst_amount: Yup.number().when("tax_inclusive", {
        is: true,
        then: (schema) =>
          schema
            .min(0, "GST amount cannot be negative")
            .required("GST amount is required"),
        otherwise: (schema) => schema.nullable(),
      }),
    }),
    inventory: Yup.object({
      stock_level: Yup.number()
        .typeError("Stock level must be a number")
        .required("Stock level is required")
        .integer("Stock level must be an integer")
        .min(1, "Stock level must be at least 1"),
    }),
  }),

  pricingService: Yup.object({
    price: Yup.object({
      amount: Yup.number()
        .typeError("Price must be a number")
        .required("Price is required")
        .positive("Price must be greater than 0"),
      tax_inclusive: Yup.boolean().required("Tax inclusive status is required"),
      gst_rate: Yup.number().when("tax_inclusive", {
        is: true,
        then: (schema) =>
          schema
            .min(0, "GST rate cannot be negative")
            .max(90, "GST rate cannot exceed 90%")
            .required("GST rate is required"),
        otherwise: (schema) => schema.nullable(),
      }),
      gst_amount: Yup.number().when("tax_inclusive", {
        is: true,
        then: (schema) =>
          schema
            .min(0, "GST amount cannot be negative")
            .required("GST amount is required"),
        otherwise: (schema) => schema.nullable(),
      }),
    }),
  }),

  // Shipping & Terms - different for product vs service
  shippingProduct: Yup.object({
    freeShipping: Yup.boolean().required("Free shipping status is required"),
    productReturnPolicy: Yup.object({
      eligible: Yup.boolean().required("Return eligibility is required"),
      return_period_days: Yup.number()
        .integer("Return period must be a whole number")
        .min(0, "Return period cannot be negative")
        .required("Return period is required"),
      conditions: Yup.string().required("Return conditions are required"),
    }),
  }),

  serviceTerms: Yup.object({
    service_terms: Yup.object({
      contract_time_begining: Yup.string().required(
        "Contract start time is required"
      ),
      contract_length: Yup.string().required("Contract length is required"),
    }),
  }),
};

const getValidationSchema = (type: string, step: number) => {
  const isService = type === ProductOrService.ServiceOnly;

  switch (step) {
    case 0:
      return baseValidationSchemas.basicInfo;
    case 1:
      return baseValidationSchemas.details;
    case 2:
      return isService
        ? baseValidationSchemas.pricingService
        : baseValidationSchemas.pricingProduct;
    case 3:
      return isService
        ? baseValidationSchemas.serviceTerms
        : baseValidationSchemas.shippingProduct;
    default:
      return Yup.object({});
  }
};

const productInitialValues: ProductNew = {
  manufacturerId: "",
  name: "",
  type: ProductOrService.ProductOnly,
  countryOfOrigin: "",
  category: { name: ProductCategory.TECH },
  description: "",
  price: {
    amount: 0,
    tax_inclusive: false,
    gst_rate: 0,
    gst_amount: 0,
  },
  inventory: {
    stock_level: 1,
  },
  freeShipping: false,
  productReturnPolicy: {
    eligible: true,
    return_period_days: 30,
    conditions: "",
  },
  campaignId: "",
  userId: "",
  logo: "",
  images: [],
  status: "draft",
  supply: 1,
};

const serviceInitialValues = {
  ...productInitialValues,
  type: ProductOrService.ServiceOnly,
  inventory: undefined,
  freeShipping: undefined,
  productReturnPolicy: undefined,
  service_terms: {
    contract_time_begining: "",
    contract_length: "2 hours",
  },
};

interface Props {
  productOrService: string;
  onSubmit(values: ProductNew): void;
  onImageRemove?(source: string): void;
}

export default function ProductForm({
  onSubmit,
  onImageRemove,
  productOrService,
}: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [logo, setLogo] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [campaignImageSource, setCampaignImageSource] = useState<string[]>([]);
  const [formType, setFormType] = useState<string>(
    ProductOrService.ProductOnly
  );

  // Update form steps based on product/service type
  const getStepTitle = (index: number) => {
    if (index === 3) {
      return formType === ProductOrService.ServiceOnly
        ? "Service Terms"
        : "Shipping & Returns";
    }
    return steps[index].title;
  };

  const onImagesChange: ChangeEventHandler<HTMLInputElement> = ({ target }) => {
    const files = target.files;
    if (files) {
      const newImages = Array.from(files).map((item) => item);
      const oldImages = campaignImageSource || [];

      setImageFiles([...imageFiles, ...newImages]);

      setCampaignImageSource([
        ...oldImages,
        ...newImages.map((file) => URL.createObjectURL(file)),
      ]);
    }
  };

  const removeImage = async (index: number) => {
    if (!campaignImageSource) return;

    const imageToRemove = campaignImageSource[index];
    const cloudSourceUrl = "pub-7337cfa6ce8741dea70792ea29aa86e7.r2.dev";

    if (imageToRemove.startsWith(cloudSourceUrl)) {
      onImageRemove && onImageRemove(imageToRemove);
    } else {
      const fileIndexDifference =
        campaignImageSource.length - imageFiles.length;
      const indexToRemove = index - fileIndexDifference;

      const newImageFiles = imageFiles.filter((_, i) => i !== indexToRemove);
      setImageFiles([...newImageFiles]);
    }

    const newImagesSource = campaignImageSource.filter((_, i) => i !== index);
    setCampaignImageSource([...newImagesSource]);
  };

  const handleSubmit = async (values: any) => {
    setIsPending(true);
    setSubmitError(null);

    try {
      const productData = {
        ...values,
        logo: values.logo as string,
        images: imageFiles,
      };
      console.log("productData", productData);

      await onSubmit(productData);
    } catch (error) {
      setSubmitError("An unknown error occurred");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Formik
      initialValues={
        formType === ProductOrService.ServiceOnly
          ? serviceInitialValues
          : productInitialValues
      }
      validationSchema={() => getValidationSchema(formType, currentStep)}
      onSubmit={handleSubmit}
      enableReinitialize
    >
      {({ validateForm, setFieldValue, submitForm, values }) => (
        <form
          onSubmit={(e) => e.preventDefault()}
          className="p-6 max-w-4xl mx-auto"
        >
          <h1 className="text-3xl text-center mb-4">
            Create a{" "}
            {formType === ProductOrService.ServiceOnly ? "Service" : "Product"}
          </h1>
          <div className="mb-6">
            <Steps
              progressDot
              current={currentStep}
              responsive
              items={steps.map((step, index) => ({
                title: getStepTitle(index),
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
              <h2 className="text-2xl mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl mb-2">Type</h3>

                  {productOrService !== ProductOrService.ProductAndService && (
                    <Field
                      as="select"
                      name="type"
                      className="block w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blueColor"
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                        const newType = e.target.value;
                        setFieldValue("type", newType);
                        setFormType(newType);
                      }}
                    >
                      <option value={ProductOrService.ProductOnly}>
                        Product
                      </option>
                      <option value={ProductOrService.ServiceOnly}>
                        Service
                      </option>
                    </Field>
                  )}

                  <ErrorMessage
                    name="type"
                    component="div"
                    className="text-redColor"
                  />
                </div>
                <div>
                  <h3 className="text-xl mb-2">Name</h3>
                  <Field
                    name="name"
                    placeholder={
                      formType === ProductOrService.ServiceOnly
                        ? "Service Name"
                        : "Product Name"
                    }
                    className="block w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blueColor"
                  />
                  <ErrorMessage
                    name="name"
                    component="div"
                    className="text-redColor"
                  />
                </div>

                <div>
                  <h3 className="text-xl mb-2">Logo</h3>
                  <ImageSelector
                    id="logo"
                    images={logo ? [URL.createObjectURL(logo)] : []}
                    onChange={({ target }) => {
                      const file = target.files ? target.files[0] : null;
                      setFieldValue("logo", file);
                      setLogo(file);
                    }}
                  />
                  <ErrorMessage
                    name="logo"
                    component="div"
                    className="text-redColor"
                  />
                </div>
                <div>
                  <h3 className="text-xl mb-2">Images</h3>
                  <ImageSelector
                    multiple
                    id="images"
                    images={campaignImageSource}
                    onRemove={removeImage}
                    onChange={onImagesChange}
                  />
                  <ErrorMessage
                    name="images"
                    component="div"
                    className="text-redColor"
                  />
                </div>

                <div>
                  <h3 className="text-xl mb-2">Manufacturer ID</h3>
                  <Field
                    name="manufacturerId"
                    placeholder="Manufacturer ID"
                    className="block w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blueColor"
                  />
                  <ErrorMessage
                    name="manufacturerId"
                    component="div"
                    className="text-redColor"
                  />
                </div>

                <div>
                  <h3 className="text-xl mb-2">Country of Origin</h3>
                  <Field
                    name="countryOfOrigin"
                    placeholder="Country of Origin"
                    className="block w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blueColor"
                  />
                  <ErrorMessage
                    name="countryOfOrigin"
                    component="div"
                    className="text-redColor"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl mb-4">
                {formType === ProductOrService.ServiceOnly
                  ? "Service"
                  : "Product"}{" "}
                Details
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl mb-2">Description</h3>
                  <Field
                    as="textarea"
                    name="description"
                    placeholder={
                      formType === ProductOrService.ServiceOnly
                        ? "Service Description"
                        : "Product Description"
                    }
                    className="block w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blueColor h-24"
                  />
                  <ErrorMessage
                    name="description"
                    component="div"
                    className="text-redColor"
                  />
                </div>

                <div>
                  <h3 className="text-xl mb-2">Category</h3>
                  <Field
                    as="select"
                    name="category.name"
                    className="block w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blueColor"
                  >
                    {Object.values(ProductCategory).map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage
                    name="category.name"
                    component="div"
                    className="text-redColor"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl mb-4">
                {formType === ProductOrService.ServiceOnly
                  ? "Pricing"
                  : "Pricing & Inventory"}
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl mb-2">Price Amount (USDC)</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Please enter the price in USDC currency
                  </p>
                  <Field
                    name="price.amount"
                    type="number"
                    placeholder="Price"
                    className="block w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blueColor"
                  />
                  <ErrorMessage
                    name="price.amount"
                    component="div"
                    className="text-redColor"
                  />
                </div>
                <div>
                  <h3 className="text-xl mb-2">Tax Details</h3>

                  <label className="block mb-2">
                    <Field type="checkbox" name="price.tax_inclusive" />
                    <span className="ml-2">Tax Inclusive</span>
                  </label>
                  <ErrorMessage
                    name="price.tax_inclusive"
                    component="p"
                    className="text-red-500 text-sm"
                  />

                  <Field name="price.tax_inclusive">
                    {({ field: { value } }: { field: { value: boolean } }) =>
                      value && (
                        <>
                          <Field
                            name="price.gst_rate"
                            type="number"
                            placeholder="GST Rate (%)"
                            className="block w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blueColor mb-1"
                          />
                          <ErrorMessage
                            name="price.gst_rate"
                            component="p"
                            className="text-red-500 text-sm"
                          />

                          <Field
                            name="price.gst_amount"
                            type="number"
                            placeholder="GST Amount"
                            className="block w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blueColor"
                          />
                          <ErrorMessage
                            name="price.gst_amount"
                            component="p"
                            className="text-red-500 text-sm"
                          />
                        </>
                      )
                    }
                  </Field>
                </div>

                {formType === ProductOrService.ProductOnly && (
                  <div>
                    <h3 className="text-xl mb-2">Stock Level</h3>
                    <Field
                      name="inventory.stock_level"
                      type="number"
                      placeholder="Stock Level"
                      className="block w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blueColor"
                    />
                    <ErrorMessage
                      name="inventory.stock_level"
                      component="div"
                      className="text-redColor"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && formType === ProductOrService.ProductOnly && (
            <div>
              <h2 className="text-2xl mb-4">Shipping & Returns</h2>
              <div className="space-y-4">
                <div>
                  <label className="block mb-4">
                    <Field type="checkbox" name="freeShipping" />
                    <span className="ml-2">Free Shipping</span>
                  </label>
                </div>

                <div>
                  <h3 className="text-xl mb-2">Return Policy</h3>
                  <label className="block mb-2">
                    <Field
                      type="checkbox"
                      name="productReturnPolicy.eligible"
                    />
                    <span className="ml-2">Returns Eligible</span>
                  </label>

                  <Field
                    name="productReturnPolicy.return_period_days"
                    type="number"
                    placeholder="Return Period (days)"
                    className="block w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blueColor mb-2"
                  />

                  <Field
                    as="textarea"
                    name="productReturnPolicy.conditions"
                    placeholder="Return Conditions"
                    className="block w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blueColor h-24"
                  />
                  <ErrorMessage
                    name="productReturnPolicy.conditions"
                    component="div"
                    className="text-redColor"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && formType === ProductOrService.ServiceOnly && (
            <div>
              <h2 className="text-2xl mb-4">Service Terms</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl mb-2">Contract Start Time</h3>
                  <Field
                    type="date"
                    name="service_terms.contract_time_begining"
                    className="block w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blueColor"
                  />
                  <ErrorMessage
                    name="service_terms.contract_time_begining"
                    component="div"
                    className="text-redColor"
                  />
                </div>

                <div>
                  <h3 className="text-xl mb-2">Contract Length</h3>
                  <Field
                    name="service_terms.contract_length"
                    placeholder="e.g. 2 hours, 3 days, 1 week"
                    className="block w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blueColor"
                  />
                  <ErrorMessage
                    name="service_terms.contract_length"
                    component="div"
                    className="text-redColor"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div>
              <h2 className="text-2xl mb-4">Review</h2>
              <p>
                Please review all{" "}
                {formType === ProductOrService.ServiceOnly
                  ? "service"
                  : "product"}{" "}
                details before submitting.
              </p>
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
                        Error Creating{" "}
                        {formType === ProductOrService.ServiceOnly
                          ? "Service"
                          : "Product"}
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
                        if (typeof error === "string") {
                          toast.error(`${field}: ${error}`, {
                            autoClose: 3000,
                          });
                        } else if (error && typeof error === "object") {
                          Object.entries(error).forEach(
                            ([subField, subError]) => {
                              toast.error(`${field}.${subField}: ${subError}`, {
                                autoClose: 3000,
                              });
                            }
                          );
                        }
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
